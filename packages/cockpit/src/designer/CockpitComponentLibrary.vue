<script setup lang="ts">
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import Sortable from 'sortablejs'
import { ElButton, ElEmpty } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
let sortable: Sortable | undefined

const widgets = computed(() => props.registry.listWidgets())

onMounted(() => {
  if (!libraryRef.value)
    return
  sortable = Sortable.create(libraryRef.value, {
    animation: 160,
    group: { name: 'luma-cockpit-designer-modules', pull: 'clone', put: false },
    sort: false,
    draggable: '.luma-cockpit-designer__library-card',
    ghostClass: 'is-drag-ghost',
    chosenClass: 'is-drag-chosen',
  })
})

onBeforeUnmount(() => {
  sortable?.destroy()
})
</script>

<template>
  <aside class="luma-cockpit-designer__library" aria-label="模块库">
    <header class="luma-cockpit-designer__library-title">
      <div>
        <strong>模块</strong>
        <span>{{ widgets.length }} 个可用模块</span>
      </div>
    </header>
    <div ref="libraryRef" class="luma-cockpit-designer__library-grid">
      <article
        v-for="widget in widgets"
        :key="widget.type"
        class="luma-cockpit-designer__library-card"
        :class="{ 'is-selected': selectedType === widget.type }"
        :data-cockpit-library-type="widget.type"
        :data-cockpit-library-title="widget.label"
      >
        <CockpitWidgetPreview
          :cockpit-id="cockpitId"
          :definition="widget"
          :instance-id="`library-preview:${widget.type}`"
          :layout-id="layoutId"
        />
        <ElButton
          text
          class="luma-cockpit-designer__library-select"
          :aria-label="`选择或拖动模块：${widget.label}`"
          :aria-pressed="selectedType === widget.type"
          @click="emit('selectWidget', widget)"
        >
          {{ widget.label }}
        </ElButton>
      </article>
      <ElEmpty v-if="!widgets.length" class="luma-cockpit-designer__library-empty" description="暂无可用模块" :image-size="56" />
    </div>
  </aside>
</template>
