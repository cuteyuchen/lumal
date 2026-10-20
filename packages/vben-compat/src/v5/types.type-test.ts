import type { FormSchema, VbenFormApi, VbenFormProps, VxeGridProps } from './types'

interface UserValues { name: string, age: number }
const schema: FormSchema<UserValues>[] = [{ fieldName: 'age', label: '年龄', component: 'InputNumber' }]
// @ts-expect-error 字段必须来自模型，不接受任意拼写
const invalidField: FormSchema<UserValues> = { fieldName: 'missing', label: '错误', component: 'Input' }
// @ts-expect-error Vben 5 使用 schema，不接受 legacy schemas
const invalidOptions: VbenFormProps = { schemas: [] }
// @ts-expect-error 高级 VXE 编辑需要应用侧可选引擎，不属于轻量子集
const advancedGrid: VxeGridProps = { gridOptions: { editConfig: {} } }

function checkApi(api: VbenFormApi<UserValues>): void {
  void api.setValues({ age: 18 })
  // @ts-expect-error 设置值保持模型类型约束
  void api.setValues({ age: '18' })
  // @ts-expect-error 字段必须来自模型
  void api.setFieldValue('missing', true)
}
void schema
void invalidField
void invalidOptions
void advancedGrid
void checkApi
