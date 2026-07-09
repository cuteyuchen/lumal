import { describe, expect, it } from 'vitest'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuRecords,
  normalizeMenuNodes,
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
})
