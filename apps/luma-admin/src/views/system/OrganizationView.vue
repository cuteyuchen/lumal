<script setup lang="ts">
import type {
  SchemaFormItem,
  SchemaFormMode,
  SchemaFormModel,
  SchemaFormOption,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type { SaveSystemOrganizationInput, SystemOrganizationRecord } from '../../api/system'
import { LumaPage, LumaSchemaForm, LumaSchemaTable } from '@luma/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import {
  createSystemOrganization,
  deleteSystemOrganization,
  fetchSystemOrganizations,
  updateSystemOrganization,
} from '../../api/system'
import { adminPermissionCodes } from '../../mock/permission'

/***********************页面状态*********************/
const organizations = shallowRef<SystemOrganizationRecord[]>([])
const loading = shallowRef(false)
const dialogVisible = shallowRef(false)
const formMode = shallowRef<SchemaFormMode>('create')
const editingOrganization = shallowRef<SystemOrganizationRecord>()
const formModel = shallowRef<SchemaFormModel>({})
const saving = shallowRef(false)
const operationError = shallowRef('')

const tableRows = computed(() => organizations.value as unknown as SchemaTableRow[])
const dialogTitle = computed(() => formMode.value === 'edit' ? '编辑机构' : '新增机构')

/***********************表格与表单配置*********************/
const columns: SchemaTableColumn[] = [
  { field: 'name', label: '机构名称', width: 190 },
  { field: 'code', label: '机构编码', width: 180 },
  { field: 'leader', label: '负责人', width: 120 },
  { field: 'phone', label: '联系电话', width: 150 },
  { field: 'email', label: '邮箱', width: 190 },
  { dictionary: 'status', field: 'status', label: '状态', width: 90 },
  { field: 'order', label: '排序', width: 80 },
]

function flattenParentOptions(
  items: SystemOrganizationRecord[],
  excludedIds: Set<string>,
  depth = 0,
): SchemaFormOption[] {
  return items.flatMap((organization) => {
    const current = excludedIds.has(organization.id)
      ? []
      : [{ label: `${'　'.repeat(depth)}${organization.name}`, value: organization.id }]
    const children = flattenParentOptions(organization.children ?? [], excludedIds, depth + 1)

    return [...current, ...children]
  })
}

function collectOrganizationIds(
  organization: SystemOrganizationRecord | undefined,
  result = new Set<string>(),
): Set<string> {
  if (!organization) {
    return result
  }

  result.add(organization.id)
  organization.children?.forEach(child => collectOrganizationIds(child, result))
  return result
}

const parentOptions = computed<SchemaFormOption[]>(() => [
  { label: '根机构', value: '' },
  ...flattenParentOptions(
    organizations.value,
    collectOrganizationIds(editingOrganization.value),
  ),
])

const formSchemas = computed<SchemaFormItem[]>(() => [
  {
    component: 'select',
    field: 'parentId',
    label: '上级机构',
    options: parentOptions.value,
    span: 12,
  },
  {
    component: 'input',
    field: 'name',
    label: '机构名称',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    disabled: ({ mode }) => mode === 'edit',
    field: 'code',
    label: '机构编码',
    placeholder: '例如 platform-rd',
    required: true,
    span: 12,
  },
  { component: 'input', field: 'leader', label: '负责人', span: 12 },
  { component: 'input', field: 'phone', label: '联系电话', span: 12 },
  { component: 'input', field: 'email', label: '邮箱', span: 12 },
  { component: 'number', field: 'order', label: '排序', span: 12 },
  {
    component: 'select',
    defaultValue: 'enabled',
    dictionary: 'status',
    field: 'status',
    label: '状态',
    required: true,
    span: 12,
  },
])

const tableProps = {
  defaultExpandAll: true,
  treeProps: { children: 'children' },
}

/***********************数据加载*********************/
async function loadOrganizations(): Promise<void> {
  loading.value = true

  try {
    organizations.value = await fetchSystemOrganizations()
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '机构数据加载失败')
  }
  finally {
    loading.value = false
  }
}

function toOrganizationRecord(row: SchemaTableRow): SystemOrganizationRecord {
  return row as unknown as SystemOrganizationRecord
}

function toOrganizationInput(model: SchemaFormModel): SaveSystemOrganizationInput {
  return {
    code: model.code,
    email: model.email,
    leader: model.leader,
    name: model.name,
    order: model.order,
    parentId: model.parentId,
    phone: model.phone,
    status: model.status,
  }
}

/***********************交互处理*********************/
function openCreate(parentId = ''): void {
  formMode.value = 'create'
  editingOrganization.value = undefined
  formModel.value = { order: 0, parentId, status: 'enabled' }
  operationError.value = ''
  dialogVisible.value = true
}

function openEdit(row: SchemaTableRow): void {
  const organization = toOrganizationRecord(row)
  formMode.value = 'edit'
  editingOrganization.value = organization
  formModel.value = { ...organization }
  operationError.value = ''
  dialogVisible.value = true
}

async function handleSubmit(model: SchemaFormModel): Promise<void> {
  saving.value = true
  operationError.value = ''

  try {
    if (formMode.value === 'edit' && editingOrganization.value) {
      await updateSystemOrganization(editingOrganization.value.id, toOrganizationInput(model))
    }
    else {
      await createSystemOrganization(toOrganizationInput(model))
    }

    dialogVisible.value = false
    await loadOrganizations()
    ElMessage.success('机构已保存')
  }
  catch (error) {
    operationError.value = error instanceof Error ? error.message : '机构保存失败'
  }
  finally {
    saving.value = false
  }
}

async function removeOrganizationRow(row: SchemaTableRow): Promise<void> {
  const organization = toOrganizationRecord(row)

  try {
    await ElMessageBox.confirm(`确定删除机构“${organization.name}”吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }

  try {
    await deleteSystemOrganization(organization.id)
    await loadOrganizations()
    ElMessage.success('机构已删除')
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '机构删除失败')
  }
}

onMounted(() => {
  void loadOrganizations()
})
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="机构管理"
      description="维护组织树、上下级关系和机构基础信息。"
      :loading="loading"
    >
      <template #actions>
        <ElButton
          v-authority="adminPermissionCodes.systemOrganizationCreate"
          type="primary"
          native-type="button"
          data-action="create-organization"
          @click="openCreate()"
        >
          新增根机构
        </ElButton>
      </template>

      <LumaSchemaTable
        :columns="columns"
        :rows="tableRows"
        :table-props="tableProps"
        row-key="id"
        action-width="230"
      >
        <template #actions="{ row }">
          <ElButton
            v-authority="adminPermissionCodes.systemOrganizationCreate"
            native-type="button"
            data-action="create-organization-child"
            @click="openCreate(String(row.id))"
          >
            新增下级
          </ElButton>
          <ElButton
            v-authority="adminPermissionCodes.systemOrganizationUpdate"
            native-type="button"
            data-action="edit-organization"
            @click="openEdit(row)"
          >
            编辑
          </ElButton>
          <ElButton
            v-authority="adminPermissionCodes.systemOrganizationDelete"
            type="danger"
            native-type="button"
            data-action="delete-organization"
            @click="removeOrganizationRow(row)"
          >
            删除
          </ElButton>
        </template>
      </LumaSchemaTable>
    </LumaPage>

    <ElDialog v-model="dialogVisible" append-to-body class="luma-admin-dialog" :title="dialogTitle" width="720px">
      <ElAlert
        v-if="operationError"
        class="luma-admin-page__operation-error"
        :title="operationError"
        type="error"
        show-icon
        :closable="false"
      />
      <LumaSchemaForm
        v-model="formModel"
        :mode="formMode"
        :schemas="formSchemas"
        :submit-loading="saving"
        show-actions
        submit-text="保存"
        @submit="handleSubmit"
      />
    </ElDialog>
  </main>
</template>
