import type {
  CrudTableColumn,
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
    component: 'hidden',
    field: 'id',
    label: 'ID',
  },
  {
    component: 'input',
    editDisabled: true,
    field: 'name',
    label: '名称',
    placeholder: '请输入项目名称',
    prepend: '项目',
    required: true,
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
  {
    component: 'radio',
    dictionary: 'priority',
    field: 'priority',
    label: '优先级',
  },
  {
    component: 'number',
    componentProps: {
      max: 100,
      min: 0,
      step: 5,
    },
    field: 'score',
    formatter: value => `${String(value ?? 0)} 分`,
    label: '评分',
    suffix: '分',
  },
  {
    component: 'switch',
    field: 'enabled',
    label: '启用',
  },
  {
    component: 'checkbox',
    field: 'tags',
    label: '标签',
    options: [
      { label: '表单', value: 'form' },
      { label: '表格', value: 'table' },
      { label: '权限', value: 'access' },
    ],
  },
  {
    component: 'date',
    field: 'activeDate',
    label: '生效日期',
  },
  {
    component: 'daterange',
    field: 'availableRange',
    label: '有效范围',
    span: 24,
  },
  {
    component: 'tree-select',
    componentProps: {
      data: [
        {
          children: [
            { label: '示例页面', value: 'examples' },
            { label: '系统设置', value: 'settings' },
          ],
          label: '根节点',
          value: 'root',
        },
      ],
    },
    field: 'parentId',
    label: '上级节点',
  },
  {
    component: 'input',
    field: 'icon',
    label: '菜单图标',
  },
  {
    component: 'upload',
    componentProps: {
      action: '#',
      limit: 1,
    },
    field: 'attachment',
    label: '附件',
  },
  {
    component: 'textarea',
    field: 'remark',
    label: '备注',
    span: 24,
  },
]

export const exampleCrudFormSchemas: SchemaFormItem[] = [
  {
    component: 'input',
    field: 'name',
    label: '名称',
    rules: [{ required: true, message: '请输入名称' }],
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
  },
  {
    component: 'radio',
    dictionary: 'priority',
    field: 'priority',
    label: '优先级',
  },
  {
    component: 'textarea',
    field: 'remark',
    label: '备注',
  },
]

export const exampleCrudColumns: CrudTableColumn[] = [
  {
    field: 'name',
    label: '名称',
    componentProps: {
      minWidth: 160,
    },
    formComponentProps: {
      clearable: true,
    },
    placeholder: '请输入名称',
    required: true,
    rules: [{ required: true, message: '请输入名称' }],
  },
  {
    dictionary: 'status',
    field: 'status',
    label: '状态',
    width: 120,
  },
  {
    component: 'radio',
    dictionary: 'priority',
    field: 'priority',
    label: '优先级',
    width: 120,
  },
  {
    component: 'textarea',
    field: 'remark',
    label: '备注',
    showInTable: false,
    span: 24,
  },
]

/***********************表格数据*********************/
export const exampleTableColumns: SchemaTableColumn[] = [
  {
    componentProps: {
      minWidth: 160,
    },
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
  {
    field: 'internalCode',
    hidden: true,
    label: '内部编码',
  },
]

export const exampleTableRows: SchemaTableRow[] = [
  {
    id: 'example-1',
    internalCode: 'LUMA-001',
    name: '字典标准响应',
    priority: 'high',
    status: 'enabled',
  },
  {
    id: 'example-2',
    internalCode: 'LUMA-002',
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
