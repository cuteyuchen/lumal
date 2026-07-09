<script setup lang="ts">
import type { PaginationChangePayload, SchemaFormModel } from '@luma/core/components'
import {
  LumaPage,
  LumaPageLayout,
  LumaPagination,
  LumaSchemaForm,
  LumaSchemaTable,
} from '@luma/core/components'
import { shallowRef } from 'vue'
import {
  createExampleQueryModel,
  exampleQuerySchemas,
  exampleTableColumns,
  exampleTableRows,
} from './example-data'

/***********************页面状态*********************/
const queryModel = shallowRef<SchemaFormModel>(createExampleQueryModel())
const page = shallowRef(1)
const pageSize = shallowRef(10)
const message = shallowRef('展示查询区、工具栏、内容区和分页区。')

/***********************事件处理*********************/
function handleSearch(): void {
  message.value = `已查询：${String(queryModel.value.keyword || '全部')} / ${String(queryModel.value.status)}`
}

function handleReset(): void {
  queryModel.value = createExampleQueryModel()
  message.value = '查询表单已恢复初始值。'
}

function handlePageChange(payload: PaginationChangePayload): void {
  message.value = `分页更新：第 ${payload.page} 页，每页 ${payload.pageSize} 条。`
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Page Layout" :description="message">
      <LumaPageLayout @search="handleSearch" @reset="handleReset">
        <template #query>
          <LumaSchemaForm v-model="queryModel" :schemas="exampleQuerySchemas" />
        </template>

        <template #toolbar>
          <div class="luma-admin-example__toolbar">
            <button class="luma-admin-example__button luma-admin-example__button--primary" type="button">
              新增
            </button>
            <button class="luma-admin-example__button" type="button">
              导出
            </button>
          </div>
        </template>

        <LumaSchemaTable :columns="exampleTableColumns" :rows="exampleTableRows" row-key="id" />

        <template #pagination>
          <LumaPagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :total="36"
            :page-sizes="[10, 20]"
            @change="handlePageChange"
          />
        </template>
      </LumaPageLayout>
    </LumaPage>
  </main>
</template>
