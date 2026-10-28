import { MenuRouteConflictError } from '@lumal/core/router'
import { resolveIconDefinition } from '@lumal/icons'
import { ElMessageBox } from 'element-plus'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import * as adminIcons from '../src/icons'
import {
  createAdminRouter,
  createAdminSidebarMenus,
  createAdminTabs,
  ensureAdminRoutes,
  getAdminRouteNames,
  permissionStore,
} from '../src/router'
import { staticAdminRouteRecords } from '../src/router/routes'
import { adminSession, login, logout } from '../src/services/session'

describe('lumal admin router', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await logout()
  })

  it('静态壳层路由包含工作台、个人中心和关于且使用标准 meta 字段', () => {
    // 动态菜单（系统管理、功能示例、项目等）改由后端 GET /menu 下发，
    // 前端静态路由只保留不随权限变化的壳层页面。
    const dashboardRoute = staticAdminRouteRecords.find(route => route.path === '/dashboard')
    const profileRoute = staticAdminRouteRecords.find(route => route.path === '/profile')
    const aboutRoute = staticAdminRouteRecords.find(route => route.path === '/about')

    expect(staticAdminRouteRecords.map(route => route.path)).toEqual(['/dashboard', '/profile', '/about'])
    expect(dashboardRoute).toMatchObject({
      component: 'dashboard/index',
      path: '/dashboard',
      meta: {
        authority: ['dashboard:view'],
        title: '工作台',
      },
    })
    expect(profileRoute).toMatchObject({
      component: 'profile/index',
      path: '/profile',
      meta: {
        hideInMenu: true,
        title: '个人中心',
      },
    })
    expect(aboutRoute).toMatchObject({
      component: 'about/index',
      path: '/about',
      meta: {
        icon: 'lumal:monitor',
        title: '关于',
      },
    })
    expect(JSON.stringify(staticAdminRouteRecords)).not.toContain('"permissions"')
    expect(JSON.stringify(staticAdminRouteRecords)).not.toContain('"dictType"')
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
            badge: 'NEW',
            badgeTone: 'primary',
            badgeType: 'text',
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
          {
            children: [],
            icon: 'lumal:grid',
            path: '/examples/icons',
            title: '图标',
          },
          { children: [], icon: 'lumal:monitor', path: '/examples/viewport', title: 'Viewport' },
          { children: [], icon: 'app:chart', path: '/examples/datav', title: 'DataV' },
          { children: [], icon: 'lumal:monitor', path: '/examples/cockpit', title: 'Cockpit Runtime' },
        ],
        icon: 'app:examples',
        path: '/examples',
        redirect: '/examples/overview',
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
        redirect: '/system/user',
        title: '系统管理',
      },
      {
        children: [],
        icon: 'lumal:monitor',
        path: '/about',
        title: '关于',
      },
    ])
  })

  it('创建 Router 时立即注册静态菜单，远程菜单等待登录加载', () => {
    const router = createAdminRouter(createMemoryHistory())

    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(router.hasRoute('Profile')).toBe(true)
    expect(router.hasRoute('About')).toBe(true)
    expect(router.hasRoute('AdminCockpit')).toBe(false)
    expect(router.hasRoute('System')).toBe(false)
  })

  it.each(['admin', 'operator', 'guest'] as const)('%s 可从菜单访问图标示例并恢复深层地址', async (role) => {
    await login(role)
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/examples/icons?source=refresh')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/examples/icons?source=refresh')
    expect(router.currentRoute.value.name).toBe('ExamplesIcons')
    expect(createAdminSidebarMenus(router).find(menu => menu.path === '/examples')?.children)
      .toContainEqual({ children: [], icon: 'lumal:grid', path: '/examples/icons', title: '图标' })
  })

  it('operator 只能看到字典系统菜单、项目和示例字典能力', async () => {
    await login('operator')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    const menus = createAdminSidebarMenus(router)
    const systemMenu = menus.find(menu => menu.path === '/system')

    expect(menus.map(menu => menu.path)).toEqual(['/dashboard', '/examples', '/project', '/resources', '/system', '/about'])
    expect(systemMenu?.children.map(menu => menu.path)).toEqual(['/system/dict', '/system/dict-item'])
  })

  it('guest 只能看到工作台和基础示例菜单', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    const menus = createAdminSidebarMenus(router)
    const examplesMenu = menus.find(menu => menu.path === '/examples')

    expect(menus.map(menu => menu.path)).toEqual(['/dashboard', '/examples', '/resources', '/about'])
    expect(examplesMenu?.children.map(menu => menu.path)).not.toContain('/examples/dictionary')
    expect(examplesMenu?.children.map(menu => menu.path)).not.toContain('/examples/cockpit')
    expect(examplesMenu?.children.map(menu => menu.path)).toEqual(expect.arrayContaining([
      '/examples/overview',
      '/examples/theme-settings',
      '/examples/services',
    ]))
  })

  it.each(['/examples/viewport', '/examples/datav', '/examples/cockpit'])('新示例 %s 可恢复深层路由', async (path) => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await router.push(`${path}?source=refresh`)
    await router.isReady()
    expect(router.currentRoute.value.fullPath).toBe(`${path}?source=refresh`)
    expect(router.currentRoute.value.meta.workspaceViewport).toBe(path === '/examples/viewport' ? 'flow-only' : 'self-managed')
    expect(router.currentRoute.value.meta.viewport).toEqual(path === '/examples/viewport'
      ? { mode: 'contain', designWidth: 960, designHeight: 540 }
      : undefined)
  })

  it('guest 不因基础示例权限获得 Cockpit 访问权', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/examples/cockpit')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/403')
  })

  it.each(['/dashboard', '/about'])('未登录访问 %s 会跳转到登录页并携带 redirect', async (path) => {
    const router = createAdminRouter(createMemoryHistory())

    await router.push(path)
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe(path)
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

  it('刷新凭据失效时进入受保护页面会重定向到登录页', async () => {
    vi.spyOn(ElMessageBox, 'alert').mockResolvedValue('confirm' as never)
    await login('admin')
    adminSession.setSession({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    })
    const router = createAdminRouter(createMemoryHistory())

    await expect(router.push('/system/user')).resolves.toBeUndefined()

    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/system/user')
    expect(adminSession.getSession()).toBeNull()
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

  it('远程菜单加载失败时保留静态菜单和静态路由', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory(), {
      loadRemoteMenus: async () => {
        throw new Error('菜单服务不可用')
      },
    })

    await expect(ensureAdminRoutes(router)).rejects.toThrow('菜单服务不可用')
    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(router.hasRoute('System')).toBe(false)
    expect(createAdminSidebarMenus(router).map(menu => menu.path)).toEqual(['/dashboard', '/about'])
  })

  it('远程菜单与静态菜单冲突时不留下部分远程路由', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory(), {
      loadRemoteMenus: async () => [
        {
          component: 'dashboard/index',
          meta: { title: '临时页面' },
          name: 'TemporaryPage',
          path: '/temporary-page',
        },
        {
          component: 'dashboard/index',
          meta: { title: '冲突页面' },
          name: 'DuplicateDashboardPath',
          path: '/dashboard',
        },
      ],
    })

    await expect(ensureAdminRoutes(router)).rejects.toBeInstanceOf(MenuRouteConflictError)
    expect(router.hasRoute('TemporaryPage')).toBe(false)
    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(getAdminRouteNames(router)).toEqual([])
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

  it('个人中心可直接访问但不会出现在侧边栏', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/profile')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('Profile')
    expect(createAdminSidebarMenus(router).some(menu => menu.path === '/profile')).toBe(false)
  })

  it.each(['admin', 'operator', 'guest'] as const)('%s 可从菜单访问关于页并生成可关闭标签', async (role) => {
    await login(role)
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/about')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('About')
    expect(createAdminSidebarMenus(router)).toContainEqual({
      children: [],
      icon: 'lumal:monitor',
      path: '/about',
      title: '关于',
    })
    expect(createAdminTabs('/about', router)).toContainEqual({
      closable: true,
      icon: 'lumal:monitor',
      path: '/about',
      title: '关于',
    })
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
        path: '/resources/datav-guide',
      }),
    ]))
  })

  it('登出后会移除动态路由并清空菜单', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await ensureAdminRoutes(router)

    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(router.hasRoute('SystemUser')).toBe(true)

    await logout()

    expect(router.hasRoute('SystemUser')).toBe(false)
    expect(router.hasRoute('Dashboard')).toBe(true)
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
    await login('admin')
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

  it('无父菜单权限时不能直接访问未声明权限的子路由', async () => {
    await login('guest')
    const router = createAdminRouter(createMemoryHistory(), {
      loadRemoteMenus: async () => [
        {
          children: [
            {
              component: 'dashboard/index',
              meta: { title: '子页面' },
              name: 'RestrictedChild',
              path: 'child',
            },
          ],
          meta: { authority: ['restricted:parent:view'], title: '受限父菜单' },
          name: 'RestrictedParent',
          path: '/restricted-parent',
        },
      ],
    })

    await router.push('/restricted-parent/child')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
    expect(createAdminSidebarMenus(router).some(menu => menu.path === '/restricted-parent')).toBe(false)
  })

  it('有项目权限时可以访问项目路由', async () => {
    await login('operator')

    const router = createAdminRouter(createMemoryHistory())

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/project')
  })

  it('菜单实际使用 Element Plus 时准备图标资源，加载失败也不阻断路由', async () => {
    await login('admin')
    const loadRemoteMenus = async () => [{
      path: '/element-plus-menu',
      name: 'ElementPlusMenu',
      meta: { title: '图标菜单' },
      children: [{
        path: 'child',
        name: 'ElementPlusMenuChild',
        component: 'dashboard/index',
        meta: { title: '子页面', icon: 'element-plus:Edit' },
      }],
    }]
    const firstRouter = createAdminRouter(createMemoryHistory(), { loadRemoteMenus })
    await ensureAdminRoutes(firstRouter)
    expect(resolveIconDefinition('element-plus:Edit')?.svgText).toContain('<svg')

    vi.spyOn(adminIcons, 'registerAdminElementPlusIcons').mockRejectedValueOnce(new Error('offline'))
    const secondRouter = createAdminRouter(createMemoryHistory(), { loadRemoteMenus })
    await expect(ensureAdminRoutes(secondRouter)).resolves.toBeUndefined()
    expect(getAdminRouteNames(secondRouter)).toContain('ElementPlusMenuChild')
  })
})
