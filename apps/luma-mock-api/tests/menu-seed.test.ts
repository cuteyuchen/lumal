import { describe, expect, it } from 'vitest'
import { adminMenuSeed, staticAdminMenuSeed } from '../domain/menu-seed'

// 后端菜单种子是 GET /menu 下发数据的权威源，前端不再写死这份结构。
// 校验其字段规范：统一使用标准 meta.authority，且不混入 permissions/dictType 等派生字段。
describe('admin menu seed', () => {
  it('远程菜单种子使用标准 meta.authority 字段', () => {
    const examplesRoute = adminMenuSeed.find(route => route.path === '/examples')
    const profileRoute = staticAdminMenuSeed.find(route => route.path === '/profile')
    const projectRoute = adminMenuSeed.find(route => route.path === '/project')
    const systemRoute = adminMenuSeed.find(route => route.path === '/system')

    expect(staticAdminMenuSeed[0]).toMatchObject({
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
    expect(profileRoute).toMatchObject({
      component: 'profile/index',
      path: '/profile',
      meta: {
        hideInMenu: true,
        title: '个人中心',
      },
    })
    expect(adminMenuSeed.some(route => route.path === '/dashboard' || route.path === '/profile')).toBe(false)
    expect(JSON.stringify(adminMenuSeed)).not.toContain('"permissions"')
    expect(JSON.stringify(adminMenuSeed)).not.toContain('"dictType"')
  })
})
