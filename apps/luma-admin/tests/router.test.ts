import { describe, expect, it } from 'vitest'
import {
  adminRouteRecords,
  createAdminRouter,
  createAdminSidebarMenus,
  permissionStore,
} from '../src/router'

describe('luma admin router', () => {
  it('示例路由配置使用标准 meta.authority 字段', () => {
    expect(adminRouteRecords.slice(0, 2)).toMatchObject([
      {
        path: '/dashboard',
        meta: {
          authority: ['dashboard:view'],
          title: '工作台',
        },
      },
      {
        path: '/project',
        meta: {
          authority: ['project:list'],
          title: '项目管理',
        },
      },
    ])
    expect(JSON.stringify(adminRouteRecords)).not.toContain('"permissions"')
  })

  it('会按当前权限生成可访问侧边栏菜单', () => {
    permissionStore.setPermissions(['dashboard:view'])
    permissionStore.setRoles(['admin'])

    expect(createAdminSidebarMenus()).toEqual([
      {
        children: [],
        icon: 'app:dashboard',
        path: '/dashboard',
        title: '工作台',
      },
    ])
  })

  it('无项目权限时访问项目路由会跳转到 403', async () => {
    permissionStore.setPermissions(['dashboard:view'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('有项目权限时可以访问项目路由', async () => {
    permissionStore.setPermissions(['dashboard:view', 'project:list'])
    permissionStore.setRoles(['admin'])

    const router = createAdminRouter()

    await router.push('/project')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/project')
  })
})
