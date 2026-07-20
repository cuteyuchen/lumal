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
  CrudToolbarSlotProps,
} from './types'
import { LumalIcon } from '@lumal/icons-vue'
import { ElButton, ElMessageBox } from 'element-plus'
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { LumalPagination } from '../pagination'
import { LumalSchemaForm } from '../schema-form'
import { LumalSchemaTable } from '../schema-table'
import LumalCrudEditor from './LumalCrudEditor.vue'
import { deriveCrudFormSchemas } from './schema'
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
  getExportData: (rows?: SchemaTableRow[]) => {
    columns: Array<{ field: string, label: string }>
    rows: string[][]
  }
  getTableElement: () => HTMLElement | undefined
  getTableInstance: () => unknown
}

type CrudTableSlots = {
  [name in `form-${string}`]?: (props: Record<string, unknown>) => unknown
} & {
  [name in `query-${string}`]?: (props: Record<string, unknown>) => unknown
} & {
  [name in `table-${string}`]?: (props: Record<string, unknown>) => unknown
} & {
  'actions'?: () => unknown
  'create-action'?: (props: Pick<CrudToolbarSlotProps, 'openCreate'>) => unknown
  'default'?: () => unknown
  'footer'?: (props: {
    close: () => void
    mode: CrudFormMode
    model: SchemaFormModel
    submit: () => void
  }) => unknown
  'row-actions'?: (props: {
    index: number
    openEdit: (row: SchemaTableRow) => void
    openView: (row: SchemaTableRow) => void
    removeRow: (row: SchemaTableRow) => Promise<void>
    row: SchemaTableRow
  }) => unknown
  'table-title'?: () => unknown
  'toolbar-actions'?: (props: CrudToolbarSlotProps) => unknown
  'toolbar-tools'?: (props: {
    reload: () => Promise<void>
    toggleFullscreen: () => Promise<void>
  }) => unknown
}

type QueryViewportMode = 'desktop' | 'mobile'

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

defineSlots<CrudTableSlots>()

const queryModel = defineModel<SchemaFormModel>('queryModel', { default: () => ({}) })
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 10 })

/***********************模板引用*********************/
const crudRef = useTemplateRef<HTMLElement>('crudRef')
const queryRef = useTemplateRef<HTMLElement>('queryRef')
const queryFormRef = useTemplateRef<SchemaFormExpose>('queryFormRef')
const dialogFormRef = useTemplateRef<SchemaFormExpose>('dialogFormRef')
const tableRef = useTemplateRef<SchemaTableExpose>('tableRef')

/***********************兼容配置归一化*********************/
const resolvedQuerySchemas = computed(() => props.query?.schemas ?? props.querySchemas)
const resolvedAllColumns = computed(() => props.table?.columns ?? props.columns)
const resolvedColumns = computed(() => resolvedAllColumns.value.filter(column => column.showInTable !== false))
const resolvedFormSchemas = computed(() => deriveCrudFormSchemas(resolvedAllColumns.value, props.formSchemas))
const resolvedRowKey = computed(() => props.table?.rowKey ?? props.rowKey)
const resolvedSelection = computed(() => props.table?.selection ?? props.selection)
const resolvedEmptyText = computed(() => props.table?.emptyText ?? props.emptyText)
const responsiveQueryColumns = shallowRef(3)
const queryColumns = computed(() => Math.max(1, props.query?.columns ?? responsiveQueryColumns.value))
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
const hasForm = computed(() => resolvedFormSchemas.value.length > 0)
const showCreate = computed(() => hasForm.value && props.toolbar?.create !== false)
const showBatchDelete = computed(() => resolvedSelection.value && props.toolbar?.batchDelete !== false)
const showRefresh = computed(() => Boolean(props.dataSource) && props.toolbar?.refresh !== false)
const showExport = computed(() => Boolean(props.toolbar?.export))
const showFullscreen = computed(() => props.toolbar?.fullscreen !== false)
const showQueryToggle = computed(() => hasQuery.value && props.toolbar?.queryToggle !== false)
const hasToolbarActions = computed(() => showCreate.value || showBatchDelete.value || showExport.value)
const hasToolbarTools = computed(() => showQueryToggle.value || showRefresh.value || showFullscreen.value)

/***********************组合状态*********************/
const initialMobileViewport = typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(max-width: 768px)').matches
const initialQueryVisibility = {
  desktop: props.query?.defaultVisible ?? true,
  mobile: props.query?.mobileDefaultVisible ?? props.query?.defaultVisible ?? true,
}
const dataSource = computed(() => props.dataSource)
const operationLoading = shallowRef(false)
const isFullscreen = shallowRef(false)
const isMobileViewport = shallowRef(initialMobileViewport)
const queryViewportMode = computed<QueryViewportMode>(() => isMobileViewport.value ? 'mobile' : 'desktop')
const queryVisibilityByMode = shallowRef<Record<QueryViewportMode, boolean>>(initialQueryVisibility)
const queryPanelVisible = shallowRef(initialQueryVisibility[initialMobileViewport ? 'mobile' : 'desktop'])
let querySubmitTimer: ReturnType<typeof setTimeout> | undefined
let queryResizeObserver: ResizeObserver | undefined
let mobileMediaQuery: MediaQueryList | undefined

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

const editorTitle = computed(() => {
  const titles: Record<CrudFormMode, string> = {
    create: props.editor?.createTitle ?? props.toolbar?.createText ?? props.createText,
    edit: props.editor?.editTitle ?? '编辑',
    view: props.editor?.viewTitle ?? '查看',
  }
  return titles[dialogState.mode.value]
})

watch(
  () => props.dataSource,
  () => void data.load(),
  { immediate: true },
)
watch([page, pageSize], () => void data.load())

function handleFullscreenChange(): void {
  isFullscreen.value = typeof document !== 'undefined' && document.fullscreenElement === crudRef.value
}

function updateResponsiveQueryColumns(width: number): void {
  if (props.query?.columns !== undefined || width <= 0) {
    return
  }
  const columns = width >= 1280 ? 4 : width >= 960 ? 3 : width >= 640 ? 2 : 1
  if (responsiveQueryColumns.value !== columns) {
    responsiveQueryColumns.value = columns
  }
}

function setupQueryResizeObserver(): void {
  queryResizeObserver?.disconnect()
  queryResizeObserver = undefined
  if (!queryRef.value) {
    return
  }
  updateResponsiveQueryColumns(queryRef.value.clientWidth)
  if (typeof ResizeObserver === 'undefined') {
    return
  }
  queryResizeObserver = new ResizeObserver(entries => updateResponsiveQueryColumns(entries[0]?.contentRect.width ?? 0))
  queryResizeObserver.observe(queryRef.value)
}

function syncMobileViewport(matches: boolean): void {
  if (isMobileViewport.value === matches) {
    return
  }

  isMobileViewport.value = matches
  queryPanelVisible.value = queryVisibilityByMode.value[queryViewportMode.value]
  void nextTick(() => {
    if (queryPanelVisible.value) {
      setupQueryResizeObserver()
    }
    else {
      queryResizeObserver?.disconnect()
    }
    tableRef.value?.doLayout()
  })
}

function handleMobileViewportChange(event: MediaQueryListEvent): void {
  syncMobileViewport(event.matches)
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mobileMediaQuery = window.matchMedia('(max-width: 768px)')
    syncMobileViewport(mobileMediaQuery.matches)
    mobileMediaQuery.addEventListener?.('change', handleMobileViewportChange)
  }
  setupQueryResizeObserver()
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }
  mobileMediaQuery?.removeEventListener?.('change', handleMobileViewportChange)
  queryResizeObserver?.disconnect()
  if (querySubmitTimer) {
    clearTimeout(querySubmitTimer)
  }
})

watch(() => props.query?.columns, (columns) => {
  if (columns === undefined) {
    updateResponsiveQueryColumns(queryRef.value?.clientWidth ?? 0)
  }
})
watch(
  [() => props.query?.defaultVisible, () => props.query?.mobileDefaultVisible],
  ([defaultVisible, mobileDefaultVisible]) => {
    queryVisibilityByMode.value = {
      desktop: defaultVisible ?? true,
      mobile: mobileDefaultVisible ?? defaultVisible ?? true,
    }
    queryPanelVisible.value = queryVisibilityByMode.value[queryViewportMode.value]
  },
)

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

function handleQueryValuesChange(): void {
  if (!props.query?.submitOnChange) {
    return
  }
  if (querySubmitTimer) {
    clearTimeout(querySubmitTimer)
  }
  querySubmitTimer = setTimeout(handleSearchClick, Math.max(0, props.query.submitDebounce ?? 300))
}

async function handleExportClick(): Promise<void> {
  const selectedRows = [...selectionState.selectedRows.value]
  const exportRows = selectedRows.length > 0 ? selectedRows : data.currentRows.value
  const context = {
    columns: resolvedColumns.value,
    query: { ...queryModel.value },
    rows: exportRows,
    selectedRows,
  }
  emit('export', { query: context.query, selectedRows })

  const exportConfig = typeof props.toolbar?.export === 'object' ? props.toolbar.export : undefined
  if (exportConfig?.handler) {
    await exportConfig.handler(context)
    return
  }

  const exportData = tableRef.value?.getExportData(exportRows)
  if (
    !exportData
    || typeof document === 'undefined'
    || typeof URL === 'undefined'
    || (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('jsdom'))
  ) {
    return
  }
  const escapeCell = (value: string): string => `"${value.replace(/"/g, '""')}"`
  const csv = [
    exportData.columns.map(column => escapeCell(column.label)).join(','),
    ...exportData.rows.map(row => row.map(escapeCell).join(',')),
  ].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportConfig?.filename ?? `lumal-export-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

async function toggleFullscreen(): Promise<void> {
  if (!crudRef.value || typeof document === 'undefined') {
    return
  }
  try {
    if (document.fullscreenElement === crudRef.value) {
      await document.exitFullscreen?.()
    }
    else {
      await crudRef.value.requestFullscreen?.()
    }
  }
  catch (error) {
    emit('operationError', error)
  }
}

function handlePageChange(payload: PaginationChangePayload): void {
  emit('pageChange', payload)
}

function toggleQueryPanel(): void {
  queryPanelVisible.value = !queryPanelVisible.value
  queryVisibilityByMode.value = {
    ...queryVisibilityByMode.value,
    [queryViewportMode.value]: queryPanelVisible.value,
  }
  if (queryPanelVisible.value) {
    void nextTick(() => {
      setupQueryResizeObserver()
      tableRef.value?.doLayout()
    })
    return
  }
  queryResizeObserver?.disconnect()
  void nextTick(() => tableRef.value?.doLayout())
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
  const saved = await dialogState.submit(model, async () => {
    const valid = await dialogFormRef.value?.validate()
    return valid !== false
  })
  if (!saved && dialogState.error.value) {
    emit('operationError', new Error(dialogState.error.value))
  }
}

async function confirmRows(rows: SchemaTableRow[]): Promise<boolean> {
  const confirmRemove = props.actions?.confirmRemove

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
    clearSelection()
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
  const beforeAllowed = props.dataSource?.beforeRemove
    ? await props.dataSource.beforeRemove([row])
    : true
  if (!remove || !beforeAllowed || !await confirmRows([row])) {
    return
  }
  await runMutation(() => remove(row))
}

async function removeSelectedRows(): Promise<void> {
  const rows = [...selectionState.selectedRows.value]
  const beforeAllowed = props.dataSource?.beforeRemove
    ? await props.dataSource.beforeRemove(rows)
    : true
  if (rows.length === 0 || !beforeAllowed || !await confirmRows(rows)) {
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
  if (props.editor?.confirmClose) {
    return props.editor.confirmClose({
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

function handleEditorBeforeClose(done: () => void): void {
  void requestDialogClose().then((allowed) => {
    if (allowed) {
      done()
    }
  })
}

function closeEditor(): void {
  void requestDialogClose().then((allowed) => {
    if (allowed) {
      dialogState.visible.value = false
    }
  })
}

function submitEditor(): void {
  void handleFormSubmit(dialogState.model.value)
}

function clearSelection(): void {
  selectionState.clear()
  tableRef.value?.clearSelection()
}

/***********************公开方法*********************/
defineExpose({
  clearSelection,
  getCrudElement: () => crudRef.value,
  closeEditor,
  getEditorForm: () => dialogFormRef.value,
  getQueryForm: () => queryFormRef.value,
  getSelectedRowKeys: () => [...selectionState.selectedRowKeys.value],
  getSelectedRows: () => [...selectionState.selectedRows.value],
  getTable: () => tableRef.value,
  isLoading: () => currentLoading.value,
  openCreate,
  openEdit,
  openView,
  query: handleSearchClick,
  reset: handleResetClick,
  reload: data.load,
  removeRow,
  removeSelectedRows,
  setFormData: (value: SchemaFormModel) => dialogFormRef.value?.setValues(value),
  toggleFullscreen,
  toggleQuery: queryState.toggle,
  toggleQueryPanel,
})
</script>

<template>
  <div ref="crudRef" class="lumal-crud-table">
    <div
      v-if="hasQuery"
      v-show="queryPanelVisible"
      ref="queryRef"
      class="lumal-crud-table__query"
      :class="{ 'is-collapsed': queryState.collapsed.value }"
    >
      <LumalSchemaForm
        ref="queryFormRef"
        v-model="queryModel"
        :schemas="queryState.visibleSchemas.value"
        :columns="queryColumns"
        :label-width="query?.labelWidth ?? 88"
        class="lumal-crud-table__query-form"
        @values-change="handleQueryValuesChange"
      >
        <template
          v-for="schema in queryState.visibleSchemas.value.filter(item => $slots[`query-${String(item.field)}`])"
          :key="String(schema.field)"
          #[`field-${String(schema.field)}`]="scope"
        >
          <slot :name="`query-${String(schema.field)}`" v-bind="scope" />
        </template>
      </LumalSchemaForm>
      <div class="lumal-crud-table__query-actions">
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

    <div v-if="data.error.value" class="lumal-crud-table__error" role="alert">
      <span>{{ data.error.value }}</span>
      <ElButton native-type="button" data-action="retry" @click="data.load">
        重试
      </ElButton>
    </div>

    <section class="lumal-crud-table__table-panel">
      <div class="lumal-crud-table__body">
        <LumalSchemaTable
          ref="tableRef"
          :columns="resolvedColumns"
          :rows="data.currentRows.value"
          :row-key="resolvedRowKey"
          :empty-text="resolvedEmptyText"
          :loading="currentLoading"
          :selection="resolvedSelection"
          :show-column-settings="table?.showColumnSettings"
          :column-settings="table?.columnSettings"
          :auto-resize="table?.autoResize ?? true"
          :action-width="table?.actionWidth"
          :mobile-action-width="table?.mobileActionWidth"
          :table-props="{ height: '100%', border: true }"
          @selection-change="selectionState.update"
        >
          <template v-if="$slots['table-title'] || title" #toolbar-title>
            <slot name="table-title">
              {{ title }}
            </slot>
          </template>
          <template v-if="hasToolbarActions || $slots.actions || $slots['toolbar-actions']" #toolbar>
            <div
              class="lumal-crud-table__toolbar"
              :class="`is-${toolbar?.actionsPosition ?? 'right'}`"
            >
              <slot v-if="showCreate" name="create-action" :open-create="openCreate">
                <ElButton type="primary" native-type="button" data-action="create" @click="openCreate">
                  <LumalIcon name="lumal:plus" />
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
              <ElButton v-if="showExport" native-type="button" data-action="export" @click="handleExportClick">
                {{ toolbar?.exportText ?? '导出' }}
              </ElButton>
              <slot
                name="toolbar-actions"
                :reload="data.load"
                :open-create="openCreate"
                :selected-rows="selectionState.selectedRows.value"
                :selected-row-keys="selectionState.selectedRowKeys.value"
                :clear-selection="clearSelection"
              />
              <slot name="actions" />
            </div>
          </template>
          <template v-if="hasToolbarTools || $slots['toolbar-tools']" #toolbar-tools>
            <div class="lumal-crud-table__toolbar-tools">
              <slot name="toolbar-tools" :reload="data.load" :toggle-fullscreen="toggleFullscreen" />
              <ElButton
                v-if="showQueryToggle"
                circle
                native-type="button"
                data-action="toggle-query-panel"
                :class="{ 'is-active': queryPanelVisible }"
                :aria-expanded="String(queryPanelVisible)"
                :aria-label="queryPanelVisible ? '隐藏筛选条件' : '显示筛选条件'"
                :title="queryPanelVisible ? '隐藏筛选条件' : '显示筛选条件'"
                @click="toggleQueryPanel"
              >
                <LumalIcon name="lumal:filter" />
              </ElButton>
              <ElButton
                v-if="showRefresh"
                circle
                native-type="button"
                data-action="refresh"
                :aria-label="toolbar?.refreshText ?? '刷新'"
                :title="toolbar?.refreshText ?? '刷新'"
                @click="data.load"
              >
                <LumalIcon name="lumal:refresh" />
              </ElButton>
              <ElButton
                v-if="showFullscreen"
                circle
                native-type="button"
                data-action="fullscreen"
                :aria-label="toolbar?.fullscreenText ?? (isFullscreen ? '退出全屏' : '全屏')"
                :title="toolbar?.fullscreenText ?? (isFullscreen ? '退出全屏' : '全屏')"
                @click="toggleFullscreen"
              >
                <LumalIcon :name="isFullscreen ? 'lumal:fullscreen-exit' : 'lumal:fullscreen'" />
              </ElButton>
            </div>
          </template>
          <template
            v-for="column in resolvedColumns.filter(item => $slots[`table-${String(item.field)}`])"
            :key="String(column.field)"
            #[`table-${String(column.field)}`]="scope"
          >
            <slot :name="`table-${String(column.field)}`" v-bind="scope" />
          </template>
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
        </LumalSchemaTable>
      </div>

      <div v-if="$slots.default" class="lumal-crud-table__extra">
        <slot />
      </div>

      <div v-if="showPagination" class="lumal-crud-table__pagination">
        <LumalPagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :total="data.currentTotal.value"
          :page-sizes="resolvedPageSizes"
          @change="handlePageChange"
        />
      </div>
    </section>

    <LumalCrudEditor
      v-model="dialogState.visible.value"
      :title="editorTitle"
      :type="editor?.type ?? 'dialog'"
      :width="editor?.width ?? (editor?.type === 'drawer' ? 'min(720px, 92vw)' : 'min(920px, calc(100vw - 32px))')"
      :close-on-click-modal="editor?.closeOnClickModal ?? false"
      :destroy-on-close="editor?.destroyOnClose ?? true"
      :before-close="handleEditorBeforeClose"
    >
      <div v-if="dialogState.error.value" class="lumal-crud-table__dialog-error" role="alert">
        {{ dialogState.error.value }}
      </div>
      <LumalSchemaForm
        ref="dialogFormRef"
        v-model="dialogState.model.value"
        :mode="dialogState.mode.value"
        :schemas="resolvedFormSchemas"
        :columns="editor?.columns ?? 2"
        :label-width="editor?.labelWidth ?? 88"
        :loading="editor?.loading"
        :disabled="dialogState.saving.value || editor?.disabled"
        :submit-loading="dialogState.saving.value"
        :show-actions="false"
        @submit="handleFormSubmit"
      >
        <template
          v-for="schema in resolvedFormSchemas.filter(item => $slots[`form-${String(item.field)}`])"
          :key="String(schema.field)"
          #[`field-${String(schema.field)}`]="scope"
        >
          <slot :name="`form-${String(schema.field)}`" v-bind="scope" />
        </template>
      </LumalSchemaForm>
      <template #footer>
        <slot
          name="footer" :mode="dialogState.mode.value" :model="dialogState.model.value" :close="closeEditor"
          :submit="submitEditor"
        >
          <div class="lumal-crud-table__dialog-footer">
            <ElButton native-type="button" @click="closeEditor">
              {{ dialogState.mode.value === 'view' ? '关闭' : '取消' }}
            </ElButton>
            <ElButton
              v-if="dialogState.mode.value !== 'view'"
              type="primary"
              native-type="button"
              :loading="dialogState.saving.value"
              @click="submitEditor"
            >
              {{ editor?.submitText ?? '保存' }}
            </ElButton>
          </div>
        </slot>
      </template>
    </LumalCrudEditor>
  </div>
</template>

<style scoped lang="scss">
.lumal-crud-table {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.lumal-crud-table:fullscreen {
  box-sizing: border-box;
  height: 100dvh;
  padding: 16px;
  overflow: auto;
  background: var(--el-bg-color-page);
}

.lumal-crud-table__query {
  display: grid;
  flex: none;
  gap: var(--lumal-space-3, 12px);
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(8px * var(--lumal-radius-scale, 1));
  background: var(--el-fill-color-light);
}

.lumal-crud-table__query-form :deep(.lumal-schema-form__row) {
  row-gap: 14px;
}

.lumal-crud-table__query-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.lumal-crud-table__query-actions,
.lumal-crud-table__toolbar,
.lumal-crud-table__toolbar-tools {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: var(--lumal-space-2, 8px);
  align-items: center;
}

.lumal-crud-table__toolbar {
  width: 100%;
  justify-content: flex-start;
}

.lumal-crud-table__toolbar.is-right {
  justify-content: flex-end;
}

.lumal-crud-table__toolbar-tools {
  flex: none;
  justify-content: flex-end;
}

.lumal-crud-table__toolbar-tools :deep([data-action="toggle-query-panel"].is-active) {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.lumal-crud-table__query-actions {
  justify-content: flex-end;
}

.lumal-crud-table__error,
.lumal-crud-table__dialog-error {
  display: flex;
  gap: var(--lumal-space-3, 12px);
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: var(--el-border-radius-base);
  color: var(--el-color-danger-dark-2);
  background: var(--el-color-danger-light-9);
}

.lumal-crud-table__table-panel,
.lumal-crud-table__body,
.lumal-crud-table__extra {
  width: 100%;
  min-width: 0;
}

.lumal-crud-table__table-panel {
  box-sizing: border-box;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: calc(8px * var(--lumal-radius-scale, 1));
  background: var(--el-bg-color);
}

.lumal-crud-table__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
}

.lumal-crud-table__body :deep(.lumal-schema-table) {
  height: 100%;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
}

.lumal-crud-table__body :deep(.lumal-schema-table__scroll) {
  height: 100%;
  min-height: 0;
}

.lumal-crud-table__pagination {
  flex: none;
  min-width: 0;
  padding-top: 12px;
}

@media (min-width: 960px) {
  .lumal-crud-table__query.is-collapsed {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .lumal-crud-table__query.is-collapsed .lumal-crud-table__query-actions {
    align-self: end;
    white-space: nowrap;
  }
}

.lumal-crud-table__dialog-error {
  margin-bottom: var(--lumal-space-4, 16px);
}

.lumal-crud-table__dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:global(.lumal-crud-table__dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.lumal-crud-table__dialog .el-dialog__body) {
  padding: 24px;
}

:global(.lumal-crud-table__dialog .el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
  /* 移动端改为内容自然撑开，由外层 LumalContent 滚动，避免 height:100% + overflow:hidden 截断 */
  .lumal-crud-table {
    height: auto;
    max-height: none;
    gap: 12px;
    overflow: visible;
  }

  .lumal-crud-table__query {
    gap: 10px;
    padding: 12px;
  }

  .lumal-crud-table__query-form :deep(.lumal-schema-form__row) {
    row-gap: 10px;
  }

  .lumal-crud-table__table-panel {
    flex: 0 0 auto;
    padding: 12px;
  }

  .lumal-crud-table__body {
    flex: 0 0 auto;
    min-height: 0;
  }

  .lumal-crud-table__body :deep(.lumal-schema-table) {
    height: auto;
    min-height: 0;
    grid-template-rows: auto auto;
  }

  .lumal-crud-table__body :deep(.lumal-schema-table__scroll) {
    height: auto;
    min-height: 160px;
    max-height: min(56dvh, 480px);
    overflow: auto;
  }

  .lumal-crud-table__query-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .lumal-crud-table__query-actions :deep(.el-button) {
    min-height: 32px;
    margin-left: 0;
  }

  .lumal-crud-table__query-actions :deep([data-action="toggle-query"]) {
    grid-column: 1 / -1;
  }

  .lumal-crud-table__toolbar :deep(.el-button) {
    min-height: 32px;
    margin-left: 0;
  }

  .lumal-crud-table__toolbar-tools :deep(.el-button) {
    margin-left: 0;
  }

  :global(.lumal-crud-table__dialog.el-dialog) {
    display: flex;
    width: calc(100vw - 24px) !important;
    max-height: calc(100dvh - 24px);
    flex-direction: column;
    margin: 12px auto;
  }

  :global(.lumal-crud-table__dialog .el-dialog__header) {
    padding: 12px;
  }

  :global(.lumal-crud-table__dialog .el-dialog__body) {
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
  }

  :global(.lumal-crud-table__dialog .el-dialog__footer) {
    padding: 10px 12px 12px;
  }

  .lumal-crud-table__dialog-footer :deep(.el-button) {
    min-height: 32px;
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .lumal-crud-table__dialog-footer :deep(.el-button) {
    flex: 1 1 0;
  }
}
</style>
