import type { SchemaFormModel } from '@lumal/core/components'
import type { BusinessTransport } from '../../../app/services/contracts'
import type { Menu, MenuInput, MenuType } from './types'
import { assertRoutePath, resolveView, safeExternalUrl } from '../../../app/menu-policy'
import { viewComponents } from '../../../app/router/views'
import { integer, object, rows, stringArray, text } from '../../../shared/api'

export function menuInput(model: SchemaFormModel): MenuInput {
  const type = text(model.type, '菜单类型', true) as MenuType
  if (!['directory', 'menu', 'button', 'external', 'embedded'].includes(type))
    throw new Error('菜单类型无效')
  const path = type === 'button' ? '' : text(model.path, '路径', true)
  if (type !== 'button')
    assertRoutePath(path)
  const component = type === 'menu' ? text(model.component, '组件', true) : type === 'embedded' ? 'app/iframe' : ''
  if (component && !resolveView(viewComponents, component))
    throw new Error('菜单组件不在白名单中')
  const externalLink = ['external', 'embedded'].includes(type) ? safeExternalUrl(model.externalLink) : ''
  if (type === 'embedded') {
    const origins = String(import.meta.env.VITE_IFRAME_ORIGINS ?? '').split(',').map(item => item.trim())
    if (!origins.includes(new URL(externalLink).origin))
      throw new Error('iframe 来源不在独立白名单中')
  }
  const permissions = typeof model.permissions === 'string'
    ? stringArray(model.permissions.split(',').map(item => item.trim()).filter(Boolean))
    : stringArray(model.permissions ?? [])
  if (type === 'button' && !permissions.length)
    throw new Error('按钮必须配置权限标识')
  return {
    type,
    path,
    component,
    externalLink,
    permissions,
    name: type === 'button' ? '' : text(model.name, '路由名', true),
    parentId: text(model.parentId, '父节点'),
    title: text(model.title, '标题', true),
    icon: text(model.icon, '图标'),
    order: integer(model.order ?? 0),
    hidden: model.hidden === true,
  }
}
export function parseMenu(value: unknown): Menu {
  const raw = object(value)
  // 远端业务菜单包含未生成页面时，仍允许管理其资料；路由下发另经严格白名单验证。
  return {
    id: text(raw.id, '菜单 ID', true),
    title: text(raw.title, '标题', true),
    parentId: text(raw.parentId, '父节点'),
    type: raw.type as MenuType,
    path: text(raw.path, '路径'),
    name: text(raw.name, '路由名'),
    component: text(raw.component, '组件'),
    icon: text(raw.icon, '图标'),
    order: integer(raw.order ?? 0),
    hidden: raw.hidden === true,
    permissions: stringArray(raw.permissions ?? (raw.permission ? [raw.permission] : [])),
    externalLink: text(raw.externalLink, '外链'),
    children: raw.children === undefined ? undefined : rows(raw.children, parseMenu),
  }
}
export function createMenuService(transport: BusinessTransport) {
  return {
    list: async () => rows(await transport.request('GET', '/system/menus'), parseMenu),
    create: async (input: MenuInput) => parseMenu(await transport.request('POST', '/system/menus', { body: input })),
    update: async (id: string, input: MenuInput) => parseMenu(await transport.request('PUT', `/system/menus/${encodeURIComponent(id)}`, { body: input })),
    remove: (id: string) => transport.request<void>('DELETE', `/system/menus/${encodeURIComponent(id)}`),
  }
}
