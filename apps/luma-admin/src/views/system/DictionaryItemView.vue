<script setup lang="ts">
import type { SchemaFormItem, SchemaFormMode, SchemaFormModel, SchemaTableColumn, SchemaTableRow } from '@luma/core/components'
import type { SaveSystemDictionaryItemInput, SystemDictionaryItemRecord, SystemDictionaryTypeRecord } from '../../api/system'
import { LumaPage, LumaSchemaForm, LumaSchemaTable } from '@luma/core/components'
import { ElButton, ElDialog, ElMessage, ElMessageBox, ElOption, ElSelect } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import {
  createDictionaryItem,
  deleteDictionaryItem,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  updateDictionaryItem,
} from '../../api/system'
import { adminPermissionCodes } from '../../mock/permission'
import { refreshAdminDictionaryCache } from '../../services/dictionary'

const types = shallowRef<SystemDictionaryTypeRecord[]>([])
const items = shallowRef<SystemDictionaryItemRecord[]>([])
const typeCode = shallowRef('')
const loading = shallowRef(false)
const refreshing = shallowRef(false)
const dialogVisible = shallowRef(false)
const formMode = shallowRef<SchemaFormMode>('create')
const editingRecord = shallowRef<SystemDictionaryItemRecord>()
const formModel = shallowRef<SchemaFormModel>({})
const rows = computed(() => items.value as unknown as SchemaTableRow[])
const currentType = computed(() => types.value.find(item => item.code === typeCode.value))

const columns: SchemaTableColumn[] = [
  { field: 'label', label: '显示标签', minWidth: 180 },
  { field: 'value', label: '字典值', minWidth: 180 },
  { field: 'color', label: '语义颜色', width: 140 },
  { field: 'order', label: '排序', width: 90 },
  { dictionary: 'status', field: 'status', label: '状态', width: 110 },
]

const schemas: SchemaFormItem[] = [
  { component: 'input', field: 'label', label: '显示标签', required: true, span: 12 },
  { component: 'input', field: 'value', label: '字典值', required: true, span: 12 },
  { component: 'input', componentProps: { type: 'color' }, field: 'color', label: '语义颜色', span: 12 },
  { component: 'number', field: 'order', label: '排序', span: 12 },
  { component: 'select', defaultValue: 'enabled', dictionary: 'status', field: 'status', label: '状态', required: true, span: 12 },
]

async function loadItems(): Promise<void> {
  items.value = typeCode.value ? await fetchDictionaryItems(typeCode.value) : []
}

async function loadData(): Promise<void> {
  loading.value = true
  try {
    types.value = await fetchDictionaryTypes()
    if (!types.value.some(item => item.code === typeCode.value)) {
      typeCode.value = types.value[0]?.code ?? ''
    }
    await loadItems()
  }
  finally {
    loading.value = false
  }
}

function toRecord(row: SchemaTableRow): SystemDictionaryItemRecord {
  return row as unknown as SystemDictionaryItemRecord
}

function openCreate(): void {
  formMode.value = 'create'
  editingRecord.value = undefined
  formModel.value = { color: '#1677ff', order: items.value.length + 1, status: 'enabled' }
  dialogVisible.value = true
}

function openEdit(row: SchemaTableRow): void {
  const record = toRecord(row)
  formMode.value = 'edit'
  editingRecord.value = record
  formModel.value = { ...record }
  dialogVisible.value = true
}

async function save(model: SchemaFormModel): Promise<void> {
  const input: SaveSystemDictionaryItemInput = {
    color: model.color,
    label: model.label,
    order: model.order,
    status: model.status,
    typeCode: typeCode.value,
    value: model.value,
  }
  if (formMode.value === 'edit' && editingRecord.value) {
    await updateDictionaryItem(editingRecord.value.id, input)
  }
  else {
    await createDictionaryItem(input)
  }
  dialogVisible.value = false
  await loadItems()
  await refreshAdminDictionaryCache(typeCode.value)
  ElMessage.success('字典项已保存')
}

async function remove(row: SchemaTableRow): Promise<void> {
  const record = toRecord(row)
  try {
    await ElMessageBox.confirm(`确定删除字典项“${record.label}”吗？`, '删除字典项', {
      cancelButtonText: '取消',
      confirmButtonText: '删除',
      type: 'warning',
    })
  }
  catch {
    return
  }
  await deleteDictionaryItem(record.id)
  await loadItems()
  await refreshAdminDictionaryCache(typeCode.value)
  ElMessage.success('字典项已删除')
}

async function refreshCache(): Promise<void> {
  refreshing.value = true
  try {
    await refreshAdminDictionaryCache(typeCode.value)
    ElMessage.success('字典缓存已刷新')
  }
  finally {
    refreshing.value = false
  }
}

onMounted(() => void loadData())
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage title="字典项" description="按字典分类维护显示标签、标准值、语义颜色和排序。" :loading="loading">
      <template #actions>
        <ElButton v-authority="adminPermissionCodes.systemDictUpdate" data-action="refresh-dictionary-cache" :disabled="!typeCode" :loading="refreshing" @click="refreshCache">
          刷新缓存
        </ElButton>
        <ElButton v-authority="adminPermissionCodes.systemDictCreate" type="primary" data-action="create-dictionary-item" :disabled="!typeCode" @click="openCreate">
          新增字典项
        </ElButton>
      </template>

      <div class="luma-dictionary-items__filter">
        <span>字典分类</span>
        <ElSelect v-model="typeCode" placeholder="请选择字典分类" @change="loadItems">
          <ElOption v-for="item in types" :key="item.code" :label="`${item.name} (${item.code})`" :value="item.code" />
        </ElSelect>
        <small>{{ currentType?.description || '选择分类后维护对应字典项' }}</small>
      </div>

      <LumaSchemaTable :columns="columns" :rows="rows" row-key="id" action-width="180">
        <template #table-color="{ value }">
          <span class="luma-dictionary-items__color"><i :style="{ backgroundColor: String(value || '#94a3b8') }" />{{ value || '-' }}</span>
        </template>
        <template #actions="{ row }">
          <ElButton v-authority="adminPermissionCodes.systemDictUpdate" data-action="edit-dictionary-item" @click="openEdit(row)">
            编辑
          </ElButton>
          <ElButton v-authority="adminPermissionCodes.systemDictDelete" type="danger" data-action="delete-dictionary-item" @click="remove(row)">
            删除
          </ElButton>
        </template>
      </LumaSchemaTable>
    </LumaPage>

    <ElDialog v-model="dialogVisible" append-to-body class="luma-admin-dialog" :title="formMode === 'edit' ? '编辑字典项' : '新增字典项'" width="720px">
      <LumaSchemaForm v-model="formModel" :mode="formMode" :schemas="schemas" :columns="2" show-actions submit-text="保存字典项" @submit="save" />
    </ElDialog>
  </main>
</template>

<style scoped lang="scss">
.luma-dictionary-items__filter { display:grid; grid-template-columns:auto minmax(240px,420px) 1fr; gap:12px; align-items:center; padding:16px; border:1px solid var(--el-border-color-lighter); border-radius:8px; background:var(--el-fill-color-extra-light); }
.luma-dictionary-items__filter > span { font-weight:600; }
.luma-dictionary-items__filter small { color:var(--el-text-color-secondary); }
.luma-dictionary-items__color { display:inline-flex; gap:8px; align-items:center; }
.luma-dictionary-items__color i { width:12px; height:12px; border-radius:3px; box-shadow:0 0 0 1px var(--el-border-color); }
@media(max-width:768px){.luma-dictionary-items__filter{grid-template-columns:1fr}.luma-dictionary-items__filter :deep(.el-select){width:100%}}
</style>
