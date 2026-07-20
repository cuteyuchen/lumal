<script setup lang="ts" generic="T extends SchemaTableRecord = SchemaTableRow">
import type { TableInstance } from 'element-plus'
import type {
  NormalizedSchemaTableColumn,
  SchemaTableAuthority,
  SchemaTableClassName,
  SchemaTableColumn,
  SchemaTableColumnSettings,
  SchemaTablePaginationChangePayload,
  SchemaTableRecord,
  SchemaTableRow,
  SchemaTableSortChangePayload,
  SchemaTableTreeProps,
} from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElCheckbox, ElLoading, ElPopover, ElTable, ElTableColumn } from 'element-plus'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  unref,
  useTemplateRef,
  watch,
} from 'vue'
import { createDictionaryOptionIndex, useDictionaryMap } from '../../dictionary'
import { LumalPagination } from '../pagination'
import { resolveSchemaTableCellDisplay } from './cell'
import LumalSchemaTableCell from './LumalSchemaTableCell.vue'
import { normalizeSchemaTableColumns } from './normalize'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  actionLabel?: string
  actionWidth?: number | string
  autoResize?: boolean
  canAccess?: (authority: SchemaTableAuthority) => boolean
  cellClassName?: SchemaTableClassName<T>
  columnResizable?: boolean
  columnSettings?: SchemaTableColumnSettings
  columns: SchemaTableColumn<T>[]
  defaultExpandAll?: boolean
  emptyText?: string
  error?: Error | string | boolean
  errorText?: string
  headerCellClassName?: SchemaTableClassName<T>
  indexLabel?: string
  indexWidth?: number | string
  loading?: boolean
  mobileActionLabel?: string
  mobileActionWidth?: number | string
  pageSizes?: number[]
  pagination?: boolean
  rowClassName?: SchemaTableClassName<T>
  rowKey?: string | ((row: T, index: number) => string | number)
  rows?: T[]
  retryText?: string
  scaleColumnWidth?: boolean
  selection?: boolean
  showColumnSettings?: boolean
  showIndex?: boolean
  tableProps?: Record<string, unknown>
  total?: number
  treeProps?: SchemaTableTreeProps
}>(), {
  actionLabel: '操作',
  actionWidth: 160,
  autoResize: true,
  columnResizable: true,
  emptyText: '暂无数据',
  error: false,
  errorText: '数据加载失败',
  indexLabel: '#',
  indexWidth: 64,
  loading: false,
  mobileActionLabel: '更多',
  mobileActionWidth: 72,
  pageSizes: () => [10, 20, 50, 100],
  pagination: false,
  rowKey: 'id',
  rows: () => [],
  retryText: '重新加载',
  scaleColumnWidth: true,
  selection: false,
  showColumnSettings: false,
  showIndex: false,
  tableProps: () => ({}),
  total: 0,
})

const emit = defineEmits<{
  currentChange: [currentRow: T | null, oldCurrentRow: T | null]
  expandChange: [row: T, expanded: boolean | T[]]
  filterChange: [filters: Record<string, unknown>]
  pageChange: [payload: SchemaTablePaginationChangePayload]
  retry: []
  rowClick: [row: T, column: unknown, event: Event]
  selectionChange: [selectedRows: T[], selectedRowKeys: Array<string | number>]
  sortChange: [payload: SchemaTableSortChangePayload]
}>()

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })
const vLoading = ElLoading.directive

/***********************模板引用与状态*********************/
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const tableRef = useTemplateRef<TableInstance>('tableRef')
const hiddenColumnFields = shallowRef(new Set<string>())
const columnOrder = shallowRef<string[]>([])
const selectedRows = shallowRef<T[]>([])
const selectedRowKeys = shallowRef<Array<string | number>>([])
const isMobileViewport = shallowRef(typeof window !== 'undefined' && window.innerWidth <= 768)
const openMobileActionKey = shallowRef<string | null>(null)
let resizeObserver: ResizeObserver | undefined
let resizeLayoutTimer: ReturnType<typeof setTimeout> | undefined
let draggedColumnField = ''

const normalizedColumns = computed(() => normalizeSchemaTableColumns<T>(props.columns, {
  canAccess: props.canAccess,
}))
const orderedColumns = computed(() => {
  const order = columnOrder.value
  if (order.length === 0) {
    return normalizedColumns.value
  }
  const indexMap = new Map(order.map((field, index) => [field, index]))
  return [...normalizedColumns.value].sort((left, right) =>
    (indexMap.get(String(left.field)) ?? Number.MAX_SAFE_INTEGER)
    - (indexMap.get(String(right.field)) ?? Number.MAX_SAFE_INTEGER))
})
const renderableColumns = computed(() => orderedColumns.value.filter(column =>
  column.renderable && !hiddenColumnFields.value.has(String(column.field)),
))
const configurableColumns = computed(() => orderedColumns.value.filter(column =>
  column.renderable && !column.fixed && column.configurable !== false,
))
const flexibleColumnField = computed(() => [...renderableColumns.value]
  .reverse()
  .find(column => !column.fixed)
  ?.field)

const { dictionaryMap } = useDictionaryMap(() =>
  normalizedColumns.value.map(column => column.dictionary ?? column.dictType),
)

const columnOptionIndexes = computed(() => new Map(
  normalizedColumns.value.map((column) => {
    const options = resolveColumnOptions(column)
    return [String(column.field), createDictionaryOptionIndex(options)] as const
  }),
))

const rowIndexMap = computed(() => new Map(props.rows.map((row, index) => [row, index])))
const elementRowKey = computed(() => {
  if (typeof props.rowKey !== 'function') {
    return props.rowKey
  }

  const rowKey = props.rowKey
  const indexes = rowIndexMap.value
  return (row: T): string => String(rowKey(row, indexes.get(row) ?? -1))
})
const showPagination = computed(() => props.pagination && props.total > 0)
const showColumnSettingsPanel = computed(() => props.showColumnSettings || props.columnSettings?.enabled)
const resolvedActionWidth = computed(() => isMobileViewport.value ? props.mobileActionWidth : props.actionWidth)
const resolvedErrorText = computed(() => props.error instanceof Error
  ? props.error.message || props.errorText
  : typeof props.error === 'string' ? props.error : props.errorText)
const resolvedDefaultExpandAll = computed(() =>
  props.defaultExpandAll ?? Boolean(props.tableProps.defaultExpandAll),
)
const resolvedTreeProps = computed<SchemaTableTreeProps>(() =>
  props.treeProps
  ?? props.tableProps.treeProps as SchemaTableTreeProps | undefined
  ?? { children: 'children', hasChildren: 'hasChildren' },
)

/***********************列与单元格*********************/
function toggleColumnVisible(field: string): void {
  const next = new Set(hiddenColumnFields.value)
  if (next.has(field)) {
    next.delete(field)
  }
  else {
    const visibleConfigurableCount = configurableColumns.value.filter(column =>
      !next.has(String(column.field)),
    ).length
    if (visibleConfigurableCount <= 1) {
      return
    }
    next.add(field)
  }
  hiddenColumnFields.value = next
  persistColumnSettings()
  void nextTick(() => tableRef.value?.doLayout?.())
}

function resetColumnSettings(): void {
  hiddenColumnFields.value = new Set()
  columnOrder.value = normalizedColumns.value.map(column => String(column.field))
  persistColumnSettings()
  void nextTick(() => tableRef.value?.doLayout?.())
}

function moveColumn(field: string, direction: -1 | 1): void {
  const order = configurableColumns.value.map(column => String(column.field))
  const currentIndex = order.indexOf(field)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= order.length) {
    return
  }
  const targetField = order[targetIndex]
  const fullOrder = orderedColumns.value.map(column => String(column.field))
  const from = fullOrder.indexOf(field)
  const to = fullOrder.indexOf(targetField)
  fullOrder.splice(from, 1)
  fullOrder.splice(to, 0, field)
  columnOrder.value = fullOrder
  persistColumnSettings()
  void nextTick(() => tableRef.value?.doLayout?.())
}

function handleColumnDragStart(field: string): void {
  draggedColumnField = field
}

function handleColumnDrop(targetField: string): void {
  if (!draggedColumnField || draggedColumnField === targetField) {
    draggedColumnField = ''
    return
  }
  const order = orderedColumns.value.map(column => String(column.field))
  const from = order.indexOf(draggedColumnField)
  const to = order.indexOf(targetField)
  if (from >= 0 && to >= 0) {
    order.splice(from, 1)
    order.splice(to, 0, draggedColumnField)
    columnOrder.value = order
    persistColumnSettings()
    void nextTick(() => tableRef.value?.doLayout?.())
  }
  draggedColumnField = ''
}

function persistColumnSettings(): void {
  const key = props.columnSettings?.storageKey
  if (!key || typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.setItem(key, JSON.stringify({
      hidden: [...hiddenColumnFields.value],
      order: columnOrder.value,
    }))
  }
  catch {
    // 存储不可用时保留当前会话状态。
  }
}

function restoreColumnSettings(): void {
  columnOrder.value = normalizedColumns.value.map(column => String(column.field))
  const key = props.columnSettings?.storageKey
  if (!key || typeof localStorage === 'undefined') {
    return
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}') as { hidden?: string[], order?: string[] }
    const fields = new Set(normalizedColumns.value.map(column => String(column.field)))
    hiddenColumnFields.value = new Set((stored.hidden ?? []).filter(field => fields.has(field)))
    columnOrder.value = [
      ...(stored.order ?? []).filter(field => fields.has(field)),
      ...[...fields].filter(field => !(stored.order ?? []).includes(field)),
    ]
  }
  catch {
    resetColumnSettings()
  }
}

function resolveColumnOptions(column: NormalizedSchemaTableColumn<T>) {
  const dictionary = column.dictionary ?? column.dictType
  if (dictionary) {
    return dictionaryMap.value[dictionary] ?? []
  }

  return unref(column.options) ?? []
}

function isCellHidden(row: T, column: NormalizedSchemaTableColumn<T>, index: number): boolean {
  return typeof column.hidden === 'function'
    ? Boolean(column.hidden({ rows: props.rows, row, index }))
    : false
}

function resolveCellDisplay(row: T, column: NormalizedSchemaTableColumn<T>, index: number) {
  return resolveSchemaTableCellDisplay(
    row as SchemaTableRow,
    column as NormalizedSchemaTableColumn,
    index,
    resolveColumnOptions(column),
    columnOptionIndexes.value.get(String(column.field)),
  )
}

function createColumnFormatter(column: NormalizedSchemaTableColumn<T>) {
  return (row: T, _column: unknown, _cellValue: unknown, index: number): string =>
    isCellHidden(row, column, index) ? '' : resolveCellDisplay(row, column, index).text
}

const columnFormatters = computed(() => new Map(
  normalizedColumns.value.map(column => [String(column.field), createColumnFormatter(column)]),
))

function resolveColumnFormatter(column: NormalizedSchemaTableColumn<T>) {
  return columnFormatters.value.get(String(column.field))
}

function resolveColumnMinWidth(column: NormalizedSchemaTableColumn<T>): number | string | undefined {
  if (!props.scaleColumnWidth) {
    return undefined
  }
  const minWidth = column.minWidth ?? column.componentProps.minWidth as number | string | undefined
  if (column.field === flexibleColumnField.value) {
    return minWidth ?? column.width ?? column.componentProps.width as number | string | undefined
  }
  return minWidth
}

function resolveColumnWidth(column: NormalizedSchemaTableColumn<T>): number | string | undefined {
  if (!props.scaleColumnWidth || column.field === flexibleColumnField.value) {
    return undefined
  }
  return column.width
}

function resolveRowKey(row: T, index: number): string | number | undefined {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row, index)
  }
  const value = props.rowKey ? (row as Record<string, unknown>)[props.rowKey] : undefined
  return typeof value === 'string' || typeof value === 'number' ? value : undefined
}

function resolveMobileActionKey(row: T, index: number): string {
  const rowKey = resolveRowKey(row, index)
  return rowKey === undefined ? `index:${index}` : `row:${typeof rowKey}:${rowKey}`
}

function isMobileActionOpen(row: T, index: number): boolean {
  return openMobileActionKey.value === resolveMobileActionKey(row, index)
}

function handleMobileActionVisible(row: T, index: number, visible: boolean): void {
  const key = resolveMobileActionKey(row, index)
  if (visible) {
    openMobileActionKey.value = key
  }
  else if (openMobileActionKey.value === key) {
    openMobileActionKey.value = null
  }
}

function toggleMobileActions(row: T, index: number): void {
  const key = resolveMobileActionKey(row, index)
  openMobileActionKey.value = openMobileActionKey.value === key ? null : key
}

function closeMobileActions(): void {
  openMobileActionKey.value = null
}

/***********************事件与尺寸*********************/
function handleSelectionChange(rows: T[]): void {
  selectedRows.value = rows
  selectedRowKeys.value = rows
    .map(row => resolveRowKey(row, rowIndexMap.value.get(row) ?? -1))
    .filter((key): key is string | number => key !== undefined)
  emit('selectionChange', rows, selectedRowKeys.value)
}

function handlePageChange(payload: SchemaTablePaginationChangePayload): void {
  emit('pageChange', payload)
}

function handleRowClick(row: T, column: unknown, event: Event): void {
  emit('rowClick', row, column, event)
}

function handleCurrentChange(currentRow: T | null, oldCurrentRow: T | null): void {
  emit('currentChange', currentRow, oldCurrentRow)
}

function handleExpandChange(row: T, expanded: boolean | T[]): void {
  emit('expandChange', row, expanded)
}

function syncMobileViewport(): void {
  if (typeof window === 'undefined') {
    return
  }
  const mobile = window.innerWidth <= 768
  if (mobile === isMobileViewport.value) {
    return
  }
  isMobileViewport.value = mobile
  if (!mobile) {
    closeMobileActions()
  }
  void nextTick(() => tableRef.value?.doLayout?.())
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    closeMobileActions()
  }
}

function setupResizeObserver(): void {
  if (!props.autoResize || typeof ResizeObserver === 'undefined' || !containerRef.value) {
    return
  }
  resizeObserver = new ResizeObserver(() => {
    if (resizeLayoutTimer) {
      clearTimeout(resizeLayoutTimer)
    }
    resizeLayoutTimer = setTimeout(() => {
      resizeLayoutTimer = undefined
      tableRef.value?.doLayout?.()
    })
  })
  resizeObserver.observe(containerRef.value)
}

function teardownResizeObserver(): void {
  resizeObserver?.disconnect()
  resizeObserver = undefined
  if (resizeLayoutTimer) {
    clearTimeout(resizeLayoutTimer)
    resizeLayoutTimer = undefined
  }
}

watch(() => props.autoResize, () => {
  teardownResizeObserver()
  setupResizeObserver()
})
watch(
  () => [props.columns.map(column => String(column.field)).join('\u0000'), props.columnSettings?.storageKey],
  restoreColumnSettings,
)
watch(openMobileActionKey, (key) => {
  if (typeof document === 'undefined') {
    return
  }
  document.removeEventListener('keydown', handleDocumentKeydown)
  if (key !== null) {
    document.addEventListener('keydown', handleDocumentKeydown)
  }
})
onMounted(() => {
  restoreColumnSettings()
  syncMobileViewport()
  setupResizeObserver()
  window.addEventListener('resize', syncMobileViewport)
})
onBeforeUnmount(() => {
  teardownResizeObserver()
  window.removeEventListener('resize', syncMobileViewport)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection?.(),
  doLayout: () => tableRef.value?.doLayout?.(),
  getSelectedRowKeys: () => [...selectedRowKeys.value],
  getSelectedRows: () => [...selectedRows.value],
  getColumnOrder: () => [...columnOrder.value],
  getExportData: (sourceRows: T[] = props.rows) => {
    const indexes = new Map(sourceRows.map((row, index) => [row, index]))
    return {
      columns: renderableColumns.value.map(column => ({ field: String(column.field), label: column.label })),
      rows: sourceRows.map(row => renderableColumns.value.map(column =>
        resolveCellDisplay(row, column, indexes.get(row) ?? -1).text,
      )),
    }
  },
  getVisibleColumns: () => [...renderableColumns.value],
  resetColumnSettings,
  getTableElement: () => tableRef.value?.$el as HTMLElement | undefined,
  getTableInstance: () => tableRef.value,
  toggleRowSelection: (row: T, selected?: boolean) => tableRef.value?.toggleRowSelection?.(row, selected),
})
</script>

<template>
  <div ref="containerRef" class="lumal-schema-table">
    <div v-if="$slots['toolbar-title'] || $slots.toolbar || $slots['toolbar-tools'] || showColumnSettingsPanel" class="lumal-schema-table__toolbar">
      <div v-if="$slots['toolbar-title']" class="lumal-schema-table__toolbar-title">
        <slot name="toolbar-title" />
      </div>
      <div v-if="$slots.toolbar" class="lumal-schema-table__toolbar-content">
        <slot name="toolbar" />
      </div>
      <div v-if="$slots['toolbar-tools'] || showColumnSettingsPanel" class="lumal-schema-table__toolbar-tools">
        <slot name="toolbar-tools" />
        <div v-if="showColumnSettingsPanel" class="lumal-schema-table__column-settings">
          <details>
            <summary class="lumal-schema-table__column-settings-trigger" aria-label="列设置" title="列设置">
              <LumalIcon name="lumal:grid" />
            </summary>
            <div class="lumal-schema-table__column-options">
              <div class="lumal-schema-table__column-options-header">
                <strong>列设置</strong>
                <button type="button" @click="resetColumnSettings">
                  恢复默认
                </button>
              </div>
              <div
                v-for="(column, index) in configurableColumns"
                :key="String(column.field)"
                class="lumal-schema-table__column-option"
                :draggable="columnSettings?.reorderable !== false"
                @dragstart="handleColumnDragStart(String(column.field))"
                @dragover.prevent
                @drop="handleColumnDrop(String(column.field))"
              >
                <ElCheckbox
                  :model-value="!hiddenColumnFields.has(String(column.field))"
                  @update:model-value="toggleColumnVisible(String(column.field))"
                >
                  {{ column.label }}
                </ElCheckbox>
                <span v-if="columnSettings?.reorderable !== false" class="lumal-schema-table__column-order-actions">
                  <button type="button" :disabled="index === 0" :aria-label="`上移${column.label}`" @click="moveColumn(String(column.field), -1)">
                    ↑
                  </button>
                  <button type="button" :disabled="index === configurableColumns.length - 1" :aria-label="`下移${column.label}`" @click="moveColumn(String(column.field), 1)">
                    ↓
                  </button>
                </span>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>

    <div v-if="error" class="lumal-schema-table__error" role="alert">
      <span>{{ resolvedErrorText }}</span>
      <button type="button" @click="emit('retry')">
        {{ retryText }}
      </button>
    </div>

    <div v-else class="lumal-schema-table__scroll">
      <ElTable
        ref="tableRef"
        v-loading="loading"
        v-bind="tableProps"
        class="lumal-schema-table__body"
        :data="rows"
        :row-key="elementRowKey"
        :empty-text="emptyText"
        :row-class-name="rowClassName"
        :cell-class-name="cellClassName"
        :header-cell-class-name="headerCellClassName"
        :default-expand-all="resolvedDefaultExpandAll"
        :tree-props="resolvedTreeProps"
        :data-loading="loading"
        @selection-change="handleSelectionChange"
        @sort-change="emit('sortChange', $event)"
        @filter-change="emit('filterChange', $event)"
        @row-click="handleRowClick"
        @current-change="handleCurrentChange"
        @expand-change="handleExpandChange"
      >
        <ElTableColumn v-if="selection" type="selection" width="48" />
        <ElTableColumn v-if="showIndex" type="index" :label="indexLabel" :width="indexWidth" />

        <ElTableColumn
          v-for="column in renderableColumns"
          :key="String(column.field)"
          v-bind="column.componentProps"
          :prop="String(column.field)"
          :label="column.label"
          :align="column.align"
          :width="resolveColumnWidth(column)"
          :min-width="resolveColumnMinWidth(column)"
          :fixed="column.fixed"
          :resizable="columnResizable"
          :show-overflow-tooltip="column.showOverflowTooltip ?? true"
          :formatter="resolveColumnFormatter(column)"
          :data-field="String(column.field)"
        >
          <template #default="{ row, $index }">
            <template v-if="!isCellHidden(row, column, $index)">
              <slot
                :name="`table-${String(column.field)}`"
                :row="row"
                :index="$index"
                :column="column"
                :value="row[column.field]"
              >
                <LumalSchemaTableCell :display="resolveCellDisplay(row, column, $index)" />
              </slot>
            </template>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="$slots.actions"
          fixed="right"
          :label="actionLabel"
          :width="resolvedActionWidth"
          data-field="actions"
        >
          <template #default="{ row, $index }">
            <div class="lumal-schema-table__actions lumal-schema-table__actions--desktop">
              <slot name="actions" :row="row" :index="$index" />
            </div>
            <ElPopover
              :visible="isMobileActionOpen(row, $index)"
              :teleported="true"
              trigger="click"
              placement="bottom-end"
              popper-class="lumal-schema-table__mobile-actions-popper"
              @update:visible="handleMobileActionVisible(row, $index, $event)"
            >
              <template #reference>
                <button
                  type="button"
                  class="lumal-schema-table__mobile-actions"
                  aria-haspopup="menu"
                  :aria-expanded="isMobileActionOpen(row, $index)"
                  @click.stop="toggleMobileActions(row, $index)"
                  @keydown.esc.stop.prevent="closeMobileActions"
                >
                  {{ mobileActionLabel }}
                </button>
              </template>
              <div class="lumal-schema-table__mobile-actions-menu" role="menu" @click.capture="closeMobileActions">
                <slot name="actions" :row="row" :index="$index" />
              </div>
            </ElPopover>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-if="showPagination" class="lumal-schema-table__pagination">
      <LumalPagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.lumal-schema-table {
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.lumal-schema-table__toolbar,
.lumal-schema-table__pagination {
  display: flex;
  justify-content: flex-end;
}

.lumal-schema-table__toolbar {
  min-height: 40px;
  align-items: center;
  gap: 8px;
}

.lumal-schema-table__toolbar-content {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-start;
}

.lumal-schema-table__toolbar-title {
  min-width: 0;
  flex: none;
  color: var(--el-text-color-primary);
  font-size: calc(var(--lumal-font-size-base, 14px) + 2px);
  font-weight: 600;
  line-height: 1.5;
}

.lumal-schema-table__toolbar-tools {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

.lumal-schema-table__toolbar-tools :deep(.el-button) {
  margin-left: 0;
}

.lumal-schema-table__toolbar-tools :deep(.el-button.is-circle) {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  flex: 0 0 30px;
  padding: 0;
}

.lumal-schema-table__column-options {
  position: absolute;
  z-index: var(--lumal-z-dropdown);
  top: calc(100% + 8px);
  right: 0;
  display: flex;
  width: max-content;
  min-width: 200px;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--lumal-shadow-base);
}

.lumal-schema-table__column-options-header,
.lumal-schema-table__column-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lumal-schema-table__column-options-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.lumal-schema-table__column-options-header button,
.lumal-schema-table__column-order-actions button,
.lumal-schema-table__error button {
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.lumal-schema-table__column-option[draggable="true"] {
  cursor: grab;
}

.lumal-schema-table__column-order-actions {
  display: inline-flex;
  gap: 4px;
}

.lumal-schema-table__column-order-actions button {
  min-width: 32px;
  padding: 0;
}

.lumal-schema-table__column-order-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.lumal-schema-table__error {
  display: flex;
  min-height: 160px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  border: 1px dashed var(--el-color-danger-light-5);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.lumal-schema-table__column-settings {
  position: relative;
}

.lumal-schema-table__column-settings-trigger :deep(.lumal-icon) {
  width: 16px;
  height: 16px;
}

.lumal-schema-table__column-settings-trigger {
  box-sizing: border-box;
  display: inline-flex;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  list-style: none;
}

.lumal-schema-table__column-settings-trigger::-webkit-details-marker {
  display: none;
}

.lumal-schema-table__scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.lumal-schema-table__body {
  width: 100%;
  min-width: 720px;
}

.lumal-schema-table__actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.lumal-schema-table__mobile-actions {
  display: none;
  box-sizing: border-box;
  border: 0;
  border-radius: var(--el-border-radius-small);
  color: var(--el-color-primary);
  font: inherit;
  background: transparent;
  cursor: pointer;
}

.lumal-schema-table__mobile-actions-menu {
  display: grid;
  min-width: 112px;
  gap: 6px;
}

.lumal-schema-table__mobile-actions-menu :deep(.el-button) {
  width: 100%;
  margin-left: 0;
  justify-content: flex-start;
}

@media (max-width: 768px) {
  .lumal-schema-table {
    gap: 12px;
  }

  .lumal-schema-table__toolbar {
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-start;
    row-gap: 8px;
  }

  .lumal-schema-table__toolbar-content {
    flex: 1 1 auto;
    min-width: 0;
    justify-content: flex-start;
  }

  .lumal-schema-table__toolbar-tools {
    flex: 0 1 auto;
    min-width: 0;
    justify-content: flex-end;
    gap: 6px;
    margin-left: auto;
  }

  .lumal-schema-table__toolbar-tools :deep(.el-button.is-circle) {
    width: 28px;
    min-width: 28px;
    height: 28px;
    min-height: 28px;
    flex-basis: 28px;
  }

  .lumal-schema-table__column-settings-trigger {
    width: 28px;
    min-width: 28px;
    height: 28px;
    min-height: 28px;
  }

  .lumal-schema-table__pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .lumal-schema-table__actions--desktop {
    display: none;
  }

  .lumal-schema-table__mobile-actions {
    display: inline-flex;
    min-width: 48px;
    height: 32px;
    min-height: 32px;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
  }

  .lumal-schema-table__mobile-actions:hover,
  .lumal-schema-table__mobile-actions:focus-visible,
  .lumal-schema-table__mobile-actions[aria-expanded="true"] {
    background: var(--el-color-primary-light-9);
    outline: none;
  }

  .lumal-schema-table__body :deep(.el-table__body .el-table__cell) {
    padding: 8px 0;
  }

  .lumal-schema-table__body :deep(.el-table__body .cell) {
    min-height: 32px;
    line-height: 32px;
  }
}
</style>
