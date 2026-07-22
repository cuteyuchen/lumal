<script setup lang="ts">
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import { ElButton, ElEmpty } from 'element-plus'
import Sortable from 'sortablejs'
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import CockpitWidgetPreview from './CockpitWidgetPreview.vue'

/***********************Designer 模块库*********************/

const props = defineProps<{
  cockpitId: string
  layoutId: string
  registry: CockpitRegistry
  selectedType?: string
}>()
const emit = defineEmits<{ selectWidget: [widget: CockpitWidgetDefinition] }>()
const libraryRef = ref<HTMLElement | null>(null)
const livePreviewType = shallowRef<string>()
let sortable: Sortable | undefined

const widgets = computed(() => props.registry.listWidgets())

onMounted(() => {
  if (!libraryRef.value)
    return
  sortable = Sortable.create(libraryRef.value, {
    animation: 160,
    group: { name: 'lumal-cockpit-designer-modules', pull: 'clone', put: false },
    sort: false,
    draggable: '.lumal-cockpit-designer__library-card',
    ghostClass: 'is-drag-ghost',
    chosenClass: 'is-drag-chosen',
  })
})

onBeforeUnmount(() => {
  sortable?.destroy()
})
</script>

<template>
  <aside class="lumal-cockpit-designer__library" aria-label="模块选择">
    <header class="lumal-cockpit-designer__library-head">
      <div class="lumal-cockpit-designer__library-head-copy">
        <strong>模块选择</strong>
        <span>拖拽模块到左侧或右侧区域，也可点击后选择目标槽位</span>
      </div>
      <span class="lumal-cockpit-designer__library-count">{{ widgets.length }} 个</span>
    </header>

    <div ref="libraryRef" class="lumal-cockpit-designer__library-grid">
      <article
        v-for="widget in widgets"
        :key="widget.type"
        class="lumal-cockpit-designer__library-card"
        :class="{ 'is-selected': selectedType === widget.type }"
        :data-cockpit-library-type="widget.type"
        :data-cockpit-library-title="widget.label"
        @pointerenter="livePreviewType = widget.type"
        @pointerleave="livePreviewType = undefined"
        @focusin="livePreviewType = widget.type"
        @focusout="livePreviewType = undefined"
      >
        <CockpitWidgetPreview
          :cockpit-id="cockpitId"
          :definition="widget"
          :instance-id="`library-preview:${widget.type}`"
          :layout-id="layoutId"
          :live="livePreviewType === widget.type"
        />
        <ElButton
          text
          class="lumal-cockpit-designer__library-select"
          :aria-label="`选择或拖动模块：${widget.label}`"
          :aria-pressed="selectedType === widget.type"
          @click="emit('selectWidget', widget)"
        >
          {{ widget.label }}
        </ElButton>
      </article>
      <ElEmpty v-if="!widgets.length" class="lumal-cockpit-designer__library-empty" description="暂无可用模块" :image-size="56" />
    </div>
  </aside>
</template>
