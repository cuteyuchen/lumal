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
import { ElCheckbox, ElLoading, ElTable, ElTableColumn } from 'element-plus'
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
import { useDictionaryMap } from '../../dictionary'
import { LumaPagination } from '../pagination'
import { resolveSchemaTableCellDisplay } from './cell'
import LumaSchemaTableCell from './LumaSchemaTableCell.vue'
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
  error?: boolean | Error | string
  errorText?: string
  headerCellClassName?: SchemaTableClassName<T>
  indexLabel?: string
  indexWidth?: number | string
  loading?: boolean
  mobileActionLabel?: string
  pageSizes?: number[]
  pagination?: boolean
  rowClassName?: SchemaTableClassName<T>
  rowKey?: string | ((row: T, index: number) => string | number)
  rows?: T[]
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
  pageSizes: () => [10, 20, 50, 100],
  pagination: false,
  rowKey: 'id',
  rows: () => [],
  scaleColumnWidth: true,
  selection: false,
  showColumnSettings: false,
  showIndex: false,
  tableProps: () => ({}),
  total: 0,
})

const emit = defineEmits<{
  currentChange: [currentRow: T | undefined, oldCurrentRow: T | undefined]
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
let resizeObserver: ResizeObserver | undefined
let draggedColumnField = ''

const normalizedColumns = computed(() => normalizeSchemaTableColumns<T>(props.columns, {
  canAccess: props.canAccess,
  rows: props.rows,
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

const elementRowKey = computed(() => {
  if (typeof props.rowKey !== 'function') {
    return props.rowKey
  }

  const rowKey = props.rowKey
  return (row: T): string => String(rowKey(row, props.rows.indexOf(row)))
})
const showPagination = computed(() => props.pagination && props.total > 0)
const showColumnSettingsPanel = computed(() => props.showColumnSettings || props.columnSettings?.enabled)
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
  )
}

function createColumnFormatter(column: NormalizedSchemaTableColumn<T>) {
  return (row: T, _column: unknown, _cellValue: unknown, index: number): string =>
    isCellHidden(row, column, index) ? '' : resolveCellDisplay(row, column, index).text
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

/***********************事件与尺寸*********************/
function handleSelectionChange(rows: T[]): void {
  selectedRows.value = rows
  selectedRowKeys.value = rows
    .map(row => resolveRowKey(row, props.rows.indexOf(row)))
    .filter((key): key is string | number => key !== undefined)
  emit('selectionChange', rows, selectedRowKeys.value)
}

function handlePageChange(payload: SchemaTablePaginationChangePayload): void {
  emit('pageChange', payload)
}

function handleRowClick(row: T, column: unknown, event: Event): void {
  emit('rowClick', row, column, event)
}

function handleCurrentChange(currentRow: T | undefined, oldCurrentRow: T | undefined): void {
  emit('currentChange', currentRow, oldCurrentRow)
}

function handleExpandChange(row: T, expanded: boolean | T[]): void {
  emit('expandChange', row, expanded)
}

function setupResizeObserver(): void {
  if (!props.autoResize || typeof ResizeObserver === 'undefined' || !containerRef.value) {
    return
  }
  resizeObserver = new ResizeObserver(() => {
    void nextTick(() => tableRef.value?.doLayout?.())
  })
  resizeObserver.observe(containerRef.value)
}

function teardownResizeObserver(): void {
  resizeObserver?.disconnect()
  resizeObserver = undefined
}

watch(() => props.autoResize, () => {
  teardownResizeObserver()
  setupResizeObserver()
})
watch(() => [props.columns, props.columnSettings?.storageKey], restoreColumnSettings, { deep: true })
onMounted(() => {
  restoreColumnSettings()
  setupResizeObserver()
})
onBeforeUnmount(teardownResizeObserver)

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection?.(),
  doLayout: () => tableRef.value?.doLayout?.(),
  getSelectedRowKeys: () => [...selectedRowKeys.value],
  getSelectedRows: () => [...selectedRows.value],
  getColumnOrder: () => [...columnOrder.value],
  getExportData: (sourceRows: T[] = props.rows) => ({
    columns: renderableColumns.value.map(column => ({ field: String(column.field), label: column.label })),
    rows: sourceRows.map(row => renderableColumns.value.map(column =>
      resolveCellDisplay(row, column, props.rows.indexOf(row)).text,
    )),
  }),
  getVisibleColumns: () => [...renderableColumns.value],
  getTableElement: () => tableRef.value?.$el as HTMLElement | undefined,
  getTableInstance: () => tableRef.value,
  toggleRowSelection: (row: T, selected?: boolean) => tableRef.value?.toggleRowSelection?.(row, selected),
})
</script>

<template>
  <div ref="containerRef" class="luma-schema-table">
    <div v-if="showColumnSettingsPanel" class="luma-schema-table__toolbar">
      <div class="luma-schema-table__column-settings">
        <details>
          <summary class="luma-schema-table__column-settings-trigger" aria-label="列设置" title="列设置">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
            </svg>
          </summary>
          <div class="luma-schema-table__column-options">
            <div class="luma-schema-table__column-options-header">
              <strong>列设置</strong>
              <button type="button" @click="resetColumnSettings">恢复默认</button>
            </div>
            <div
              v-for="(column, index) in configurableColumns"
              :key="String(column.field)"
              class="luma-schema-table__column-option"
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
              <span v-if="columnSettings?.reorderable !== false" class="luma-schema-table__column-order-actions">
                <button type="button" :disabled="index === 0" :aria-label="`上移${column.label}`" @click="moveColumn(String(column.field), -1)">↑</button>
                <button type="button" :disabled="index === configurableColumns.length - 1" :aria-label="`下移${column.label}`" @click="moveColumn(String(column.field), 1)">↓</button>
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>

    <div v-if="error" class="luma-schema-table__error" role="alert">
      <span>{{ resolvedErrorText }}</span>
      <button type="button" @click="emit('retry')">{{ retryText }}</button>
    </div>

    <div v-else class="luma-schema-table__scroll">
      <ElTable
        ref="tableRef"
        v-loading="loading"
        v-bind="tableProps"
        class="luma-schema-table__body"
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
          :formatter="createColumnFormatter(column)"
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
                <LumaSchemaTableCell :display="resolveCellDisplay(row, column, $index)" />
              </slot>
            </template>
          </template>
        </ElTableColumn>

        <ElTableColumn
          v-if="$slots.actions"
          fixed="right"
          :label="actionLabel"
          :width="actionWidth"
          data-field="actions"
        >
          <template #default="{ row, $index }">
            <div class="luma-schema-table__actions luma-schema-table__actions--desktop">
              <slot name="actions" :row="row" :index="$index" />
            </div>
            <details class="luma-schema-table__mobile-actions">
              <summary>{{ mobileActionLabel }}</summary>
              <div class="luma-schema-table__mobile-actions-menu">
                <slot name="actions" :row="row" :index="$index" />
              </div>
            </details>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-if="showPagination" class="luma-schema-table__pagination">
      <LumaPagination
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
.luma-schema-table {
  display: grid;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.luma-schema-table__toolbar,
.luma-schema-table__pagination {
  display: flex;
  justify-content: flex-end;
}

.luma-schema-table__column-options {
  position: absolute;
  z-index: var(--luma-z-dropdown);
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
  box-shadow: var(--luma-shadow-base);
}

.luma-schema-table__column-options-header,
.luma-schema-table__column-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.luma-schema-table__column-options-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.luma-schema-table__column-options-header button,
.luma-schema-table__column-order-actions button,
.luma-schema-table__error button {
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-small);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
}

.luma-schema-table__column-option[draggable="true"] {
  cursor: grab;
}

.luma-schema-table__column-order-actions {
  display: inline-flex;
  gap: 4px;
}

.luma-schema-table__column-order-actions button {
  min-width: 32px;
  padding: 0;
}

.luma-schema-table__column-order-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.luma-schema-table__error {
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

.luma-schema-table__column-settings {
  position: relative;
}

.luma-schema-table__column-settings-trigger svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentcolor;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.luma-schema-table__column-settings-trigger {
  display: inline-flex;
  width: 36px;
  height: 36px;
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

.luma-schema-table__column-settings-trigger::-webkit-details-marker {
  display: none;
}

.luma-schema-table__scroll {
  width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.luma-schema-table__body {
  width: 100%;
  min-width: 720px;
}

.luma-schema-table__actions {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.luma-schema-table__mobile-actions {
  position: relative;
  display: none;
}

.luma-schema-table__mobile-actions > summary {
  color: var(--el-color-primary);
  cursor: pointer;
  list-style: none;
}

.luma-schema-table__mobile-actions-menu {
  position: absolute;
  z-index: var(--luma-z-dropdown);
  top: calc(100% + 6px);
  right: 0;
  display: grid;
  min-width: 112px;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--luma-shadow-base);
}

@media (max-width: 768px) {
  .luma-schema-table {
    gap: 12px;
  }

  .luma-schema-table__column-settings-trigger {
    min-height: 44px;
    min-width: 44px;
  }

  .luma-schema-table__pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }

  .luma-schema-table__actions--desktop {
    display: none;
  }

  .luma-schema-table__mobile-actions {
    display: inline-block;
  }

  .luma-schema-table__mobile-actions > summary {
    min-height: 44px;
    padding: 11px 8px;
  }
}
</style>
  retryText?: string
  retryText: '重新加载',
  resetColumnSettings,
