import type { SchemaFormOption, SchemaTableRow } from '@lumal/core/components'
import type { Component, ComputedRef } from 'vue'

export type V5Values = Record<string, unknown>
export type V5Component
  = | 'CheckboxGroup' | 'DatePicker' | 'Input' | 'InputNumber'
    | 'InputPassword' | 'InputTextarea' | 'RadioGroup' | 'Select'
    | 'Switch' | 'Textarea' | 'TreeSelect'

/** 结构化兼容 Zod 的校验器；只有使用它的应用才需要安装 Zod。 */
export interface V5Validator {
  safeParseAsync: (value: unknown) => Promise<{
    success: boolean
    data?: unknown
    error?: { issues: readonly { message: string }[] }
  }>
}
export type V5Rule = 'required' | 'selectRequired' | V5Validator
export type V5Resolver<R> = R | ((values: V5Values, api: VbenFormApi) => R)
export interface V5ComponentProps extends Record<string, unknown> {
  disabled?: boolean
  options?: SchemaFormOption[]
  placeholder?: string
  type?: string
}
export interface FormSchema<T extends object = V5Values> {
  fieldName: Extract<keyof T, string>
  component: V5Component
  label: string
  defaultValue?: unknown
  componentProps?: V5Resolver<V5ComponentProps>
  rules?: V5Rule
  help?: string
  dependencies?: {
    triggerFields: string[]
    if?: V5Resolver<boolean>
    show?: V5Resolver<boolean>
    disabled?: V5Resolver<boolean>
    required?: V5Resolver<boolean>
    componentProps?: V5Resolver<V5ComponentProps>
  }
}
export interface VbenFormProps<T extends object = V5Values> {
  schema?: FormSchema<T>[]
  commonConfig?: {
    componentProps?: V5ComponentProps
    disabled?: boolean
    labelWidth?: number | string
  }
  layout?: 'horizontal' | 'vertical'
  wrapperClass?: string
  showDefaultActions?: boolean
  submitOnEnter?: boolean
  submitOnChange?: boolean
  scrollToFirstError?: boolean
  submitButtonOptions?: { content?: string, loading?: boolean, disabled?: boolean }
  resetButtonOptions?: { content?: string, show?: boolean }
  handleSubmit?: (values: Partial<T> & V5Values) => Promise<unknown> | unknown
  handleReset?: () => Promise<unknown> | unknown
  handleValuesChange?: (values: Partial<T> & V5Values, changedFields: string[]) => void
}
export interface V5ValidationResult { valid: boolean, errors: Record<string, string> }
export interface VbenFormApi<T extends object = V5Values> {
  readonly isMounted: boolean
  getValues: () => Promise<Partial<T> & V5Values>
  setValues: (values: Partial<T>, filterFields?: boolean, shouldValidate?: boolean) => Promise<void>
  setFieldValue: (field: Extract<keyof T, string>, value: unknown, shouldValidate?: boolean) => Promise<void>
  resetForm: (state?: { values?: Partial<T> }) => Promise<void>
  resetValidate: () => Promise<void>
  validate: () => Promise<V5ValidationResult>
  validateAndSubmitForm: () => Promise<(Partial<T> & V5Values) | undefined>
  submitForm: (event?: Event) => Promise<(Partial<T> & V5Values) | undefined>
  getState: () => VbenFormProps<T>
  setState: (state: Partial<VbenFormProps<T>> | ((previous: VbenFormProps<T>) => Partial<VbenFormProps<T>>)) => void
  updateSchema: (schemas: Array<Partial<FormSchema<T>> & Pick<FormSchema<T>, 'fieldName'>>) => void
  removeSchemaByFields: (fields: Array<Extract<keyof T, string>>) => Promise<void>
  getLatestSubmissionValues: () => Partial<T> & V5Values
}
export type UseVbenFormReturn<T extends object = V5Values> = [Component, VbenFormApi<T>]

export interface VxeGridColumn<Row extends object = SchemaTableRow> {
  field?: Extract<keyof Row, string>
  title?: string
  type?: 'checkbox' | 'seq'
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  align?: 'center' | 'left' | 'right'
  visible?: boolean
  sortable?: boolean
  showOverflow?: boolean
  slots?: { default?: string }
  formatter?: (params: { cellValue: unknown, row: Row, rowIndex: number }) => unknown
}
export interface V5QueryParams {
  page: { currentPage: number, pageSize: number }
  sort: { field?: string, order?: 'asc' | 'desc' | null }
}
export interface VxeTableGridOptions<Row extends object = SchemaTableRow> {
  columns?: VxeGridColumn<Row>[]
  data?: Row[]
  rowConfig?: { keyField?: Extract<keyof Row, string> }
  pagerConfig?: false | { enabled?: boolean, pageSize?: number, currentPage?: number, pageSizes?: number[] }
  proxyConfig?: {
    autoLoad?: boolean
    response?: { result?: string, total?: string }
    ajax?: { query?: (params: V5QueryParams, formValues: V5Values) => Promise<unknown> }
  }
  toolbarConfig?: { custom?: boolean, refresh?: boolean, search?: boolean }
  loading?: boolean
  height?: number | string
  border?: boolean
  stripe?: boolean
  showOverflow?: boolean
}
export interface VxeGridProps<Row extends object = SchemaTableRow> {
  gridOptions?: VxeTableGridOptions<Row>
  formOptions?: VbenFormProps
  tableTitle?: string
  showSearchForm?: boolean
  gridEvents?: {
    checkboxChange?: (params: { records: Row[] }) => void
    sortChange?: (params: { field?: string, order?: 'asc' | 'desc' | null }) => void
    pageChange?: (params: { currentPage: number, pageSize: number }) => void
    proxyQuery?: (params: { result: unknown }) => void
    proxyQueryError?: (params: { error: unknown }) => void
  }
}
export interface V5NativeGrid<Row extends object = SchemaTableRow> {
  getCheckboxRecords: () => Row[]
  clearCheckboxRow: () => void
  setCheckboxRow: (rows: Row | Row[], checked: boolean) => void
  getTableData: () => { fullData: Row[], tableData: Row[] }
}
export interface VxeGridApi<Row extends object = SchemaTableRow> {
  formApi: VbenFormApi
  readonly grid: V5NativeGrid<Row>
  readonly error: ComputedRef<unknown>
  getState: () => VxeGridProps<Row>
  query: (params?: V5Values) => Promise<void>
  reload: (params?: V5Values) => Promise<void>
  setGridOptions: (options: Partial<VxeTableGridOptions<Row>>) => void
  setState: (state: Partial<VxeGridProps<Row>> | ((previous: VxeGridProps<Row>) => Partial<VxeGridProps<Row>>)) => void
  setLoading: (loading: boolean) => void
  toggleSearchForm: (show?: boolean) => boolean
}
export type UseVbenVxeGridReturn<Row extends object = SchemaTableRow> = [Component, VxeGridApi<Row>]
