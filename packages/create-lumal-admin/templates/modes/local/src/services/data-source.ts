import type { LumalMenuRecord } from '@lumal/core/router'
import type { AccessSnapshot, ApplicationService, CurrentUser, DataRow, ServiceContext } from './contracts'
import { localMenus } from '../router/views'

export const demoAccount = import.meta.env.DEV ? { username: 'admin', password: 'lumal123' } : null

// 本地演示数据独立于 HTTP 模板，生产构建默认拒绝演示认证。
export function createBackend(context: ServiceContext): ApplicationService {
  const permissions = [...new Set(localMenus.flatMap((menu) => {
    const prefix = String(menu.meta?.permissionPrefix ?? '')
    return prefix ? ['list', 'view', 'create', 'update', 'delete', 'authorize'].map(action => `${prefix}:${action}`) : []
  }))]
  const initial: Record<string, DataRow[]> = {
    users: [
      { id: 'admin', username: 'admin', nickname: '管理员', roles: ['admin'], status: 'enabled' },
      { id: 'guest', username: 'guest', nickname: '访客', roles: ['guest'], status: 'enabled' },
    ],
    roles: [
      { id: 'admin', code: 'admin', name: '管理员', status: 'enabled', permissions },
      { id: 'guest', code: 'guest', name: '访客', status: 'enabled', permissions: [] },
    ],
    menus: localMenus.map(menu => ({
      id: menu.name ?? menu.path,
      title: menu.meta?.title,
      path: menu.path,
      name: menu.name,
      component: menu.component,
      permission: menu.meta?.authority,
      type: 'menu',
      hidden: false,
    })),
    config: [{ id: 'appName', key: 'appName', value: 'Lumal Admin' }, { id: 'pageSize', key: 'pageSize', value: '10' }],
  }
  function readRows(resource: string): DataRow[] {
    const value = localStorage.getItem(`demo:system:${resource}`)
    return value ? JSON.parse(value) as DataRow[] : structuredClone(initial[resource] ?? [])
  }
  function assertDemo(): void {
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_LOCAL_DEMO !== 'true')
      throw new Error('生产环境已禁用本地演示，请使用 HTTP 模式或显式启用演示')
  }
  function getUser(): CurrentUser {
    assertDemo()
    const raw = sessionStorage.getItem(`demo:${context.getSession()?.accessToken ?? ''}`)
    if (!raw)
      throw new Error('本地演示会话已失效')
    return JSON.parse(raw) as CurrentUser
  }
  function getAccess(): AccessSnapshot {
    const user = getUser()
    const record = readRows('users').find(row => row.username === user.username)
    if (!record || record.status === 'disabled')
      throw new Error('本地账号已停用或删除，请重新登录')
    const roles = Array.isArray(record.roles) ? record.roles.map(String) : []
    return {
      roles,
      permissions: [...new Set(readRows('roles').filter(role => roles.includes(String(role.code)) && role.status !== 'disabled').flatMap(role => Array.isArray(role.permissions) ? role.permissions.map(String) : []))],
    }
  }
  function writeRows(resource: string, rows: DataRow[]): void {
    localStorage.setItem(`demo:system:${resource}`, JSON.stringify(rows))
  }
  function assertWrite(resource: string, action: string): void {
    const menu = localMenus.find(menu => menu.meta?.resource === resource)
    const prefix = String(menu?.meta?.permissionPrefix ?? '')
    if (!prefix || !getAccess().permissions.includes(`${prefix}:${action}`))
      throw new Error('无操作权限')
  }
  function buildMenus(rows: DataRow[]): LumalMenuRecord[] {
    const active = new Set<string>()
    const identities = new Set(rows.map(row => String(row.id)))
    const visit = (parentId = ''): LumalMenuRecord[] => rows
      .filter(row => String(row.parentId ?? '') === parentId && row.type !== 'button')
      .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0))
      .map((row) => {
        const id = String(row.id)
        if (active.has(id))
          throw new Error('菜单存在循环父节点')
        active.add(id)
        const original = localMenus.find(menu => menu.component === row.component)
        if (row.type !== 'directory' && !original)
          throw new Error(`菜单组件不在预设白名单中：${String(row.component)}`)
        const children = visit(id)
        active.delete(id)
        return {
          path: String(row.path),
          name: String(row.name),
          component: row.type === 'directory' ? undefined : original?.component,
          children,
          meta: { ...original?.meta, title: String(row.title), hideInMenu: Boolean(row.hidden), authority: row.permission as string | string[], order: Number(row.order ?? 0) },
        }
      })
    for (const row of rows) {
      const parents = new Set([String(row.id)])
      let parent = String(row.parentId ?? '')
      while (parent) {
        if (parents.has(parent) || !identities.has(parent))
          throw new Error('菜单父节点不存在或形成循环')
        parents.add(parent)
        parent = String(rows.find(item => String(item.id) === parent)?.parentId ?? '')
      }
      if (typeof row.path !== 'string' || !row.path.startsWith('/') || !row.name)
        throw new Error('菜单必须配置绝对路径与唯一名称')
    }
    return visit()
  }
  return {
    async login(input, signal) {
      assertDemo()
      signal.throwIfAborted()
      const account = readRows('users').find(row => row.username === input.username)
      if (!account || account.status === 'disabled' || input.password !== 'lumal123')
        throw new Error('账号或密码不正确')
      const accessToken = crypto.randomUUID()
      sessionStorage.setItem(`demo:${accessToken}`, JSON.stringify({ id: input.username, name: input.username, username: input.username }))
      return { accessToken }
    },
    getUser: async (signal) => {
      signal.throwIfAborted()
      return getUser()
    },
    getAccess: async (signal) => {
      signal.throwIfAborted()
      return getAccess()
    },
    getMenus: async (signal) => {
      signal.throwIfAborted()
      getUser()
      // 只解析本预设组件白名单；菜单可编辑层级，不接受任意远程 import。
      return buildMenus(readRows('menus'))
    },
    logout: async (token) => { sessionStorage.removeItem(`demo:${token}`) },
    clearCache() {},
    async list(resource, input) {
      assertWrite(resource, resource === 'config' ? 'view' : 'list')
      const keyword = String(input.query.keyword ?? '').trim()
      const rows = readRows(resource).filter(row => (!keyword || Object.values(row).some(value => String(value).includes(keyword)))
        && (!input.query.typeCode || row.typeCode === input.query.typeCode))
      if (typeof input.query.sortField === 'string' && input.query.sortOrder) {
        const field = input.query.sortField
        rows.sort((left, right) => String(left[field] ?? '').localeCompare(String(right[field] ?? ''), 'zh-CN', { numeric: true }) * (input.query.sortOrder === 'desc' ? -1 : 1))
      }
      return { items: rows.slice((input.page - 1) * input.pageSize, input.page * input.pageSize), total: rows.length }
    },
    async save(resource, model, id) {
      assertWrite(resource, id ? 'update' : 'create')
      if (resource === 'roles' && Array.isArray(model.permissions))
        assertWrite(resource, 'authorize')
      const rows = readRows(resource)
      if (id && !rows.some(row => row.id === id))
        throw new Error('记录不存在')
      const record: DataRow = { ...model, id: id ?? crypto.randomUUID() }
      const uniqueField = resource === 'users' ? 'username' : resource === 'roles' ? 'code' : undefined
      if (uniqueField && rows.some(row => row.id !== id && row[uniqueField] === record[uniqueField]))
        throw new Error(`${uniqueField} 重复`)
      if (resource === 'users' && id === 'admin' && (record.status === 'disabled' || !Array.isArray(record.roles) || !record.roles.includes('admin')))
        throw new Error('不能停用或移除内置管理员角色')
      const assignedPermissions = record.permissions
      if (resource === 'roles' && id === 'admin' && (record.code !== 'admin' || record.status === 'disabled' || !Array.isArray(assignedPermissions) || !permissions.every(code => assignedPermissions.includes(code))))
        throw new Error('不能停用或移除内置管理员权限')
      const next = id ? rows.map(row => row.id === id ? record : row) : [...rows, record]
      if (resource === 'menus')
        buildMenus(next)
      writeRows(resource, next)
      return record
    },
    async remove(resource, id) {
      assertWrite(resource, 'delete')
      if (['users', 'roles'].includes(resource) && id === 'admin')
        throw new Error('不能删除内置管理员')
      if (resource === 'menus' && readRows(resource).some(row => row.parentId === id))
        throw new Error('请先删除子菜单')
      writeRows(resource, readRows(resource).filter(row => row.id !== id))
    },
  }
}
