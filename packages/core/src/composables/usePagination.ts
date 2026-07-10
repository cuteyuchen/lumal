import type { Ref } from 'vue'
import { ref } from 'vue'

/***********************分页结果*********************/
/** Luma 标准分页结果结构。 */
export interface PaginationResult<T> {
  items: T[]
  total: number
}

export interface UsePaginationOptions<T, TResponse> {
  /** 初始每页条数，默认 10。 */
  initialPageSize?: number
  /** 初始页码，默认 1。 */
  initialPage?: number
  /** 页码参数名，默认 `page`。 */
  pageKey?: string
  /** 每页条数参数名，默认 `pageSize`。 */
  pageSizeKey?: string
  /** 响应解析器，默认按 `{ items, total }` 读取。 */
  parser?: (response: TResponse) => PaginationResult<T>
}

export interface UsePaginationReturn<T> {
  items: Ref<T[]>
  total: Ref<number>
  page: Ref<number>
  pageSize: Ref<number>
  loading: Ref<boolean>
  fetchData: () => Promise<void>
  query: () => Promise<void>
  setPageSize: (value: number) => Promise<void>
  setPage: (value: number) => Promise<void>
}

function defaultParser<T>(response: unknown): PaginationResult<T> {
  const result = response as { items?: T[], total?: number } | undefined
  return {
    items: result?.items ?? [],
    total: result?.total ?? 0,
  }
}

/**
 * 列表分页组合式逻辑：管理页码、每页条数、loading 与数据加载。
 * 不绑定具体后端字段，默认按 Luma 标准 `{ items, total }` 解析，可通过 parser 适配。
 */
export function usePagination<T = unknown, TResponse = unknown>(
  fetchFn: (params: Record<string, unknown>) => Promise<TResponse>,
  getQueryParams?: () => Record<string, unknown>,
  options: UsePaginationOptions<T, TResponse> | number = {},
): UsePaginationReturn<T> {
  const normalizedOptions = typeof options === 'number' ? { initialPageSize: options } : options
  const parser = normalizedOptions.parser ?? defaultParser<T>
  const pageKey = normalizedOptions.pageKey ?? 'page'
  const pageSizeKey = normalizedOptions.pageSizeKey ?? 'pageSize'

  const items = ref<T[]>([]) as Ref<T[]>
  const total = ref(0)
  const page = ref(normalizedOptions.initialPage ?? 1)
  const pageSize = ref(normalizedOptions.initialPageSize ?? 10)
  const loading = ref(false)

  async function fetchData(): Promise<void> {
    loading.value = true

    try {
      const extra = getQueryParams?.() ?? {}
      const response = await fetchFn({
        ...extra,
        [pageKey]: page.value,
        [pageSizeKey]: pageSize.value,
      })
      const parsed = parser(response)
      items.value = parsed.items
      total.value = parsed.total
    }
    finally {
      loading.value = false
    }
  }

  async function query(): Promise<void> {
    page.value = 1
    await fetchData()
  }

  async function setPageSize(value: number): Promise<void> {
    pageSize.value = value
    await fetchData()
  }

  async function setPage(value: number): Promise<void> {
    page.value = value
    await fetchData()
  }

  return {
    items,
    total,
    page,
    pageSize,
    loading,
    fetchData,
    query,
    setPageSize,
    setPage,
  }
}
