import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  createGlobComponentResolver,
  createRouteRecords,
  createRouteRegistry,
  createSidebarMenus,
  createTopMenus,
  findFirstAccessibleMenu,
  normalizeMenuNodes,
  normalizeMenuRecords,
} from '../src/router'

describe('router menu helpers', () => {
  it('会按 Vue Router 和 Vben 风格字段归一化菜单记录', () => {
    const menus = normalizeMenuRecords([
      {
        path: '/project',
        name: 'Project',
        component: 'project/index',
        meta: {
          title: '项目管理',
          icon: 'app:project',
          order: 2,
          authority: 'project:list',
          roles: ['admin'],
          keepAlive: true,
        },
      },
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: 'dashboard/index',
        meta: {
          title: '工作台',
          icon: 'app:dashboard',
          order: 1,
          authority: ['dashboard:view'],
        },
      },
      {
        path: '/hidden',
        name: 'Hidden',
        meta: {
          title: '隐藏页面',
          hideInMenu: true,
        },
      },
    ])

    expect(menus.map(item => item.name)).toEqual(['Dashboard', 'Project', 'Hidden'])
    expect(menus[0]).toMatchObject({
      authority: ['dashboard:view'],
      component: 'dashboard/index',
      icon: 'app:dashboard',
      path: '/dashboard',
      roles: [],
      title: '工作台',
      visible: true,
    })
    expect(menus[1]).toMatchObject({
      authority: ['project:list'],
      keepAlive: true,
      roles: ['admin'],
      title: '项目管理',
    })
    expect(menus[2]?.visible).toBe(false)
  })

  it('会按字段映射归一化非标准菜单记录', () => {
    const menus = normalizeMenuRecords([
      {
        childrenItems: [
          {
            menuTitle: '概览',
            routePath: 'overview',
          },
        ],
        componentName: 'examples/index',
        hiddenFlag: false,
        menuTitle: '功能示例',
        orderIndex: 2,
        permissionCodes: ['examples:view'],
        roleCodes: ['admin'],
        routeName: 'Examples',
        routePath: '/examples',
      },
    ], {
      fieldNames: {
        authority: 'permissionCodes',
        children: 'childrenItems',
        component: 'componentName',
        hideInMenu: 'hiddenFlag',
        name: 'routeName',
        order: 'orderIndex',
        path: 'routePath',
        roles: 'roleCodes',
        title: 'menuTitle',
      },
    })

    expect(menus).toEqual([
      expect.objectContaining({
        authority: ['examples:view'],
        children: [
          expect.objectContaining({
            path: '/examples/overview',
            title: '概览',
          }),
        ],
        component: 'examples/index',
        name: 'Examples',
        path: '/examples',
        permissions: ['examples:view'],
        roles: ['admin'],
        title: '功能示例',
        visible: true,
      }),
    ])
  })

  it('会基于标准 meta 字段生成路由和侧边栏菜单', () => {
    const dashboardComponent = () => Promise.resolve({ default: 'DashboardView' })
    const projectComponent = () => Promise.resolve({ default: 'ProjectView' })
    const normalized = normalizeMenuRecords([
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: 'dashboard/index',
        meta: {
          title: '工作台',
          icon: 'app:dashboard',
          authority: ['dashboard:view'],
          affixTab: true,
        },
      },
      {
        path: '/project',
        name: 'Project',
        component: 'project/index',
        meta: {
          title: '项目管理',
          icon: 'app:project',
          authority: ['project:list'],
          roles: ['admin'],
        },
      },
    ])

    const routes = createRouteRecords(normalized, {
      componentResolver: component => ({
        'dashboard/index': dashboardComponent,
        'project/index': projectComponent,
      })[component],
    })
    const sidebarMenus = createSidebarMenus(normalized, {
      hasPermission: permissions => permissions.includes('dashboard:view'),
      hasRole: roles => roles.includes('admin'),
    })

    expect(routes).toEqual([
      {
        component: dashboardComponent,
        meta: {
          affixTab: true,
          authority: ['dashboard:view'],
          icon: 'app:dashboard',
          permissions: ['dashboard:view'],
          roles: [],
          title: '工作台',
        },
        name: 'Dashboard',
        path: '/dashboard',
      },
      {
        component: projectComponent,
        meta: {
          authority: ['project:list'],
          icon: 'app:project',
          permissions: ['project:list'],
          roles: ['admin'],
          title: '项目管理',
        },
        name: 'Project',
        path: '/project',
      },
    ])
    expect(sidebarMenus).toEqual([
      {
        children: [],
        icon: 'app:dashboard',
        path: '/dashboard',
        title: '工作台',
      },
    ])
  })

  it('会归一化扁平菜单为树结构，并按 order 排序', () => {
    const menus = normalizeMenuNodes([
      {
        id: 'system',
        order: 2,
        path: '/system',
        title: '系统管理',
      },
      {
        id: 'dashboard',
        order: 1,
        path: 'dashboard',
        title: '工作台',
      },
      {
        component: 'system/user',
        id: 'system-user',
        order: 1,
        parentId: 'system',
        path: 'user',
        permissions: ['system:user:list'],
        title: '用户管理',
      },
    ])

    expect(menus.map(item => item.id)).toEqual(['dashboard', 'system'])
    expect(menus[0]?.path).toBe('/dashboard')
    expect(menus[1]?.children[0]?.path).toBe('/system/user')
    expect(menus[1]?.children[0]?.permissions).toEqual(['system:user:list'])
  })

  it('会从规范菜单生成路由记录并解析组件', () => {
    const component = () => Promise.resolve({ default: 'UserView' })
    const routes = createRouteRecords([
      {
        children: [
          {
            children: [],
            component: 'system/user',
            id: 'system-user',
            meta: {},
            name: 'SystemUser',
            path: '/system/user',
            permissions: ['system:user:list'],
            roles: [],
            title: '用户管理',
            visible: true,
          },
        ],
        id: 'system',
        meta: {},
        name: 'System',
        path: '/system',
        permissions: [],
        roles: [],
        title: '系统管理',
        visible: true,
      },
    ], {
      componentResolver: path => path === 'system/user' ? component : undefined,
    })

    expect(routes).toEqual([
      {
        children: [
          {
            component,
            meta: {
              permissions: ['system:user:list'],
              roles: [],
              title: '用户管理',
            },
            name: 'SystemUser',
            path: '/system/user',
          },
        ],
        meta: {
          permissions: [],
          roles: [],
          title: '系统管理',
        },
        name: 'System',
        path: '/system',
      },
    ])
  })

  it('会注册并重置动态路由', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })
    const registry = createRouteRegistry(router)
    const routes = createRouteRecords(normalizeMenuRecords([
      {
        path: '/dynamic',
        name: 'Dynamic',
        meta: {
          title: '动态页面',
        },
      },
    ]))

    registry.register(routes)

    expect(router.hasRoute('Dynamic')).toBe(true)

    registry.reset()

    expect(router.hasRoute('Dynamic')).toBe(false)
  })

  it('会生成侧边栏菜单并过滤隐藏项', () => {
    const sidebarMenus = createSidebarMenus(normalizeMenuNodes([
      {
        children: [
          {
            id: 'hidden-child',
            path: 'hidden',
            title: '隐藏子项',
            visible: false,
          },
          {
            id: 'visible-child',
            icon: 'app:user',
            path: 'visible',
            title: '可见子项',
          },
        ],
        id: 'parent',
        path: '/parent',
        title: '父菜单',
      },
    ]))

    expect(sidebarMenus).toEqual([
      {
        children: [
          {
            children: [],
            icon: 'app:user',
            path: '/parent/visible',
            title: '可见子项',
          },
        ],
        icon: undefined,
        path: '/parent',
        title: '父菜单',
      },
    ])
  })

  it('会按权限和角色生成可访问的侧边栏菜单', () => {
    const sidebarMenus = createSidebarMenus(normalizeMenuNodes([
      {
        children: [
          {
            id: 'profile',
            path: 'profile',
            permissions: ['system:profile:view'],
            title: '个人资料',
          },
          {
            id: 'user',
            path: 'user',
            permissions: ['system:user:list'],
            title: '用户管理',
          },
        ],
        id: 'system',
        path: '/system',
        title: '系统管理',
      },
      {
        children: [
          {
            id: 'audit-log',
            path: 'audit-log',
            roles: ['auditor'],
            title: '审计日志',
          },
        ],
        id: 'audit',
        path: '/audit',
        title: '审计中心',
      },
    ]), {
      hasPermission: permissions => permissions.includes('system:profile:view'),
      hasRole: roles => roles.includes('admin'),
    })

    expect(sidebarMenus).toEqual([
      {
        children: [
          {
            children: [],
            icon: undefined,
            path: '/system/profile',
            title: '个人资料',
          },
        ],
        icon: undefined,
        path: '/system',
        title: '系统管理',
      },
    ])
  })

  it('会查找第一个有访问权的可见菜单', () => {
    const menus = normalizeMenuNodes([
      {
        children: [
          {
            id: 'user',
            path: 'user',
            permissions: ['system:user:list'],
            title: '用户管理',
          },
          {
            id: 'dict',
            path: 'dict',
            permissions: ['system:dict:list'],
            title: '字典管理',
          },
        ],
        id: 'system',
        path: '/system',
        title: '系统管理',
      },
    ])

    const firstMenu = findFirstAccessibleMenu(menus, {
      hasPermission: permissions => permissions.includes('system:dict:list'),
    })

    expect(firstMenu?.path).toBe('/system/dict')
  })

  it('父级权限或角色拒绝时会跳过整个子树', () => {
    const menus = normalizeMenuNodes([
      {
        children: [
          {
            id: 'restricted-child',
            path: 'child',
            title: '无独立权限的子页',
          },
        ],
        id: 'restricted',
        path: '/restricted',
        permissions: ['restricted:view'],
        roles: ['admin'],
        title: '受限父菜单',
      },
      {
        id: 'dashboard',
        path: '/dashboard',
        title: '工作台',
      },
    ])

    expect(findFirstAccessibleMenu(menus, {
      hasPermission: permissions => !permissions.includes('restricted:view'),
      hasRole: () => true,
    })?.path).toBe('/dashboard')

    expect(findFirstAccessibleMenu(menus, {
      hasPermission: () => true,
      hasRole: roles => !roles.includes('admin'),
    })?.path).toBe('/dashboard')
  })

  it('父级可访问但所有子项被拒绝时不会把目录作为首个落点', () => {
    const menus = normalizeMenuNodes([
      {
        children: [
          {
            id: 'restricted-child',
            path: 'child',
            permissions: ['child:view'],
            title: '受限子页',
          },
        ],
        id: 'directory',
        path: '/directory',
        title: '目录',
      },
      {
        id: 'dashboard',
        path: '/dashboard',
        title: '工作台',
      },
    ])

    expect(findFirstAccessibleMenu(menus, {
      hasPermission: permissions => !permissions.includes('child:view'),
    })?.path).toBe('/dashboard')
  })

  it('会将外链字段贯穿归一化、路由记录和侧边栏菜单', () => {
    const menus = normalizeMenuRecords([
      {
        path: '/docs',
        name: 'Docs',
        externalLink: 'https://example.com/docs',
        meta: {
          externalTarget: '_self',
          title: '外部文档',
          icon: 'app:link',
        },
      },
    ])

    expect(menus[0]?.externalLink).toBe('https://example.com/docs')

    const routes = createRouteRecords(menus)
    expect(routes[0]?.meta.externalLink).toBe('https://example.com/docs')

    const sidebarMenus = createSidebarMenus(menus)
    expect(sidebarMenus[0]?.externalLink).toBe('https://example.com/docs')
    expect(sidebarMenus[0]?.externalTarget).toBe('_self')
  })

  it('会按 meta.topMenu 拆分顶部菜单，未标记时回退为全部可访问一级菜单', () => {
    const menus = normalizeMenuRecords([
      {
        path: '/dashboard',
        name: 'Dashboard',
        meta: { title: '工作台', topMenu: true },
      },
      {
        path: '/system',
        name: 'System',
        meta: { title: '系统管理' },
      },
    ])

    expect(createTopMenus(menus).map(menu => menu.path)).toEqual(['/dashboard'])

    const withoutTopFlag = normalizeMenuRecords([
      {
        path: '/dashboard',
        name: 'Dashboard',
        meta: { title: '工作台' },
      },
      {
        path: '/system',
        name: 'System',
        meta: { title: '系统管理' },
      },
    ])

    expect(createTopMenus(withoutTopFlag).map(menu => menu.path)).toEqual(['/dashboard', '/system'])
  })

  it('会用 glob 模块表把组件字符串解析为懒加载组件', () => {
    const userLoader = () => Promise.resolve({ default: 'UserView' })
    const dashboardLoader = () => Promise.resolve({ default: 'DashboardView' })
    const fallback = () => Promise.resolve({ default: 'NotFound' })
    const resolver = createGlobComponentResolver({
      fallback,
      modules: {
        '../views/system/user.vue': userLoader,
        '../views/dashboard/index.vue': dashboardLoader,
      },
    })

    expect(resolver('system/user')).toBe(userLoader)
    expect(resolver('dashboard')).toBe(dashboardLoader)
    // 命中同一候选路径返回缓存的同一个 loader
    expect(resolver('system/user.vue')).toBe(userLoader)
    // 未命中任何候选回退到 fallback
    expect(resolver('missing/page')).toBe(fallback)
  })
})
