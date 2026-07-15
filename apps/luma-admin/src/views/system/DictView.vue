<script setup lang="ts">
import type {
  SchemaFormItem,
  SchemaFormMode,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type {
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SystemDictionaryItemRecord,
  SystemDictionaryTypeRecord,
} from '../../api/system'
import { LumaPage, LumaSchemaForm, LumaSchemaTable } from '@luma/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { adminPermissionCodes } from '../../api/permissions'
import {
  createDictionaryItem,
  createDictionaryType,
  deleteDictionaryItem,
  deleteDictionaryType,
  fetchDictionaryItems,
  fetchDictionaryTypes,
  updateDictionaryItem,
  updateDictionaryType,
} from '../../api/system'
import { refreshAdminDictionaryCache } from '../../services/dictionary'

/***********************页面状态*********************/
const dictionaryTypes = shallowRef<SystemDictionaryTypeRecord[]>([])
const dictionaryItems = shallowRef<SystemDictionaryItemRecord[]>([])
const selectedTypeCode = shallowRef('')
const loading = shallowRef(false)
const cacheRefreshing = shallowRef(false)
const cacheError = shallowRef('')

const typeDialogVisible = shallowRef(false)
const typeFormMode = shallowRef<SchemaFormMode>('create')
const editingType = shallowRef<SystemDictionaryTypeRecord>()
const typeFormModel = shallowRef<SchemaFormModel>({})

const itemDialogVisible = shallowRef(false)
const itemFormMode = shallowRef<SchemaFormMode>('create')
const editingItem = shallowRef<SystemDictionaryItemRecord>()
const itemFormModel = shallowRef<SchemaFormModel>({})

const typeRows = computed(() => dictionaryTypes.value as unknown as SchemaTableRow[])
const itemRows = computed(() => dictionaryItems.value as unknown as SchemaTableRow[])
const selectedType = computed(() => dictionaryTypes.value.find(type => type.code === selectedTypeCode.value))

/***********************Schema 配置*********************/
const typeColumns: SchemaTableColumn[] = [
  { field: 'name', label: '名称', width: 120 },
  { field: 'code', label: '编码', width: 120 },
  { dictionary: 'status', field: 'status', label: '状态', width: 90 },
]

const itemColumns: SchemaTableColumn[] = [
  { field: 'label', label: '标签', width: 120 },
  { field: 'value', label: '值', width: 140 },
  { field: 'color', label: '颜色', width: 110 },
  { field: 'order', label: '排序', width: 80 },
  { dictionary: 'status', field: 'status', label: '状态', width: 90 },
]

const typeFormSchemas: SchemaFormItem[] = [
  { component: 'input', field: 'name', label: '字典名称', required: true, span: 12 },
  {
    component: 'input',
    disabled: ({ mode }) => mode === 'edit',
    field: 'code',
    label: '字典编码',
    placeholder: '例如 status',
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
  { component: 'textarea', field: 'description', label: '说明', span: 24 },
]

const itemFormSchemas: SchemaFormItem[] = [
  { component: 'input', field: 'label', label: '标签', required: true, span: 12 },
  { component: 'input', field: 'value', label: '值', required: true, span: 12 },
  {
    component: 'input',
    field: 'color',
    label: '颜色',
    placeholder: '例如 #16a34a',
    span: 12,
  },
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
]

/***********************数据加载*********************/
async function loadTypes(): Promise<void> {
  dictionaryTypes.value = await fetchDictionaryTypes()

  if (!dictionaryTypes.value.some(type => type.code === selectedTypeCode.value)) {
    selectedTypeCode.value = dictionaryTypes.value[0]?.code ?? ''
  }
}

async function loadItems(): Promise<void> {
  dictionaryItems.value = selectedTypeCode.value
    ? await fetchDictionaryItems(selectedTypeCode.value)
    : []
}

async function loadDictionaryData(): Promise<void> {
  loading.value = true

  try {
    await loadTypes()
    await loadItems()
  }
  finally {
    loading.value = false
  }
}

async function selectType(row: SchemaTableRow): Promise<void> {
  selectedTypeCode.value = toDictionaryType(row).code
  await loadItems()
}

async function refreshDictionaryCache(typeCode: string, reload = true, notify = false): Promise<void> {
  cacheRefreshing.value = true
  cacheError.value = ''

  try {
    const refreshed = await refreshAdminDictionaryCache(typeCode, { reload })
    if (notify) {
      ElMessage.success(refreshed ? '字典缓存已刷新' : '当前环境未安装字典上下文，无需刷新')
    }
  }
  catch (error) {
    cacheError.value = error instanceof Error ? error.message : '字典缓存刷新失败'
  }
  finally {
    cacheRefreshing.value = false
  }
}

function toDictionaryType(row: SchemaTableRow): SystemDictionaryTypeRecord {
  return row as unknown as SystemDictionaryTypeRecord
}

function toDictionaryItem(row: SchemaTableRow): SystemDictionaryItemRecord {
  return row as unknown as SystemDictionaryItemRecord
}

/***********************字典类型操作*********************/
function openCreateType(): void {
  typeFormMode.value = 'create'
  editingType.value = undefined
  typeFormModel.value = { status: 'enabled' }
  typeDialogVisible.value = true
}

function openEditType(row: SchemaTableRow): void {
  const type = toDictionaryType(row)
  typeFormMode.value = 'edit'
  editingType.value = type
  typeFormModel.value = { ...type }
  typeDialogVisible.value = true
}

async function saveType(model: SchemaFormModel): Promise<void> {
  const input: SaveSystemDictionaryTypeInput = {
    code: model.code,
    description: model.description,
    name: model.name,
    status: model.status,
  }

  if (typeFormMode.value === 'edit' && editingType.value) {
    await updateDictionaryType(editingType.value.id, input)
    await refreshDictionaryCache(editingType.value.code)
  }
  else {
    const created = await createDictionaryType(input)
    selectedTypeCode.value = created.code
  }

  typeDialogVisible.value = false
  await loadDictionaryData()
  ElMessage.success('字典类型已保存')
}

async function removeType(row: SchemaTableRow): Promise<void> {
  const type = toDictionaryType(row)

  try {
    await ElMessageBox.confirm(`确定删除字典“${type.name}”及全部字典项吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }

  await deleteDictionaryType(type.id)
  await refreshDictionaryCache(type.code, false)
  await loadDictionaryData()
  ElMessage.success('字典类型已删除')
}

/***********************字典项操作*********************/
function openCreateItem(): void {
  if (!selectedTypeCode.value) {
    return
  }

  itemFormMode.value = 'create'
  editingItem.value = undefined
  itemFormModel.value = {
    order: dictionaryItems.value.length + 1,
    status: 'enabled',
  }
  itemDialogVisible.value = true
}

function openEditItem(row: SchemaTableRow): void {
  const item = toDictionaryItem(row)
  itemFormMode.value = 'edit'
  editingItem.value = item
  itemFormModel.value = { ...item }
  itemDialogVisible.value = true
}

async function saveItem(model: SchemaFormModel): Promise<void> {
  const input: SaveSystemDictionaryItemInput = {
    color: model.color,
    label: model.label,
    order: model.order,
    status: model.status,
    typeCode: selectedTypeCode.value,
    value: model.value,
  }

  if (itemFormMode.value === 'edit' && editingItem.value) {
    await updateDictionaryItem(editingItem.value.id, input)
  }
  else {
    await createDictionaryItem(input)
  }

  itemDialogVisible.value = false
  await loadItems()
  await refreshDictionaryCache(selectedTypeCode.value)
  ElMessage.success('字典项已保存')
}

async function removeItem(row: SchemaTableRow): Promise<void> {
  const item = toDictionaryItem(row)
  await deleteDictionaryItem(item.id)
  await loadItems()
  await refreshDictionaryCache(selectedTypeCode.value)
  ElMessage.success('字典项已删除')
}

onMounted(() => {
  void loadDictionaryData()
})
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="字典管理"
      description="统一维护字典类型和字典项，保存后会刷新全局字典缓存。"
      :loading="loading"
    >
      <ElAlert
        v-if="cacheError"
        class="luma-admin-page__operation-error"
        :title="cacheError"
        type="error"
        show-icon
        :closable="false"
      />
      <div class="luma-dictionary-manager">
        <section class="luma-dictionary-manager__types">
          <header class="luma-dictionary-manager__header">
            <strong>字典类型</strong>
            <ElButton
              v-authority="adminPermissionCodes.systemDictCreate"
              type="primary"
              native-type="button"
              data-action="create-dictionary-type"
              @click="openCreateType"
            >
              新增类型
            </ElButton>
          </header>
          <LumaSchemaTable :columns="typeColumns" :rows="typeRows" row-key="id" action-width="190">
            <template #actions="{ row }">
              <ElButton native-type="button" data-action="select-dictionary-type" @click="selectType(row)">
                字典项
              </ElButton>
              <ElButton
                v-authority="adminPermissionCodes.systemDictUpdate"
                native-type="button"
                data-action="edit-dictionary-type"
                @click="openEditType(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-authority="adminPermissionCodes.systemDictDelete"
                type="danger"
                native-type="button"
                data-action="delete-dictionary-type"
                @click="removeType(row)"
              >
                删除
              </ElButton>
            </template>
          </LumaSchemaTable>
        </section>

        <section class="luma-dictionary-manager__items">
          <header class="luma-dictionary-manager__header">
            <div>
              <strong>字典项</strong>
              <span>{{ selectedType?.name ?? '请选择字典类型' }}</span>
            </div>
            <div class="luma-dictionary-manager__actions">
              <ElButton
                v-authority="adminPermissionCodes.systemDictUpdate"
                native-type="button"
                data-action="refresh-dictionary-cache"
                :disabled="!selectedTypeCode"
                :loading="cacheRefreshing"
                @click="refreshDictionaryCache(selectedTypeCode, true, true)"
              >
                刷新缓存
              </ElButton>
              <ElButton
                v-authority="adminPermissionCodes.systemDictCreate"
                type="primary"
                native-type="button"
                data-action="create-dictionary-item"
                :disabled="!selectedTypeCode"
                @click="openCreateItem"
              >
                新增字典项
              </ElButton>
            </div>
          </header>
          <LumaSchemaTable :columns="itemColumns" :rows="itemRows" row-key="id" action-width="150">
            <template #actions="{ row }">
              <ElButton
                v-authority="adminPermissionCodes.systemDictUpdate"
                native-type="button"
                data-action="edit-dictionary-item"
                @click="openEditItem(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-authority="adminPermissionCodes.systemDictDelete"
                type="danger"
                native-type="button"
                data-action="delete-dictionary-item"
                @click="removeItem(row)"
              >
                删除
              </ElButton>
            </template>
          </LumaSchemaTable>
        </section>
      </div>
    </LumaPage>

    <ElDialog v-model="typeDialogVisible" :title="typeFormMode === 'edit' ? '编辑字典类型' : '新增字典类型'" width="680px">
      <LumaSchemaForm
        v-model="typeFormModel"
        :mode="typeFormMode"
        :schemas="typeFormSchemas"
        show-actions
        submit-text="保存"
        @submit="saveType"
      />
    </ElDialog>

    <ElDialog v-model="itemDialogVisible" :title="itemFormMode === 'edit' ? '编辑字典项' : '新增字典项'" width="680px">
      <LumaSchemaForm
        v-model="itemFormModel"
        :mode="itemFormMode"
        :schemas="itemFormSchemas"
        show-actions
        submit-text="保存"
        @submit="saveItem"
      />
    </ElDialog>
  </main>
</template>

<style scoped lang="scss">
.luma-dictionary-manager {
  display: grid;
  grid-template-columns: minmax(360px, 0.85fr) minmax(520px, 1.15fr);
  gap: 16px;
}

.luma-dictionary-manager__types,
.luma-dictionary-manager__items {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}

.luma-dictionary-manager__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.luma-dictionary-manager__header span {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
}

.luma-dictionary-manager__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1100px) {
  .luma-dictionary-manager {
    grid-template-columns: 1fr;
  }
}
</style>
