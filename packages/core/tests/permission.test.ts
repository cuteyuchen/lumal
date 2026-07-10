import { describe, expect, it, vi } from 'vitest'
import {
  createPermissionDirective,
  createPermissionStore,
  hasPermission,
  hasRole,
  setupPermissionGuard,
} from '../src/permission'

describe('permission helpers', () => {
  it('会按 some/every 模式判断权限码', () => {
    const permissions = ['system:user:list', 'system:user:create']

    expect(hasPermission(permissions, 'system:user:list')).toBe(true)
    expect(hasPermission(permissions, ['system:user:list', 'system:user:delete'])).toBe(true)
    expect(hasPermission(permissions, ['system:user:list', 'system:user:delete'], 'every')).toBe(false)
  })

  it('会按 some/every 模式判断角色', () => {
    const roles = ['admin', 'auditor']

    expect(hasRole(roles, 'admin')).toBe(true)
    expect(hasRole(roles, ['admin', 'editor'])).toBe(true)
    expect(hasRole(roles, ['admin', 'editor'], 'every')).toBe(false)
  })
})

describe('permission store', () => {
  it('会更新并判断权限和角色', () => {
    const store = createPermissionStore({
      permissions: ['system:user:list'],
      roles: ['admin'],
    })

    expect(store.hasPermission('system:user:list')).toBe(true)
    expect(store.hasRole('admin')).toBe(true)

    store.setPermissions(['system:dict:list'])
    store.setRoles(['auditor'])

    expect(store.hasPermission('system:user:list')).toBe(false)
    expect(store.hasPermission('system:dict:list')).toBe(true)
    expect(store.hasRole('admin')).toBe(false)
    expect(store.hasRole('auditor')).toBe(true)
  })
})

describe('permission directive', () => {
  it('无权限时会隐藏元素', () => {
    const store = createPermissionStore({
      permissions: ['system:user:list'],
    })
    const directive = createPermissionDirective(store)
    const element = document.createElement('button')

    directive.mounted?.(element, {
      value: 'system:user:delete',
    } as never, null as never, null as never)

    expect(element.style.display).toBe('none')
  })
})

describe('permission guard', () => {
  it('路由无权限时会返回重定向路径', async () => {
    const store = createPermissionStore({
      permissions: ['system:user:list'],
      roles: ['admin'],
    })
    const beforeEach = vi.fn()
    const router = {
      beforeEach,
    }

    setupPermissionGuard(router, store, {
      noAccessRedirect: '/403',
    })

    const guard = beforeEach.mock.calls[0]?.[0]

    expect(guard({
      meta: {
        permissions: ['system:user:delete'],
      },
    })).toBe('/403')
    expect(guard({
      meta: {
        permissions: ['system:user:list'],
        roles: ['admin'],
      },
    })).toBe(true)
  })

  it('登录页与白名单路径始终放行', () => {
    const store = createPermissionStore({ permissions: [] })
    const beforeEach = vi.fn()

    setupPermissionGuard({ beforeEach }, store, {
      isAuthenticated: () => false,
      loginPath: '/login',
      requireLoginByDefault: true,
      whiteList: ['/about'],
    })

    const guard = beforeEach.mock.calls[0]?.[0]

    expect(guard({ path: '/login', meta: {} })).toBe(true)
    expect(guard({ path: '/about', meta: {} })).toBe(true)
  })

  it('未登录访问需要登录的路由会携带原始路径跳转登录页', () => {
    const store = createPermissionStore({ permissions: [] })
    const beforeEach = vi.fn()

    setupPermissionGuard({ beforeEach }, store, {
      isAuthenticated: () => false,
      redirectQueryKey: 'redirect',
      requireLoginByDefault: true,
    })

    const guard = beforeEach.mock.calls[0]?.[0]

    expect(guard({
      path: '/system/user',
      fullPath: '/system/user?tab=1',
      meta: {},
    })).toEqual({
      path: '/login',
      query: { redirect: '/system/user?tab=1' },
    })
  })

  it('已登录后按 meta.requireLogin === false 免登录放行', () => {
    const store = createPermissionStore({ permissions: ['dashboard:view'] })
    const beforeEach = vi.fn()

    setupPermissionGuard({ beforeEach }, store, {
      isAuthenticated: () => false,
      requireLoginByDefault: true,
    })

    const guard = beforeEach.mock.calls[0]?.[0]

    expect(guard({
      path: '/public',
      meta: { requireLogin: false },
    })).toBe(true)
  })
})
