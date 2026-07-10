<script setup lang="ts">
import type { TableInstance } from 'element-plus'
import type { DictionaryLabelValue } from '../../dictionary'
import type {
  NormalizedSchemaTableColumn,
  SchemaTableAuthority,
  SchemaTableClassName,
  SchemaTableColumn,
  SchemaTablePaginationChangePayload,
  SchemaTableRow,
} from './types'
import { ElLoading, ElTable, ElTableColumn } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import { getDictionaryLabel, useDictionaryMap } from '../../dictionary'
import { LumaPagination } from '../pagination'
import { normalizeSchemaTableColumns } from './normalize'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  actionLabel?: string
  actionWidth?: number | string
  canAccess?: (authority: SchemaTableAuthority) => boolean
  cellClassName?: SchemaTableClassName
  columns: SchemaTableColumn[]
  emptyText?: string
  headerCellClassName?: SchemaTableClassName
  indexLabel?: string
  indexWidth?: number | string
  loading?: boolean
  pageSizes?: number[]
  pagination?: boolean
  rowClassName?: SchemaTableClassName
  rowKey?: string | ((row: SchemaTableRow, index: number) => string | number)
  rows?: SchemaTableRow[]
  selection?: boolean
  showIndex?: boolean
  tableProps?: Record<string, unknown>
  total?: number
}>(), {
  actionLabel: '操作',
  actionWidth: 160,
  emptyText: '暂无数据',
  indexLabel: '#',
  indexWidth: 64,
  loading: false,
  pageSizes: () => [10, 20, 50, 100],
  pagination: false,
  rows: () => [],
  selection: false,
  showIndex: false,
  tableProps: () => ({}),
  total: 0,
})

const emit = defineEmits<{
  pageChange: [payload: SchemaTablePaginationChangePayload]
  selectionChange: [rows: SchemaTableRow[]]
}>()

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************本地指令*********************/
const vLoading = ElLoading.directive

/***********************模板引用*********************/
const tableRef = useTemplateRef<TableInstance>('tableRef')

/***********************列状态*********************/
const normalizedColumns = computed(() => normalizeSchemaTableColumns(props.columns, {
  canAccess: props.canAccess,
  rows: props.rows,
}))

const renderableColumns = computed(() => normalizedColumns.value.filter(column => column.renderable))

const { dictionaryMap } = useDictionaryMap(() =>
  normalizedColumns.value.map(column => column.dictionary ?? column.dictType),
)

const elementRowKey = computed(() => {
  const rowKey = props.rowKey

  if (typeof rowKey !== 'function') {
    return rowKey
  }

  return (row: SchemaTableRow): string => {
    const index = props.rows.findIndex(item => item === row)
    return String(rowKey(row, index))
  }
})

/***********************分页状态*********************/
const showPagination = computed(() => props.pagination && props.total > 0)

/***********************表格取值*********************/
function resolveColumnOptions(column: NormalizedSchemaTableColumn) {
  if (column.options?.length) {
    return column.options
  }

  const dictionary = column.dictionary ?? column.dictType

  return dictionary ? dictionaryMap.value[dictionary] ?? [] : []
}

function isDictionaryLabelValue(value: unknown): value is DictionaryLabelValue {
  if (value === undefined || value === null) {
    return true
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return true
  }

  return Array.isArray(value)
    && value.every(item =>
      typeof item === 'boolean' || typeof item === 'number' || typeof item === 'string',
    )
}

function formatCellText(row: SchemaTableRow, column: NormalizedSchemaTableColumn, index: number): string {
  const rawValue = row[column.field]
  const formattedValue = column.formatter?.(rawValue, row, index) ?? rawValue

  if (formattedValue === undefined || formattedValue === null || formattedValue === '') {
    return column.emptyText
  }

  if (column.formatter) {
    return String(formattedValue)
  }

  const options = resolveColumnOptions(column)

  if (options.length > 0 && isDictionaryLabelValue(formattedValue)) {
    return getDictionaryLabel(options, formattedValue)
  }

  return String(formattedValue)
}

function createColumnFormatter(column: NormalizedSchemaTableColumn) {
  return (row: SchemaTableRow, _column: unknown, _cellValue: unknown, index: number): string => {
    return formatCellText(row, column, index)
  }
}

/***********************事件处理*********************/
function handleSelectionChange(rows: SchemaTableRow[]): void {
  emit('selectionChange', rows)
}

function handlePageChange(payload: SchemaTablePaginationChangePayload): void {
  emit('pageChange', payload)
}

/***********************公开方法*********************/
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection?.(),
  doLayout: () => tableRef.value?.doLayout?.(),
  getTableElement: () => tableRef.value?.$el as HTMLElement | undefined,
  getTableInstance: () => tableRef.value,
  toggleRowSelection: (row: SchemaTableRow, selected?: boolean) => tableRef.value?.toggleRowSelection?.(row, selected),
})
</script>

<template>
  <div class="luma-schema-table">
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
      :data-loading="loading"
      @selection-change="handleSelectionChange"
    >
      <ElTableColumn
        v-if="selection"
        type="selection"
        width="48"
      />

      <ElTableColumn
        v-if="showIndex"
        type="index"
        :label="indexLabel"
        :width="indexWidth"
      />

      <ElTableColumn
        v-for="column in renderableColumns"
        :key="column.field"
        v-bind="column.componentProps"
        :prop="column.field"
        :label="column.label"
        :align="column.align"
        :width="column.width"
        :formatter="createColumnFormatter(column)"
        :data-field="column.field"
      />

      <ElTableColumn
        v-if="$slots.actions"
        fixed="right"
        :label="actionLabel"
        :width="actionWidth"
        data-field="actions"
      >
        <template #default="{ row, $index }">
          <slot name="actions" :row="row" :index="$index" />
        </template>
      </ElTableColumn>
    </ElTable>

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
  min-width: 0;
  width: 100%;
}

.luma-schema-table__body {
  width: 100%;
}

.luma-schema-table__pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
