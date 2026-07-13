<script setup lang="ts">
import type { SortableEvent } from 'sortablejs'
import type { CockpitWidgetInstance } from '../types'
import type { DraftWidgetLocation } from './useCockpitDraft'
import Sortable from 'sortablejs'
import { ElMessageBox } from 'element-plus'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

/***********************Designer 模块投放区*********************/

interface DragPayload {
  source?: DraftWidgetLocation
  library?: { type: string, title?: string }
  replace?: boolean
  reorder?: { oldIndex: number, newIndex: number }
}

const props = withDefaults(defineProps<{
  allowMultiple?: boolean
  target: DraftWidgetLocation
  widget?: CockpitWidgetInstance
}>(), {
  allowMultiple: false,
  widget: undefined,
})

const emit = defineEmits<{
  drop: [payload: DragPayload]
}>()

const zoneRef = ref<HTMLElement | null>(null)
let sortable: Sortable | undefined

function readSource(value: string | undefined): DraftWidgetLocation | undefined {
  if (!value)
    return undefined
  try {
    const source = JSON.parse(value) as DraftWidgetLocation
    if (source.kind === 'cell' || source.kind === 'tabs')
      return source
  }
  catch {
    return undefined
  }
  return undefined
}

function isCurrentTarget(source: DraftWidgetLocation | undefined): boolean {
  return Boolean(
    source
    && source.kind === 'cell'
    && props.target.kind === 'cell'
    && source.side === props.target.side
    && source.rowId === props.target.rowId
    && source.cellId === props.target.cellId,
  )
}

function canMove(event: Sortable.MoveEvent): boolean {
  const source = readSource((event.dragged as HTMLElement).dataset.cockpitDragSource)
  return !isCurrentTarget(source)
}

function payloadFor(item: HTMLElement, replace = false): DragPayload {
  const source = readSource(item.dataset.cockpitDragSource)
  const type = item.dataset.cockpitLibraryType
  return source
    ? { source, replace }
    : type
      ? { library: { type, title: item.dataset.cockpitLibraryTitle }, replace }
      : {}
}

async function handleAdd(event: SortableEvent): Promise<void> {
  const item = event.item as HTMLElement
  const payload = payloadFor(item)
  const replace = !props.allowMultiple && Boolean(props.widget)

  if (replace) {
    try {
      await ElMessageBox.confirm('目标槽位已有模块，是否替换？', '确认替换', {
        cancelButtonText: '取消',
        confirmButtonText: '替换',
        type: 'warning',
      })
    }
    catch {
      if (payload.source)
        event.from.appendChild(item)
      else
        item.remove()
      return
    }
  }

  emit('drop', { ...payload, replace })
  void nextTick(() => item.remove())
}

onMounted(() => {
  if (!zoneRef.value)
    return
  sortable = Sortable.create(zoneRef.value, {
    animation: 160,
    group: { name: 'luma-cockpit-designer-modules', pull: true, put: true },
    sort: props.allowMultiple,
    draggable: '.luma-cockpit-designer__drag-item',
    ghostClass: 'is-drag-ghost',
    chosenClass: 'is-drag-chosen',
    onMove: canMove,
    onAdd: event => void handleAdd(event),
    onUpdate(event) {
      if (props.allowMultiple && event.oldIndex !== undefined && event.newIndex !== undefined)
        emit('drop', { reorder: { oldIndex: event.oldIndex, newIndex: event.newIndex } })
    },
  })
})

onBeforeUnmount(() => {
  sortable?.destroy()
})
</script>

<template>
  <div ref="zoneRef" class="luma-cockpit-designer__drop-zone" :class="{ 'is-tabs': allowMultiple }">
    <slot />
  </div>
</template>
