<script setup lang="ts">
import type { CrudDataSource, SchemaFormItem, SchemaTableColumn, SchemaTableRow } from '@lumal/core/components'
import type { Option } from '../../../shared/api'
import type { User, UserQuery } from './types'
import { LumalCrudTable, LumalPage } from '@lumal/core/components'
import { ElAlert, ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { permissionStore, service } from '../../../app/services/session'
import { options } from '../../../shared/api'
import { useAsyncData } from '../../../shared/composables/use-async-data'
import { statusOptions } from '../../../shared/status'
import { createUserService, parseUser, userInput } from './api'
import UserOrganizationFilter from './components/UserOrganizationFilter.vue'
import UserRoleDialog from './components/UserRoleDialog.vue'

/***********************用户列表与引用选项*********************/
const api = createUserService(service)
const table = useTemplateRef<InstanceType<typeof LumalCrudTable>>('table')
const organizationId = shallowRef('')
const selected = shallowRef<SchemaTableRow[]>([])
const actionError = shallowRef('')
let listError: unknown
const acting = shallowRef(false)
const roleDialog = shallowRef(false)
const assigning = shallowRef<User[]>([])
const batchAssignment = shallowRef(false)
const can = (action: string) => permissionStore.hasPermission(`system:user:${action}`)
const references = useAsyncData(async () => {
  const [roles, organizations] = await Promise.all([
    service.request('GET', '/system/roles/options'),
    service.request('GET', '/system/organizations/options'),
  ])
  return { roles: options(roles), organizations: options(organizations) }
}, { roles: [] as Option[], organizations: [] as Option[] })
function flatten(options: Option[]): Option[] {
  return options.flatMap(item => [item, ...flatten(item.children ?? [])])
}
const orgLabels = computed(() => new Map(flatten(references.data.value.organizations).map(item => [item.value, item.label])))
watch(organizationId, () => {
  void table.value?.reload()
})
const dataSource: CrudDataSource = {
  async fetch(input) {
    listError = undefined
    try {
      return await api.list({ ...input, query: { ...input.query, organizationId: organizationId.value } as UserQuery })
    }
    catch (reason) {
      listError = reason
      throw reason
    }
  },
  create: model => api.create(userInput(model)),
  update: (row, model) => api.update(parseUser(row).id, userInput(model)),
  remove: row => api.remove(parseUser(row).id),
}

/***********************用户独立表单与查询契约*********************/
const columns = computed<SchemaTableColumn[]>(() => [
  { field: 'username', label: '用户名', minWidth: 130 },
  { field: 'nickname', label: '昵称', minWidth: 120 },
  { field: 'organizationId', label: '机构', minWidth: 140, formatter: value => orgLabels.value.get(String(value)) ?? '-' },
  { field: 'roles', label: '角色', minWidth: 150, formatter: value => Array.isArray(value) ? value.map(code => references.data.value.roles.find(option => option.value === code)?.label ?? code).join('、') : '' },
  { field: 'status', label: '状态', options: statusOptions, width: 90 },
  { field: 'phone', label: '手机号', minWidth: 130 },
])
const schemas = computed<SchemaFormItem[]>(() => [
  { field: 'username', label: '用户名', component: 'input', required: true, editDisabled: true },
  { field: 'nickname', label: '昵称', component: 'input', required: true, rules: [{ max: 32, message: '昵称最多 32 个字符' }] },
  { field: 'organizationId', label: '所属机构', component: 'tree-select', options: references.data.value.organizations, componentProps: { data: references.data.value.organizations, checkStrictly: true, defaultExpandAll: true, props: { children: 'children', label: 'label', value: 'value', disabled: 'disabled' } }, defaultValue: references.data.value.organizations[0]?.value ?? '' },
  { field: 'roles', label: '角色', component: 'select', required: true, options: references.data.value.roles, defaultValue: ['guest'], componentProps: { multiple: true }, disabled: ({ mode }) => mode === 'edit' && !can('assign-roles') },
  { field: 'status', label: '状态', component: 'select', options: statusOptions, defaultValue: 'enabled', disabled: ({ mode, model }) => model.username === 'admin' || (mode === 'edit' && !can('status')) },
  { field: 'phone', label: '手机号', component: 'input', rules: [{ pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }] },
])
const querySchemas = computed<SchemaFormItem[]>(() => [
  { field: 'keyword', label: '关键词', component: 'input' },
  { field: 'roles', label: '角色', component: 'select', options: references.data.value.roles },
  { field: 'status', label: '状态', component: 'select', options: statusOptions },
])

/***********************状态、批量操作与密码重置*********************/
async function run(action: () => Promise<unknown>): Promise<void> {
  if (acting.value)
    return
  acting.value = true
  actionError.value = ''
  let persisted = false
  try {
    await action()
    persisted = true
    await table.value?.reload()
    if (listError)
      throw listError
    table.value?.clearSelection()
    selected.value = []
    ElMessage.success('操作成功')
  }
  catch (reason) {
    actionError.value = `${persisted ? '操作已保存，但刷新失败：' : ''}${reason instanceof Error ? reason.message : '操作失败'}`
  }
  finally {
    acting.value = false
  }
}
function assign(users: User[], batch = false): void {
  assigning.value = users
  batchAssignment.value = batch
  roleDialog.value = true
}
async function resetPassword(row: SchemaTableRow): Promise<void> {
  try {
    await ElMessageBox.confirm(`重置 ${parseUser(row).nickname} 的密码？`, '密码重置', { confirmButtonText: '重置', cancelButtonText: '取消' })
  }
  catch { return }
  await run(async () => {
    const result = await api.resetPassword(parseUser(row).id)
    await ElMessageBox.alert(`临时密码：${result.temporaryPassword}`, '密码已重置')
  })
}
async function rolesSaved(): Promise<void> {
  table.value?.clearSelection()
  selected.value = []
  await table.value?.reload()
  if (listError)
    actionError.value = '角色分配已保存，但列表读取失败，请重新加载'
}
</script>

<template>
  <LumalPage class="lumal-admin-page" title="用户管理" no-padding>
    <ElAlert v-if="references.error.value" :title="references.error.value" type="error" :closable="false">
      <ElButton link @click="references.reload">
        重试选项加载
      </ElButton>
    </ElAlert>
    <ElAlert v-if="actionError" :title="actionError" type="error" role="alert" closable @close="actionError = ''" />
    <div class="user-layout">
      <UserOrganizationFilter v-model="organizationId" :options="references.data.value.organizations" />
      <LumalCrudTable
        ref="table" :data-source="dataSource" :form-schemas="schemas"
        :table="{ columns, rowKey: 'id', selection: true, showColumnSettings: true, actionWidth: 430 }"
        :query="{ schemas: querySchemas, columns: 3, collapsible: true, mobileDefaultVisible: false }"
        :toolbar="{ create: can('create') && !references.error.value, batchDelete: false, refresh: true }"
        :actions="{ view: false, edit: false, remove: false }" :editor="{ columns: 2 }"
        @selection-change="selected = $event" @operation-error="actionError = $event instanceof Error ? $event.message : String($event)"
      >
        <template #toolbar-actions="{ selectedRows }">
          <ElButton v-if="can('status')" :disabled="!selectedRows.length || acting" @click="run(() => api.batchStatus(selectedRows.map(row => parseUser(row).id), 'enabled'))">
            批量启用
          </ElButton>
          <ElButton v-if="can('status')" :disabled="!selectedRows.length || acting" @click="run(() => api.batchStatus(selectedRows.map(row => parseUser(row).id), 'disabled'))">
            批量停用
          </ElButton>
          <ElButton v-if="can('assign-roles')" :disabled="!selectedRows.length || !!references.error.value" @click="assign(selectedRows.map(parseUser), true)">
            批量分配角色
          </ElButton>
        </template>
        <template #row-actions="{ row }">
          <ElButton link @click="table?.openView(row)">
            查看
          </ElButton>
          <ElButton v-if="can('update')" link @click="table?.openEdit(row)">
            编辑
          </ElButton>
          <ElButton v-if="can('status')" link :disabled="row.username === 'admin' || acting" @click="run(() => api.setStatus(parseUser(row).id, row.status === 'enabled' ? 'disabled' : 'enabled'))">
            {{ row.status === 'enabled' ? '停用' : '启用' }}
          </ElButton>
          <ElButton v-if="can('assign-roles')" link :disabled="!!references.error.value" @click="assign([parseUser(row)])">
            分配角色
          </ElButton>
          <ElButton v-if="can('reset-password')" link @click="resetPassword(row)">
            重置密码
          </ElButton>
          <ElButton v-if="can('delete')" link type="danger" :disabled="row.username === 'admin'" @click="table?.removeRow(row)">
            删除
          </ElButton>
        </template>
      </LumalCrudTable>
    </div>
    <UserRoleDialog v-model="roleDialog" :users="assigning" :options="references.data.value.roles" :batch="batchAssignment" @saved="rolesSaved" />
  </LumalPage>
</template>

<style scoped>
.user-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 16px; min-width: 0; }
@media (max-width: 768px) { .user-layout { grid-template-columns: minmax(0, 1fr); } }
</style>
