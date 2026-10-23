import type { CrudTableColumn } from '../crud-table/types'
import type { SchemaTableColumn } from './types'

interface ExampleRow {
  id: string
  name: string
  status: string
}

const validColumns: SchemaTableColumn<ExampleRow>[] = [
  { field: 'name', label: '名称', minWidth: 160 },
  { field: 'status', label: '状态' },
  { type: 'index', label: '序号' },
]

const validCrudColumns: CrudTableColumn<ExampleRow>[] = validColumns

// @ts-expect-error 列字段必须来自行模型
const invalidColumn: SchemaTableColumn<ExampleRow> = { field: 'missing', label: '错误列' }

// @ts-expect-error 普通列不能省略业务字段
const missingField: SchemaTableColumn<ExampleRow> = { label: '缺少字段' }
// @ts-expect-error 序号列不能绑定业务字段
const boundIndex: CrudTableColumn<ExampleRow> = { type: 'index', field: 'id', label: '序号' }

void validColumns
void validCrudColumns
void invalidColumn
void missingField
void boundIndex
