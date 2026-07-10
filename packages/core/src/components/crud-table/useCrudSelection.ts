import type { ShallowRef } from 'vue'
import type { SchemaTableRow } from '../schema-table'
import { shallowRef } from 'vue'

export function useCrudSelection() {
  const selectedRows = shallowRef<SchemaTableRow[]>([])
  const selectedRowKeys = shallowRef<Array<number | string>>([])

  function clear(): void {
    selectedRows.value = []
    selectedRowKeys.value = []
  }

  function update(rows: SchemaTableRow[], keys: Array<number | string> = []): void {
    selectedRows.value = rows
    selectedRowKeys.value = keys
  }

  return {
    clear,
    selectedRowKeys: selectedRowKeys as ShallowRef<Array<number | string>>,
    selectedRows: selectedRows as ShallowRef<SchemaTableRow[]>,
    update,
  }
}
