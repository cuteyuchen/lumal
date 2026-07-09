import type { SchemaFormItem, SchemaFormModel, SchemaFormOption } from '@luma/core/components'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

export type VbenFormComponent
  = | 'Hidden'
    | 'Input'
    | 'Input.Password'
    | 'Input.TextArea'
    | 'Select'
    | 'Textarea'
    | (string & {})

export interface VbenFormRule {
  required?: boolean
}

export interface VbenFormComponentProps {
  disabled?: boolean
  options?: SchemaFormOption[]
  placeholder?: string
  type?: string
  [key: string]: unknown
}

export interface VbenFormSchema {
  label: string
  component?: VbenFormComponent
  componentProps?: VbenFormComponentProps
  defaultValue?: unknown
  field?: string
  fieldName?: string
  hidden?: boolean
  ifShow?: boolean
  required?: boolean
  rules?: VbenFormRule[]
  show?: boolean
}

export interface UseVbenFormOptions {
  schemas?: VbenFormSchema[]
  model?: SchemaFormModel
  showActions?: boolean
  submitText?: string
  submit?: (model: SchemaFormModel) => void
}

export type UseVbenFormInput = MaybeRefOrGetter<UseVbenFormOptions>

export interface LumaSchemaFormCompatProps {
  'modelValue': SchemaFormModel
  'onUpdate:modelValue': (model: SchemaFormModel) => void
  'onSubmit': (model: SchemaFormModel) => void
  'schemas': SchemaFormItem[]
  'showActions'?: boolean
  'submitText'?: string
}

export type VbenFormRegister = (formInstance?: unknown) => void

export interface VbenFormApi {
  schemaFormProps: ComputedRef<LumaSchemaFormCompatProps>
  getFieldsValue: () => SchemaFormModel
  getFormInstance: () => unknown
  getLumaSchemas: () => SchemaFormItem[]
  handleSubmit: (model?: SchemaFormModel) => void
  handleUpdateModel: (model: SchemaFormModel) => void
  resetFields: () => void
  setFieldsValue: (values: SchemaFormModel) => void
}

export type UseVbenFormReturn = [VbenFormRegister, VbenFormApi]
