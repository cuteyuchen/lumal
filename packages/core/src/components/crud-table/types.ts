import type { PaginationChangePayload } from '../pagination'
import type { SchemaFormItem, SchemaFormModel } from '../schema-form'
import type { SchemaTableColumn, SchemaTableRow } from '../schema-table'

export type CrudTableQueryModel = SchemaFormModel

export type CrudTablePageChangePayload = PaginationChangePayload

export interface CrudTableSearchPayload extends SchemaFormModel {}

export interface CrudTableResetPayload extends SchemaFormModel {}

export interface CrudFetchParams<Query extends SchemaFormModel = SchemaFormModel> {
  page: number
  pageSize: number
  query: Query
}

export interface CrudFetchResult<Row extends SchemaTableRow = SchemaTableRow> {
  items: Row[]
  total: number
}

export interface CrudDataSource<
  Row extends SchemaTableRow = SchemaTableRow,
  Query extends SchemaFormModel = SchemaFormModel,
> {
  create?: (model: Partial<Row>) => Promise<unknown>
  fetch: (params: CrudFetchParams<Query>) => Promise<unknown>
  parseResponse?: (response: unknown) => CrudFetchResult<Row>
  remove?: (row: Row) => Promise<unknown>
  removeMany?: (rows: Row[]) => Promise<unknown>
  update?: (row: Row, model: Partial<Row>) => Promise<unknown>
}

export type CrudFormMode = 'create' | 'edit' | 'view'

export type CrudStateResolver<Row extends SchemaTableRow = SchemaTableRow>
  = boolean | ((row: Row, index: number) => boolean)

export interface CrudRemoveConfirmOptions<Row extends SchemaTableRow = SchemaTableRow> {
  cancelButtonText?: string
  confirmButtonText?: string
  message?: string | ((rows: Row[]) => string)
  title?: string
}

export type CrudRemoveConfirm<Row extends SchemaTableRow = SchemaTableRow>
  = | false
    | CrudRemoveConfirmOptions<Row>
    | ((rows: Row[]) => boolean | Promise<boolean>)

export interface CrudQueryConfig {
  schemas?: SchemaFormItem[]
  columns?: number
  collapsible?: boolean
  defaultCollapsed?: boolean
  collapsedRows?: number
  labelWidth?: number | string
  searchText?: string
  resetText?: string
}

export interface CrudTableConfig {
  columns?: SchemaTableColumn[]
  rowKey?: string | ((row: SchemaTableRow, index: number) => string | number)
  selection?: boolean
  showColumnSettings?: boolean
  autoResize?: boolean
  actionWidth?: number | string
  emptyText?: string
}

export interface CrudToolbarConfig {
  create?: boolean
  batchDelete?: boolean
  refresh?: boolean
  export?: boolean
  createText?: string
  batchDeleteText?: string
  refreshText?: string
  exportText?: string
}

export interface CrudActionsConfig<Row extends SchemaTableRow = SchemaTableRow> {
  view?: CrudStateResolver<Row>
  edit?: CrudStateResolver<Row>
  remove?: CrudStateResolver<Row>
  viewText?: string
  editText?: string
  removeText?: string
  confirmRemove?: CrudRemoveConfirm<Row>
}

export interface CrudDialogConfig<Row extends SchemaTableRow = SchemaTableRow> {
  width?: number | string
  createTitle?: string
  editTitle?: string
  viewTitle?: string
  submitText?: string
  closeOnClickModal?: boolean
  destroyOnClose?: boolean
  confirmClose?: (context: {
    mode: CrudFormMode
    model: Partial<Row>
    row?: Row
  }) => boolean | Promise<boolean>
}

export interface CrudPaginationConfig {
  enabled?: boolean
  pageSizes?: number[]
}

export interface CrudTableProps {
  title?: string
  description?: string
  querySchemas?: SchemaFormItem[]
  formSchemas?: SchemaFormItem[]
  columns?: SchemaTableColumn[]
  dataSource?: CrudDataSource
  rows?: SchemaTableRow[]
  rowKey?: string | ((row: SchemaTableRow, index: number) => string | number)
  total?: number
  pageSizes?: number[]
  pagination?: boolean | CrudPaginationConfig
  loading?: boolean
  emptyText?: string
  searchText?: string
  resetText?: string
  createText?: string
  batchDeleteText?: string
  selection?: boolean
  confirmRemove?: (rows: SchemaTableRow[]) => boolean | Promise<boolean>
  query?: CrudQueryConfig
  table?: CrudTableConfig
  toolbar?: CrudToolbarConfig
  actions?: CrudActionsConfig
  dialog?: CrudDialogConfig
}
