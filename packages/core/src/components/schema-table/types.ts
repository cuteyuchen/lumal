import type { DictionaryOption } from '../../dictionary'

export type SchemaTableRow = Record<string, unknown>

export type SchemaTableAlign = 'center' | 'left' | 'right'

export type SchemaTableCellFormatter = (
  value: unknown,
  row: SchemaTableRow,
  index: number,
) => unknown

export interface SchemaTableColumn {
  field: string
  label: string
  dictionary?: string
  dictType?: string
  options?: DictionaryOption[]
  hidden?: boolean
  align?: SchemaTableAlign
  width?: number | string
  emptyText?: string
  formatter?: SchemaTableCellFormatter
}

export interface NormalizedSchemaTableColumn extends SchemaTableColumn {
  align: SchemaTableAlign
  emptyText: string
  renderable: boolean
}
