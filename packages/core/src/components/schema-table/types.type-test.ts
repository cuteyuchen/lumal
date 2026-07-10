import type { SchemaTableColumn } from './types'

interface ExampleRow {
  id: string
  name: string
  status: string
}

const validColumns: SchemaTableColumn<ExampleRow>[] = [
  { field: 'name', label: '名称', minWidth: 160 },
  { field: 'status', label: '状态' },
]

// @ts-expect-error 列字段必须来自行模型
const invalidColumn: SchemaTableColumn<ExampleRow> = { field: 'missing', label: '错误列' }

void validColumns
void invalidColumn
