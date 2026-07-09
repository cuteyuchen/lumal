<script setup lang="ts">
import type {
  PaginationChangePayload,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import {
  LumaIcon,
  LumaPage,
  LumaPagination,
  LumaSchemaForm,
  LumaSchemaTable,
} from '@luma/core/components'
import { shallowRef } from 'vue'

/***********************页面状态*********************/
const title = 'Luma Admin'
const description = '轻量 Vue Admin 框架基线已启动'

/***********************表单配置*********************/
const formModel = shallowRef<SchemaFormModel>({
  id: 'demo-001',
  name: 'Luma 示例项目',
  status: 'enabled',
})

const schemas: SchemaFormItem[] = [
  {
    field: 'id',
    label: 'ID',
    component: 'hidden',
  },
  {
    field: 'name',
    label: '项目名称',
    component: 'input',
    placeholder: '请输入项目名称',
  },
  {
    field: 'status',
    label: '状态',
    component: 'select',
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
]

/***********************表格配置*********************/
const tableColumns: SchemaTableColumn[] = [
  {
    field: 'name',
    label: '项目名称',
  },
  {
    field: 'status',
    label: '状态',
    formatter: value => value === 'enabled' ? '启用' : '停用',
  },
]

const tableRows: SchemaTableRow[] = [
  {
    id: 'demo-001',
    name: 'Luma 示例项目',
    status: 'enabled',
  },
]

/***********************分页状态*********************/
const page = shallowRef(1)
const pageSize = shallowRef(10)
const paginationMessage = shallowRef('当前展示示例数据')

function handlePaginationChange(payload: PaginationChangePayload): void {
  paginationMessage.value = `第 ${payload.page} 页，每页 ${payload.pageSize} 条`
}
</script>

<template>
  <main class="luma-admin-home">
    <LumaPage :title="title" :description="description">
      <template #actions>
        <LumaIcon name="app:dashboard" color="#1677ff" :size="36" />
      </template>

      <div class="luma-admin-home__form">
        <LumaSchemaForm v-model="formModel" :schemas="schemas" />
      </div>

      <div class="luma-admin-home__table">
        <LumaSchemaTable row-key="id" :columns="tableColumns" :rows="tableRows" />
      </div>

      <footer class="luma-admin-home__pagination">
        <span class="luma-admin-home__pagination-text">
          {{ paginationMessage }}
        </span>
        <LumaPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="35"
          :page-sizes="[10, 20]"
          @change="handlePaginationChange"
        />
      </footer>
    </LumaPage>
  </main>
</template>
