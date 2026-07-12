<script setup lang="ts">
import type { Slots } from 'vue'
import type { CockpitRegistry } from '../registry/types'
import type { CockpitConfig, CockpitRenderMode } from '../types'
import { computed, provide, ref, useSlots, watch } from 'vue'
import { useCockpit } from '../composables/useCockpit'
import { normalizeCockpitConfig } from '../config/normalize'
import { createCockpitMessageBus } from '../messaging/createCockpitMessageBus'
import { cockpitRuntimeEnvKey } from './context'
import LumaCockpitCanvas from './LumaCockpitCanvas.vue'

/***********************驾驶舱运行时主组件*********************/

const props = withDefaults(defineProps<{
  config: CockpitConfig
  registry: CockpitRegistry
  baseWidth?: number
  baseHeight?: number
  cachePages?: boolean
  /** 渲染模式；Designer 预览传入 design，组件可通过 context.mode 感知 */
  renderMode?: CockpitRenderMode
  /** 消息总线可由宿主传入以跨实例共享，否则内部创建 */
  messageBus?: ReturnType<typeof createCockpitMessageBus>
}>(), {
  baseWidth: 1920,
  baseHeight: 1080,
  cachePages: true,
  renderMode: 'runtime',
})

const emit = defineEmits<{
  configure: []
  configError: [error: unknown]
}>()

const activeCategoryId = defineModel<string | undefined>('activeCategoryId')
const activePageId = defineModel<string | undefined>('activePageId')

const slots = useSlots()

// 标准化配置并在同一个纯 computed 中捕获异常，避免 computed 内产生副作用
const normalizedResult = computed<{ config: CockpitConfig | null, error: unknown }>(() => {
  try {
    return { config: normalizeCockpitConfig(props.config), error: null }
  }
  catch (error) {
    return { config: null, error }
  }
})

const normalized = computed<CockpitConfig | null>(() => normalizedResult.value.config)
const configError = computed<unknown>(() => normalizedResult.value.error)

// 标准化失败时向宿主报告，不使驾驶舱崩溃
watch(configError, (error) => {
  if (error)
    emit('configError', error)
}, { immediate: true })

const messages = props.messageBus ?? createCockpitMessageBus()

// 向运行时子树提供稳定环境（深层 Host 从 env.slots 读取宿主插槽）
provide(cockpitRuntimeEnvKey, {
  cockpitId: normalized.value?.id ?? props.config.id,
  mode: props.renderMode,
  registry: props.registry,
  messages,
  cachePages: props.cachePages,
  slots: slots as Slots,
})

const orchestration = useCockpit({
  config: () => normalized.value ?? props.config,
  activeCategoryId,
  activePageId,
})

/***********************全屏*********************/
const rootRef = ref<HTMLElement | null>(null)
async function enterFullscreen(): Promise<void> {
  const el = rootRef.value
  if (el && el.requestFullscreen)
    await el.requestFullscreen()
}
async function exitFullscreen(): Promise<void> {
  if (document.fullscreenElement)
    await document.exitFullscreen()
}
defineExpose({ enterFullscreen, exitFullscreen, messages })

const hasConfig = computed(() => normalized.value !== null && normalized.value.categories.length > 0)

function requestConfigure(): void {
  emit('configure')
}
</script>

<template>
  <div ref="rootRef" class="luma-cockpit" data-mode="runtime">
    <!-- 配置加载失败：可覆盖错误插槽 + 重试 -->
    <template v-if="configError">
      <slot name="error" :error="configError">
        <div class="luma-cockpit__error" role="alert">
          配置加载失败
        </div>
      </slot>
    </template>

    <!-- 配置为空：空驾驶舱状态 -->
    <template v-else-if="!hasConfig">
      <slot name="empty">
        <div class="luma-cockpit__empty" role="status">
          空驾驶舱
        </div>
      </slot>
    </template>

    <template v-else>
      <!-- Canvas 与深层 Host 通过注入的 env.slots 读取宿主插槽，无需逐个转发 -->
      <LumaCockpitCanvas
        :title="normalized!.title"
        :base-width="baseWidth"
        :base-height="baseHeight"
        :visible-categories="orchestration.visibleCategories.value"
        :active-category="orchestration.activeCategory.value"
        :active-pages="orchestration.activePages.value"
        :active-page="orchestration.activePage.value"
        :on-select-category="orchestration.selectCategory"
        :on-select-page="orchestration.selectPage"
      />
      <!-- 配置入口由宿主通过 header-actions 插槽触发，此处仅暴露事件 -->
      <slot name="configure-trigger" :configure="requestConfigure" />
    </template>
  </div>
</template>
