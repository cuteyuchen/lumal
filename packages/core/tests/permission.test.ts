import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import {
  createPermissionDirective,
  createPermissionStore,
  hasPermission,
  hasRole,
  LumaAccessControl,
  providePermissionStore,
  setupPermissionGuard,
  usePermissionStore,
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

  it('accessControl 会响应权限更新并支持 fallback', async () => {
    const store = createPermissionStore({ permissions: ['system:user:list'] })
    const wrapper = mount(LumaAccessControl, {
      props: {
        permission: 'system:user:create',
        store,
      },
      slots: {
        default: '<button class="allowed">新增</button>',
        fallback: '<span class="denied">无权限</span>',
      },
    })

    expect(wrapper.find('.denied').exists()).toBe(true)
    store.setPermissions(['system:user:create'])
    await nextTick()
    expect(wrapper.find('.allowed').exists()).toBe(true)
  })

  it('accessControl 对权限和角色使用 AND，并分别支持 some/every', async () => {
    const store = createPermissionStore({
      permissions: ['report:read'],
      roles: ['admin'],
    })
    const wrapper = mount(LumaAccessControl, {
      props: {
        mode: 'some',
        permissions: ['report:read', 'report:write'],
        roleMode: 'every',
        roles: ['admin', 'auditor'],
        store,
      },
      slots: {
        default: '<span class="allowed">允许</span>',
        fallback: '<span class="denied">拒绝</span>',
      },
    })

    expect(wrapper.find('.denied').exists()).toBe(true)
    store.setRoles(['admin', 'auditor'])
    await nextTick()
    expect(wrapper.find('.allowed').exists()).toBe(true)
    store.setPermissions([])
    await nextTick()
    expect(wrapper.find('.denied').exists()).toBe(true)
  })

  it('provide/use API 会向后代提供同一 PermissionStore', () => {
    const store = createPermissionStore({ roles: ['admin'] })
    const Child = defineComponent({
      setup() {
        const injected = usePermissionStore()
        return () => h('span', { class: 'role-result' }, String(injected.hasRole('admin')))
      },
    })
    const Parent = defineComponent({
      setup() {
        providePermissionStore(store)
        return () => h(Child)
      },
    })

    expect(mount(Parent).find('.role-result').text()).toBe('true')
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

  it('嵌套路由会逐级校验权限和角色，并在层级之间使用 AND', () => {
    const store = createPermissionStore({
      permissions: ['child:read'],
      roles: ['user'],
    })
    const beforeEach = vi.fn()

    setupPermissionGuard({ beforeEach }, store, {
      mode: 'some',
      noAccessRedirect: '/403',
      roleMode: 'some',
    })

    const guard = beforeEach.mock.calls[0]?.[0]
    const route = {
      matched: [
        { meta: { permissions: ['parent:read', 'parent:write'], roles: ['admin', 'owner'] } },
        { meta: { permissions: ['child:read', 'child:write'] } },
      ],
      meta: { permissions: ['child:read', 'child:write'] },
    }

    expect(guard(route)).toBe('/403')

    store.setPermissions(['parent:write', 'child:read'])
    store.setRoles(['owner'])
    expect(guard(route)).toBe(true)

    store.setRoles(['user'])
    expect(guard(route)).toBe('/403')
  })

  it('嵌套路由的每一级会分别保留 every 匹配模式', () => {
    const store = createPermissionStore({
      permissions: ['parent:read', 'parent:write', 'child:read', 'child:write'],
      roles: ['admin', 'auditor'],
    })
    const beforeEach = vi.fn()

    setupPermissionGuard({ beforeEach }, store, {
      mode: 'every',
      noAccessRedirect: '/403',
      roleMode: 'every',
    })

    const guard = beforeEach.mock.calls[0]?.[0]
    const route = {
      matched: [
        { meta: { permissions: ['parent:read', 'parent:write'], roles: ['admin'] } },
        { meta: { permissions: ['child:read', 'child:write'], roles: ['auditor'] } },
      ],
      meta: { permissions: ['child:read', 'child:write'], roles: ['auditor'] },
    }

    expect(guard(route)).toBe(true)

    store.setPermissions(['parent:read', 'child:read', 'child:write'])
    expect(guard(route)).toBe('/403')

    store.setPermissions(['parent:read', 'parent:write', 'child:read', 'child:write'])
    store.setRoles(['admin'])
    expect(guard(route)).toBe('/403')
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
