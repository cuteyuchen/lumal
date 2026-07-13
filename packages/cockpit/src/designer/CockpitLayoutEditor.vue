<script setup lang="ts">
import type { CockpitRegistry, CockpitWidgetDefinition } from '../registry/types'
import type { CockpitGridRowConfig, CockpitSide } from '../types'
import type { DraftWidgetLocation, UseCockpitDraftReturn } from './useCockpitDraft'
import { LumaIcon } from '@luma/icons'
import { ElButton, ElInputNumber, ElMessage, ElSwitch, ElTooltip } from 'element-plus'
import { computed } from 'vue'
import CockpitWidgetDropZone from './CockpitWidgetDropZone.vue'
import CockpitWidgetPreview from './CockpitWidgetPreview.vue'

/***********************左右区域网格编辑器*********************/

const props = defineProps<{
  cockpitId: string
  draft: UseCockpitDraftReturn
  registry: CockpitRegistry
  selectedWidget?: CockpitWidgetDefinition
  side: CockpitSide
}>()

const region = computed(() => {
  const layout = props.draft.activeLayout.value
  if (!layout)
    return undefined
  return props.side === 'left' ? layout.left : layout.right
})

function locationForCell(row: CockpitGridRowConfig, cellId: string): DraftWidgetLocation {
  return { kind: 'cell', side: props.side, rowId: row.id, cellId }
}

function locationForTabs(row: CockpitGridRowConfig, widgetId?: string): DraftWidgetLocation {
  return { kind: 'tabs', side: props.side, rowId: row.id, widgetId }
}

function definitionFor(type: string): CockpitWidgetDefinition | undefined {
  return props.registry.resolveWidget(type)
}

function resize(rows: number, columns: number): void {
  if (!props.draft.resizeRegion(props.side, rows, columns))
    ElMessage.warning('缩减区域会移除已放置模块，请先拖动模块到保留槽位后再操作。')
}

function setTabs(row: CockpitGridRowConfig, enabled: boolean): void {
  if (!props.draft.setRowTabs(props.side, row.id, enabled))
    ElMessage.warning('Tab 行中的模块数超过当前列数，无法解除合并。')
}

function addSelected(location: DraftWidgetLocation): void {
  if (props.selectedWidget)
    props.draft.addWidget(location, props.selectedWidget.type, props.selectedWidget.label)
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
  if (!payload.source)
    return
  const result = props.draft.moveWidget(payload.source, target, payload.replace)
  if (!result.moved && !result.requiresReplace)
    ElMessage.error('模块移动失败。')
}

</script>

<template>
  <section class="luma-cockpit-designer__region" :data-side="side">
    <header class="luma-cockpit-designer__region-head">
      <div>
        <strong>{{ side === 'left' ? '左侧区域' : '右侧区域' }}</strong>
        <span>列宽像素，行高百分比</span>
      </div>
      <label class="luma-cockpit-designer__field">
        <span>行</span>
        <ElInputNumber
          :model-value="region?.rows.length ?? 1"
          :min="1"
          :controls="false"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域行数`"
          @change="resize($event ?? 1, region?.columns.length ?? 1)"
        />
      </label>
      <label class="luma-cockpit-designer__field">
        <span>列</span>
        <ElInputNumber
          :model-value="region?.columns.length ?? 1"
          :min="1"
          :controls="false"
          :aria-label="`${side === 'left' ? '左侧' : '右侧'}区域列数`"
          @change="resize(region?.rows.length ?? 1, $event ?? 1)"
        />
      </label>
    </header>

    <div v-if="region" class="luma-cockpit-designer__region-controls">
      <label v-for="(column, index) in region.columns" :key="column.id" class="luma-cockpit-designer__field">
        <span>列 {{ index + 1 }}</span>
        <ElInputNumber
          :model-value="column.width"
          :min="1"
          :controls="false"
          :aria-label="`列 ${index + 1} 宽度像素`"
          @change="draft.setColumnWidth(side, column.id, $event ?? column.width)"
        />
        <em>px</em>
      </label>
    </div>

    <div v-if="region" class="luma-cockpit-designer__grid-rows">
      <section v-for="(row, rowIndex) in region.rows" :key="row.id" class="luma-cockpit-designer__grid-row" :style="{ flexBasis: `${row.height}%` }">
        <header class="luma-cockpit-designer__grid-row-head">
          <strong>第 {{ rowIndex + 1 }} 行</strong>
          <label class="luma-cockpit-designer__field">
            <span>高</span>
            <ElInputNumber
              :model-value="row.height"
              :min="1"
              :max="100"
              :precision="3"
              :controls="false"
              :aria-label="`第 ${rowIndex + 1} 行高度百分比`"
              @change="draft.setRowHeight(side, row.id, $event ?? row.height)"
            />
            <em>%</em>
          </label>
          <label class="luma-cockpit-designer__tabs-switch">
            <span>合并列</span>
            <ElSwitch :model-value="row.mode === 'tabs'" @change="setTabs(row, Boolean($event))" />
          </label>
        </header>

        <div v-if="row.mode === 'grid'" class="luma-cockpit-designer__grid-cells" :style="{ gridTemplateColumns: `repeat(${region.columns.length}, minmax(0, 1fr))` }">
          <CockpitWidgetDropZone
            v-for="cell in row.cells"
            :key="cell.id"
            :target="locationForCell(row, cell.id)"
            :widget="cell.widget"
            @drop="handleDrop(locationForCell(row, cell.id), $event)"
          >
            <article
              v-if="cell.widget"
              class="luma-cockpit-designer__placed-widget luma-cockpit-designer__drag-item"
              :data-cockpit-drag-source="JSON.stringify(locationForCell(row, cell.id))"
            >
              <CockpitWidgetPreview
                v-if="definitionFor(cell.widget.type)"
                :cockpit-id="cockpitId"
                :definition="definitionFor(cell.widget.type)!"
                :instance-id="`placed-preview:${cell.widget.id}`"
                :layout-id="draft.activeLayout.value?.id ?? ''"
              />
              <div v-else class="luma-cockpit-designer__widget-preview-fallback">未注册模块</div>
              <footer class="luma-cockpit-designer__placed-widget-footer">
                <span>{{ cell.widget.title ?? cell.widget.type }}</span>
                <ElTooltip content="移除模块" placement="top">
                  <ElButton text type="danger" :aria-label="`移除模块 ${cell.widget.title ?? cell.widget.type}`" @click="draft.removeWidget(locationForCell(row, cell.id))">
                    移除
                  </ElButton>
                </ElTooltip>
              </footer>
            </article>
            <ElButton
              v-else
              class="luma-cockpit-designer__empty-cell"
              plain
              :disabled="!selectedWidget"
              @click="addSelected(locationForCell(row, cell.id))"
            >
              <LumaIcon name="luma:plus" :size="14" />
              <span>{{ selectedWidget ? `放入 ${selectedWidget.label}` : '请置入模块' }}</span>
            </ElButton>
          </CockpitWidgetDropZone>
        </div>

        <CockpitWidgetDropZone
          v-else
          class="luma-cockpit-designer__tab-row"
          allow-multiple
          :target="locationForTabs(row)"
          @drop="handleDrop(locationForTabs(row), $event)"
        >
          <article
            v-for="widget in row.widgets"
            :key="widget.id"
            class="luma-cockpit-designer__placed-widget luma-cockpit-designer__drag-item"
            :class="{ 'is-active': row.activeWidgetId === widget.id }"
            :data-cockpit-drag-source="JSON.stringify(locationForTabs(row, widget.id))"
          >
            <CockpitWidgetPreview
              v-if="definitionFor(widget.type)"
              :cockpit-id="cockpitId"
              :definition="definitionFor(widget.type)!"
              :instance-id="`tab-preview:${widget.id}`"
              :layout-id="draft.activeLayout.value?.id ?? ''"
            />
            <div v-else class="luma-cockpit-designer__widget-preview-fallback">未注册模块</div>
            <footer class="luma-cockpit-designer__placed-widget-footer">
              <ElButton text class="luma-cockpit-designer__tab-widget-title" :aria-pressed="row.activeWidgetId === widget.id" @click="draft.setActiveTab(side, row.id, widget.id)">
                {{ widget.title ?? widget.type }}
              </ElButton>
              <ElTooltip content="移除模块" placement="top">
                <ElButton text type="danger" :aria-label="`移除 Tab 模块 ${widget.title ?? widget.type}`" @mousedown.stop @click.stop="draft.removeWidget(locationForTabs(row, widget.id))">
                  移除
                </ElButton>
              </ElTooltip>
            </footer>
          </article>
          <ElButton
            v-if="!row.widgets.length"
            class="luma-cockpit-designer__empty-cell"
            plain
            :disabled="!selectedWidget"
            @click="addSelected(locationForTabs(row))"
          >
            <LumaIcon name="luma:plus" :size="14" />
            <span>{{ selectedWidget ? `放入 ${selectedWidget.label}` : '请置入模块' }}</span>
          </ElButton>
        </CockpitWidgetDropZone>
      </section>
    </div>
  </section>
</template>
