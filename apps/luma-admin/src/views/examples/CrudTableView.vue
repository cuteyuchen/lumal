<script setup lang="ts">
import type {
  CrudDataSource,
  CrudFetchParams,
  CrudFetchResult,
  CrudTableResetPayload,
  CrudTableSearchPayload,
  PaginationChangePayload,
  SchemaFormModel,
  SchemaTableRow,
} from '@luma/core/components'
import { LumaCrudTable } from '@luma/core/components'
import { shallowRef } from 'vue'
import {
  createExampleQueryModel,
  exampleCrudColumns,
  exampleQuerySchemas,
  exampleTableRows,
} from './example-data'

/***********************CRUD 状态*********************/
const queryModel = shallowRef<SchemaFormModel>(createExampleQueryModel())
const page = shallowRef(1)
const pageSize = shallowRef(10)
const message = shallowRef('等待 CRUD 操作')
const rows = shallowRef<SchemaTableRow[]>([...exampleTableRows])
const editorType = shallowRef<'dialog' | 'drawer'>('dialog')
const queryConfig = {
  collapsible: true,
  collapsedRows: 1,
  columns: 2,
  defaultCollapsed: true,
  schemas: exampleQuerySchemas,
  submitDebounce: 250,
  submitOnChange: false,
}
const tableConfig = {
  columns: exampleCrudColumns,
  rowKey: 'id',
  selection: true,
  columnSettings: {
    enabled: true,
    reorderable: true,
    storageKey: 'luma-example:crud-columns',
  },
}
const toolbarConfig = {
  export: true,
}

/***********************远程数据源*********************/
function filterRows(params: CrudFetchParams): CrudFetchResult {
  const keyword = String(params.query.keyword ?? '').trim()
  const status = String(params.query.status ?? '')
  const priority = String(params.query.priority ?? '')
  const filteredRows = rows.value.filter((row) => {
    const matchKeyword = keyword ? String(row.name ?? '').includes(keyword) : true
    const matchStatus = status ? row.status === status : true
    const matchPriority = priority ? row.priority === priority : true

    return matchKeyword && matchStatus && matchPriority
  })
  const start = (params.page - 1) * params.pageSize

  return {
    items: filteredRows.slice(start, start + params.pageSize),
    total: filteredRows.length,
  }
}

const dataSource: CrudDataSource = {
  create(model) {
    rows.value = [
      {
        id: `example-${Date.now()}`,
        priority: model.priority ?? 'normal',
        status: model.status ?? 'enabled',
        ...model,
      },
      ...rows.value,
    ]
    message.value = '已新增一条数据'
    return Promise.resolve({})
  },
  fetch(params) {
    return Promise.resolve(filterRows(params))
  },
  remove(row) {
    rows.value = rows.value.filter(item => item.id !== row.id)
    message.value = `已删除：${String(row.name ?? '-')}`
    return Promise.resolve({})
  },
  removeMany(selectedRows) {
    const selectedIds = new Set(selectedRows.map(row => row.id))
    rows.value = rows.value.filter(row => !selectedIds.has(row.id))
    message.value = `已批量删除 ${selectedRows.length} 条`
    return Promise.resolve({})
  },
  update(row, model) {
    rows.value = rows.value.map(item => item.id === row.id ? { ...item, ...model } : item)
    message.value = `已更新：${String(model.name ?? row.name ?? '-')}`
    return Promise.resolve({})
  },
}

/***********************事件处理*********************/
function handleSearch(payload: CrudTableSearchPayload): void {
  message.value = `查询条件：${String(payload.keyword || '全部')} / ${String(payload.priority || '-')}`
}

function handleReset(payload: CrudTableResetPayload): void {
  message.value = `已重置：${String(payload.status || 'enabled')}`
}

function handlePageChange(payload: PaginationChangePayload): void {
  message.value = `分页：第 ${payload.page} 页 / ${payload.pageSize} 条`
}

function handleExport(payload: { selectedRows: SchemaTableRow[] }): void {
  message.value = payload.selectedRows.length > 0
    ? `准备导出已选 ${payload.selectedRows.length} 条数据`
    : '准备按当前查询条件导出'
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaCrudTable
      v-model:query-model="queryModel"
      v-model:page="page"
      v-model:page-size="pageSize"
      title="CRUD Table"
      :description="message"
      :data-source="dataSource"
      :editor="{ columns: 2, type: editorType, width: editorType === 'drawer' ? 'min(720px, 92vw)' : 'min(920px, calc(100vw - 32px))' }"
      :query="queryConfig"
      :table="tableConfig"
      :toolbar="toolbarConfig"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @export="handleExport"
    >
      <template #toolbar-tools>
        <button class="luma-admin-example__button" type="button" @click="editorType = editorType === 'dialog' ? 'drawer' : 'dialog'">
          编辑器：{{ editorType === 'dialog' ? '弹窗' : '抽屉' }}
        </button>
      </template>
    </LumaCrudTable>
  </main>
</template>
