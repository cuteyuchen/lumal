<script setup lang="ts">
import type {
  SchemaFormItem,
  SchemaFormModel,
  SchemaFormOption,
  SchemaTableColumn,
  SchemaTableRow,
} from '@lumal/core/components'
import type { SaveSystemOrganizationInput, SystemOrganizationRecord } from '../../api/system'
import { LumalPage, LumalSchemaForm, LumalSchemaTable } from '@lumal/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { adminPermissionCodes } from '../../api/permissions'
import {
  createSystemOrganization,
  deleteSystemOrganization,
  fetchSystemOrganizations,
  updateSystemOrganization,
} from '../../api/system'
import { useSchemaEntityCrud } from '../../composables/useSchemaEntityCrud'

/***********************页面状态*********************/
const organizations = shallowRef<SystemOrganizationRecord[]>([])
const loading = shallowRef(false)
const {
  editingRecord: editingOrganization,
  error: operationError,
  mode: formMode,
  model: formModel,
  openCreate: openCreateDialog,
  openEdit: openEditDialog,
  remove: removeOrganization,
  saving,
  submit: handleSubmit,
  visible: dialogVisible,
} = useSchemaEntityCrud<SystemOrganizationRecord, SaveSystemOrganizationInput>({
  create: createSystemOrganization,
  update: (record, input) => updateSystemOrganization(record.id, input),
  remove: record => deleteSystemOrganization(record.id),
  reload: loadOrganizations,
  toInput: toOrganizationInput,
  confirmRemove: record => ({ message: `确定删除机构“${record.name}”吗？` }),
  saveSuccess: '机构已保存',
  saveError: '机构保存失败',
  removeSuccess: '机构已删除',
  removeError: '机构删除失败',
})

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
  openCreateDialog({ order: 0, parentId, status: 'enabled' })
}

function openEdit(row: SchemaTableRow): void {
  const organization = toOrganizationRecord(row)
  openEditDialog(organization)
}

async function removeOrganizationRow(row: SchemaTableRow): Promise<void> {
  await removeOrganization(toOrganizationRecord(row))
}

onMounted(() => {
  void loadOrganizations()
})
</script>

<template>
  <main class="lumal-admin-page">
    <LumalPage
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

      <LumalSchemaTable
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
      </LumalSchemaTable>
    </LumalPage>

    <ElDialog v-model="dialogVisible" append-to-body class="lumal-admin-dialog" :title="dialogTitle" width="720px">
      <ElAlert
        v-if="operationError"
        class="lumal-admin-page__operation-error"
        :title="operationError"
        type="error"
        show-icon
        :closable="false"
      />
      <LumalSchemaForm
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
