<script setup lang="ts">
import type { CockpitMessageBus } from '../messaging/types'
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import type { CockpitGridRowConfig, CockpitSide, CockpitWidgetInstance } from '../types'
import type { DesignerPlacementSelection } from './types'
import type { DraftWidgetLocation, UseCockpitDraftReturn } from './useCockpitDraft'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElInputNumber, ElMessage, ElSwitch, ElTooltip } from 'element-plus'
import { computed, nextTick } from 'vue'
import CockpitWidgetDropZone from './CockpitWidgetDropZone.vue'
import CockpitWidgetPreview from './CockpitWidgetPreview.vue'
import { confirmWidgetReplacement } from './confirmWidgetReplacement'

/***********************左右区域网格编辑器*********************/

const props = defineProps<{
  cockpitId: string
  draft: UseCockpitDraftReturn
  registry: CockpitRegistry
  placementSelection?: DesignerPlacementSelection
  previewMessageBus: CockpitMessageBus
  side: CockpitSide
}>()

const emit = defineEmits<{
  selectPlaced: [selection: Extract<DesignerPlacementSelection, { kind: 'placed' }>]
  clearPlacement: []
}>()

const region = computed(() => {
  const layout = props.draft.activeLayout.value
  if (!layout)
    return undefined
  const resolved = props.side === 'left' ? layout.left : layout.right
  return resolved ? { ...resolved } : undefined
})

const cellLocationMap = computed(() => {
  const map = new Map<string, { location: DraftWidgetLocation, serialized: string }>()
  region.value?.rows.forEach((row) => {
    row.cells.forEach((cell) => {
      const location = { kind: 'cell', side: props.side, rowId: row.id, cellId: cell.id } as const
      map.set(cell.id, { location, serialized: JSON.stringify(location) })
    })
  })
  return map
})

const tabLocationMap = computed(() => {
  const map = new Map<string, { location: DraftWidgetLocation, serialized: string }>()
  region.value?.rows.forEach((row) => {
    const rowLocation = { kind: 'tabs', side: props.side, rowId: row.id } as const
    map.set(`row:${row.id}`, { location: rowLocation, serialized: JSON.stringify(rowLocation) })
    row.widgets.forEach((widget) => {
      const location = { ...rowLocation, widgetId: widget.id } as const
      map.set(`widget:${widget.id}`, { location, serialized: JSON.stringify(location) })
    })
  })
  return map
})

function locationForCell(row: CockpitGridRowConfig, cellId: string): DraftWidgetLocation {
  return cellLocationMap.value.get(cellId)?.location ?? { kind: 'cell', side: props.side, rowId: row.id, cellId }
}

function locationForTabs(row: CockpitGridRowConfig, widgetId?: string): DraftWidgetLocation {
  const key = widgetId ? `widget:${widgetId}` : `row:${row.id}`
  return tabLocationMap.value.get(key)?.location ?? { kind: 'tabs', side: props.side, rowId: row.id, widgetId }
}

function serializedLocationForCell(row: CockpitGridRowConfig, cellId: string): string {
  return cellLocationMap.value.get(cellId)?.serialized ?? JSON.stringify(locationForCell(row, cellId))
}

function serializedLocationForTabs(row: CockpitGridRowConfig, widgetId?: string): string {
  const key = widgetId ? `widget:${widgetId}` : `row:${row.id}`
  return tabLocationMap.value.get(key)?.serialized ?? JSON.stringify(locationForTabs(row, widgetId))
}

function definitionFor(type: string): CockpitWidgetDefinition | undefined {
  return props.registry.resolveWidget(type)
}

function columnTemplate(): string {
  const count = region.value?.columns.length ?? 1
  return Array.from({ length: Math.max(1, count) }).fill('minmax(0, 1fr)').join(' ')
}

function activeWidgetFor(row: CockpitGridRowConfig): CockpitWidgetInstance | undefined {
  return row.widgets.find(widget => widget.id === row.activeWidgetId) ?? row.widgets[0]
}

function sameLocation(left: DraftWidgetLocation, right: DraftWidgetLocation): boolean {
  if (left.kind !== right.kind || left.side !== right.side || left.rowId !== right.rowId)
    return false
  return left.kind === 'cell'
    ? left.cellId === (right as Extract<DraftWidgetLocation, { kind: 'cell' }>).cellId
    : left.widgetId === (right as Extract<DraftWidgetLocation, { kind: 'tabs' }>).widgetId
}

function isSelectedLocation(location: DraftWidgetLocation): boolean {
  return props.placementSelection?.kind === 'placed'
    && sameLocation(props.placementSelection.location, location)
}

function canUseAsTarget(location: DraftWidgetLocation): boolean {
  const selection = props.placementSelection
  return Boolean(selection && (selection.kind !== 'placed' || !sameLocation(selection.location, location)))
}

function resize(rows: number, columns: number): void {
  if (!props.draft.resizeRegion(props.side, rows, columns))
    ElMessage.warning('缩减区域会移除已放置模块，请先拖动模块到保留槽位后再操作。')
}

function setTabs(row: CockpitGridRowConfig, enabled: boolean): void {
  if (!props.draft.setRowTabs(props.side, row.id, enabled)) {
    ElMessage.warning('Tab 行中的模块数超过当前列数，无法解除合并。')
    return
  }
  if (props.placementSelection?.kind === 'placed'
    && props.placementSelection.location.side === props.side
    && props.placementSelection.location.rowId === row.id) {
    emit('clearPlacement')
  }
}

function selectPlaced(location: DraftWidgetLocation, widget: CockpitWidgetInstance): void {
  emit('selectPlaced', {
    kind: 'placed',
    location,
    widgetId: widget.id,
    title: widget.title ?? definitionFor(widget.type)?.label ?? widget.type,
  })
}

function removeWidget(location: DraftWidgetLocation): void {
  if (isSelectedLocation(location))
    emit('clearPlacement')
  props.draft.removeWidget(location)
}

async function placeSelection(target: DraftWidgetLocation): Promise<void> {
  const selection = props.placementSelection
  if (!selection || (selection.kind === 'placed' && sameLocation(selection.location, target)))
    return

  let replace = false
  if (target.kind === 'cell' && props.draft.hasWidgetAt(target)) {
    replace = await confirmWidgetReplacement()
    if (!replace)
      return
  }

  if (selection.kind === 'library') {
    if (!props.draft.addWidget(target, selection.type, selection.title, replace))
      ElMessage.warning('模块放置失败，请检查目标槽位。')
    return
  }

  let result = props.draft.moveWidget(selection.location, target, replace)
  if (result.requiresReplace && await confirmWidgetReplacement())
    result = props.draft.moveWidget(selection.location, target, true)
  if (!result.moved) {
    ElMessage.warning('模块移动失败，请重新选择目标。')
    return
  }
  emit('clearPlacement')
}

function handleDrop(target: DraftWidgetLocation, payload: { source?: DraftWidgetLocation, library?: { type: string, title?: string }, replace?: boolean, reorder?: { oldIndex: number, newIndex: number } }): void {
  if (payload.reorder && target.kind === 'tabs') {
    props.draft.reorderTabWidgets(props.side, target.rowId, payload.reorder.oldIndex, payload.reorder.newIndex)
    return
  }
  if (payload.library) {
    if (!props.draft.addWidget(target, payload.library.type, payload.library.title, payload.replace))
      ElMessage.warning('目标槽位已有模块，请确认替换后再操作。')
    return
  }
  if (!payload.source) {
    return
  }
  const result = props.draft.moveWidget(payload.source, target, payload.replace)
  if (!result.moved && !result.requiresReplace) {
    ElMessage.error('模块移动失败。')
  }
  else if (result.moved && props.placementSelection?.kind === 'placed'
    && sameLocation(props.placementSelection.location, payload.source)) {
    emit('clearPlacement')
  }
}

async function handleTabKeydown(row: CockpitGridRowConfig, index: number, event: KeyboardEvent): Promise<void> {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key) || !row.widgets.length)
    return
  event.preventDefault()
  const last = row.widgets.length - 1
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? last
      : event.key === 'ArrowRight'
        ? (index + 1) % row.widgets.length
        : (index - 1 + row.widgets.length) % row.widgets.length
  props.draft.setActiveTab(props.side, row.id, row.widgets[nextIndex].id)
  await nextTick()
  const list = (event.currentTarget as HTMLElement).closest('[role="tablist"]')
  list?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex]?.focus()
}
</script>

<template>
  <section class="lumal-cockpit-designer__region" :data-side="side">
    <header
      class="lumal-cockpit-designer__region-head"
      data-role="region-tools"
      role="group"
      :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域布局设置`"
    >
      <div class="lumal-cockpit-designer__region-head-meta">
        <strong>{{ side === 'left' ? '左侧区域' : '右侧区域' }}</strong>
        <span>调整网格结构与区域宽</span>
      </div>
      <label class="lumal-cockpit-designer__field">
        <span>行</span>
        <ElInputNumber
          :model-value="region?.rows.length ?? 1"
          :min="1"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域行数`"
          @change="resize($event ?? 1, region?.columns.length ?? 1)"
        />
      </label>
      <label class="lumal-cockpit-designer__field">
        <span>列</span>
        <ElInputNumber
          :model-value="region?.columns.length ?? 1"
          :min="1"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域列数`"
          @change="resize(region?.rows.length ?? 1, $event ?? 1)"
        />
      </label>
      <label class="lumal-cockpit-designer__field lumal-cockpit-designer__region-width-field">
        <span>区域宽</span>
        <ElInputNumber
          :model-value="region?.width ?? 0"
          :min="Math.max(1, region?.columns.length ?? 1)"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域宽度像素`"
          @change="draft.setRegionWidth(side, $event ?? region?.width ?? 0)"
        />
        <em>px</em>
      </label>
    </header>

    <div v-if="region" class="lumal-cockpit-designer__grid-rows">
      <section
        v-for="(row, rowIndex) in region.rows"
        :key="row.id"
        class="lumal-cockpit-designer__grid-row"
        :style="{ flex: `${row.height} 1 0` }"
      >
        <header
          class="lumal-cockpit-designer__grid-row-head"
          data-role="row-tools"
          role="group"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}第 ${rowIndex + 1} 行布局设置`"
        >
          <strong>第 {{ rowIndex + 1 }} 行</strong>
          <label class="lumal-cockpit-designer__field">
            <span>行高</span>
            <ElInputNumber
              :model-value="row.height"
              :min="1"
              :max="100"
              :precision="3"
              :aria-label="`第 ${rowIndex + 1} 行高度百分比`"
              @change="draft.setRowHeight(side, row.id, $event ?? row.height)"
            />
            <em>%</em>
          </label>
          <label class="lumal-cockpit-designer__tabs-switch">
            <span>合并列</span>
            <ElSwitch :model-value="row.mode === 'tabs'" @change="setTabs(row, Boolean($event))" />
          </label>
        </header>

        <div v-if="row.mode === 'grid'" class="lumal-cockpit-designer__grid-cells" :style="{ gridTemplateColumns: columnTemplate() }">
          <CockpitWidgetDropZone
            v-for="cell in row.cells"
            :key="cell.id"
            :target="locationForCell(row, cell.id)"
            :widget="cell.widget"
            @drop="handleDrop(locationForCell(row, cell.id), $event)"
          >
            <article
              v-if="cell.widget"
              class="lumal-cockpit-designer__placed-widget lumal-cockpit-designer__drag-item"
              :class="{ 'is-keyboard-selected': isSelectedLocation(locationForCell(row, cell.id)) }"
              :data-cockpit-drag-source="serializedLocationForCell(row, cell.id)"
              data-role="placed-widget"
            >
              <!-- 与 Tab 多模块一致：名称与操作区固定在顶部 -->
              <header class="lumal-cockpit-designer__placed-widget-header">
                <span>{{ cell.widget.title ?? cell.widget.type }}</span>
                <div class="lumal-cockpit-designer__placed-widget-actions">
                  <ElTooltip content="选择并移动模块" placement="top">
                    <ElButton
                      class="lumal-cockpit-designer__widget-action"
                      data-role="select-move-source"
                      :aria-label="`选择移动模块 ${cell.widget.title ?? cell.widget.type}`"
                      :aria-pressed="isSelectedLocation(locationForCell(row, cell.id))"
                      @mousedown.stop
                      @click.stop="selectPlaced(locationForCell(row, cell.id), cell.widget)"
                    >
                      <LumalIcon name="lumal:more" :size="12" />
                    </ElButton>
                  </ElTooltip>
                  <ElTooltip v-if="canUseAsTarget(locationForCell(row, cell.id))" content="移动并替换到此槽位" placement="top">
                    <ElButton
                      class="lumal-cockpit-designer__widget-action"
                      data-role="keyboard-target"
                      :aria-label="`移动并替换 ${cell.widget.title ?? cell.widget.type}`"
                      @mousedown.stop
                      @click.stop="placeSelection(locationForCell(row, cell.id))"
                    >
                      <LumalIcon name="lumal:plus" :size="12" />
                    </ElButton>
                  </ElTooltip>
                  <ElTooltip content="移除模块" placement="top">
                    <ElButton
                      type="danger"
                      class="lumal-cockpit-designer__widget-action"
                      data-role="remove-widget"
                      :aria-label="`移除模块 ${cell.widget.title ?? cell.widget.type}`"
                      @click="removeWidget(locationForCell(row, cell.id))"
                    >
                      <LumalIcon name="lumal:close" :size="12" />
                    </ElButton>
                  </ElTooltip>
                </div>
              </header>
              <div class="lumal-cockpit-designer__placed-widget-body">
                <CockpitWidgetPreview
                  v-if="definitionFor(cell.widget.type)"
                  :cockpit-id="cockpitId"
                  :definition="definitionFor(cell.widget.type)!"
                  :instance-id="cell.widget.id"
                  :layout-id="draft.activeLayout.value?.id ?? ''"
                  :message-bus="previewMessageBus"
                  live
                />
                <div v-else class="lumal-cockpit-designer__widget-preview-fallback">
                  未注册模块
                </div>
              </div>
            </article>
            <ElButton
              v-else
              class="lumal-cockpit-designer__empty-cell"
              plain
              :disabled="!placementSelection"
              data-role="keyboard-target"
              @click="placeSelection(locationForCell(row, cell.id))"
            >
              <span>{{ placementSelection ? `放入 ${placementSelection.title}` : '请置入模块' }}</span>
            </ElButton>
          </CockpitWidgetDropZone>
        </div>

        <CockpitWidgetDropZone
          v-else
          class="lumal-cockpit-designer__tab-row"
          allow-multiple
          drag-handle=".lumal-cockpit-designer__tab-move"
          sortable-target=".lumal-cockpit-designer__tab-list"
          :target="locationForTabs(row)"
          @drop="handleDrop(locationForTabs(row), $event)"
        >
          <section class="lumal-cockpit-designer__tab-card" :class="{ 'is-empty': !row.widgets.length }">
            <header class="lumal-cockpit-designer__tab-list" role="tablist" :aria-label="`${side === 'left' ? '左侧' : '右侧'}第 ${rowIndex + 1} 行模块`">
              <div
                v-for="(widget, widgetIndex) in row.widgets"
                :key="widget.id"
                class="lumal-cockpit-designer__tab-item lumal-cockpit-designer__drag-item"
                :class="{ 'is-active': row.activeWidgetId === widget.id, 'is-keyboard-selected': isSelectedLocation(locationForTabs(row, widget.id)) }"
                :data-cockpit-drag-source="serializedLocationForTabs(row, widget.id)"
              >
                <ElButton
                  :id="`designer-tab-${widget.id}`"
                  text
                  class="lumal-cockpit-designer__tab-widget-title"
                  role="tab"
                  :aria-controls="`designer-tabpanel-${row.id}`"
                  :aria-selected="row.activeWidgetId === widget.id"
                  :tabindex="row.activeWidgetId === widget.id ? 0 : -1"
                  @click="draft.setActiveTab(side, row.id, widget.id)"
                  @keydown="handleTabKeydown(row, widgetIndex, $event)"
                >
                  {{ widget.title ?? widget.type }}
                </ElButton>
                <ElTooltip content="拖拽或选择移动 Tab" placement="top">
                  <ElButton
                    class="lumal-cockpit-designer__tab-action lumal-cockpit-designer__tab-move"
                    data-role="select-move-source"
                    :aria-label="`选择移动 Tab ${widget.title ?? widget.type}`"
                    :aria-pressed="isSelectedLocation(locationForTabs(row, widget.id))"
                    @mousedown.stop
                    @click.stop="selectPlaced(locationForTabs(row, widget.id), widget)"
                  >
                    <LumalIcon name="lumal:more" :size="11" />
                  </ElButton>
                </ElTooltip>
                <ElTooltip content="移除 Tab" placement="top">
                  <ElButton
                    type="danger"
                    class="lumal-cockpit-designer__tab-action"
                    data-role="remove-widget"
                    :aria-label="`移除 Tab 模块 ${widget.title ?? widget.type}`"
                    @mousedown.stop
                    @click.stop="removeWidget(locationForTabs(row, widget.id))"
                  >
                    <LumalIcon name="lumal:close" :size="11" />
                  </ElButton>
                </ElTooltip>
              </div>
              <ElTooltip v-if="row.widgets.length && placementSelection" content="移入此 Tab 行" placement="top">
                <ElButton
                  class="lumal-cockpit-designer__tab-target"
                  data-role="keyboard-target"
                  aria-label="移入此 Tab 行"
                  @click="placeSelection(locationForTabs(row))"
                >
                  <LumalIcon name="lumal:plus" :size="12" />
                </ElButton>
              </ElTooltip>
            </header>
            <div
              :id="`designer-tabpanel-${row.id}`"
              class="lumal-cockpit-designer__tab-preview"
              role="tabpanel"
              :aria-labelledby="activeWidgetFor(row) ? `designer-tab-${activeWidgetFor(row)!.id}` : undefined"
            >
              <template v-if="activeWidgetFor(row)">
                <CockpitWidgetPreview
                  v-if="definitionFor(activeWidgetFor(row)!.type)"
                  :key="activeWidgetFor(row)!.id"
                  :cockpit-id="cockpitId"
                  :definition="definitionFor(activeWidgetFor(row)!.type)!"
                  :instance-id="activeWidgetFor(row)!.id"
                  :layout-id="draft.activeLayout.value?.id ?? ''"
                  :message-bus="previewMessageBus"
                  live
                />
                <div v-else class="lumal-cockpit-designer__widget-preview-fallback">
                  未注册模块
                </div>
              </template>
              <ElButton
                v-else
                class="lumal-cockpit-designer__empty-cell"
                plain
                :disabled="!placementSelection"
                data-role="keyboard-target"
                @click="placeSelection(locationForTabs(row))"
              >
                <span>{{ placementSelection ? `添加 ${placementSelection.title} 到 Tab` : '请置入模块' }}</span>
              </ElButton>
            </div>
          </section>
        </CockpitWidgetDropZone>
      </section>
    </div>
  </section>
</template>
