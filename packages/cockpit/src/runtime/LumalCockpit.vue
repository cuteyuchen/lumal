<script setup lang="ts">
import type { Slots } from 'vue'
import type { CockpitRegistry } from '../registry/types'
import type {
  CockpitCenterContext,
  CockpitConfig,
  CockpitNodeKind,
  CockpitNodeSelectPayload,
  CockpitRenderMode,
  CockpitThemeMode,
  CockpitViewportMode,
} from '../types'
import type { CockpitCardComponent } from './card'
import { ElSwitch, ElTooltip } from 'element-plus'
import { computed, provide, ref, shallowReactive, shallowRef, useSlots, watch, watchEffect } from 'vue'
import { useCockpit } from '../composables/useCockpit'
import {
  DEFAULT_COCKPIT_AUTO_REFRESH_INTERVAL_MS,
  useCockpitAutoRefresh,
} from '../composables/useCockpitAutoRefresh'
import { normalizeCockpitConfig } from '../config/normalize'
import { createCockpitMessageBus } from '../messaging/createCockpitMessageBus'
import { cockpitRuntimeEnvKey } from './context'
import LumalCockpitCanvas from './LumalCockpitCanvas.vue'
import LumalCockpitCard from './LumalCockpitCard.vue'

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
  cardComponent?: CockpitCardComponent
  /** 是否启用右上角全局自动刷新开关（默认关闭，由消费方 opt-in）。 */
  autoRefresh?: boolean
  /** 自动刷新间隔（ms），默认 5 分钟。 */
  autoRefreshIntervalMs?: number
}>(), {
  baseWidth: 1920,
  baseHeight: 1080,
  cachePages: true,
  renderMode: 'runtime',
  viewportMode: 'scale',
  autoRefresh: false,
  autoRefreshIntervalMs: DEFAULT_COCKPIT_AUTO_REFRESH_INTERVAL_MS,
})

const emit = defineEmits<{
  configure: []
  configError: [error: unknown]
  nodeSelect: [payload: CockpitNodeSelectPayload]
}>()

const activeLayoutId = defineModel<string | undefined>('activeLayoutId')
const themeMode = defineModel<CockpitThemeMode>('themeMode', { default: 'dark' })
const autoRefreshEnabled = defineModel<boolean>('autoRefreshEnabled', { default: false })
const slots = useSlots()

const normalized = shallowRef<CockpitConfig | null>(null)
const normalizationError = shallowRef<unknown>(null)
let sourceSignature = ''
let normalizedSignature = ''

watchEffect(() => {
  try {
    const nextSourceSignature = JSON.stringify(props.config)
    if (nextSourceSignature === sourceSignature) {
      normalizationError.value = null
      return
    }

    const nextConfig = normalizeCockpitConfig(props.config)
    const nextNormalizedSignature = JSON.stringify(nextConfig)
    sourceSignature = nextSourceSignature
    normalizationError.value = null
    if (nextNormalizedSignature !== normalizedSignature) {
      normalized.value = nextConfig
      normalizedSignature = nextNormalizedSignature
    }
  }
  catch (error) {
    normalizationError.value = error
  }
})

const normalizedResult = computed<{ config: CockpitConfig | null, error: unknown }>(() => ({
  config: normalized.value,
  error: normalizationError.value,
}))

watch(() => normalizedResult.value.error, (error) => {
  if (error)
    emit('configError', error)
}, { immediate: true })

const messages = props.messageBus ?? createCockpitMessageBus()
const runtimeEnv = shallowReactive({
  cockpitId: props.config.id,
  mode: props.renderMode,
  registry: props.registry,
  messages,
  cachePages: props.cachePages,
  slots: slots as Slots,
  cardComponent: props.cardComponent ?? LumalCockpitCard,
})
watchEffect(() => {
  runtimeEnv.cockpitId = normalized.value?.id ?? props.config.id
  runtimeEnv.mode = props.renderMode
  runtimeEnv.registry = props.registry
  runtimeEnv.cachePages = props.cachePages
  runtimeEnv.cardComponent = props.cardComponent ?? LumalCockpitCard
})
provide(cockpitRuntimeEnvKey, runtimeEnv)

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

// 仅在 opt-in 开启时驱动定时器；开关状态仍由 autoRefreshEnabled 承载
const autoRefreshTimerEnabled = ref(false)
watch(
  [() => props.autoRefresh, autoRefreshEnabled],
  ([feature, on]) => {
    autoRefreshTimerEnabled.value = Boolean(feature && on)
  },
  { immediate: true },
)

const autoRefreshIntervalLabel = computed(() => {
  const minutes = Math.round(props.autoRefreshIntervalMs / 60_000)
  return minutes >= 1 ? `${minutes} 分钟` : `${Math.round(props.autoRefreshIntervalMs / 1000)} 秒`
})

const { refreshNow } = useCockpitAutoRefresh({
  messages,
  sourceId: () => normalized.value?.id ?? props.config.id,
  intervalMs: () => props.autoRefreshIntervalMs,
  enabled: autoRefreshTimerEnabled,
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
defineExpose({ enterFullscreen, exitFullscreen, messages, toggleTheme, refreshNow })

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
    class="lumal-cockpit"
    :data-mode="renderMode"
    :data-cockpit-theme="themeMode"
    :data-viewport-mode="viewportMode"
    @click.capture="handleNodeClick"
  >
    <template v-if="normalizedResult.error">
      <slot name="error" :error="normalizedResult.error">
        <div class="lumal-cockpit__error" role="alert">
          配置加载失败
        </div>
      </slot>
    </template>
    <template v-else-if="!hasConfig">
      <slot name="empty">
        <div class="lumal-cockpit__empty" role="status">
          空驾驶舱
        </div>
      </slot>
    </template>
    <template v-else-if="orchestration.activeLayout.value && centerContext">
      <LumalCockpitCanvas
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
          <div v-if="autoRefresh" class="lumal-cockpit__auto-refresh">
            <ElTooltip :content="autoRefreshEnabled ? `关闭自动刷新（每 ${autoRefreshIntervalLabel}）` : `开启自动刷新（每 ${autoRefreshIntervalLabel}）`">
              <label class="lumal-cockpit__auto-refresh-control">
                <span>自动刷新</span>
                <ElSwitch
                  v-model="autoRefreshEnabled"
                  size="small"
                  data-action="cockpit-auto-refresh"
                  :aria-label="`全局自动刷新，间隔 ${autoRefreshIntervalLabel}`"
                />
              </label>
            </ElTooltip>
          </div>
          <slot name="header-actions" />
        </template>
        <template #center="slotProps">
          <slot name="center" v-bind="slotProps" />
        </template>
        <template #left="slotProps">
          <slot name="left" v-bind="slotProps" />
        </template>
        <template #right="slotProps">
          <slot name="right" v-bind="slotProps" />
        </template>
      </LumalCockpitCanvas>
      <slot name="configure-trigger" :configure="requestConfigure" />
    </template>
  </div>
</template>
