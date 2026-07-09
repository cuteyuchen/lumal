<script setup lang="ts">
import type {
  CrudTablePageChangePayload,
  CrudTableResetPayload,
  CrudTableSearchPayload,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type { LumaLayoutMenuItem, LumaLayoutTabItem } from '@luma/core/layout'
import {
  LumaCrudTable,
  LumaIcon,
} from '@luma/core/components'
import { LumaLayout } from '@luma/core/layout'
import { shallowRef } from 'vue'

/***********************页面状态*********************/
const title = 'Luma Admin'
const description = '轻量 Vue Admin 框架基线已启动'
const collapsed = shallowRef(false)
const activeMenuPath = shallowRef('/dashboard')
const activeTabPath = shallowRef('/dashboard')

/***********************布局配置*********************/
const menus: LumaLayoutMenuItem[] = [
  {
    path: '/dashboard',
    title: '工作台',
    icon: 'app:dashboard',
  },
  {
    path: '/project',
    title: '项目管理',
    icon: 'app:dashboard',
  },
]

const tabs: LumaLayoutTabItem[] = [
  {
    path: '/dashboard',
    title: '工作台',
  },
  {
    path: '/project',
    title: '项目管理',
  },
]

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

function handleSearch(payload: CrudTableSearchPayload): void {
  paginationMessage.value = `查询项目：${String(payload.name ?? '') || '全部'}`
}

function handleReset(_payload: CrudTableResetPayload): void {
  paginationMessage.value = '已重置查询条件'
}

function handlePaginationChange(payload: CrudTablePageChangePayload): void {
  paginationMessage.value = `第 ${payload.page} 页，每页 ${payload.pageSize} 条`
}

function handleMenuSelect(path: string): void {
  activeMenuPath.value = path
  activeTabPath.value = path
  paginationMessage.value = `已切换菜单：${path}`
}

function handleTabChange(path: string): void {
  activeMenuPath.value = path
}
</script>

<template>
  <LumaLayout
    v-model:collapsed="collapsed"
    v-model:active-tab-path="activeTabPath"
    :title="title"
    :menus="menus"
    :tabs="tabs"
    :active-menu-path="activeMenuPath"
    @menu-select="handleMenuSelect"
    @tab-change="handleTabChange"
  >
    <template #headerActions>
      <span class="luma-admin-home__status">Mini</span>
    </template>

    <main class="luma-admin-home">
      <LumaCrudTable
        v-model:query-model="formModel"
        v-model:page="page"
        v-model:page-size="pageSize"
        class="luma-admin-home__crud"
        :title="title"
        :description="description"
        :query-schemas="schemas"
        :columns="tableColumns"
        :rows="tableRows"
        row-key="id"
        :total="35"
        :page-sizes="[10, 20]"
        @search="handleSearch"
        @reset="handleReset"
        @page-change="handlePaginationChange"
      >
        <template #actions>
          <LumaIcon name="app:dashboard" color="#1677ff" :size="36" />
        </template>

        <template #default>
          <span class="luma-admin-home__pagination-text">
            {{ paginationMessage }}
          </span>
        </template>
      </LumaCrudTable>
    </main>
  </LumaLayout>
</template>
