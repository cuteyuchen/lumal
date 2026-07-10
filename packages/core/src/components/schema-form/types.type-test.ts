import type { SchemaFormItem } from './types'

interface ExampleForm {
  name: string
  score: number
  status: string
}

const validFields: SchemaFormItem<ExampleForm>[] = [
  {
    component: 'input',
    componentProps: { maxlength: 40 },
    field: 'name',
    label: '名称',
  },
  {
    component: 'number',
    componentProps: { min: 0, step: 5 },
    field: 'score',
    label: '评分',
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
]

// @ts-expect-error 字段名必须来自模型
const invalidField: SchemaFormItem<ExampleForm> = { field: 'missing', label: '错误字段' }

const invalidProps: SchemaFormItem<ExampleForm> = {
  component: 'input',
  // @ts-expect-error input 不接受 upload action
  componentProps: { action: '/upload' },
  field: 'name',
  label: '名称',
}

void validFields
void invalidField
void invalidProps
