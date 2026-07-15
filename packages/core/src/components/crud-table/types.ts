import type { PaginationChangePayload } from '../pagination'
import type {
  SchemaFormComponentProps,
  SchemaFormComponentType,
  SchemaFormItem,
  SchemaFormModel,
  SchemaFormRule,
} from '../schema-form'
import type { SchemaTableColumn, SchemaTableColumnSettings, SchemaTableRow } from '../schema-table'

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
  beforeRemove?: (rows: Row[]) => boolean | Promise<boolean>
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
  defaultVisible?: boolean
  collapsedRows?: number
  labelWidth?: number | string
  searchText?: string
  resetText?: string
  submitOnChange?: boolean
  submitDebounce?: number
}

export interface CrudTableConfig {
  columns?: CrudTableColumn[]
  rowKey?: string | ((row: SchemaTableRow, index: number) => string | number)
  selection?: boolean
  showColumnSettings?: boolean
  columnSettings?: SchemaTableColumnSettings
  autoResize?: boolean
  actionWidth?: number | string
  emptyText?: string
}

export interface CrudTableColumn extends SchemaTableColumn {
  component?: SchemaFormComponentType
  defaultValue?: unknown
  editDisabled?: boolean
  formComponentProps?: SchemaFormComponentProps
  placeholder?: string
  prepend?: string
  append?: string
  prefix?: string
  suffix?: string
  required?: boolean
  rules?: SchemaFormRule[]
  showInForm?: boolean
  showInTable?: boolean
  span?: number
}

export interface CrudToolbarConfig {
  actionsPosition?: 'left' | 'right'
  queryToggle?: boolean
  create?: boolean
  batchDelete?: boolean
  refresh?: boolean
  export?: boolean | CrudExportConfig
  fullscreen?: boolean
  createText?: string
  batchDeleteText?: string
  refreshText?: string
  exportText?: string
  fullscreenText?: string
}

export interface CrudToolbarSlotProps<Row extends SchemaTableRow = SchemaTableRow> {
  clearSelection: () => void
  openCreate: () => void
  reload: () => Promise<void>
  selectedRowKeys: Array<number | string>
  selectedRows: Row[]
}

export interface CrudExportContext<Row extends SchemaTableRow = SchemaTableRow> {
  columns: CrudTableColumn[]
  query: SchemaFormModel
  rows: Row[]
  selectedRows: Row[]
}

export interface CrudExportConfig<Row extends SchemaTableRow = SchemaTableRow> {
  filename?: string
  handler?: (context: CrudExportContext<Row>) => void | Promise<void>
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

export interface CrudEditorConfig<Row extends SchemaTableRow = SchemaTableRow> {
  type?: 'dialog' | 'drawer'
  width?: number | string
  columns?: number
  labelWidth?: number | string
  loading?: boolean
  disabled?: boolean
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
  querySchemas?: SchemaFormItem[]
  formSchemas?: SchemaFormItem[]
  columns?: CrudTableColumn[]
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
  query?: CrudQueryConfig
  table?: CrudTableConfig
  toolbar?: CrudToolbarConfig
  actions?: CrudActionsConfig
  editor?: CrudEditorConfig
}
