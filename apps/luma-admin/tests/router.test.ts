import { afterEach, describe, expect, it } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import {
  createAdminRouter,
  createAdminSidebarMenus,
  ensureAdminRoutes,
  getAdminRouteNames,
  permissionStore,
} from '../src/router'
import { adminRouteRecords } from '../src/router/routes'
import { adminSession, login, logout } from '../src/services/session'

describe('luma admin router', () => {
  afterEach(async () => {
    await logout()
  })

  it('示例路由配置使用标准 meta.authority 字段', () => {
    const examplesRoute = adminRouteRecords.find(route => route.path === '/examples')
    const projectRoute = adminRouteRecords.find(route => route.path === '/project')
    const systemRoute = adminRouteRecords.find(route => route.path === '/system')

    expect(adminRouteRecords[0]).toMatchObject({
      path: '/dashboard',
      meta: {
        authority: ['dashboard:view'],
        title: '工作台',
      },
    })
    expect(examplesRoute).toMatchObject({
      path: '/examples',
      meta: {
        authority: ['examples:view'],
        title: '功能示例',
      },
    })
    expect(systemRoute).toMatchObject({
      path: '/system',
      meta: {
        title: '系统管理',
      },
    })
    expect(systemRoute?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'user',
        meta: expect.objectContaining({
          authority: ['system:user:list'],
          title: '用户管理',
        }),
      }),
      expect.objectContaining({
        path: 'organization',
        meta: expect.objectContaining({
          authority: ['system:organization:list'],
          title: '机构管理',
        }),
      }),
      expect.objectContaining({
        path: 'dict',
        meta: expect.objectContaining({
          authority: ['system:dict:list'],
          title: '字典分类',
        }),
      }),
      expect.objectContaining({
        path: 'dict-item',
        meta: expect.objectContaining({
          authority: ['system:dict:list'],
          title: '字典项',
        }),
      }),
    ]))
    expect(examplesRoute?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: 'overview',
        meta: expect.objectContaining({
          authority: ['examples:view'],
          title: '示例总览',
        }),
      }),
    ]))
    expect(projectRoute).toMatchObject({
      path: '/project',
      meta: {
        authority: ['project:list'],
        title: '项目管理',
      },
    })
    expect(JSON.stringify(adminRouteRecords)).not.toContain('"permissions"')
    expect(JSON.stringify(adminRouteRecords)).not.toContain('"dictType"')
  })

  it('admin 会看到系统管理全量菜单', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    expect(createAdminSidebarMenus(router)).toEqual([
      {
        children: [],
        icon: 'app:dashboard',
        path: '/dashboard',
        title: '工作台',
      },
      {
        children: [
          {
            children: [],
            icon: 'app:examples',
            path: '/examples/overview',
            title: '示例总览',
          },
          {
            children: [],
            icon: 'app:theme',
            path: '/examples/theme-settings',
            title: '主题与动画',
          },
          {
            children: [],
            icon: 'app:table',
            path: '/examples/page-layout',
            title: '页面布局',
          },
          {
            children: [],
            icon: 'app:form',
            path: '/examples/schema-form',
            title: 'Schema Form',
          },
          {
            children: [],
            icon: 'app:table',
            path: '/examples/schema-table',
            title: 'Schema Table',
          },
          {
            children: [],
            icon: 'app:table',
            path: '/examples/crud-table',
            title: 'CRUD Table',
          },
          {
            children: [],
            icon: 'app:form',
            path: '/examples/dictionary',
            title: 'Dictionary',
          },
          {
            children: [],
            icon: 'app:examples',
            path: '/examples/info-reference',
            title: 'Info Reference',
          },
          {
            children: [],
            icon: 'app:examples',
            path: '/examples/composables',
            title: 'Composables',
          },
          {
            children: [],
            icon: 'app:examples',
            path: '/examples/utils',
            title: 'Utils',
          },
          {
            children: [],
            icon: 'app:examples',
            path: '/examples/services',
            title: 'Services',
          },
          {
            children: [],
            icon: 'app:chart',
            path: '/examples/chart',
            title: 'Chart',
          },
          {
            children: [],
            icon: 'app:chart',
            path: '/examples/chart-panel',
            title: 'Chart Panel',
          },
        ],
        icon: 'app:examples',
        path: '/examples',
        title: '功能示例',
      },
      {
        children: [],
        icon: 'app:dashboard',
        path: '/project',
        title: '项目管理',
      },
      expect.objectContaining({
        path: '/resources',
        title: '外部资源',
      }),
      {
        children: [
          { children: [], icon: 'app:user', path: '/system/user', title: '用户管理' },
          { children: [], icon: 'app:role', path: '/system/role', title: '角色管理' },
          { children: [], icon: 'app:menu', path: '/system/menu', title: '菜单管理' },
          { children: [], icon: 'app:organization', path: '/system/organization', title: '机构管理' },
          { children: [], icon: 'app:dict', path: '/system/dict', title: '字典分类' },
          { children: [], icon: 'app:dict', path: '/system/dict-item', title: '字典项' },
          { children: [], icon: 'app:settings', path: '/system/config', title: '系统配置' },
        ],
        icon: 'app:system',
        path: '/system',
        title: '系统管理',
      },
    ])
  })

  it('operator 只能看到字典系统菜单、项目和示例字典能力', async () => {
    await login('operator')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    const menus = createAdminSidebarMenus(router)
    const systemMenu = menus.find(menu => menu.path === '/system')

    expect(menus.map(menu => menu.path)).toEqual(['/dashboard', '/examples', '/project', '/resources', '/system'])
    expect(systemMenu?.children.map(menu => menu.path)).toEqual(['/system/dict', '/system/dict-item'])
  })

  it('guest 只能看到工作台和基础示例菜单', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    const menus = createAdminSidebarMenus(router)
    const examplesMenu = menus.find(menu => menu.path === '/examples')

    expect(menus.map(menu => menu.path)).toEqual(['/dashboard', '/examples', '/resources'])
    expect(examplesMenu?.children.map(menu => menu.path)).not.toContain('/examples/dictionary')
    expect(examplesMenu?.children.map(menu => menu.path)).toEqual(expect.arrayContaining([
      '/examples/overview',
      '/examples/theme-settings',
      '/examples/services',
    ]))
  })

  it('未登录访问后台页面会跳转到登录页并携带 redirect', async () => {
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/dashboard')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
  })

  it('登录页未登录时也可以直接访问', async () => {
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/login')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('登录 admin 后可以访问工作台', async () => {
    await login('admin')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/dashboard')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/dashboard')
    expect(router.hasRoute('Dashboard')).toBe(true)
  })

  it('并发初始化只注册一份动态路由', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())

    await Promise.all([
      ensureAdminRoutes(router),
      ensureAdminRoutes(router),
      ensureAdminRoutes(router),
    ])

    const names = getAdminRouteNames(router)
    expect(names.length).toBeGreaterThan(0)
    expect(new Set(names).size).toBe(names.length)
  })

  it('刷新深层地址时会先注册菜单路由再恢复原地址', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/system/user?source=refresh')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/system/user?source=refresh')
    expect(router.currentRoute.value.name).toBe('SystemUser')
  })

  it('机构管理深层地址可注册并恢复', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/system/organization?source=refresh')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/system/organization?source=refresh')
    expect(router.currentRoute.value.name).toBe('SystemOrganization')
  })

  it('未知地址会进入独立 404 页面', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/missing/deep-page')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/404')
    expect(router.currentRoute.value.name).toBe('AdminNotFound')
  })

  it('菜单外链同时支持新窗口和站内内嵌策略', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    const resources = createAdminSidebarMenus(router).find(menu => menu.path === '/resources')

    expect(resources?.children).toEqual(expect.arrayContaining([
      expect.objectContaining({
        externalTarget: '_blank',
        path: '/resources/docs',
      }),
      expect.objectContaining({
        externalTarget: '_self',
        path: '/resources/preview',
      }),
    ]))
  })

  it('登出后会移除动态路由并清空菜单', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    expect(router.hasRoute('SystemUser')).toBe(true)

    await logout()

    expect(router.hasRoute('SystemUser')).toBe(false)
    expect(getAdminRouteNames(router)).toEqual([])
    expect(createAdminSidebarMenus(router)).toEqual([])
  })

  it('有字典权限时可以访问字典示例路由', async () => {
    await login('admin')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/examples/dictionary')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/examples/dictionary')
  })

  it('无受限示例权限时访问受限示例会跳转到 403', async () => {
    adminSession.setToken('test-token')
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/examples/restricted')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('无项目权限时访问项目路由会跳转到 403', async () => {
    await login('guest')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('operator 无用户管理权限时访问系统用户路由会跳转到 403', async () => {
    await login('operator')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/system/user')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('有项目权限时可以访问项目路由', async () => {
    await login('operator')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/project')
  })
})
