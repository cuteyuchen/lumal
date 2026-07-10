import type { Ref } from 'vue'
import type { DictionaryOption } from '../../dictionary'

export type SchemaTableRecord = object
export type SchemaTableRow = Record<string, unknown>
export type SchemaTableFieldKey<T extends SchemaTableRecord = SchemaTableRow> = Extract<keyof T, string>
export type SchemaTableAlign = 'center' | 'left' | 'right'
export type SchemaTableAuthority = string | string[]

export interface SchemaTableContext<T extends SchemaTableRecord = SchemaTableRow> {
  rows: T[]
  row?: T
  index?: number
}

export type SchemaTableStateResolver<T extends SchemaTableRecord = SchemaTableRow>
  = boolean | ((context: SchemaTableContext<T>) => boolean)

export type SchemaTableCellFormatter<T extends SchemaTableRecord = SchemaTableRow> = (
  value: unknown,
  row: T,
  index: number,
) => unknown

export type SchemaTableClassName<T extends SchemaTableRecord = SchemaTableRow>
  = | string
    | ((context: {
      columnIndex?: number
      row: T
      rowIndex: number
    }) => string)

export interface SchemaTablePaginationChangePayload {
  page: number
  pageSize: number
}

export interface SchemaTableTreeProps {
  children: string
  hasChildren?: string
}

export interface SchemaTableColumn<T extends SchemaTableRecord = SchemaTableRow> {
  field: SchemaTableFieldKey<T>
  label: string
  authority?: SchemaTableAuthority
  dictionary?: string
  dictType?: string
  options?: DictionaryOption[] | Ref<DictionaryOption[]>
  hidden?: SchemaTableStateResolver<T>
  align?: SchemaTableAlign
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  showOverflowTooltip?: boolean
  componentProps?: Record<string, unknown>
  emptyText?: string
  formatter?: SchemaTableCellFormatter<T>
}

export interface NormalizedSchemaTableColumn<T extends SchemaTableRecord = SchemaTableRow> extends SchemaTableColumn<T> {
  align: SchemaTableAlign
  componentProps: Record<string, unknown>
  emptyText: string
  renderable: boolean
}

export interface SchemaTableSelectionPayload<T extends SchemaTableRecord = SchemaTableRow> {
  selectedRows: T[]
  selectedRowKeys: Array<string | number>
}
