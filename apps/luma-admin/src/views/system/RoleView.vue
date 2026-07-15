<script setup lang="ts">
import type {
  CrudDataSource,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type {
  SaveSystemRoleInput,
  SystemPermissionTreeNode,
  SystemRoleQuery,
  SystemRoleRecord,
} from '../../api/system'
import { LumaCrudTable } from '@luma/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage, ElMessageBox, ElTree } from 'element-plus'
import { nextTick, onMounted, shallowRef, useTemplateRef } from 'vue'
import { adminPermissionCodes } from '../../api/permissions'
import {
  createSystemRole,
  deleteSystemRole,
  fetchSystemPermissionTree,
  fetchSystemRolePermissions,
  fetchSystemRoles,
  updateSystemRole,
  updateSystemRolePermissions,
} from '../../api/system'

interface RoleCrudTableExpose {
  openEdit: (row: SchemaTableRow) => void
  openView: (row: SchemaTableRow) => void
  removeRow: (row: SchemaTableRow) => Promise<void>
}

interface PermissionTreeExpose {
  getCheckedKeys: (leafOnly?: boolean) => unknown[]
  getHalfCheckedKeys: () => unknown[]
  setCheckedKeys: (keys: unknown[]) => void
}

/***********************页面状态*********************/
const crudTableRef = useTemplateRef<RoleCrudTableExpose>('crudTableRef')
const permissionTreeRef = useTemplateRef<PermissionTreeExpose>('permissionTreeRef')
const queryModel = shallowRef<SchemaFormModel>({
  keyword: '',
  status: '',
})
const page = shallowRef(1)
const pageSize = shallowRef(10)
const permissionTree = shallowRef<SystemPermissionTreeNode[]>([])
const authorizationVisible = shallowRef(false)
const authorizingRole = shallowRef<SystemRoleRecord>()
const authorizationLoading = shallowRef(false)
const authorizationSaving = shallowRef(false)
const authorizationError = shallowRef('')

/***********************Schema 配置*********************/
const querySchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'keyword',
    label: '关键词',
    placeholder: '搜索角色名称、编码或说明',
  },
  {
    component: 'select',
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
]

const formSchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'name',
    label: '角色名称',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    disabled: ({ mode }) => mode === 'edit',
    field: 'code',
    label: '角色编码',
    placeholder: '例如 auditor',
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
    component: 'textarea',
    field: 'description',
    label: '说明',
    span: 24,
  },
]

const columns: SchemaTableColumn[] = [
  { field: 'name', label: '角色名称', width: 160 },
  { field: 'code', label: '角色编码', width: 160 },
  { dictionary: 'status', field: 'status', label: '状态', width: 100 },
  { field: 'description', label: '说明', width: 320 },
]
const queryConfig = {
  collapsible: true,
  columns: 3,
  schemas: querySchemas,
}
const tableConfig = {
  columns,
  rowKey: 'id',
  showColumnSettings: true,
}

/***********************数据适配*********************/
function toRoleRecord(row: SchemaTableRow): SystemRoleRecord {
  return row as unknown as SystemRoleRecord
}

function toRoleInput(model: Partial<SchemaTableRow>): SaveSystemRoleInput {
  return {
    code: model.code,
    description: model.description,
    name: model.name,
    status: model.status,
  }
}

const dataSource: CrudDataSource = {
  async create(model) {
    await createSystemRole(toRoleInput(model))
    ElMessage.success('角色新增成功')
  },
  fetch(params) {
    return fetchSystemRoles({
      page: params.page,
      pageSize: params.pageSize,
      query: params.query as SystemRoleQuery,
    })
  },
  async remove(row) {
    const role = toRoleRecord(row)
    await deleteSystemRole(role.id)
    ElMessage.success(`已删除角色：${role.name}`)
  },
  async update(row, model) {
    const role = toRoleRecord(row)
    await updateSystemRole(role.id, toRoleInput(model))
    ElMessage.success('角色信息已更新')
  },
}

/***********************CRUD 交互*********************/
function openView(row: SchemaTableRow): void {
  crudTableRef.value?.openView(row)
}

function openEdit(row: SchemaTableRow): void {
  crudTableRef.value?.openEdit(row)
}

function removeRole(row: SchemaTableRow): void {
  void crudTableRef.value?.removeRow(row)
}

async function confirmRemove(rows: SchemaTableRow[]): Promise<boolean> {
  const label = rows.length === 1 ? toRoleRecord(rows[0]).name : `${rows.length} 个角色`

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

/***********************角色授权*********************/
function collectPermissionCodes(nodes: SystemPermissionTreeNode[], result = new Set<string>()): Set<string> {
  nodes.forEach((node) => {
    node.permissions.forEach(permission => result.add(permission))
    if (node.children) {
      collectPermissionCodes(node.children, result)
    }
  })
  return result
}

async function openAuthorize(row: SchemaTableRow): Promise<void> {
  const role = toRoleRecord(row)
  authorizingRole.value = role
  authorizationVisible.value = true
  authorizationLoading.value = true
  authorizationError.value = ''

  try {
    const [tree, permissions] = await Promise.all([
      fetchSystemPermissionTree(),
      fetchSystemRolePermissions(role.code),
    ])

    permissionTree.value = tree
    await nextTick()
    permissionTreeRef.value?.setCheckedKeys(permissions)
  }
  catch (error) {
    authorizationError.value = error instanceof Error ? error.message : '角色权限加载失败'
  }
  finally {
    authorizationLoading.value = false
  }
}

async function saveRolePermissions(): Promise<void> {
  const role = authorizingRole.value

  if (!role || !permissionTreeRef.value) {
    return
  }

  authorizationSaving.value = true
  authorizationError.value = ''

  try {
    const knownPermissions = collectPermissionCodes(permissionTree.value)
    const checkedKeys = [
      ...permissionTreeRef.value.getCheckedKeys(false),
      ...permissionTreeRef.value.getHalfCheckedKeys(),
    ].map(String).filter(permission => knownPermissions.has(permission))

    await updateSystemRolePermissions(role.code, checkedKeys)
    authorizationVisible.value = false
    ElMessage.success('角色权限已保存，相关账号下次登录时生效')
  }
  catch (error) {
    authorizationError.value = error instanceof Error ? error.message : '角色权限保存失败'
  }
  finally {
    authorizationSaving.value = false
  }
}

onMounted(() => {
  void fetchSystemPermissionTree().then((tree) => {
    permissionTree.value = tree
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
      title="角色管理"
      description="维护角色基础信息并通过权限树分配菜单和按钮权限。"
      :actions="actionsConfig"
      :data-source="dataSource"
      :form-schemas="formSchemas"
      :query="queryConfig"
      :table="tableConfig"
    >
      <template #create-action="{ openCreate }">
        <ElButton
          v-authority="adminPermissionCodes.systemRoleCreate"
          type="primary"
          native-type="button"
          data-action="create-role"
          @click="openCreate"
        >
          新增角色
        </ElButton>
      </template>

      <template #row-actions="{ row }">
        <ElButton native-type="button" data-action="view-role" @click="openView(row)">
          查看
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemRoleUpdate"
          native-type="button"
          data-action="edit-role"
          @click="openEdit(row)"
        >
          编辑
        </ElButton>
        <ElButton
          v-authority="adminPermissionCodes.systemRoleAuthorize"
          native-type="button"
          data-action="authorize-role"
          @click="openAuthorize(row)"
        >
          授权
        </ElButton>
        <ElButton
          v-if="!toRoleRecord(row).builtIn"
          v-authority="adminPermissionCodes.systemRoleDelete"
          type="danger"
          native-type="button"
          data-action="delete-role"
          @click="removeRole(row)"
        >
          删除
        </ElButton>
      </template>
    </LumaCrudTable>

    <ElDialog
      v-model="authorizationVisible"
      append-to-body
      class="luma-admin-dialog"
      :title="`角色授权：${authorizingRole?.name ?? ''}${authorizingRole ? `（${authorizingRole.code}）` : ''}`"
      width="560px"
    >
      <p class="luma-admin-role-authorization__hint">
        勾选菜单会联动下级页面和按钮权限，可按需取消具体操作权限。
      </p>
      <ElAlert
        v-if="authorizationError"
        class="luma-admin-page__operation-error"
        :title="authorizationError"
        type="error"
        show-icon
        :closable="false"
      />
      <ElTree
        ref="permissionTreeRef"
        v-loading="authorizationLoading"
        :data="permissionTree"
        node-key="id"
        show-checkbox
        default-expand-all
        :props="{ children: 'children', label: 'label' }"
      />
      <template #footer>
        <ElButton native-type="button" :disabled="authorizationSaving" @click="authorizationVisible = false">
          取消
        </ElButton>
        <ElButton
          type="primary"
          native-type="button"
          data-action="save-role-permissions"
          :disabled="authorizationLoading"
          :loading="authorizationSaving"
          @click="saveRolePermissions"
        >
          保存授权
        </ElButton>
      </template>
    </ElDialog>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-role-authorization__hint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
  line-height: 1.6;
}
</style>
