import type { DictionaryOption } from '../../dictionary'

export type SchemaFormModel = Record<string, unknown>

export type SchemaFormComponentType = 'hidden' | 'input' | 'select' | 'textarea'

export type SchemaFormOptionValue = string | number | boolean

export interface SchemaFormOption extends DictionaryOption {}

export interface SchemaFormItem {
  field: string
  label: string
  component?: SchemaFormComponentType
  dictionary?: string
  dictType?: string
  defaultValue?: unknown
  hidden?: boolean
  required?: boolean
  placeholder?: string
  options?: SchemaFormOption[]
  props?: Record<string, unknown>
}

export interface NormalizedSchemaFormItem extends SchemaFormItem {
  id: string
  component: SchemaFormComponentType
  options: SchemaFormOption[]
  renderable: boolean
}
