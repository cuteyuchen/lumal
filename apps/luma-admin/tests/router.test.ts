import { describe, expect, it } from 'vitest'
import {
  adminRouteRecords,
  createAdminRouter,
  createAdminSidebarMenus,
  permissionStore,
} from '../src/router'

describe('luma admin router', () => {
  it('示例路由配置使用标准 meta.authority 字段', () => {
    const examplesRoute = adminRouteRecords.find(route => route.path === '/examples')
    const projectRoute = adminRouteRecords.find(route => route.path === '/project')

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

  it('会按当前权限生成可访问侧边栏菜单', () => {
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary'])
    permissionStore.setRoles(['admin'])

    expect(createAdminSidebarMenus()).toEqual([
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
    ])
  })

  it('有字典权限时可以访问字典示例路由', async () => {
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/examples/dictionary')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/examples/dictionary')
  })

  it('无受限示例权限时访问受限示例会跳转到 403', async () => {
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/examples/restricted')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('无项目权限时访问项目路由会跳转到 403', async () => {
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('有项目权限时可以访问项目路由', async () => {
    permissionStore.setPermissions(['dashboard:view', 'examples:view', 'examples:dictionary', 'project:list'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/project')
  })
})
