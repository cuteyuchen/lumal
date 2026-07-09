export type SchemaFormModel = Record<string, unknown>

export type SchemaFormComponentType = 'hidden' | 'input' | 'select' | 'textarea'

export type SchemaFormOptionValue = string | number | boolean

export interface SchemaFormOption {
  label: string
  value: SchemaFormOptionValue
  disabled?: boolean
}

export interface SchemaFormItem {
  field: string
  label: string
  component?: SchemaFormComponentType
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
