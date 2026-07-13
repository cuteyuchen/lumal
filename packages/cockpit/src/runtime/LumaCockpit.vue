<script setup lang="ts">
import type { Slots } from 'vue'
import type {
  CockpitCenterContext,
  CockpitConfig,
  CockpitNodeKind,
  CockpitNodeSelectPayload,
  CockpitRenderMode,
  CockpitThemeMode,
  CockpitViewportMode,
} from '../types'
import type { CockpitRegistry } from '../registry/types'
import { computed, provide, ref, useSlots, watch } from 'vue'
import { useCockpit } from '../composables/useCockpit'
import { normalizeCockpitConfig } from '../config/normalize'
import { createCockpitMessageBus } from '../messaging/createCockpitMessageBus'
import { cockpitRuntimeEnvKey } from './context'
import LumaCockpitCanvas from './LumaCockpitCanvas.vue'

/***********************驾驶舱运行时主组件*********************/
// 布局导航由消费应用负责。框架只装配当前布局与注册模块。

const props = withDefaults(defineProps<{
  config: CockpitConfig
  registry: CockpitRegistry
  baseWidth?: number
  baseHeight?: number
  cachePages?: boolean
  renderMode?: CockpitRenderMode
  viewportMode?: CockpitViewportMode
  messageBus?: ReturnType<typeof createCockpitMessageBus>
}>(), {
  baseWidth: 1920,
  baseHeight: 1080,
  cachePages: true,
  renderMode: 'runtime',
  viewportMode: 'scale',
})

const emit = defineEmits<{
  configure: []
  configError: [error: unknown]
  nodeSelect: [payload: CockpitNodeSelectPayload]
}>()

const activeLayoutId = defineModel<string | undefined>('activeLayoutId')
const themeMode = defineModel<CockpitThemeMode>('themeMode', { default: 'dark' })
const slots = useSlots()

const normalizedResult = computed<{ config: CockpitConfig | null, error: unknown }>(() => {
  try {
    return { config: normalizeCockpitConfig(props.config), error: null }
  }
  catch (error) {
    return { config: null, error }
  }
})
const normalized = computed(() => normalizedResult.value.config)

watch(() => normalizedResult.value.error, (error) => {
  if (error)
    emit('configError', error)
}, { immediate: true })

const messages = props.messageBus ?? createCockpitMessageBus()
provide(cockpitRuntimeEnvKey, {
  cockpitId: props.config.id,
  mode: props.renderMode,
  registry: props.registry,
  messages,
  cachePages: props.cachePages,
  slots: slots as Slots,
})

const orchestration = useCockpit({
  config: () => normalized.value ?? props.config,
  activeLayoutId,
})

const centerContext = computed<CockpitCenterContext | undefined>(() => {
  const layout = orchestration.activeLayout.value
  if (!layout)
    return undefined
  return {
    cockpitId: normalized.value?.id ?? props.config.id,
    layoutId: layout.id,
    instanceId: `${layout.id}:center`,
    mode: props.renderMode,
    messages,
  }
})

const rootRef = ref<HTMLElement | null>(null)
async function enterFullscreen(): Promise<void> {
  if (rootRef.value?.requestFullscreen)
    await rootRef.value.requestFullscreen()
}
async function exitFullscreen(): Promise<void> {
  if (document.fullscreenElement)
    await document.exitFullscreen()
}
function toggleTheme(): void {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
}
defineExpose({ enterFullscreen, exitFullscreen, messages, toggleTheme })

const hasConfig = computed(() => Boolean(normalized.value?.layouts.length))

function requestConfigure(): void {
  emit('configure')
}

function handleNodeClick(event: MouseEvent): void {
  if (props.renderMode !== 'design')
    return
  const target = event.target instanceof Element ? event.target : null
  const node = target?.closest('[data-cockpit-node]') as HTMLElement | null
  if (!node || !rootRef.value?.contains(node))
    return
  const kind = node.dataset.cockpitNode as CockpitNodeKind | undefined
  const id = node.dataset.cockpitNodeId
  if (!kind || !id)
    return
  emit('nodeSelect', { kind, id, side: node.dataset.cockpitSide as CockpitNodeSelectPayload['side'] })
}
</script>

<template>
  <div
    ref="rootRef"
    class="luma-cockpit"
    :data-mode="renderMode"
    :data-cockpit-theme="themeMode"
    :data-viewport-mode="viewportMode"
    @click.capture="handleNodeClick"
  >
    <template v-if="normalizedResult.error">
      <slot name="error" :error="normalizedResult.error">
        <div class="luma-cockpit__error" role="alert">
          配置加载失败
        </div>
      </slot>
    </template>
    <template v-else-if="!hasConfig">
      <slot name="empty">
        <div class="luma-cockpit__empty" role="status">
          空驾驶舱
        </div>
      </slot>
    </template>
    <template v-else-if="orchestration.activeLayout.value && centerContext">
      <LumaCockpitCanvas
        :title="normalized!.title"
        :base-width="baseWidth"
        :base-height="baseHeight"
        :viewport-mode="viewportMode"
        :layout="orchestration.activeLayout.value"
        :center-context="centerContext"
      >
        <template #header-prefix>
          <slot name="header-prefix" />
        </template>
        <template #header-title="slotProps">
          <slot name="header-title" v-bind="slotProps" />
        </template>
        <template #header-actions>
          <slot name="header-actions" />
        </template>
        <template #center="slotProps">
          <slot name="center" v-bind="slotProps" />
        </template>
      </LumaCockpitCanvas>
      <slot name="configure-trigger" :configure="requestConfigure" />
    </template>
  </div>
</template>
