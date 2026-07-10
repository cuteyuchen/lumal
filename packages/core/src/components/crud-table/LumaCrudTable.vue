<script setup lang="ts">
import type { PaginationChangePayload } from '../pagination'
import type { SchemaFormModel } from '../schema-form'
import type { SchemaTableRow } from '../schema-table'
import type {
  CrudFetchResult,
  CrudFormMode,
  CrudTableProps,
  CrudTableResetPayload,
  CrudTableSearchPayload,
} from './types'
import { ElButton, ElDialog } from 'element-plus'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { LumaPage } from '../page'
import { LumaPagination } from '../pagination'
import { LumaSchemaForm, normalizeSchemaFormItems, resolveSchemaFormInitialModel } from '../schema-form'
import { LumaSchemaTable } from '../schema-table'

/***********************属性定义*********************/
const props = withDefaults(defineProps<CrudTableProps>(), {
  rows: () => [],
  querySchemas: () => [],
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  pagination: true,
  loading: false,
  emptyText: '暂无数据',
  searchText: '查询',
  resetText: '重置',
  createText: '新增',
  batchDeleteText: '批量删除',
  formSchemas: () => [],
  selection: false,
  confirmRemove: () => true,
})

const emit = defineEmits<{
  (event: 'search', payload: CrudTableSearchPayload): void
  (event: 'reset', payload: CrudTableResetPayload): void
  (event: 'pageChange', payload: PaginationChangePayload): void
}>()

const queryModel = defineModel<SchemaFormModel>('queryModel', {
  default: () => ({}),
})

const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************模板引用*********************/
const crudRef = useTemplateRef<HTMLElement>('crudRef')

/***********************远程数据状态*********************/
const remoteRows = shallowRef<SchemaTableRow[]>([])
const remoteTotal = shallowRef(0)
const internalLoading = shallowRef(false)
const tableError = shallowRef('')

/***********************查询状态*********************/
const hasQuery = computed(() => props.querySchemas.length > 0)
const hasForm = computed(() => props.formSchemas.length > 0)
const hasToolbar = computed(() =>
  hasForm.value || props.selection || Boolean(props.dataSource),
)

const queryDefaultModel = computed(() => {
  const normalizedSchemas = normalizeSchemaFormItems(props.querySchemas)
  return resolveSchemaFormInitialModel(normalizedSchemas)
})

/***********************弹窗表单状态*********************/
const dialogVisible = shallowRef(false)
const formMode = shallowRef<CrudFormMode>('create')
const formModel = shallowRef<SchemaFormModel>({})
const editingRow = shallowRef<SchemaTableRow>()

const dialogTitle = computed(() => {
  const titles: Record<CrudFormMode, string> = {
    create: props.createText,
    edit: '编辑',
    view: '查看',
  }

  return titles[formMode.value]
})

/***********************表格状态*********************/
const currentRows = computed(() => props.dataSource ? remoteRows.value : props.rows)
const currentTotal = computed(() => props.dataSource ? remoteTotal.value : props.total)
const currentLoading = computed(() => props.loading || internalLoading.value)
const selectedRows = shallowRef<SchemaTableRow[]>([])

/***********************分页状态*********************/
const showPagination = computed(() => props.pagination && currentTotal.value > 0)

/***********************响应解析*********************/
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseFetchResult(response: unknown): CrudFetchResult {
  if (props.dataSource?.parseResponse) {
    return props.dataSource.parseResponse(response)
  }

  if (!isRecord(response) || !Array.isArray(response.items) || typeof response.total !== 'number') {
    return {
      items: [],
      total: 0,
    }
  }

  return {
    items: response.items as SchemaTableRow[],
    total: response.total,
  }
}

/***********************数据加载*********************/
function loadData(): Promise<void> {
  if (!props.dataSource) {
    return Promise.resolve()
  }

  internalLoading.value = true
  tableError.value = ''

  return props.dataSource.fetch({
    page: page.value,
    pageSize: pageSize.value,
    query: { ...queryModel.value },
  }).then((response) => {
    const result = parseFetchResult(response)
    remoteRows.value = result.items
    remoteTotal.value = result.total
  }).catch((error: unknown) => {
    tableError.value = error instanceof Error ? error.message : String(error)
    remoteRows.value = []
    remoteTotal.value = 0
  }).finally(() => {
    internalLoading.value = false
  })
}

watch(
  () => props.dataSource,
  () => {
    void loadData()
  },
  { immediate: true },
)

watch([page, pageSize], () => {
  void loadData()
})

/***********************事件处理*********************/
function handleSearchClick(): void {
  emit('search', {
    ...queryModel.value,
  })

  if (page.value === 1) {
    void loadData()
    return
  }

  page.value = 1
}

function handleResetClick(): void {
  const nextModel = {
    ...queryDefaultModel.value,
  }
  queryModel.value = nextModel
  emit('reset', nextModel)

  if (page.value === 1) {
    void loadData()
    return
  }

  page.value = 1
}

function handlePageChange(payload: PaginationChangePayload): void {
  emit('pageChange', payload)
}

function handleSelectionChange(rows: SchemaTableRow[]): void {
  selectedRows.value = rows
}

function openCreate(): void {
  formMode.value = 'create'
  editingRow.value = undefined
  formModel.value = {}
  dialogVisible.value = true
}

function openEdit(row: SchemaTableRow): void {
  formMode.value = 'edit'
  editingRow.value = row
  formModel.value = { ...row }
  dialogVisible.value = true
}

function openView(row: SchemaTableRow): void {
  formMode.value = 'view'
  editingRow.value = row
  formModel.value = { ...row }
  dialogVisible.value = true
}

function handleFormSubmit(model: SchemaFormModel): void {
  const source = props.dataSource

  if (!source) {
    dialogVisible.value = false
    return
  }

  const task = formMode.value === 'edit' && editingRow.value
    ? source.update?.(editingRow.value, model)
    : source.create?.(model)

  void Promise.resolve(task).then(() => {
    dialogVisible.value = false
    return loadData()
  })
}

function confirmRows(rows: SchemaTableRow[]): Promise<boolean> {
  return Promise.resolve(props.confirmRemove(rows))
}

function removeRow(row: SchemaTableRow): Promise<void> {
  if (!props.dataSource?.remove) {
    return Promise.resolve()
  }

  return confirmRows([row]).then((confirmed) => {
    if (!confirmed) {
      return undefined
    }

    return props.dataSource?.remove?.(row)
  }).then(() => loadData())
}

function removeSelectedRows(): Promise<void> {
  const rows = selectedRows.value

  if (rows.length === 0) {
    return Promise.resolve()
  }

  return confirmRows(rows).then((confirmed) => {
    if (!confirmed) {
      return undefined
    }

    if (props.dataSource?.removeMany) {
      return props.dataSource.removeMany(rows)
    }

    return Promise.all(rows.map(row => props.dataSource?.remove?.(row)))
  }).then(() => loadData())
}

/***********************公开方法*********************/
defineExpose({
  getCrudElement: () => crudRef.value,
  openCreate,
  openEdit,
  openView,
  reload: loadData,
  removeRow,
  removeSelectedRows,
})
</script>

<template>
  <div ref="crudRef" class="luma-crud-table">
    <LumaPage
      :title="title"
      :description="description"
      :loading="currentLoading"
    >
      <template v-if="hasToolbar || $slots.actions" #actions>
        <div class="luma-crud-table__toolbar">
          <slot v-if="hasForm" name="create-action" :open-create="openCreate">
            <ElButton
              type="primary"
              native-type="button"
              data-action="create"
              @click="openCreate"
            >
              {{ createText }}
            </ElButton>
          </slot>
          <ElButton
            v-if="selection"
            native-type="button"
            data-action="batch-remove"
            :disabled="selectedRows.length === 0"
            @click="removeSelectedRows"
          >
            {{ batchDeleteText }}
          </ElButton>
          <ElButton
            v-if="dataSource"
            native-type="button"
            data-action="refresh"
            @click="loadData"
          >
            刷新
          </ElButton>
          <slot name="actions" />
        </div>
      </template>

      <div v-if="hasQuery" class="luma-crud-table__query">
        <LumaSchemaForm v-model="queryModel" :schemas="querySchemas" />
        <div class="luma-crud-table__query-actions">
          <ElButton
            type="primary"
            native-type="button"
            data-action="search"
            @click="handleSearchClick"
          >
            {{ searchText }}
          </ElButton>
          <ElButton
            native-type="button"
            data-action="reset"
            @click="handleResetClick"
          >
            {{ resetText }}
          </ElButton>
        </div>
      </div>

      <div v-if="tableError" class="luma-crud-table__error">
        {{ tableError }}
      </div>

      <div class="luma-crud-table__body">
        <LumaSchemaTable
          :columns="columns"
          :rows="currentRows"
          :row-key="rowKey"
          :empty-text="emptyText"
          :loading="currentLoading"
          :selection="selection"
          @selection-change="handleSelectionChange"
        >
          <template v-if="hasForm || dataSource?.remove || $slots['row-actions']" #actions="{ row, index }">
            <slot name="row-actions" :row="row" :index="index">
              <ElButton
                v-if="hasForm"
                native-type="button"
                data-action="view"
                @click="openView(row)"
              >
                查看
              </ElButton>
              <ElButton
                v-if="hasForm"
                native-type="button"
                data-action="edit"
                @click="openEdit(row)"
              >
                编辑
              </ElButton>
              <ElButton
                v-if="dataSource?.remove"
                native-type="button"
                data-action="remove"
                @click="removeRow(row)"
              >
                删除
              </ElButton>
            </slot>
          </template>
        </LumaSchemaTable>
      </div>

      <div v-if="$slots.default" class="luma-crud-table__extra">
        <slot />
      </div>

      <div v-if="showPagination" class="luma-crud-table__pagination">
        <LumaPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="currentTotal"
          :page-sizes="pageSizes"
          @change="handlePageChange"
        />
      </div>
    </LumaPage>

    <ElDialog v-model="dialogVisible" :title="dialogTitle">
      <LumaSchemaForm
        v-model="formModel"
        :mode="formMode"
        :schemas="formSchemas"
        show-actions
        submit-text="保存"
        @submit="handleFormSubmit"
      />
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.luma-crud-table {
  min-width: 0;
}

.luma-crud-table__query {
  display: grid;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.luma-crud-table__query-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.luma-crud-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.luma-crud-table__error {
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  background: #fef2f2;
}

.luma-crud-table__body {
  min-width: 0;
}

.luma-crud-table__extra {
  min-width: 0;
}

.luma-crud-table__pagination {
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
</style>
