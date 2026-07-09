<script setup lang="ts">
import type { TableInstance } from 'element-plus'
import type { NormalizedSchemaTableColumn, SchemaTableColumn, SchemaTableRow } from './types'
import { ElTable, ElTableColumn } from 'element-plus'
import { computed, useTemplateRef } from 'vue'
import { normalizeSchemaTableColumns } from './normalize'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  columns: SchemaTableColumn[]
  rows?: SchemaTableRow[]
  rowKey?: string | ((row: SchemaTableRow, index: number) => string | number)
  emptyText?: string
}>(), {
  rows: () => [],
  emptyText: '暂无数据',
})

/***********************模板引用*********************/
const tableRef = useTemplateRef<TableInstance>('tableRef')

/***********************列状态*********************/
const normalizedColumns = computed(() => normalizeSchemaTableColumns(props.columns))

const renderableColumns = computed(() => normalizedColumns.value.filter(column => column.renderable))

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

/***********************表格取值*********************/
function formatCellText(row: SchemaTableRow, column: NormalizedSchemaTableColumn, index: number): string {
  const rawValue = row[column.field]
  const formattedValue = column.formatter?.(rawValue, row, index) ?? rawValue

  if (formattedValue === undefined || formattedValue === null || formattedValue === '') {
    return column.emptyText
  }

  return String(formattedValue)
}

function createColumnFormatter(column: NormalizedSchemaTableColumn) {
  return (row: SchemaTableRow, _column: unknown, _cellValue: unknown, index: number): string => {
    return formatCellText(row, column, index)
  }
}

/***********************公开方法*********************/
defineExpose({
  getTableElement: () => tableRef.value?.$el as HTMLElement | undefined,
  getTableInstance: () => tableRef.value,
})
</script>

<template>
  <ElTable
    ref="tableRef"
    class="luma-schema-table"
    :data="rows"
    :row-key="elementRowKey"
    :empty-text="emptyText"
  >
    <ElTableColumn
      v-for="column in renderableColumns"
      :key="column.field"
      :prop="column.field"
      :label="column.label"
      :align="column.align"
      :width="column.width"
      :formatter="createColumnFormatter(column)"
      :data-field="column.field"
    />
  </ElTable>
</template>

<style scoped lang="scss">
.luma-schema-table {
  width: 100%;
}
</style>
