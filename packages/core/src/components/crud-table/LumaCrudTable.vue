<script setup lang="ts">
import type { PaginationChangePayload } from '../pagination'
import type { SchemaFormModel } from '../schema-form'
import type { SchemaTableRow } from '../schema-table'
import type {
  CrudFormMode,
  CrudStateResolver,
  CrudTableProps,
  CrudTableResetPayload,
  CrudTableSearchPayload,
} from './types'
import { ElButton, ElDialog, ElMessageBox } from 'element-plus'
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { LumaPage } from '../page'
import { LumaPagination } from '../pagination'
import { LumaSchemaForm } from '../schema-form'
import { LumaSchemaTable } from '../schema-table'
import { useCrudData } from './useCrudData'
import { useCrudDialog } from './useCrudDialog'
import { useCrudQuery } from './useCrudQuery'
import { useCrudSelection } from './useCrudSelection'

interface SchemaFormExpose {
  getFormElement: () => HTMLFormElement | undefined
  getFormInstance: () => unknown
  getValues: () => SchemaFormModel
  resetFields: () => void
  setMode: (mode: CrudFormMode) => void
  setValues: (value: SchemaFormModel) => void
  validate: () => Promise<boolean>
}

interface SchemaTableExpose {
  clearSelection: () => void
  doLayout: () => void
  getSelectedRowKeys: () => Array<number | string>
  getSelectedRows: () => SchemaTableRow[]
  getTableElement: () => HTMLElement | undefined
  getTableInstance: () => unknown
}

/***********************属性与事件*********************/
const props = withDefaults(defineProps<CrudTableProps>(), {
  rows: () => [],
  querySchemas: () => [],
  formSchemas: () => [],
  columns: () => [],
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  pagination: true,
  loading: false,
  emptyText: '暂无数据',
  searchText: '查询',
  resetText: '重置',
  createText: '新增',
  batchDeleteText: '批量删除',
  selection: false,
})

const emit = defineEmits<{
  (event: 'search', payload: CrudTableSearchPayload): void
  (event: 'reset', payload: CrudTableResetPayload): void
  (event: 'pageChange', payload: PaginationChangePayload): void
  (event: 'export', payload: { query: SchemaFormModel, selectedRows: SchemaTableRow[] }): void
  (event: 'operationError', error: unknown): void
}>()

const queryModel = defineModel<SchemaFormModel>('queryModel', { default: () => ({}) })
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************模板引用*********************/
const crudRef = useTemplateRef<HTMLElement>('crudRef')
const queryFormRef = useTemplateRef<SchemaFormExpose>('queryFormRef')
const dialogFormRef = useTemplateRef<SchemaFormExpose>('dialogFormRef')
const tableRef = useTemplateRef<SchemaTableExpose>('tableRef')

/***********************兼容配置归一化*********************/
const resolvedQuerySchemas = computed(() => props.query?.schemas ?? props.querySchemas)
const resolvedColumns = computed(() => props.table?.columns ?? props.columns)
const resolvedRowKey = computed(() => props.table?.rowKey ?? props.rowKey)
const resolvedSelection = computed(() => props.table?.selection ?? props.selection)
const resolvedEmptyText = computed(() => props.table?.emptyText ?? props.emptyText)
const queryColumns = computed(() => Math.max(1, props.query?.columns ?? 3))
const queryCollapsible = computed(() => props.query?.collapsible ?? false)
const queryDefaultCollapsed = computed(() => props.query?.defaultCollapsed ?? true)
const queryCollapsedRows = computed(() => Math.max(1, props.query?.collapsedRows ?? 1))
const paginationEnabled = computed(() => typeof props.pagination === 'object'
  ? props.pagination.enabled !== false
  : props.pagination)
const resolvedPageSizes = computed(() => typeof props.pagination === 'object'
  ? props.pagination.pageSizes ?? props.pageSizes
  : props.pageSizes)

const hasQuery = computed(() => resolvedQuerySchemas.value.length > 0)
const hasForm = computed(() => props.formSchemas.length > 0)
const showCreate = computed(() => hasForm.value && props.toolbar?.create !== false)
const showBatchDelete = computed(() => resolvedSelection.value && props.toolbar?.batchDelete !== false)
const showRefresh = computed(() => Boolean(props.dataSource) && props.toolbar?.refresh !== false)
const showExport = computed(() => props.toolbar?.export === true)
const hasToolbar = computed(() => showCreate.value || showBatchDelete.value || showRefresh.value || showExport.value)

/***********************组合状态*********************/
const dataSource = computed(() => props.dataSource)
const operationLoading = shallowRef(false)

const data = useCrudData({
  dataSource,
  loading: computed(() => props.loading),
  page,
  pageSize,
  queryModel,
  rows: computed(() => props.rows),
  total: computed(() => props.total),
})

const queryState = useCrudQuery({
  collapsedRows: queryCollapsedRows,
  collapsible: queryCollapsible,
  columns: queryColumns,
  defaultCollapsed: queryDefaultCollapsed,
  model: queryModel,
  schemas: resolvedQuerySchemas,
})

const selectionState = useCrudSelection()
const dialogState = useCrudDialog({ dataSource, afterSave: data.load })
const currentLoading = computed(() => data.currentLoading.value || operationLoading.value)
const showPagination = computed(() => paginationEnabled.value && data.currentTotal.value > 0)

const dialogTitle = computed(() => {
  const titles: Record<CrudFormMode, string> = {
    create: props.dialog?.createTitle ?? props.toolbar?.createText ?? props.createText,
    edit: props.dialog?.editTitle ?? '编辑',
    view: props.dialog?.viewTitle ?? '查看',
  }
  return titles[dialogState.mode.value]
})

watch(
  () => props.dataSource,
  () => void data.load(),
  { immediate: true },
)
watch([page, pageSize], () => void data.load())

/***********************查询与工具栏*********************/
function handleSearchClick(): void {
  emit('search', { ...queryModel.value })
  if (page.value === 1) {
    void data.load()
  }
  else {
    page.value = 1
  }
}

function handleResetClick(): void {
  const nextModel = queryState.reset()
  queryFormRef.value?.resetFields()
  emit('reset', nextModel)
  if (page.value === 1) {
    void data.load()
  }
  else {
    page.value = 1
  }
}

function handleExportClick(): void {
  emit('export', {
    query: { ...queryModel.value },
    selectedRows: [...selectionState.selectedRows.value],
  })
}

function handlePageChange(payload: PaginationChangePayload): void {
  emit('pageChange', payload)
}

/***********************行操作与弹窗*********************/
function isActionVisible(
  resolver: CrudStateResolver | undefined,
  fallback: boolean,
  row: SchemaTableRow,
  index: number,
): boolean {
  if (typeof resolver === 'function') {
    return resolver(row, index)
  }
  return resolver ?? fallback
}

function openCreate(): void {
  dialogState.open('create')
}

function openEdit(row: SchemaTableRow): void {
  dialogState.open('edit', row)
}

function openView(row: SchemaTableRow): void {
  dialogState.open('view', row)
}

async function handleFormSubmit(model: SchemaFormModel): Promise<void> {
  const valid = await dialogFormRef.value?.validate()
  if (valid === false) {
    return
  }
  const saved = await dialogState.submit(model)
  if (!saved && dialogState.error.value) {
    emit('operationError', new Error(dialogState.error.value))
  }
}

async function confirmRows(rows: SchemaTableRow[]): Promise<boolean> {
  const confirmRemove = props.actions?.confirmRemove ?? props.confirmRemove

  if (confirmRemove === false) {
    return true
  }

  if (typeof confirmRemove === 'function') {
    return confirmRemove(rows)
  }

  const message = typeof confirmRemove?.message === 'function'
    ? confirmRemove.message(rows)
    : confirmRemove?.message ?? `确定删除选中的 ${rows.length} 条数据吗？`

  try {
    await ElMessageBox.confirm(message, confirmRemove?.title ?? '删除确认', {
      cancelButtonText: confirmRemove?.cancelButtonText ?? '取消',
      confirmButtonText: confirmRemove?.confirmButtonText ?? '删除',
      type: 'warning',
    })
    return true
  }
  catch {
    return false
  }
}

async function runMutation(task: () => Promise<unknown>): Promise<boolean> {
  operationLoading.value = true
  try {
    await task()
    selectionState.clear()
    tableRef.value?.clearSelection()
    await data.load()
    return true
  }
  catch (error) {
    emit('operationError', error)
    return false
  }
  finally {
    operationLoading.value = false
  }
}

async function removeRow(row: SchemaTableRow): Promise<void> {
  const remove = props.dataSource?.remove
  if (!remove || !await confirmRows([row])) {
    return
  }
  await runMutation(() => remove(row))
}

async function removeSelectedRows(): Promise<void> {
  const rows = [...selectionState.selectedRows.value]
  if (rows.length === 0 || !await confirmRows(rows)) {
    return
  }
  await runMutation(() => props.dataSource?.removeMany
    ? props.dataSource.removeMany(rows)
    : Promise.all(rows.map(row => props.dataSource?.remove?.(row))))
}

async function requestDialogClose(): Promise<boolean> {
  if (dialogState.saving.value) {
    return false
  }
  if (!dialogState.dirty.value) {
    return true
  }
  if (props.dialog?.confirmClose) {
    return props.dialog.confirmClose({
      mode: dialogState.mode.value,
      model: dialogState.model.value,
      row: dialogState.editingRow.value,
    })
  }
  try {
    await ElMessageBox.confirm('表单内容尚未保存，确定关闭吗？', '关闭确认', {
      cancelButtonText: '继续编辑',
      confirmButtonText: '关闭',
      type: 'warning',
    })
    return true
  }
  catch {
    return false
  }
}

function handleDialogBeforeClose(done: () => void): void {
  void requestDialogClose().then((allowed) => {
    if (allowed) {
      done()
    }
  })
}

function closeDialog(): void {
  void requestDialogClose().then((allowed) => {
    if (allowed) {
      dialogState.visible.value = false
    }
  })
}

function submitDialog(): void {
  void handleFormSubmit(dialogState.model.value)
}

/***********************公开方法*********************/
defineExpose({
  clearSelection: () => {
    selectionState.clear()
    tableRef.value?.clearSelection()
  },
  getCrudElement: () => crudRef.value,
  getDialogForm: () => dialogFormRef.value,
  getQueryForm: () => queryFormRef.value,
  getSelectedRowKeys: () => [...selectionState.selectedRowKeys.value],
  getSelectedRows: () => [...selectionState.selectedRows.value],
  getTable: () => tableRef.value,
  isLoading: () => currentLoading.value,
  openCreate,
  openEdit,
  openView,
  reload: data.load,
  removeRow,
  removeSelectedRows,
  toggleQuery: queryState.toggle,
})
</script>

<template>
  <div ref="crudRef" class="luma-crud-table">
    <LumaPage class="luma-crud-table__page" :title="title" :description="description" :loading="currentLoading">
      <template v-if="hasToolbar || $slots.actions" #actions>
        <div class="luma-crud-table__toolbar">
          <slot v-if="showCreate" name="create-action" :open-create="openCreate">
            <ElButton type="primary" native-type="button" data-action="create" @click="openCreate">
              {{ toolbar?.createText ?? createText }}
            </ElButton>
          </slot>
          <ElButton
            v-if="showBatchDelete"
            native-type="button"
            data-action="batch-remove"
            :disabled="selectionState.selectedRows.value.length === 0 || operationLoading"
            @click="removeSelectedRows"
          >
            {{ toolbar?.batchDeleteText ?? batchDeleteText }}
          </ElButton>
          <ElButton v-if="showRefresh" native-type="button" data-action="refresh" @click="data.load">
            {{ toolbar?.refreshText ?? '刷新' }}
          </ElButton>
          <ElButton
            v-if="showExport"
            native-type="button"
            data-action="export"
            @click="handleExportClick"
          >
            {{ toolbar?.exportText ?? '导出' }}
          </ElButton>
          <slot name="actions" />
        </div>
      </template>

      <div v-if="hasQuery" class="luma-crud-table__query">
        <LumaSchemaForm
          ref="queryFormRef"
          v-model="queryModel"
          :schemas="queryState.visibleSchemas.value"
          :columns="queryColumns"
          :label-width="query?.labelWidth ?? 'auto'"
          class="luma-crud-table__query-form"
        />
        <div class="luma-crud-table__query-actions">
          <ElButton type="primary" native-type="button" data-action="search" @click="handleSearchClick">
            {{ query?.searchText ?? searchText }}
          </ElButton>
          <ElButton native-type="button" data-action="reset" @click="handleResetClick">
            {{ query?.resetText ?? resetText }}
          </ElButton>
          <ElButton
            v-if="queryState.canCollapse.value"
            native-type="button"
            data-action="toggle-query"
            :aria-expanded="String(!queryState.collapsed.value)"
            @click="queryState.toggle"
          >
            {{ queryState.collapsed.value ? '展开' : '收起' }}
          </ElButton>
        </div>
      </div>

      <div v-if="data.error.value" class="luma-crud-table__error" role="alert">
        <span>{{ data.error.value }}</span>
        <ElButton native-type="button" data-action="retry" @click="data.load">
          重试
        </ElButton>
      </div>

      <div class="luma-crud-table__body">
        <LumaSchemaTable
          ref="tableRef"
          :columns="resolvedColumns"
          :rows="data.currentRows.value"
          :row-key="resolvedRowKey"
          :empty-text="resolvedEmptyText"
          :loading="currentLoading"
          :selection="resolvedSelection"
          :show-column-settings="table?.showColumnSettings"
          :auto-resize="table?.autoResize ?? true"
          :action-width="table?.actionWidth"
          @selection-change="selectionState.update"
        >
          <template
            v-if="hasForm || dataSource?.remove || $slots['row-actions']"
            #actions="{ row, index }"
          >
            <slot
              name="row-actions"
              :row="row"
              :index="index"
              :open-view="openView"
              :open-edit="openEdit"
              :remove-row="removeRow"
            >
              <ElButton
                v-if="isActionVisible(actions?.view, hasForm, row, index)"
                native-type="button"
                data-action="view"
                @click="openView(row)"
              >
                {{ actions?.viewText ?? '查看' }}
              </ElButton>
              <ElButton
                v-if="isActionVisible(actions?.edit, hasForm, row, index)"
                native-type="button"
                data-action="edit"
                @click="openEdit(row)"
              >
                {{ actions?.editText ?? '编辑' }}
              </ElButton>
              <ElButton
                v-if="isActionVisible(actions?.remove, Boolean(dataSource?.remove), row, index)"
                type="danger"
                native-type="button"
                data-action="remove"
                @click="removeRow(row)"
              >
                {{ actions?.removeText ?? '删除' }}
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
          :total="data.currentTotal.value"
          :page-sizes="resolvedPageSizes"
          @change="handlePageChange"
        />
      </div>
    </LumaPage>

    <ElDialog
      v-model="dialogState.visible.value"
      :title="dialogTitle"
      :width="dialog?.width ?? 'min(920px, calc(100vw - 32px))'"
      :close-on-click-modal="dialog?.closeOnClickModal ?? false"
      :destroy-on-close="dialog?.destroyOnClose ?? true"
      :before-close="handleDialogBeforeClose"
      class="luma-crud-table__dialog"
    >
      <div v-if="dialogState.error.value" class="luma-crud-table__dialog-error" role="alert">
        {{ dialogState.error.value }}
      </div>
      <LumaSchemaForm
        ref="dialogFormRef"
        v-model="dialogState.model.value"
        :mode="dialogState.mode.value"
        :schemas="formSchemas"
        :columns="2"
        :disabled="dialogState.saving.value"
        :submit-loading="dialogState.saving.value"
        :show-actions="false"
        @submit="handleFormSubmit"
      />
      <template #footer>
        <div class="luma-crud-table__dialog-footer">
          <ElButton native-type="button" @click="closeDialog">
            {{ dialogState.mode.value === 'view' ? '关闭' : '取消' }}
          </ElButton>
          <ElButton
            v-if="dialogState.mode.value !== 'view'"
            type="primary"
            native-type="button"
            :loading="dialogState.saving.value"
            @click="submitDialog"
          >
            {{ dialog?.submitText ?? '保存' }}
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped lang="scss">
.luma-crud-table {
  width: 100%;
  min-width: 0;
}

.luma-crud-table__page {
  overflow: hidden;
}

.luma-crud-table__page :deep(.luma-page__body) {
  display: grid;
  gap: 16px;
}

.luma-crud-table__query {
  display: grid;
  gap: var(--luma-space-3, 12px);
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(8px * var(--luma-radius-scale, 1));
  background: var(--el-fill-color-extra-light);
}

.luma-crud-table__query-form :deep(.luma-schema-form__row) {
  row-gap: 14px;
}

.luma-crud-table__query-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.luma-crud-table__query-actions,
.luma-crud-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--luma-space-2, 8px);
  align-items: center;
}

.luma-crud-table__query-actions {
  justify-content: flex-end;
}

.luma-crud-table__error,
.luma-crud-table__dialog-error {
  display: flex;
  gap: var(--luma-space-3, 12px);
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-danger-dark-2);
  background: var(--el-color-danger-light-9);
}

.luma-crud-table__body,
.luma-crud-table__extra {
  width: 100%;
  min-width: 0;
}

.luma-crud-table__body {
  padding-top: 4px;
}

.luma-crud-table__pagination {
  padding-top: var(--luma-space-4, 16px);
  border-top: 1px solid var(--el-border-color-lighter);
}

.luma-crud-table__dialog-error {
  margin-bottom: var(--luma-space-4, 16px);
}

.luma-crud-table__dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:global(.luma-crud-table__dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.luma-crud-table__dialog .el-dialog__body) {
  padding: 24px;
}

:global(.luma-crud-table__dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  .luma-crud-table__query-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .luma-crud-table__query-actions :deep(.el-button) {
    min-height: 44px;
    margin-left: 0;
  }

  .luma-crud-table__toolbar :deep(.el-button) {
    min-height: 44px;
  }
}
</style>
