<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel, SchemaTableColumn, SchemaTableRow } from '@lumal/core/components'
import type { SaveSystemDictionaryTypeInput, SystemDictionaryTypeRecord } from '../../api/system'
import { LumalPage, LumalSchemaForm, LumalSchemaTable } from '@lumal/core/components'
import { ElAlert, ElButton, ElDialog } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { adminPermissionCodes } from '../../api/permissions'
import {
  createDictionaryType,
  deleteDictionaryType,
  fetchDictionaryTypes,
  updateDictionaryType,
} from '../../api/system'
import { useSchemaEntityCrud } from '../../composables/useSchemaEntityCrud'
import { refreshAdminDictionaryCache } from '../../services/dictionary'

const records = shallowRef<SystemDictionaryTypeRecord[]>([])
const loading = shallowRef(false)
const {
  error: operationError,
  mode: formMode,
  model: formModel,
  openCreate: openCreateDialog,
  openEdit: openEditDialog,
  remove: removeRecord,
  saving,
  submit: save,
  visible: dialogVisible,
} = useSchemaEntityCrud<SystemDictionaryTypeRecord, SaveSystemDictionaryTypeInput>({
  create: createDictionaryType,
  update: (record, input) => updateDictionaryType(record.id, input),
  remove: record => deleteDictionaryType(record.id),
  reload: loadData,
  toInput,
  confirmRemove: record => ({
    message: `删除分类“${record.name}”会同时删除其字典项，是否继续？`,
    title: '删除字典分类',
  }),
  saveSuccess: '字典分类已保存',
  saveError: '字典分类保存失败',
  removeSuccess: '字典分类已删除',
  removeError: '字典分类删除失败',
  afterSave: async ({ mode, record }) => {
    if (mode === 'edit' && record)
      await refreshAdminDictionaryCache(record.code, { reload: false })
  },
  afterRemove: ({ record }) => refreshAdminDictionaryCache(record.code, { reload: false }),
})
const rows = computed(() => records.value as unknown as SchemaTableRow[])

const columns: SchemaTableColumn[] = [
  { field: 'name', label: '字典名称', minWidth: 180 },
  { field: 'code', label: '字典编码', width: 180 },
  { field: 'description', label: '说明', minWidth: 260 },
  { dictionary: 'status', field: 'status', label: '状态', width: 110 },
]

const schemas: SchemaFormItem[] = [
  { component: 'input', field: 'name', label: '字典名称', required: true, span: 12 },
  { component: 'input', disabled: ({ mode }) => mode === 'edit', field: 'code', label: '字典编码', placeholder: '例如 priority', required: true, span: 12 },
  { component: 'select', defaultValue: 'enabled', dictionary: 'status', field: 'status', label: '状态', required: true, span: 12 },
  { component: 'textarea', field: 'description', label: '说明', placeholder: '说明该字典的使用范围', span: 24 },
]

async function loadData(): Promise<void> {
  loading.value = true
  try {
    records.value = await fetchDictionaryTypes()
  }
  finally {
    loading.value = false
  }
}

function toRecord(row: SchemaTableRow): SystemDictionaryTypeRecord {
  return row as unknown as SystemDictionaryTypeRecord
}

function toInput(model: SchemaFormModel): SaveSystemDictionaryTypeInput {
  return {
    code: model.code,
    description: model.description,
    name: model.name,
    status: model.status,
  }
}

function openCreate(): void {
  openCreateDialog({ status: 'enabled' })
}

function openEdit(row: SchemaTableRow): void {
  const record = toRecord(row)
  openEditDialog(record)
}

async function remove(row: SchemaTableRow): Promise<void> {
  await removeRecord(toRecord(row))
}

onMounted(() => void loadData())
</script>

<template>
  <main class="lumal-admin-page">
    <LumalPage title="字典分类" description="维护字典的分类、编码和用途；具体键值请前往“字典项”。" :loading="loading">
      <template #actions>
        <ElButton v-authority="adminPermissionCodes.systemDictCreate" type="primary" data-action="create-dictionary-type" @click="openCreate">
          新增分类
        </ElButton>
      </template>
      <LumalSchemaTable :columns="columns" :rows="rows" row-key="id" action-width="180">
        <template #actions="{ row }">
          <ElButton v-authority="adminPermissionCodes.systemDictUpdate" data-action="edit-dictionary-type" @click="openEdit(row)">
            编辑
          </ElButton>
          <ElButton v-authority="adminPermissionCodes.systemDictDelete" type="danger" data-action="delete-dictionary-type" @click="remove(row)">
            删除
          </ElButton>
        </template>
      </LumalSchemaTable>
    </LumalPage>

    <ElDialog v-model="dialogVisible" append-to-body class="lumal-admin-dialog" :title="formMode === 'edit' ? '编辑字典分类' : '新增字典分类'" width="720px">
      <ElAlert v-if="operationError" :title="operationError" type="error" show-icon :closable="false" />
      <LumalSchemaForm v-model="formModel" :mode="formMode" :schemas="schemas" :columns="2" :submit-loading="saving" show-actions submit-text="保存分类" @submit="save" />
    </ElDialog>
  </main>
</template>
