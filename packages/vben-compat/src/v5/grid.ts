import type { SchemaTableColumn, SchemaTableRow, SchemaTableSortChangePayload } from '@lumal/core/components'
import type { UseVbenVxeGridReturn, V5NativeGrid, V5QueryParams, V5Values, VxeGridApi, VxeGridProps, VxeTableGridOptions } from './types'
import { computed, defineComponent, h, onScopeDispose, shallowRef } from 'vue'
import { useVbenForm } from './form'
import { assertComponentAttrs, assertSupported } from './utils'
import V5Grid from './V5Grid.vue'

export interface NativeTable {
  getSelectedRows: () => SchemaTableRow[]
  clearSelection: () => void
  toggleRowSelection: (row: SchemaTableRow, checked: boolean) => void
}
function checkOptions(state: VxeGridProps): void {
  assertSupported(state, ['gridOptions', 'formOptions', 'tableTitle', 'showSearchForm', 'gridEvents'], 'Grid')
  const grid = state.gridOptions ?? {}
  assertSupported(grid, ['columns', 'data', 'rowConfig', 'pagerConfig', 'proxyConfig', 'toolbarConfig', 'loading', 'height', 'border', 'stripe', 'showOverflow'], 'gridOptions')
  if (grid.toolbarConfig)
    assertSupported(grid.toolbarConfig, ['custom', 'refresh', 'search'], 'toolbarConfig')
  if (grid.rowConfig)
    assertSupported(grid.rowConfig, ['keyField'], 'rowConfig')
  if (grid.pagerConfig)
    assertSupported(grid.pagerConfig, ['enabled', 'pageSize', 'currentPage', 'pageSizes'], 'pagerConfig')
  if (grid.proxyConfig) {
    assertSupported(grid.proxyConfig, ['autoLoad', 'response', 'ajax'], 'proxyConfig')
    if (grid.proxyConfig.response)
      assertSupported(grid.proxyConfig.response, ['result', 'total'], 'proxyConfig.response')
    if (grid.proxyConfig.ajax)
      assertSupported(grid.proxyConfig.ajax, ['query'], 'proxyConfig.ajax')
  }
  if (state.gridEvents)
    assertSupported(state.gridEvents, ['checkboxChange', 'sortChange', 'pageChange', 'proxyQuery', 'proxyQueryError'], 'gridEvents')
  for (const column of grid.columns ?? []) {
    assertSupported(column, ['field', 'title', 'type', 'width', 'minWidth', 'fixed', 'align', 'visible', 'sortable', 'showOverflow', 'slots', 'formatter'], 'column')
    if (column.type && !['checkbox', 'seq'].includes(column.type))
      throw new Error(`[lumal/v5] 不支持的列类型：${column.type}`)
    if (column.formatter && typeof column.formatter !== 'function')
      throw new Error('[lumal/v5] formatter 请使用函数，VXE 全局 renderer/formatter 不可用')
    if (column.slots)
      assertSupported(column.slots, ['default'], 'column.slots')
  }
}
function readPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) =>
    current && typeof current === 'object' ? (current as V5Values)[key] : undefined, value)
}
function parsePage(value: unknown, grid: VxeTableGridOptions) {
  const rows = Array.isArray(value) ? value : readPath(value, grid.proxyConfig?.response?.result ?? 'items')
  const total = Array.isArray(value) ? value.length : readPath(value, grid.proxyConfig?.response?.total ?? 'total')
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))
    || typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
    throw new Error('[lumal/v5] 查询结果必须是数组或 { items, total }，其他格式请配置 proxyConfig.response')
  }
  return { rows: rows as SchemaTableRow[], total }
}
export type GridController = ReturnType<typeof createGridController>

/***********************查询状态与生命周期*********************/
function createGridController(options: VxeGridProps) {
  checkOptions(options)
  const state = shallowRef<VxeGridProps>({ showSearchForm: true, ...options })
  const rows = shallowRef<SchemaTableRow[]>(options.gridOptions?.data ?? [])
  const total = shallowRef(rows.value.length)
  const page = shallowRef(options.gridOptions?.pagerConfig ? options.gridOptions.pagerConfig.currentPage ?? 1 : 1)
  const pageSize = shallowRef(options.gridOptions?.pagerConfig ? options.gridOptions.pagerConfig.pageSize ?? 10 : 10)
  const loading = shallowRef(false)
  const failure = shallowRef<unknown>()
  const sort = shallowRef<V5QueryParams['sort']>({})
  let native: NativeTable | undefined
  let generation = 0
  let mounted = false
  let disposed = false
  const [Form, formApi] = useVbenForm({
    ...options.formOptions,
    showDefaultActions: true,
    submitButtonOptions: { content: '查询', ...options.formOptions?.submitButtonOptions },
    handleSubmit: async (values) => {
      await state.value.formOptions?.handleSubmit?.(values)
      page.value = 1
      await query()
    },
    handleReset: async () => {
      await state.value.formOptions?.handleReset?.()
      page.value = 1
      await query()
    },
  })
  function assertActive(): void {
    if (disposed)
      throw new Error('[lumal/v5] Grid 已卸载')
  }
  async function query(params: V5Values = {}): Promise<void> {
    assertActive()
    const version = ++generation
    const grid = state.value.gridOptions ?? {}
    const load = grid.proxyConfig?.ajax?.query
    if (!load)
      return
    loading.value = true
    failure.value = undefined
    try {
      const values = { ...await formApi.getValues(), ...params }
      const result = await load({ page: { currentPage: page.value, pageSize: pageSize.value }, sort: { ...sort.value } }, values)
      if (version !== generation || disposed)
        return
      const parsed = parsePage(result, grid)
      rows.value = parsed.rows
      total.value = parsed.total
      native?.clearSelection()
      state.value.gridEvents?.proxyQuery?.({ result })
    }
    catch (error) {
      if (version !== generation || disposed)
        return
      failure.value = error
      state.value.gridEvents?.proxyQueryError?.({ error })
      throw error
    }
    finally {
      if (version === generation)
        loading.value = false
    }
  }
  function setState(input: Partial<VxeGridProps> | ((previous: VxeGridProps) => Partial<VxeGridProps>)): void {
    assertActive()
    const patch = typeof input === 'function' ? input(state.value) : input
    const previous = state.value.gridOptions
    const next = patch.gridOptions
    const merged = {
      ...state.value,
      ...patch,
      formOptions: patch.formOptions ? { ...state.value.formOptions, ...patch.formOptions } : state.value.formOptions,
      gridOptions: {
        ...previous,
        ...next,
        proxyConfig: { ...previous?.proxyConfig, ...next?.proxyConfig, ajax: { ...previous?.proxyConfig?.ajax, ...next?.proxyConfig?.ajax }, response: { ...previous?.proxyConfig?.response, ...next?.proxyConfig?.response } },
        toolbarConfig: { ...previous?.toolbarConfig, ...next?.toolbarConfig },
      },
    }
    checkOptions(merged)
    state.value = merged
    if (next?.data) {
      rows.value = next.data
      total.value = next.data.length
    }
    if (next?.pagerConfig) {
      pageSize.value = next.pagerConfig.pageSize ?? pageSize.value
      page.value = next.pagerConfig.currentPage ?? page.value
    }
    if (patch.formOptions) {
      const { handleSubmit: _submit, handleReset: _reset, ...formPatch } = patch.formOptions
      formApi.setState(formPatch)
    }
  }
  const columns = computed<SchemaTableColumn[]>(() => (state.value.gridOptions?.columns ?? [])
    .filter(column => column.type !== 'checkbox')
    .map((column, index) => ({
      field: column.field ?? `__seq_${index}`,
      label: column.title ?? '',
      width: column.width,
      minWidth: column.minWidth,
      fixed: column.fixed,
      align: column.align,
      hidden: column.visible === false,
      showOverflowTooltip: column.showOverflow ?? state.value.gridOptions?.showOverflow,
      componentProps: { sortable: column.sortable ? 'custom' : false },
      formatter: column.type === 'seq'
        ? (_value, _row, rowIndex) => (page.value - 1) * pageSize.value + rowIndex + 1
        : column.formatter ? (cellValue, row, rowIndex) => column.formatter!({ cellValue, row, rowIndex }) : undefined,
    })))
  const grid: V5NativeGrid = {
    getCheckboxRecords: () => native?.getSelectedRows() ?? [],
    clearCheckboxRow: () => native?.clearSelection(),
    setCheckboxRow: (records, checked) => {
      if (!native)
        throw new Error('[lumal/v5] 请先挂载 <Grid />')
      for (const row of Array.isArray(records) ? records : [records])
        native.toggleRowSelection(row, checked)
    },
    getTableData: () => ({ fullData: [...rows.value], tableData: [...rows.value] }),
  }
  const api: VxeGridApi = {
    grid,
    formApi,
    error: computed(() => failure.value),
    getState: () => state.value,
    query,
    async reload(params) {
      page.value = 1
      await query(params)
    },
    setGridOptions: gridOptions => setState({ gridOptions }),
    setState,
    setLoading: value => setState({ gridOptions: { loading: value } }),
    toggleSearchForm(show) {
      setState({ showSearchForm: show ?? !state.value.showSearchForm })
      return Boolean(state.value.showSearchForm)
    },
  }
  function unmount(): void {
    generation += 1
    native = undefined
    mounted = false
    loading.value = false
  }
  onScopeDispose(() => {
    unmount()
    disposed = true
  }, true)
  return {
    api,
    Form,
    state,
    columns,
    rows,
    total,
    page,
    pageSize,
    loading,
    failure,
    mount(table: NativeTable) {
      assertActive()
      if (mounted)
        throw new Error('[lumal/v5] 每个 useVbenVxeGrid 只能同时挂载一个 Grid')
      native = table
      mounted = true
      if (state.value.gridOptions?.proxyConfig?.autoLoad !== false)
        void query().catch(() => {}) // 失败由 Grid 的 alert/retry 显示，命令式 API 仍拒绝。
    },
    unmount,
    async changePage(payload: { page: number, pageSize: number }) {
      page.value = payload.page
      pageSize.value = payload.pageSize
      state.value.gridEvents?.pageChange?.({ currentPage: page.value, pageSize: pageSize.value })
      await query().catch(() => {})
    },
    async changeSort(payload: SchemaTableSortChangePayload) {
      sort.value = { field: payload.prop ?? undefined, order: payload.order === 'ascending' ? 'asc' : payload.order === 'descending' ? 'desc' : null }
      page.value = 1
      state.value.gridEvents?.sortChange?.(sort.value)
      await query().catch(() => {})
    },
    select(records: SchemaTableRow[]) { state.value.gridEvents?.checkboxChange?.({ records }) },
    retry: () => query().catch(() => {}),
  }
}

/***********************Vben 5 Grid 返回契约*********************/
export function useVbenVxeGrid<Row extends object = SchemaTableRow>(options: VxeGridProps<Row> = {}): UseVbenVxeGridReturn<Row> {
  const controller = createGridController(options as VxeGridProps)
  const Grid = defineComponent({
    name: 'LumalVben5Grid',
    inheritAttrs: false,
    setup: (_, { attrs, slots }) => () => {
      assertComponentAttrs(attrs, ['tableTitle', 'table-title'])
      return h(V5Grid, { ...attrs, controller }, slots)
    },
  })
  return [Grid, controller.api as VxeGridApi<Row>]
}
