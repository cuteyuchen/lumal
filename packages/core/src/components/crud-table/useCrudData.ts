import type { ComputedRef, Ref } from 'vue'
import type { SchemaFormModel } from '../schema-form'
import type { SchemaTableRow } from '../schema-table'
import type { CrudDataSource, CrudFetchResult } from './types'
import { computed, shallowRef } from 'vue'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function useCrudData(options: {
  dataSource: ComputedRef<CrudDataSource | undefined>
  rows: ComputedRef<SchemaTableRow[]>
  total: ComputedRef<number>
  loading: ComputedRef<boolean>
  page: Ref<number>
  pageSize: Ref<number>
  queryModel: Ref<SchemaFormModel>
}) {
  const remoteRows = shallowRef<SchemaTableRow[]>([])
  const remoteTotal = shallowRef(0)
  const internalLoading = shallowRef(false)
  const error = shallowRef('')

  const currentRows = computed(() => options.dataSource.value ? remoteRows.value : options.rows.value)
  const currentTotal = computed(() => options.dataSource.value ? remoteTotal.value : options.total.value)
  const currentLoading = computed(() => options.loading.value || internalLoading.value)

  function parseResponse(response: unknown): CrudFetchResult {
    const source = options.dataSource.value
    if (source?.parseResponse) {
      return source.parseResponse(response)
    }
    if (!isRecord(response) || !Array.isArray(response.items) || typeof response.total !== 'number') {
      return { items: [], total: 0 }
    }
    return { items: response.items as SchemaTableRow[], total: response.total }
  }

  async function load(): Promise<void> {
    const source = options.dataSource.value
    if (!source) {
      return
    }
    internalLoading.value = true
    error.value = ''
    try {
      const response = await source.fetch({
        page: options.page.value,
        pageSize: options.pageSize.value,
        query: { ...options.queryModel.value },
      })
      const result = parseResponse(response)
      remoteRows.value = result.items
      remoteTotal.value = result.total
    }
    catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason)
      remoteRows.value = []
      remoteTotal.value = 0
    }
    finally {
      internalLoading.value = false
    }
  }

  return {
    currentLoading,
    currentRows,
    currentTotal,
    error,
    load,
  }
}
