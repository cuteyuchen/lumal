import type {
  InfoTableItem,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'

/***********************查询与表单数据*********************/
export function createExampleQueryModel(): SchemaFormModel {
  return {
    keyword: '',
    priority: 'high',
    status: 'enabled',
  }
}

export const exampleQuerySchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'keyword',
    label: '关键词',
    placeholder: '请输入名称',
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
    placeholder: '请选择状态',
  },
  {
    dictionary: 'priority',
    field: 'priority',
    label: '优先级',
    placeholder: '请选择优先级',
  },
]

export const exampleFormSchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'name',
    label: '名称',
    required: true,
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
  {
    component: 'textarea',
    field: 'remark',
    label: '备注',
  },
]

/***********************表格数据*********************/
export const exampleTableColumns: SchemaTableColumn[] = [
  {
    field: 'name',
    label: '名称',
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
    width: 120,
  },
  {
    dictionary: 'priority',
    field: 'priority',
    label: '优先级',
    width: 120,
  },
]

export const exampleTableRows: SchemaTableRow[] = [
  {
    id: 'example-1',
    name: '字典标准响应',
    priority: 'high',
    status: 'enabled',
  },
  {
    id: 'example-2',
    name: '表格自动回显',
    priority: 'normal',
    status: 'disabled',
  },
]

/***********************展示数据*********************/
export const frameworkInfoItems: InfoTableItem[] = [
  { label: '项目名称', value: 'Luma Admin' },
  { label: '核心包', value: '@luma/core' },
  { label: '图标包', value: '@luma/icons' },
  { label: '字典字段', value: 'dictionary' },
  { label: '标准响应', value: '{ items: DictionaryOption[] }' },
  { label: '权限字段', value: 'meta.authority' },
]

export const chartRows = [
  { color: '#2563eb', label: 'Layout', value: 88 },
  { color: '#16a34a', label: 'Dictionary', value: 82 },
  { color: '#f59e0b', label: 'Permission', value: 72 },
  { color: '#dc2626', label: 'Examples', value: 64 },
]
