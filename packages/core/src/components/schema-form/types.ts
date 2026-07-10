import type {
  CheckboxGroupProps,
  DatePickerProps,
  FormItemRule,
  InputNumberProps,
  InputProps,
  RadioGroupProps,
  SelectProps,
  SwitchProps,
  TreeComponentProps,
  UploadProps,
} from 'element-plus'
import type { Ref } from 'vue'
import type { DictionaryOption } from '../../dictionary'

export type SchemaFormRecord = object
export type SchemaFormModel<T extends SchemaFormRecord = Record<string, unknown>> = Partial<T> & Record<string, unknown>
export type SchemaFormFieldKey<T extends SchemaFormRecord = Record<string, unknown>> = Extract<keyof T, string>
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

export interface SchemaFormComponentPropsMap {
  'checkbox': Partial<CheckboxGroupProps>
  'date': Partial<DatePickerProps>
  'daterange': Partial<DatePickerProps>
  'datetime': Partial<DatePickerProps>
  'hidden': Record<string, unknown>
  'input': Partial<InputProps>
  'number': Partial<InputNumberProps>
  'radio': Partial<RadioGroupProps>
  'select': Partial<SelectProps>
  'switch': Partial<SwitchProps>
  'textarea': Partial<InputProps>
  'tree-select': Partial<SelectProps & TreeComponentProps>
  'upload': Partial<UploadProps>
}

export type SchemaFormComponentProps = SchemaFormComponentPropsMap[SchemaFormComponentType]
export type SchemaFormOptionValue = string | number | boolean
export interface SchemaFormOption extends DictionaryOption {}

export interface SchemaFormContext<T extends SchemaFormRecord = Record<string, unknown>> {
  mode: SchemaFormMode
  model: SchemaFormModel<T>
}

export type SchemaFormStateResolver<T extends SchemaFormRecord = Record<string, unknown>>
  = boolean | ((context: SchemaFormContext<T>) => boolean)
export type SchemaFormRule = FormItemRule
export type SchemaFormAuthority = string | string[]

export interface SchemaFormItemBase<T extends SchemaFormRecord = Record<string, unknown>> {
  field: SchemaFormFieldKey<T>
  label: string
  dictionary?: string
  dictType?: string
  defaultValue?: unknown
  hidden?: SchemaFormStateResolver<T>
  disabled?: SchemaFormStateResolver<T>
  readonly?: SchemaFormStateResolver<T>
  editDisabled?: boolean
  authority?: SchemaFormAuthority
  readonlyAuthority?: SchemaFormAuthority
  required?: boolean
  rules?: SchemaFormRule[]
  span?: number
  placeholder?: string
  options?: SchemaFormOption[] | Ref<SchemaFormOption[]>
  formatter?: (value: unknown, model: SchemaFormModel<T>) => string
  prepend?: string
  append?: string
  prefix?: string
  suffix?: string
}

type SchemaFormExplicitComponentItem<
  T extends SchemaFormRecord,
  C extends SchemaFormComponentType,
> = SchemaFormItemBase<T> & {
  component: C
  componentProps?: SchemaFormComponentPropsMap[C]
  props?: SchemaFormComponentPropsMap[C]
}

type SchemaFormDefaultInputItem<T extends SchemaFormRecord> = SchemaFormItemBase<T> & {
  component?: undefined | 'input'
  dictionary?: undefined
  dictType?: undefined
  componentProps?: SchemaFormComponentPropsMap['input']
  props?: SchemaFormComponentPropsMap['input']
}

type SchemaFormDictionaryItem<T extends SchemaFormRecord> = SchemaFormItemBase<T> & {
  component?: undefined
  componentProps?: SchemaFormComponentPropsMap['select']
  props?: SchemaFormComponentPropsMap['select']
} & (
  | { dictionary: string }
  | { dictType: string }
)

export type SchemaFormItem<T extends SchemaFormRecord = Record<string, unknown>>
  = | SchemaFormDefaultInputItem<T>
    | SchemaFormDictionaryItem<T>
    | {
      [C in SchemaFormComponentType]: SchemaFormExplicitComponentItem<T, C>
    }[SchemaFormComponentType]

export type NormalizedSchemaFormItem<T extends SchemaFormRecord = Record<string, unknown>> = SchemaFormItemBase<T> & {
  id: string
  component: SchemaFormComponentType
  componentProps: SchemaFormComponentProps
  disabled: boolean
  options: SchemaFormOption[]
  readonly: boolean
  renderable: boolean
  rules: SchemaFormRule[]
}
