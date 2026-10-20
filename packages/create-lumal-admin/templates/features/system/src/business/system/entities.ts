import type { SchemaFormItem, SchemaTableColumn } from '@lumal/core/components'
import { localMenus } from '../../router/views'

export interface EntityDefinition {
  title: string
  resource: string
  permission: string
  schemas: SchemaFormItem[]
  columns: SchemaTableColumn[]
  create?: boolean
  remove?: boolean
}
const status: SchemaFormItem = {
  field: 'status',
  label: '状态',
  component: 'select',
  defaultValue: 'enabled',
  options: [{ label: '启用', value: 'enabled' }, { label: '停用', value: 'disabled' }],
}
function input(field: string, label: string, required = true): SchemaFormItem {
  return { field, label, required, component: 'input' }
}
function define(resource: string, permission: string, title: string, schemas: SchemaFormItem[]): EntityDefinition {
  return {
    title,
    resource,
    permission,
    schemas,
    columns: schemas.map(schema => ({
      field: schema.field,
      label: schema.label,
      options: schema.component === 'select' && Array.isArray(schema.options) ? schema.options : undefined,
    })),
  }
}

// 保持应用侧字段契约；页面与 HTTP adapter 都不依赖演示应用源码。
export const entities: EntityDefinition[] = [
  define('users', 'system:user', '用户管理', [
    { ...input('username', '用户名'), editDisabled: true },
    input('nickname', '昵称'),
    input('phone', '手机号', false),
    input('organizationId', '机构 ID', false),
    { field: 'roles', label: '角色', component: 'select', componentProps: { multiple: true }, defaultValue: ['guest'], options: [{ label: '管理员', value: 'admin' }, { label: '运营', value: 'operator' }, { label: '访客', value: 'guest' }] },
    status,
  ]),
  define('roles', 'system:role', '角色管理', [
    input('name', '角色名称'),
    { ...input('code', '角色编码'), editDisabled: true },
    input('description', '说明', false),
    status,
    {
      field: 'permissions',
      label: '授权权限',
      component: 'checkbox',
      defaultValue: [],
      options: [...new Set(localMenus.flatMap((menu) => {
        const prefix = String(menu.meta?.permissionPrefix ?? '')
        return prefix ? ['list', 'view', 'create', 'update', 'delete', 'authorize'].map(action => `${prefix}:${action}`) : []
      }))].map(value => ({ label: value, value })),
    },
  ]),
  define('menus', 'system:menu', '菜单管理', [
    input('title', '标题'),
    input('path', '路径'),
    input('name', '路由名'),
    { ...input('component', '组件白名单键'), required: ({ model }) => model.type === 'menu', hidden: ({ model }) => model.type !== 'menu' },
    input('parentId', '父节点 ID', false),
    input('permission', '权限标识', false),
    { field: 'type', label: '类型', component: 'select', defaultValue: 'menu', options: [{ label: '目录', value: 'directory' }, { label: '页面', value: 'menu' }, { label: '按钮', value: 'button' }] },
    { field: 'order', label: '排序', component: 'number', defaultValue: 0 },
    { field: 'hidden', label: '隐藏菜单', component: 'switch', defaultValue: false },
  ]),
  define('organizations', 'system:organization', '机构管理', [input('name', '机构名称'), input('code', '机构编码'), input('parentId', '父机构 ID', false), input('leader', '负责人', false), status]),
  define('dictionaries/types', 'system:dict', '字典管理', [input('name', '字典名称'), input('code', '字典编码'), input('description', '说明', false), status]),
  define('dictionaries/items', 'system:dict', '字典项管理', [
    input('typeCode', '字典编码'),
    input('label', '显示名称'),
    input('value', '值'),
    input('color', '颜色', false),
    { field: 'order', label: '排序', component: 'number', defaultValue: 0 },
    status,
  ]),
  {
    ...define('config', 'system:config', '系统配置', [
      { ...input('key', '配置键'), disabled: true },
      input('value', '配置值'),
      input('description', '说明', false),
    ]),
    create: false,
    remove: false,
  },
]
