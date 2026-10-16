import type {
  CrudTablePageChangePayload,
  CrudTableQueryModel,
  SchemaTableRow,
} from '@lumal/core/components'
import type {
  LumalCrudTableCompatProps,
  UseVbenVxeGridInput,
  UseVbenVxeGridReturn,
} from '../types'
import { computed, onScopeDispose, reactive, shallowRef, toRef, watch } from 'vue'
import {
  adaptVbenGridColumns,
  adaptVbenGridProxyResult,
  adaptVbenGridQuerySchemas,
  replaceVbenGridQueryModel,
  resolveVbenGridOptions,
} from './adapter'

/***********************表格组合函数*********************/
export function useVbenVxeGrid(options: UseVbenVxeGridInput = {}): UseVbenVxeGridReturn {
  const optionsRef = toRef(options)
  const gridInstance = shallowRef<unknown>()
  const rows = shallowRef<SchemaTableRow[]>([])
  const total = shallowRef(0)
  const loading = shallowRef(false)
  const error = shallowRef<unknown>()
  const page = shallowRef(1)
  const pageSize = shallowRef(10)
  const queryModel = reactive<CrudTableQueryModel>({})
  let requestGeneration = 0
  onScopeDispose(() => {
    requestGeneration += 1
  }, true)

  const gridOptions = computed(() => resolveVbenGridOptions(optionsRef.value))
  const lumalColumns = computed(() => adaptVbenGridColumns(gridOptions.value.columns))
  const querySchemas = computed(() => adaptVbenGridQuerySchemas(gridOptions.value))
  const pagination = computed(() => gridOptions.value.pagerConfig !== false && gridOptions.value.pagerConfig?.enabled !== false)
  const pageSizes = computed(() => {
    const pagerConfig = gridOptions.value.pagerConfig

    return pagerConfig === false ? undefined : pagerConfig?.pageSizes
  })

  watch(
    () => gridOptions.value.pagerConfig,
    (pagerConfig) => {
      if (pagerConfig !== false && pagerConfig?.pageSize) {
        pageSize.value = pagerConfig.pageSize
      }
    },
    { immediate: true },
  )

  function register(instance?: unknown): void {
    gridInstance.value = instance
  }

  function getQueryModel(): CrudTableQueryModel {
    return {
      ...queryModel,
    }
  }

  function setQueryModel(model: CrudTableQueryModel): void {
    replaceVbenGridQueryModel(queryModel, model)
  }

  function setRows(nextRows: SchemaTableRow[], nextTotal = nextRows.length): void {
    rows.value = nextRows
    total.value = nextTotal
  }

  function setLoading(nextLoading: boolean): void {
    loading.value = nextLoading
  }

  function clearError(): void {
    error.value = undefined
  }

  async function reload(): Promise<boolean> {
    const generation = ++requestGeneration
    const query = gridOptions.value.proxyConfig?.ajax?.query

    if (!query) {
      clearError()
      loading.value = false
      return true
    }

    loading.value = true
    clearError()

    try {
      const result = await query({
        ...getQueryModel(),
        page: page.value,
        pageSize: pageSize.value,
      })
      if (generation !== requestGeneration)
        return false
      const tableResult = adaptVbenGridProxyResult(result, gridOptions.value)
      setRows(tableResult.rows, tableResult.total)
      return true
    }
    catch (nextError) {
      if (generation !== requestGeneration)
        return false
      error.value = nextError
      gridOptions.value.onError?.(nextError)
      return false
    }
    finally {
      if (generation === requestGeneration)
        loading.value = false
    }
  }

  function search(payload: CrudTableQueryModel = getQueryModel()): Promise<boolean> {
    setQueryModel(payload)
    page.value = 1
    return reload()
  }

  function reset(): Promise<boolean> {
    setQueryModel({})
    page.value = 1
    return reload()
  }

  function handleSearch(payload: CrudTableQueryModel = getQueryModel()): Promise<boolean> {
    return search(payload)
  }

  function handleReset(payload: CrudTableQueryModel = {}): Promise<boolean> {
    setQueryModel(payload)
    page.value = 1
    return reload()
  }

  function handlePageChange(payload: CrudTablePageChangePayload): Promise<boolean> {
    page.value = payload.page
    pageSize.value = payload.pageSize
    return reload()
  }

  const crudTableProps = computed<LumalCrudTableCompatProps>(() => ({
    'columns': lumalColumns.value,
    'actions': gridOptions.value.actions,
    'emptyText': error.value instanceof Error
      ? error.value.message
      : error.value ? String(error.value) : gridOptions.value.emptyText,
    'loading': loading.value,
    'onPageChange': handlePageChange,
    'onReset': handleReset,
    'onSearch': handleSearch,
    'onUpdate:page': (nextPage: number) => {
      page.value = nextPage
    },
    'onUpdate:pageSize': (nextPageSize: number) => {
      pageSize.value = nextPageSize
    },
    'onUpdate:queryModel': setQueryModel,
    'page': page.value,
    'pageSize': pageSize.value,
    'pageSizes': pageSizes.value,
    'pagination': pagination.value,
    'queryModel': getQueryModel(),
    'querySchemas': querySchemas.value,
    'resetText': gridOptions.value.formOptions?.resetText ?? gridOptions.value.resetText,
    'rowKey': gridOptions.value.rowKey,
    'rows': rows.value,
    'searchText': gridOptions.value.formOptions?.submitText ?? gridOptions.value.searchText,
    'title': gridOptions.value.title,
    'toolbar': gridOptions.value.toolbarConfig,
    'table': {
      ...gridOptions.value.tableConfig,
      columns: lumalColumns.value,
      rowKey: gridOptions.value.rowKey,
      selection: gridOptions.value.columns?.some(column => column.type === 'checkbox'),
    },
    'total': total.value,
  }))

  return [
    register,
    {
      crudTableProps,
      clearError,
      getError: () => error.value,
      getGridInstance: () => gridInstance.value,
      getLumalColumns: () => lumalColumns.value,
      getQueryModel,
      getRows: () => rows.value,
      getTotal: () => total.value,
      handlePageChange,
      handleReset,
      handleSearch,
      reload,
      reset,
      search,
      setLoading,
      setQueryModel,
      setRows,
    },
  ]
}
