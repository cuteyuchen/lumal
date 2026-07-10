<script setup lang="ts" generic="T extends SchemaTableRecord = SchemaTableRow">
import type { TableInstance } from 'element-plus'
import type {
  NormalizedSchemaTableColumn,
  SchemaTableAuthority,
  SchemaTableClassName,
  SchemaTableColumn,
  SchemaTablePaginationChangePayload,
  SchemaTableRecord,
  SchemaTableRow,
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
  columns: SchemaTableColumn<T>[]
  defaultExpandAll?: boolean
  emptyText?: string
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
  pageChange: [payload: SchemaTablePaginationChangePayload]
  selectionChange: [selectedRows: T[], selectedRowKeys: Array<string | number>]
}>()

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })
const vLoading = ElLoading.directive

/***********************模板引用与状态*********************/
const containerRef = useTemplateRef<HTMLElement>('containerRef')
const tableRef = useTemplateRef<TableInstance>('tableRef')
const hiddenColumnFields = shallowRef(new Set<string>())
const selectedRows = shallowRef<T[]>([])
const selectedRowKeys = shallowRef<Array<string | number>>([])
let resizeObserver: ResizeObserver | undefined

const normalizedColumns = computed(() => normalizeSchemaTableColumns<T>(props.columns, {
  canAccess: props.canAccess,
  rows: props.rows,
}))
const renderableColumns = computed(() => normalizedColumns.value.filter(column =>
  column.renderable && !hiddenColumnFields.value.has(String(column.field)),
))
const configurableColumns = computed(() => normalizedColumns.value.filter(column => column.renderable))

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
  next.has(field) ? next.delete(field) : next.add(field)
  hiddenColumnFields.value = next
  void nextTick(() => tableRef.value?.doLayout?.())
}

function resolveColumnOptions(column: NormalizedSchemaTableColumn<T>) {
  const options = unref(column.options)
  if (options?.length) {
    return options
  }
  const dictionary = column.dictionary ?? column.dictType
  return dictionary ? dictionaryMap.value[dictionary] ?? [] : []
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
  return column.minWidth ?? column.componentProps.minWidth as number | string | undefined
}

function resolveColumnWidth(column: NormalizedSchemaTableColumn<T>): number | string | undefined {
  return props.scaleColumnWidth ? column.width : undefined
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
onMounted(setupResizeObserver)
onBeforeUnmount(teardownResizeObserver)

defineExpose({
  clearSelection: () => tableRef.value?.clearSelection?.(),
  doLayout: () => tableRef.value?.doLayout?.(),
  getSelectedRowKeys: () => [...selectedRowKeys.value],
  getSelectedRows: () => [...selectedRows.value],
  getTableElement: () => tableRef.value?.$el as HTMLElement | undefined,
  getTableInstance: () => tableRef.value,
  toggleRowSelection: (row: T, selected?: boolean) => tableRef.value?.toggleRowSelection?.(row, selected),
})
</script>

<template>
  <div ref="containerRef" class="luma-schema-table">
    <div v-if="showColumnSettings" class="luma-schema-table__toolbar">
      <details class="luma-schema-table__column-settings">
        <summary>列设置</summary>
        <div class="luma-schema-table__column-options">
          <ElCheckbox
            v-for="column in configurableColumns"
            :key="String(column.field)"
            :model-value="!hiddenColumnFields.has(String(column.field))"
            @update:model-value="toggleColumnVisible(String(column.field))"
          >
            {{ column.label }}
          </ElCheckbox>
        </div>
      </details>
    </div>

    <div class="luma-schema-table__scroll">
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

.luma-schema-table__column-settings {
  position: relative;
}

.luma-schema-table__column-settings > summary {
  min-height: 36px;
  padding: 7px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-blank);
  cursor: pointer;
  list-style: none;
}

.luma-schema-table__column-options {
  position: absolute;
  z-index: var(--luma-z-dropdown);
  top: calc(100% + 8px);
  right: 0;
  display: grid;
  width: max-content;
  min-width: 180px;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--luma-shadow-base);
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

  .luma-schema-table__column-settings > summary {
    min-height: 44px;
    padding: 11px 14px;
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
