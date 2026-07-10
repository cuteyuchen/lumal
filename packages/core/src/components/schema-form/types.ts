import type { DictionaryOption } from '../../dictionary'

export type SchemaFormModel = Record<string, unknown>

export type SchemaFormMode = 'create' | 'edit' | 'view'

export type SchemaFormComponentType
  = | 'checkbox'
    | 'date'
    | 'daterange'
    | 'datetime'
    | 'hidden'
    | 'input'
    | 'number'
    | 'radio'
    | 'select'
    | 'switch'
    | 'textarea'
    | 'tree-select'
    | 'upload'

export type SchemaFormOptionValue = string | number | boolean

export interface SchemaFormOption extends DictionaryOption {}

export interface SchemaFormContext {
  mode: SchemaFormMode
  model: SchemaFormModel
}

export type SchemaFormStateResolver = boolean | ((context: SchemaFormContext) => boolean)

export type SchemaFormRule = Record<string, unknown>

export type SchemaFormAuthority = string | string[]

export interface SchemaFormItem {
  field: string
  label: string
  component?: SchemaFormComponentType
  dictionary?: string
  dictType?: string
  defaultValue?: unknown
  hidden?: SchemaFormStateResolver
  disabled?: SchemaFormStateResolver
  readonly?: SchemaFormStateResolver
  authority?: SchemaFormAuthority
  required?: boolean
  rules?: SchemaFormRule[]
  span?: number
  placeholder?: string
  options?: SchemaFormOption[]
  componentProps?: Record<string, unknown>
  props?: Record<string, unknown>
}

export interface NormalizedSchemaFormItem extends SchemaFormItem {
  id: string
  component: SchemaFormComponentType
  componentProps: Record<string, unknown>
  disabled: boolean
  options: SchemaFormOption[]
  readonly: boolean
  renderable: boolean
  rules: SchemaFormRule[]
}
