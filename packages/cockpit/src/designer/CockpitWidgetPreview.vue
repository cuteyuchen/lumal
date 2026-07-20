<script setup lang="ts">
import type { CockpitMessageBus } from '../messaging/types'
import type { CockpitWidgetDefinition } from '../registry/types'
import type { CockpitBaseContext } from '../types'
import { LumalIcon } from '@lumal/icons-vue'
import { computed, onBeforeUnmount, ref, shallowReactive, watchEffect } from 'vue'
import { useCanvasScale } from '../composables/useCanvasScale'
import { provideCockpitContext } from '../composables/useCockpitContext'
import { createCockpitMessageBus } from '../messaging/createCockpitMessageBus'
import CockpitErrorBoundary from '../runtime/CockpitErrorBoundary.vue'
import { resolveCockpitComponent } from '../runtime/resolveComponent'

/***********************Designer 模块实时预览*********************/

const props = withDefaults(defineProps<{
  cockpitId: string
  definition: CockpitWidgetDefinition
  instanceId: string
  layoutId: string
  messageBus?: CockpitMessageBus
  baseWidth?: number
  baseHeight?: number
  live?: boolean
}>(), {
  baseWidth: 480,
  baseHeight: 270,
  live: false,
})

const previewRef = ref<HTMLElement | null>(null)
const messages = props.messageBus ?? createCockpitMessageBus()
const context = shallowReactive<CockpitBaseContext>({
  cockpitId: props.cockpitId,
  layoutId: props.layoutId,
  instanceId: props.instanceId,
  mode: 'design',
  messages,
})

watchEffect(() => {
  context.cockpitId = props.cockpitId
  context.layoutId = props.layoutId
  context.instanceId = props.instanceId
})

provideCockpitContext(context)

const resolved = computed(() => resolveCockpitComponent(props.definition.component))
const { result } = useCanvasScale(previewRef, {
  baseWidth: () => props.baseWidth,
  baseHeight: () => props.baseHeight,
  enabled: () => props.live,
})
const stageStyle = computed(() => ({
  width: `${props.baseWidth}px`,
  height: `${props.baseHeight}px`,
  transform: `translate(${result.value.offsetX}px, ${result.value.offsetY}px) scale(${result.value.scale})`,
  transformOrigin: 'top left',
}))

onBeforeUnmount(() => {
  messages.clearInstance(props.instanceId)
})
</script>

<template>
  <div ref="previewRef" class="lumal-cockpit-designer__widget-preview">
    <img
      v-if="definition.thumbnail"
      :src="definition.thumbnail"
      :alt="`${definition.label}预览`"
      class="lumal-cockpit-designer__widget-preview-image"
    >
    <div v-else-if="live" class="lumal-cockpit-designer__widget-preview-stage" :style="stageStyle" inert aria-hidden="true">
      <CockpitErrorBoundary>
        <component :is="resolved" :context="context" />
        <template #error>
          <div class="lumal-cockpit-designer__widget-preview-fallback">
            <LumalIcon :name="definition.icon || 'lumal:grid'" :size="28" />
            <span>预览不可用</span>
          </div>
        </template>
      </CockpitErrorBoundary>
    </div>
    <div v-else class="lumal-cockpit-designer__widget-preview-placeholder" aria-hidden="true">
      <LumalIcon :name="definition.icon || 'lumal:grid'" :size="28" />
    </div>
  </div>
</template>
