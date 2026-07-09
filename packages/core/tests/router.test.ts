import { describe, expect, it } from 'vitest'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuNodes,
} from '../src/router'

describe('router menu helpers', () => {
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
