<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components'
import { LumalSchemaForm } from '@lumal/core/components'
import { ElMessage } from 'element-plus'
import { shallowRef } from 'vue'

/***********************Schema 与联动*********************/
const model = shallowRef<SchemaFormModel>({})
const schemas: SchemaFormItem[] = [
  { field: 'name', label: '名称', required: true, component: 'input' },
  { field: 'date', label: '日期', component: 'date', componentProps: { valueFormat: 'YYYY-MM-DD' } },
  { field: 'notify', label: '邮件通知', component: 'switch' },
  { field: 'email', label: '邮箱', component: 'input', hidden: ({ model }) => !model.notify, required: ({ model }) => Boolean(model.notify), rules: [{ type: 'email', message: '请输入有效邮箱' }] },
]
function submit(): void {
  ElMessage.success('保存成功')
}
</script>

<template>
  <main class="lumal-admin-page">
    <h1>Schema 表单</h1>
    <LumalSchemaForm v-model="model" :schemas="schemas" :columns="2" show-actions show-reset @submit="submit" />
  </main>
</template>
