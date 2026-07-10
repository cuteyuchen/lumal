import type { DictionaryOption } from '../../dictionary'

export type SchemaTableRow = Record<string, unknown>

export type SchemaTableAlign = 'center' | 'left' | 'right'

export type SchemaTableAuthority = string | string[]

export interface SchemaTableContext {
  rows: SchemaTableRow[]
}

export type SchemaTableStateResolver = boolean | ((context: SchemaTableContext) => boolean)

export type SchemaTableCellFormatter = (
  value: unknown,
  row: SchemaTableRow,
  index: number,
) => unknown

export type SchemaTableClassName
  = | string
    | ((context: {
      columnIndex?: number
      row: SchemaTableRow
      rowIndex: number
    }) => string)

export interface SchemaTablePaginationChangePayload {
  page: number
  pageSize: number
}

export interface SchemaTableColumn {
  field: string
  label: string
  authority?: SchemaTableAuthority
  dictionary?: string
  dictType?: string
  options?: DictionaryOption[]
  hidden?: SchemaTableStateResolver
  align?: SchemaTableAlign
  width?: number | string
  componentProps?: Record<string, unknown>
  emptyText?: string
  formatter?: SchemaTableCellFormatter
}

export interface NormalizedSchemaTableColumn extends SchemaTableColumn {
  align: SchemaTableAlign
  componentProps: Record<string, unknown>
  emptyText: string
  renderable: boolean
}
