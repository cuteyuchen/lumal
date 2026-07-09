<script setup lang="ts">
import type {
  CrudTableResetPayload,
  CrudTableSearchPayload,
  PaginationChangePayload,
  SchemaFormModel,
} from '@luma/core/components'
import { LumaCrudTable } from '@luma/core/components'
import { shallowRef } from 'vue'
import {
  createExampleQueryModel,
  exampleQuerySchemas,
  exampleTableColumns,
  exampleTableRows,
} from './example-data'

/***********************CRUD 状态*********************/
const queryModel = shallowRef<SchemaFormModel>(createExampleQueryModel())
const page = shallowRef(1)
const pageSize = shallowRef(10)
const message = shallowRef('等待 CRUD 操作')

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
</script>

<template>
  <main class="luma-admin-example">
    <LumaCrudTable
      v-model:query-model="queryModel"
      v-model:page="page"
      v-model:page-size="pageSize"
      title="CRUD Table"
      :description="message"
      :query-schemas="exampleQuerySchemas"
      :columns="exampleTableColumns"
      :rows="exampleTableRows"
      row-key="id"
      :total="36"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
    >
      <template #actions>
        <button class="luma-admin-example__button luma-admin-example__button--primary" type="button">
          新增
        </button>
      </template>
    </LumaCrudTable>
  </main>
</template>
