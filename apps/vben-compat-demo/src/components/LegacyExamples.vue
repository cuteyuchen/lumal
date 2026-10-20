<script setup lang="ts">
import type { SchemaFormModel, SchemaTableRow } from '@lumal/core/components'
import {
  LumalCrudTable,
  LumalIcon,
  LumalSchemaForm,
} from '@lumal/core/components'
import {
  useVbenForm,
  useVbenVxeGrid,
} from '@lumal/vben-compat'
import { shallowRef } from 'vue'

/***********************示例数据*********************/
const users: SchemaTableRow[] = [
  {
    id: 1,
    name: 'Lumal',
    role: 'admin',
    status: 'enabled',
  },
  {
    id: 2,
    name: 'Vben 迁移用户',
    role: 'operator',
    status: 'disabled',
  },
  {
    id: 3,
    name: 'Schema 用户',
    role: 'developer',
    status: 'enabled',
  },
]

/***********************兼容表单*********************/
const formMessage = shallowRef('等待提交兼容表单')

const [, formApi] = useVbenForm({
  model: {
    keyword: 'Lumal',
    status: 'enabled',
  },
  schemas: [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入关键词',
      },
      fieldName: 'keyword',
      label: '关键词',
      required: true,
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ],
  showActions: true,
  submitText: '提交',
  submit: (model) => {
    formMessage.value = `已提交：${String(model.keyword ?? '') || '全部'}`
  },
})

/***********************兼容表格*********************/
const gridMessage = shallowRef('等待查询兼容表格')

const [, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'name',
        title: '用户名称',
      },
      {
        field: 'role',
        title: '角色',
      },
      {
        field: 'status',
        formatter: value => value === 'enabled' ? '启用' : '停用',
        title: '状态',
      },
    ],
    formOptions: {
      schemas: [
        {
          component: 'Input',
          componentProps: {
            placeholder: '按用户名称查询',
          },
          fieldName: 'keyword',
          label: '用户名称',
        },
        {
          component: 'Select',
          componentProps: {
            options: [
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ],
            placeholder: '全部状态',
          },
          fieldName: 'status',
          label: '状态',
        },
      ],
      submitText: '查询',
    },
    pagerConfig: {
      pageSize: 10,
      pageSizes: [10, 20],
    },
    tableConfig: {
      autoResize: true,
      showColumnSettings: true,
    },
    toolbarConfig: {
      export: true,
      refresh: true,
    },
    proxyConfig: {
      ajax: {
        query: (params) => {
          const keyword = String(params.keyword ?? '').trim()
          const status = String(params.status ?? '').trim()
          const rows = users.filter((item) => {
            const matchKeyword = keyword ? String(item.name).includes(keyword) : true
            const matchStatus = status ? item.status === status : true

            return matchKeyword && matchStatus
          })

          gridMessage.value = `当前查询：${keyword || '全部用户'}`

          return {
            items: rows,
            total: rows.length,
          }
        },
      },
    },
    rowKey: 'id',
    title: 'Vben Grid 兼容列表',
  },
})

void gridApi.reload()

/***********************事件处理*********************/
function handleFormModelUpdate(model: SchemaFormModel): void {
  formApi.handleUpdateModel(model)
}
</script>

<template>
  <main class="compat-demo">
    <section class="compat-demo__header">
      <LumalIcon name="compat:vben" color="#0f766e" :size="40" />
      <div class="compat-demo__heading">
        <h1 class="compat-demo__title">
          Vben 兼容迁移示例
        </h1>
        <p class="compat-demo__description">
          使用 @lumal/vben-compat 驱动 Lumal 原生组件。
        </p>
      </div>
    </section>

    <section class="compat-demo__panel">
      <h2 class="compat-demo__section-title">
        useVbenForm
      </h2>
      <LumalSchemaForm
        v-bind="formApi.schemaFormProps.value"
        @update:model-value="handleFormModelUpdate"
      />
      <p class="compat-demo__message">
        {{ formMessage }}
      </p>
    </section>

    <section class="compat-demo__panel compat-demo__panel--wide">
      <LumalCrudTable v-bind="gridApi.crudTableProps.value">
        <template #default>
          <span class="compat-demo__message">
            {{ gridMessage }}
          </span>
        </template>
      </LumalCrudTable>
    </section>
  </main>
</template>
