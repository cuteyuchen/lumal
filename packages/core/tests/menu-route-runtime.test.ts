import type { Router, RouteRecordRaw } from 'vue-router'
import type {
  LumaMenuInputRecord,
  LumaRouteRecord,
  LumaStaticMenuRecord,
  MenuRouteRuntimeRouterLike,
} from '../src/router'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  createMenuRouteRuntime,
  createRouteRecords,
  createSidebarMenus,
  MenuRouteConflictError,
  normalizeMenuRecords,
} from '../src/router'

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { render: () => null },
        name: 'Public',
        path: '/public',
      },
    ],
  })
}

function asRuntimeRouter(router: Router): MenuRouteRuntimeRouterLike {
  return {
    addRoute: route => router.addRoute(route as RouteRecordRaw),
    getRoutes: () => router.getRoutes(),
    hasRoute: name => router.hasRoute(name),
    removeRoute: name => router.removeRoute(name),
  }
}

function routeComponent(runtimeRoutes: LumaRouteRecord[], name: string): () => Promise<unknown> {
  const route = runtimeRoutes.find(item => item.name === name)
  return route?.component as () => Promise<unknown>
}

describe('createMenuRouteRuntime', () => {
  it('由静态菜单生成路由，并让直接组件与懒加载器绕过 resolver', () => {
    const router = createTestRouter()
    const directComponent = { render: () => null }
    const lazyComponent = () => Promise.resolve({ default: directComponent })
    const resolvedComponent = () => Promise.resolve({ default: directComponent })
    const componentResolver = vi.fn((component: string) => {
      return component === 'dashboard/index' ? resolvedComponent : undefined
    })
    const runtime = createMenuRouteRuntime({
      componentResolver,
      hasPermission: permissions => permissions.includes('dashboard:view'),
      router: asRuntimeRouter(router),
      staticMenus: [
        {
          component: directComponent,
          meta: { authority: ['denied:view'], order: 0, title: '受限页' },
          name: 'Denied',
          path: '/denied',
        },
        {
          component: 'dashboard/index',
          meta: { authority: ['dashboard:view'], order: 1, title: '工作台' },
          name: 'Dashboard',
          path: '/dashboard',
        },
        {
          component: lazyComponent,
          meta: { order: 1, title: '懒加载页' },
          name: 'Lazy',
          path: '/lazy',
        },
      ],
    })

    expect(componentResolver).toHaveBeenCalledOnce()
    expect(runtime.routes.map(route => route.name)).toEqual(['Denied', 'Dashboard', 'Lazy'])
    expect(runtime.routes[0]?.component).toBe(directComponent)
    expect(runtime.routes[2]?.component).toBe(lazyComponent)
    expect(router.hasRoute('Dashboard')).toBe(true)
    expect(runtime.sidebarMenus.map(menu => menu.path)).toEqual(['/dashboard', '/lazy'])
    expect(runtime.firstAccessiblePath).toBe('/dashboard')
  })

  it('首个落点不会越过受限父菜单进入无独立权限的子路由', () => {
    const router = createTestRouter()
    const component = { render: () => null }
    const runtime = createMenuRouteRuntime({
      hasPermission: permissions => !permissions.includes('restricted:view'),
      router: asRuntimeRouter(router),
      staticMenus: [
        {
          children: [
            {
              component,
              meta: { title: '受限子页' },
              name: 'RestrictedChild',
              path: 'child',
            },
          ],
          meta: { authority: ['restricted:view'], order: 0, title: '受限父菜单' },
          name: 'Restricted',
          path: '/restricted',
        },
        {
          component,
          meta: { order: 1, title: '工作台' },
          name: 'Dashboard',
          path: '/dashboard',
        },
      ],
    })

    expect(runtime.sidebarMenus.map(menu => menu.path)).toEqual(['/dashboard'])
    expect(runtime.firstAccessiblePath).toBe('/dashboard')
  })

  it('稳定合并静态与远程菜单并按 order 排序', async () => {
    const router = createTestRouter()
    const component = () => Promise.resolve({ default: { render: () => null } })
    const runtime = createMenuRouteRuntime({
      componentResolver: () => component,
      loadRemoteMenus: async () => [
        {
          component: 'remote/second',
          meta: { order: 2, title: '远程二' },
          name: 'RemoteSecond',
          path: '/remote-second',
        },
        {
          component: 'remote/first',
          meta: { order: 1, title: '远程一' },
          name: 'RemoteFirst',
          path: '/remote-first',
        },
      ],
      router: asRuntimeRouter(router),
      staticMenus: [
        {
          component,
          meta: { order: 1, title: '静态一' },
          name: 'StaticFirst',
          path: '/static-first',
        },
        {
          component,
          meta: { order: 3, title: '静态三' },
          name: 'StaticThird',
          path: '/static-third',
        },
      ],
    })

    await runtime.loadRemote()

    expect(runtime.menus.map(menu => menu.name)).toEqual([
      'StaticFirst',
      'RemoteFirst',
      'RemoteSecond',
      'StaticThird',
    ])
    expect(runtime.routes.map(route => route.name)).toEqual([
      'StaticFirst',
      'RemoteFirst',
      'RemoteSecond',
      'StaticThird',
    ])
  })

  it('嵌套同级菜单按 order 稳定排序并把缺省值放到末尾', () => {
    const router = createTestRouter()
    const component = { render: () => null }
    const runtime = createMenuRouteRuntime({
      router: asRuntimeRouter(router),
      staticMenus: [{
        children: [
          { component, meta: { title: '缺省一' }, name: 'MissingFirst', path: 'missing-first' },
          { component, meta: { order: 2, title: '第二' }, name: 'Second', path: 'second' },
          { component, meta: { order: 1, title: '第一' }, name: 'First', path: 'first' },
          { component, meta: { title: '缺省二' }, name: 'MissingSecond', path: 'missing-second' },
          { component, meta: { order: 1, title: '第一并列' }, name: 'FirstTie', path: 'first-tie' },
        ],
        meta: { title: '父菜单' },
        name: 'Parent',
        path: '/parent',
      }],
    })

    expect(runtime.menus[0]?.children.map(menu => menu.name)).toEqual([
      'First',
      'FirstTie',
      'Second',
      'MissingFirst',
      'MissingSecond',
    ])
    expect(runtime.routes[0]?.children?.map(route => route.name)).toEqual([
      'First',
      'FirstTie',
      'Second',
      'MissingFirst',
      'MissingSecond',
    ])
  })

  it('贯穿 activeMenu、徽标和面包屑元数据字段', () => {
    const menus = normalizeMenuRecords([{
      activePath: '/system/user',
      badgeColor: 'danger',
      badgeKind: 'text',
      badgeValue: 'NEW',
      hideCrumb: true,
      menuTitle: '用户详情',
      routeName: 'UserDetail',
      routePath: '/system/user/detail',
    }], {
      fieldNames: {
        activeMenu: 'activePath',
        badge: 'badgeValue',
        badgeTone: 'badgeColor',
        badgeType: 'badgeKind',
        hideInBreadcrumb: 'hideCrumb',
        name: 'routeName',
        path: 'routePath',
        title: 'menuTitle',
      },
    })

    expect(menus[0]).toMatchObject({
      activeMenu: '/system/user',
      badge: 'NEW',
      badgeTone: 'danger',
      badgeType: 'text',
      hideInBreadcrumb: true,
    })
    expect(createRouteRecords(menus)[0]?.meta).toMatchObject({
      activeMenu: '/system/user',
      badge: 'NEW',
      badgeTone: 'danger',
      badgeType: 'text',
      hideInBreadcrumb: true,
    })
    expect(createSidebarMenus(menus)[0]).toMatchObject({
      badge: 'NEW',
      badgeTone: 'danger',
      badgeType: 'text',
    })
  })

  it('并发加载共享同一个远程请求', async () => {
    const router = createTestRouter()
    let resolveMenus: ((menus: LumaMenuInputRecord[]) => void) | undefined
    const loadRemoteMenus = vi.fn(() => new Promise<LumaMenuInputRecord[]>((resolve) => {
      resolveMenus = resolve
    }))
    const runtime = createMenuRouteRuntime({
      componentResolver: () => () => Promise.resolve({ default: {} }),
      loadRemoteMenus,
      router: asRuntimeRouter(router),
    })

    const firstLoad = runtime.loadRemote()
    const secondLoad = runtime.loadRemote()

    expect(firstLoad).toBe(secondLoad)
    expect(loadRemoteMenus).toHaveBeenCalledOnce()

    resolveMenus?.([{
      component: 'remote/page',
      meta: { title: '远程页' },
      name: 'RemotePage',
      path: '/remote-page',
    }])
    await firstLoad

    expect(runtime.remoteLoaded).toBe(true)
    expect(router.hasRoute('RemotePage')).toBe(true)
  })

  it('静态与远程的 name 或 path 冲突会在替换前抛错', async () => {
    const router = createTestRouter()
    const component = () => Promise.resolve({ default: {} })
    const runtime = createMenuRouteRuntime({
      componentResolver: () => component,
      loadRemoteMenus: async () => [{
        component: 'remote/page',
        meta: { title: '远程冲突页' },
        name: 'RemotePage',
        path: '/static-page',
      }],
      router: asRuntimeRouter(router),
      staticMenus: [{
        component,
        meta: { title: '静态页' },
        name: 'StaticPage',
        path: '/static-page',
      }],
    })

    await expect(runtime.loadRemote()).rejects.toMatchObject({
      kind: 'path',
      value: '/static-page',
    })
    expect(router.hasRoute('StaticPage')).toBe(true)
    expect(router.hasRoute('RemotePage')).toBe(false)
    expect(runtime.remoteMenus).toEqual([])
  })

  it('同一来源的重复 name 和 path 会报告对应冲突类型', () => {
    const component = { render: () => null }
    const duplicateNameRouter = createTestRouter()

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(duplicateNameRouter),
      staticMenus: [
        { component, meta: { title: '页面一' }, name: 'Duplicate', path: '/one' },
        { component, meta: { title: '页面二' }, name: 'Duplicate', path: '/two' },
      ],
    })).toThrow(expect.objectContaining({ kind: 'name', value: 'Duplicate' }))

    const duplicatePathRouter = createTestRouter()
    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(duplicatePathRouter),
      staticMenus: [
        { component, meta: { title: '页面一' }, name: 'PageOne', path: '/duplicate' },
        { component, meta: { title: '页面二' }, name: 'PageTwo', path: '/duplicate' },
      ],
    })).toThrow(expect.objectContaining({ kind: 'path', value: '/duplicate' }))
  })

  it('在规范化前拒绝空 path', () => {
    const router = createTestRouter()

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: { render: () => null },
        meta: { title: '空路径页' },
        name: 'EmptyPath',
        path: '',
      }],
    })).toThrow(/path 不能为空/)
    expect(router.hasRoute('EmptyPath')).toBe(false)
  })

  it('拒绝空白或非字符串 name', () => {
    const component = { render: () => null }

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(createTestRouter()),
      staticMenus: [{
        component,
        meta: { title: '空白名称' },
        name: '   ',
        path: '/blank-name',
      }],
    })).toThrow(/name 必须是非空字符串/)

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(createTestRouter()),
      staticMenus: [{
        component,
        meta: { title: '数字名称' },
        name: 42,
        path: '/numeric-name',
      } as unknown as LumaStaticMenuRecord],
    })).toThrow(/name 必须是非空字符串/)
  })

  it('运行时要求 router 提供 getRoutes', () => {
    const routerWithoutRoutes = {
      addRoute: vi.fn(),
      hasRoute: vi.fn(() => false),
      removeRoute: vi.fn(),
    }

    expect(() => createMenuRouteRuntime({
      router: routerWithoutRoutes as unknown as MenuRouteRuntimeRouterLike,
    })).toThrow(/router\.getRoutes\(\)/)
    expect(routerWithoutRoutes.addRoute).not.toHaveBeenCalled()
  })

  it('会拒绝与外部路由重名，并保留原有路由', () => {
    const router = createTestRouter()

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: { render: () => null },
        meta: { title: '冲突页' },
        name: 'Public',
        path: '/another-public',
      }],
    })).toThrow(MenuRouteConflictError)
    expect(router.hasRoute('Public')).toBe(true)
    expect(router.resolve('/public').name).toBe('Public')
  })

  it('会拒绝与外部路由同 path，并保留原有路由', () => {
    const router = createTestRouter()

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: { render: () => null },
        meta: { title: '路径冲突页' },
        name: 'PublicPathConflict',
        path: '/public',
      }],
    })).toThrow(expect.objectContaining({
      firstSource: 'existing',
      kind: 'path',
      secondSource: 'static',
      value: '/public',
    }))
    expect(router.hasRoute('PublicPathConflict')).toBe(false)
    expect(router.resolve('/public').name).toBe('Public')
  })

  it('resolver 未命中时报告错误并使用 fallback', async () => {
    const router = createTestRouter()
    const fallbackResult = { default: { render: () => null } }
    const fallbackComponent = vi.fn(async () => fallbackResult)
    const onError = vi.fn()
    const runtime = createMenuRouteRuntime({
      componentResolver: () => undefined,
      fallbackComponent,
      onError,
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: 'missing/page',
        meta: { title: '缺失页' },
        name: 'MissingPage',
        path: '/missing-page',
      }],
    })

    await expect(routeComponent(runtime.routes, 'MissingPage')()).resolves.toBe(fallbackResult)
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'missing/page',
        phase: 'resolve-component',
      }),
    )
  })

  it('resolver 同步异常会报告并原样抛出，不使用 fallback', () => {
    const router = createTestRouter()
    const resolveError = new Error('resolver failed')
    const fallbackComponent = vi.fn(async () => ({ default: {} }))
    const onError = vi.fn()

    expect(() => createMenuRouteRuntime({
      componentResolver: () => {
        throw resolveError
      },
      fallbackComponent,
      onError,
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: 'broken/resolver',
        meta: { title: '解析异常页' },
        name: 'ResolverBroken',
        path: '/resolver-broken',
      }],
    })).toThrow(resolveError)
    expect(fallbackComponent).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(resolveError, expect.objectContaining({
      component: 'broken/resolver',
      phase: 'resolve-component',
    }))
  })

  it('resolver loader 失败时报告错误并执行 fallback', async () => {
    const router = createTestRouter()
    const loadError = new Error('load failed')
    const fallbackResult = { default: { render: () => null } }
    const onError = vi.fn()
    const runtime = createMenuRouteRuntime({
      componentResolver: () => async () => {
        throw loadError
      },
      fallbackComponent: async () => fallbackResult,
      onError,
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: 'broken/page',
        meta: { title: '异常页' },
        name: 'BrokenPage',
        path: '/broken-page',
      }],
    })

    await expect(routeComponent(runtime.routes, 'BrokenPage')()).resolves.toBe(fallbackResult)
    expect(onError).toHaveBeenCalledWith(loadError, expect.objectContaining({
      component: 'broken/page',
      phase: 'load-component',
    }))
  })

  it('静态直接懒加载器失败时同样报告错误并执行 fallback', async () => {
    const router = createTestRouter()
    const loadError = new Error('static load failed')
    const fallbackResult = { default: { render: () => null } }
    const onError = vi.fn()
    const componentResolver = vi.fn()
    const runtime = createMenuRouteRuntime({
      componentResolver,
      fallbackComponent: async () => fallbackResult,
      onError,
      router: asRuntimeRouter(router),
      staticMenus: [{
        component: async () => {
          throw loadError
        },
        meta: { title: '静态异常页' },
        name: 'StaticBrokenPage',
        path: '/static-broken-page',
      }],
    })

    await expect(routeComponent(runtime.routes, 'StaticBrokenPage')()).resolves.toBe(fallbackResult)
    expect(componentResolver).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(loadError, expect.objectContaining({
      phase: 'load-component',
      source: 'static',
    }))
  })

  it('拒绝缺组件叶子和远程直接组件', async () => {
    const router = createTestRouter()

    expect(() => createMenuRouteRuntime({
      router: asRuntimeRouter(router),
      staticMenus: [{
        meta: { title: '空页面' },
        name: 'EmptyPage',
        path: '/empty-page',
      }],
    })).toThrow(/叶子菜单缺少路由组件/)

    const runtime = createMenuRouteRuntime({
      loadRemoteMenus: async () => [{
        component: { render: () => null },
        meta: { title: '非法远程页' },
        name: 'InvalidRemote',
        path: '/invalid-remote',
      } as unknown as LumaMenuInputRecord],
      router: asRuntimeRouter(router),
    })

    await expect(runtime.loadRemote()).rejects.toThrow(/远程菜单组件必须是字符串/)
    expect(router.hasRoute('InvalidRemote')).toBe(false)
  })

  it('远程目录的空组件按未配置处理，叶子空组件仍明确报错', async () => {
    const router = createTestRouter()
    const runtime = createMenuRouteRuntime({
      componentResolver: () => () => Promise.resolve({ default: {} }),
      loadRemoteMenus: async () => [{
        children: [{
          component: 'remote/child',
          meta: { title: '子页面' },
          name: 'RemoteChild',
          path: 'child',
        }],
        component: '',
        meta: { title: '远程目录' },
        name: 'RemoteDirectory',
        path: '/remote',
      }],
      router: asRuntimeRouter(router),
    })

    await expect(runtime.loadRemote()).resolves.toHaveLength(1)
    expect(router.hasRoute('RemoteDirectory')).toBe(true)
    expect(router.hasRoute('RemoteChild')).toBe(true)

    const leafRuntime = createMenuRouteRuntime({
      loadRemoteMenus: async () => [{
        component: '',
        meta: { title: '空组件叶子' },
        name: 'EmptyRemoteLeaf',
        path: '/empty-remote-leaf',
      }],
      router: asRuntimeRouter(createTestRouter()),
    })
    await expect(leafRuntime.loadRemote()).rejects.toThrow(/叶子菜单缺少路由组件/)
  })

  it('reload 失败保留旧远程路由，成功后再原子替换', async () => {
    const router = createTestRouter()
    const component = () => Promise.resolve({ default: {} })
    let mode: 'first' | 'fail' | 'second' = 'first'
    const loadError = new Error('network failed')
    const loadRemoteMenus = vi.fn(async () => {
      if (mode === 'fail') {
        throw loadError
      }

      return [{
        component: `remote/${mode}`,
        meta: { title: mode },
        name: mode === 'first' ? 'RemoteFirst' : 'RemoteSecond',
        path: mode === 'first' ? '/remote-first' : '/remote-second',
      }]
    })
    const onError = vi.fn()
    const runtime = createMenuRouteRuntime({
      componentResolver: () => component,
      loadRemoteMenus,
      onError,
      router: asRuntimeRouter(router),
      staticMenus: [{
        component,
        meta: { title: '静态页' },
        name: 'StaticPage',
        path: '/static-page',
      }],
    })

    await runtime.loadRemote()
    mode = 'fail'
    await expect(runtime.reload()).rejects.toBe(loadError)
    expect(router.hasRoute('RemoteFirst')).toBe(true)
    expect(runtime.remoteMenus[0]?.name).toBe('RemoteFirst')
    expect(onError).toHaveBeenCalledWith(loadError, expect.objectContaining({
      phase: 'load-remote-menus',
    }))

    mode = 'second'
    await runtime.reload()
    expect(router.hasRoute('RemoteFirst')).toBe(false)
    expect(router.hasRoute('RemoteSecond')).toBe(true)
    expect(router.hasRoute('StaticPage')).toBe(true)
  })

  it('resetRemote 和 dispose 只移除运行时拥有的路由', async () => {
    const router = createTestRouter()
    const component = () => Promise.resolve({ default: {} })
    const runtime = createMenuRouteRuntime({
      componentResolver: () => component,
      loadRemoteMenus: async () => [{
        component: 'remote/page',
        meta: { title: '远程页' },
        name: 'RemotePage',
        path: '/remote-page',
      }],
      router: asRuntimeRouter(router),
      staticMenus: [{
        component,
        meta: { title: '静态页' },
        name: 'StaticPage',
        path: '/static-page',
      }],
    })

    await runtime.loadRemote()
    runtime.resetRemote()

    expect(router.hasRoute('RemotePage')).toBe(false)
    expect(router.hasRoute('StaticPage')).toBe(true)
    expect(router.hasRoute('Public')).toBe(true)
    expect(runtime.remoteLoaded).toBe(false)

    await runtime.reload()
    runtime.dispose()

    expect(router.hasRoute('RemotePage')).toBe(false)
    expect(router.hasRoute('StaticPage')).toBe(false)
    expect(router.hasRoute('Public')).toBe(true)
    expect(runtime.menus).toEqual([])
    await expect(runtime.reload()).rejects.toThrow(/已释放/)
  })

  it('静态注册中途失败会回滚已注册路由且保留外部路由', () => {
    const routeNames = new Set(['External'])
    let addCount = 0
    const router: MenuRouteRuntimeRouterLike = {
      addRoute(route) {
        addCount += 1
        if (addCount === 2) {
          throw new Error('second add failed')
        }

        routeNames.add(route.name)
        return () => routeNames.delete(route.name)
      },
      getRoutes: () => [],
      hasRoute: name => routeNames.has(name),
      removeRoute: name => routeNames.delete(name),
    }
    const component = { render: () => null }

    expect(() => createMenuRouteRuntime({
      router,
      staticMenus: [
        { component, meta: { title: '静态一' }, name: 'StaticOne', path: '/static-one' },
        { component, meta: { title: '静态二' }, name: 'StaticTwo', path: '/static-two' },
      ],
    })).toThrow('second add failed')
    expect([...routeNames]).toEqual(['External'])
  })

  it('resetRemote 会使尚未完成的远程结果失效', async () => {
    const router = createTestRouter()
    let resolveMenus: ((menus: LumaMenuInputRecord[]) => void) | undefined
    const runtime = createMenuRouteRuntime({
      componentResolver: () => () => Promise.resolve({ default: {} }),
      loadRemoteMenus: () => new Promise((resolve) => {
        resolveMenus = resolve
      }),
      router: asRuntimeRouter(router),
    })

    const loading = runtime.loadRemote()
    runtime.resetRemote()
    resolveMenus?.([{
      component: 'remote/late',
      meta: { title: '迟到页' },
      name: 'LatePage',
      path: '/late-page',
    }])
    await loading

    expect(router.hasRoute('LatePage')).toBe(false)
    expect(runtime.remoteMenus).toEqual([])
  })
})
