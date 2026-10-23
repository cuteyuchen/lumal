<script setup lang="ts">
import type { SchemaFormItem, SchemaTableColumn } from '@lumal/core/components'
import type { Organization } from './types'
import { LumalPage, LumalSchemaTable } from '@lumal/core/components'
import { LumalIcon } from '@lumal/icons-vue'
import { ElAlert, ElButton, ElInput } from 'element-plus'
import { computed, shallowRef } from 'vue'
import { permissionStore, service } from '../../../app/services/session'
import BaseEntityDialog from '../../../shared/components/BaseEntityDialog.vue'
import { useAsyncData } from '../../../shared/composables/use-async-data'
import { useEntityEditor } from '../../../shared/composables/use-entity-editor'
import { statusOptions } from '../../../shared/status'
import { excludedDescendants, flattenTree } from '../../../shared/tree'
import { createOrganizationService, organizationInput, parseOrganization } from './api'

/***********************机构树、关联限制与筛选*********************/
const api = createOrganizationService(service)
const state = useAsyncData(api.list, [] as Organization[])
const keyword = shallowRef('')
const can = (action: string) => permissionStore.hasPermission(`system:organization:${action}`)
const editor = useEntityEditor<Organization, ReturnType<typeof organizationInput>>({
  create: api.create,
  update: api.update,
  remove: api.remove,
  toInput: organizationInput,
  reload: state.load,
})
function filter(items: Organization[]): Organization[] {
  return items.flatMap((item) => {
    const children = filter(item.children ?? [])
    return !keyword.value || `${item.name} ${item.code}`.includes(keyword.value) || children.length ? [{ ...item, children }] : []
  })
}
const displayed = computed(() => filter(state.data.value))
const columns: SchemaTableColumn<Organization>[] = [
  { field: 'name', label: '机构名称', minWidth: 220 },
  { field: 'code', label: '编码', minWidth: 130 },
  { field: 'leader', label: '负责人', minWidth: 100 },
  { field: 'phone', label: '联系电话', minWidth: 140 },
  { field: 'status', label: '状态', options: statusOptions, width: 90 },
  { field: 'userCount', label: '关联用户', width: 100, formatter: value => value ?? '-' },
  { field: 'order', label: '排序', width: 80 },
]
const schemas = computed<SchemaFormItem[]>(() => {
  const all = flattenTree(state.data.value)
  const excluded = excludedDescendants(all, editor.editing.value?.id)
  return [
    { field: 'name', label: '机构名称', required: true },
    { field: 'code', label: '机构编码', required: true },
    { field: 'parentId', label: '上级机构', component: 'select', options: [{ label: '无', value: '' }, ...all.filter(row => !excluded.has(row.id)).map(row => ({ label: row.name, value: row.id }))] },
    { field: 'leader', label: '负责人' },
    { field: 'phone', label: '联系电话' },
    { field: 'email', label: '邮箱', rules: [{ type: 'email', message: '邮箱格式错误' }] },
    { field: 'order', label: '排序', component: 'number', defaultValue: 0 },
    { field: 'status', label: '状态', component: 'select', options: statusOptions, defaultValue: 'enabled' },
  ]
})
</script>

<template>
  <LumalPage class="lumal-admin-page" title="机构管理" no-padding>
    <ElAlert v-if="editor.error.value" :title="editor.error.value" type="error" :closable="false" />
    <LumalSchemaTable :columns="columns" :rows="displayed" :loading="state.loading.value" :error="state.error.value" default-expand-all :action-width="240" @retry="state.reload">
      <template #toolbar>
        <ElInput v-model="keyword" clearable placeholder="搜索机构名称或编码" aria-label="搜索机构" style="max-width: 260px" />
        <ElButton v-if="can('create')" type="primary" @click="editor.openCreate({ parentId: '', status: 'enabled', order: 0 })">
          新增机构
        </ElButton>
      </template>
      <template #toolbar-tools>
        <ElButton title="重新加载" aria-label="重新加载" @click="state.reload">
          <LumalIcon name="lumal:refresh" />
        </ElButton>
      </template>
      <template #actions="{ row }">
        <ElButton v-if="can('create')" link @click="editor.openCreate({ parentId: row.id, status: 'enabled', order: 0 })">
          新增子机构
        </ElButton>
        <ElButton v-if="can('update')" link @click="editor.openEdit(parseOrganization(row))">
          编辑
        </ElButton>
        <ElButton v-if="can('delete')" link type="danger" :disabled="editor.saving.value" @click="editor.remove(parseOrganization(row))">
          删除
        </ElButton>
      </template>
    </LumalSchemaTable>
    <BaseEntityDialog v-model:visible="editor.visible.value" v-model:model="editor.model.value" :title="editor.editing.value ? '编辑机构' : '新增机构'" :schemas="schemas" :editing="!!editor.editing.value" :saving="editor.saving.value" :error="editor.error.value" @submit="editor.submit" />
  </LumalPage>
</template>
