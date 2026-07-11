<script setup lang="ts">
import type {
  CrudDataSource,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type { DictionaryOption } from '@luma/core/dictionary'
import type { SaveSystemUserInput, SystemUserQuery, SystemUserRecord } from '../../api/system'
import { LumaCrudTable, LumaSchemaForm } from '@luma/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, shallowRef, useTemplateRef } from 'vue'
import {
  createSystemUser,
  deleteSystemUser,
  fetchSystemRoleOptions,
  fetchSystemUsers,
  resetSystemUserPassword,
  updateSystemUser,
  updateSystemUserRoles,
  updateSystemUserStatus,
} from '../../api/system'
import { adminPermissionCodes } from '../../mock/permission'

interface UserCrudTableExpose {
  openEdit: (row: SchemaTableRow) => void
  openView: (row: SchemaTableRow) => void
  reload: () => Promise<void>
  removeRow: (row: SchemaTableRow) => Promise<void>
}

/***********************页面状态*********************/
const crudTableRef = useTemplateRef<UserCrudTableExpose>('crudTableRef')
const queryModel = shallowRef<SchemaFormModel>({
  keyword: '',
  roles: '',
  status: '',
})
const page = shallowRef(1)
const pageSize = shallowRef(10)
const roleOptions = shallowRef<DictionaryOption[]>([])
const roleAssignmentVisible = shallowRef(false)
const assigningUser = shallowRef<SystemUserRecord>()
const roleAssignmentModel = shallowRef<SchemaFormModel>({ roles: [] })
const roleAssignmentSaving = shallowRef(false)
const roleAssignmentError = shallowRef('')

/***********************Schema 配置*********************/
const querySchemas = computed<SchemaFormItem[]>(() => [
  {
    component: 'input',
    field: 'keyword',
    label: '关键词',
    placeholder: '搜索用户名、昵称或手机号',
  },
  {
    component: 'select',
    field: 'roles',
    label: '角色',
    options: roleOptions.value,
  },
  {
    component: 'select',
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
])

const formSchemas = computed<SchemaFormItem[]>(() => [
  {
    component: 'input',
    field: 'username',
    label: '用户名',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'nickname',
    label: '昵称',
    required: true,
    span: 12,
  },
  {
    component: 'select',
    componentProps: { multiple: true },
    field: 'roles',
    label: '角色',
    options: roleOptions.value,
    required: true,
    span: 12,
  },
  {
    component: 'select',
    defaultValue: 'enabled',
    dictionary: 'status',
    field: 'status',
    label: '状态',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'phone',
    label: '手机号',
    span: 12,
  },
])

const columns = computed<SchemaTableColumn[]>(() => [
  { field: 'username', label: '用户名', width: 150 },
  { field: 'nickname', label: '昵称', width: 140 },
  {
    field: 'roles',
    formatter: value => Array.isArray(value)
      ? value.map(role => roleOptions.value.find(option => option.value === role)?.label ?? role).join('、')
      : '',
    label: '角色',
    width: 180,
  },
  { dictionary: 'status', field: 'status', label: '状态', width: 100 },
  { field: 'phone', label: '手机号', width: 150 },
  { field: 'createdAt', label: '创建时间', width: 130 },
])
const queryConfig = computed(() => ({
  collapsible: true,
  columns: 3,
  schemas: querySchemas.value,
}))
const tableConfig = computed(() => ({
  columns: columns.value,
  rowKey: 'id',
  showColumnSettings: true,
}))

/***********************数据适配*********************/
function toUserRecord(row: SchemaTableRow): SystemUserRecord {
  return row as unknown as SystemUserRecord
}

function toUserInput(model: Partial<SchemaTableRow>): SaveSystemUserInput {
  return {
    nickname: model.nickname,
    phone: model.phone,
    roles: model.roles,
    status: model.status,
    username: model.username,
  }
}

const dataSource: CrudDataSource = {
  async create(model) {
    await createSystemUser(toUserInput(model))
    ElMessage.success('用户新增成功')
  },
  fetch(params) {
    return fetchSystemUsers({
      page: params.page,
      pageSize: params.pageSize,
      query: params.query as SystemUserQuery,
    })
  },
  async remove(row) {
    const user = toUserRecord(row)
    await deleteSystemUser(user.id)
    ElMessage.success(`已删除用户：${user.nickname}`)
  },
  async update(row, model) {
    const user = toUserRecord(row)
    await updateSystemUser(user.id, toUserInput(model))
    ElMessage.success('用户信息已更新')
  },
}

/***********************交互处理*********************/
function openView(row: SchemaTableRow): void {
  crudTableRef.value?.openView(row)
}

function openEdit(row: SchemaTableRow): void {
  crudTableRef.value?.openEdit(row)
}

function removeUser(row: SchemaTableRow): void {
  void crudTableRef.value?.removeRow(row)
}

async function toggleUserStatus(row: SchemaTableRow): Promise<void> {
  const user = toUserRecord(row)
  const nextStatus = user.status === 'enabled' ? 'disabled' : 'enabled'
  const action = nextStatus === 'enabled' ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确定${action}用户“${user.nickname}”吗？`, `${action}确认`, {
      confirmButtonText: action,
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }

  await updateSystemUserStatus(user.id, nextStatus)
  await crudTableRef.value?.reload()
  ElMessage.success(`用户已${action}`)
}

function openRoleAssignment(row: SchemaTableRow): void {
  const user = toUserRecord(row)
  assigningUser.value = user
  roleAssignmentModel.value = { roles: [...user.roles] }
  roleAssignmentError.value = ''
  roleAssignmentVisible.value = true
}

async function saveRoleAssignment(model: SchemaFormModel): Promise<void> {
  if (!assigningUser.value) {
    return
  }

  roleAssignmentSaving.value = true
  roleAssignmentError.value = ''

  try {
    const roles = Array.isArray(model.roles) ? model.roles.map(String) : []
    await updateSystemUserRoles(assigningUser.value.id, roles)
    roleAssignmentVisible.value = false
    await crudTableRef.value?.reload()
    ElMessage.success('用户角色已更新')
  }
  catch (error) {
    roleAssignmentError.value = error instanceof Error ? error.message : '角色分配失败'
  }
  finally {
    roleAssignmentSaving.value = false
  }
}

async function resetPassword(row: SchemaTableRow): Promise<void> {
  const user = toUserRecord(row)

  try {
    await ElMessageBox.confirm(`确定重置用户“${user.nickname}”的密码吗？`, '重置密码', {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }

  const result = await resetSystemUserPassword(user.id)
  await ElMessageBox.alert(`临时密码：${result.temporaryPassword}`, '密码已重置', {
    confirmButtonText: '我知道了',
  })
}

async function confirmRemove(rows: SchemaTableRow[]): Promise<boolean> {
  const label = rows.length === 1 ? toUserRecord(rows[0]).nickname : `${rows.length} 个用户`

  try {
    await ElMessageBox.confirm(`确定删除 ${label} 吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    return true
  }
  catch {
    return false
  }
}

const actionsConfig = {
  confirmRemove,
}

const roleAssignmentSchemas = computed<SchemaFormItem[]>(() => [{
  component: 'select',
  componentProps: { multiple: true },
  field: 'roles',
  label: '角色',
  options: roleOptions.value,
  required: true,
  span: 24,
}])

onMounted(() => {
  void fetchSystemRoleOptions().then((options) => {
    roleOptions.value = options
  })
})
</script>

<template>
  <main class="luma-admin-page">
    <LumaCrudTable
      ref="crudTableRef"
      v-model:query-model="queryModel"
      v-model:page="page"
      v-model:page-size="pageSize"
      title="用户管理"
      description="维护后台账号、角色与启用状态；当前示例使用应用级可变 Mock API。"
      :actions="actionsConfig"
      :data-source="dataSource"
      :form-schemas="formSchemas"
      :query="queryConfig"
      :table="tableConfig"
    >
      <template #create-action="{ openCreate }">
        <ElButton
          v-authority="adminPermissionCodes.systemUserCreate"
          type="primary"
          native-type="button"
          data-action="create-user"
          @click="openCreate"
        >
          新增用户
        </ElButton>
      </template>

      <template #row-actions="{ row }">
        <ElButton
          native-type="button"
          data-action="view-user"
          @click="openView(row)"
        >
          查看
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemUserUpdate"
          native-type="button"
          data-action="edit-user"
          @click="openEdit(row)"
        >
          编辑
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemUserStatus"
          native-type="button"
          data-action="toggle-user-status"
          @click="toggleUserStatus(row)"
        >
          {{ toUserRecord(row).status === 'enabled' ? '停用' : '启用' }}
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemUserAssignRoles"
          native-type="button"
          data-action="assign-user-roles"
          @click="openRoleAssignment(row)"
        >
          分配角色
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemUserResetPassword"
          native-type="button"
          data-action="reset-user-password"
          @click="resetPassword(row)"
        >
          重置密码
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemUserDelete"
          type="danger"
          native-type="button"
          data-action="delete-user"
          @click="removeUser(row)"
        >
          删除
        </ElButton>
      </template>
    </LumaCrudTable>

    <ElDialog
      v-model="roleAssignmentVisible"
      append-to-body
      class="luma-admin-dialog"
      :title="`分配角色：${assigningUser?.nickname ?? ''}`"
      width="520px"
    >
      <ElAlert
        v-if="roleAssignmentError"
        class="luma-admin-page__operation-error"
        :title="roleAssignmentError"
        type="error"
        show-icon
        :closable="false"
      />
      <LumaSchemaForm
        v-model="roleAssignmentModel"
        mode="edit"
        :schemas="roleAssignmentSchemas"
        :submit-loading="roleAssignmentSaving"
        show-actions
        submit-text="保存角色"
        @submit="saveRoleAssignment"
      />
    </ElDialog>
  </main>
</template>
