import type { LumaLayoutTabItem } from '@luma/core/layout'
import type {
  NormalizedMenuNode,
  RouteRegistry,
  RouteRegistryRouterLike,
  SidebarMenuItem,
} from '@luma/core/router'
import type { ShallowRef } from 'vue'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { setupPermissionGuard } from '@luma/core/permission'
import {
  createRouteRecords,
  createRouteRegistry,
  createSidebarMenus,
  findFirstAccessibleMenu,
} from '@luma/core/router'
import { shallowRef } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { loadAdminMenus } from '../api/menu'
import { permissionStore } from '../services/permission'
import {
  isAuthenticated,
  registerSessionResetHandler,
} from '../services/session'
import { resolveRouteComponent } from './components'

export { permissionStore } from '../services/permission'
export { adminRouteRecords } from './routes'

interface AdminRouterRuntime {
  initialized: boolean
  initializing?: Promise<void>
  menus: ShallowRef<NormalizedMenuNode[]>
  registry: RouteRegistry
}

const routerRuntimes = new WeakMap<Router, AdminRouterRuntime>()

/***********************权限判断*********************/
function hasPermission(permissions: string[]): boolean {
  return permissionStore.hasPermission(permissions, 'every')
}

function hasRole(roles: string[]): boolean {
  return permissionStore.hasRole(roles, 'every')
}

/***********************运行时状态*********************/
function getRouterRuntime(targetRouter: Router): AdminRouterRuntime {
  const runtime = routerRuntimes.get(targetRouter)

  if (!runtime) {
    throw new Error('Admin 路由运行时尚未创建')
  }

  return runtime
}

function resetRouterRuntime(runtime: AdminRouterRuntime): void {
  runtime.registry.reset()
  runtime.menus.value = []
  runtime.initialized = false
  runtime.initializing = undefined
}

export async function ensureAdminRoutes(targetRouter: Router): Promise<void> {
  const runtime = getRouterRuntime(targetRouter)

  if (!isAuthenticated()) {
    resetRouterRuntime(runtime)
    return
  }

  if (runtime.initialized) {
    return
  }

  if (!runtime.initializing) {
    runtime.initializing = (async () => {
      const menus = await loadAdminMenus()
      const routes = createRouteRecords(menus, {
        componentResolver: resolveRouteComponent,
      })

      runtime.registry.reset()
      runtime.registry.register(routes)
      runtime.menus.value = menus
      runtime.initialized = true
    })().catch((error) => {
      resetRouterRuntime(runtime)
      throw error
    }).finally(() => {
      runtime.initializing = undefined
    })
  }

  await runtime.initializing
}

export function resetAdminRoutes(targetRouter: Router): void {
  resetRouterRuntime(getRouterRuntime(targetRouter))
}

export function getAdminRouteNames(targetRouter: Router): readonly string[] {
  return getRouterRuntime(targetRouter).registry.names
}

/***********************菜单生成*********************/
function flattenMenuTabs(menus: SidebarMenuItem[]): LumaLayoutTabItem[] {
  return menus.flatMap((menu) => {
    if (menu.children.length > 0) {
      return flattenMenuTabs(menu.children)
    }

    return {
      icon: menu.icon,
      path: menu.path,
      title: menu.title,
    }
  })
}

function resolveMenuTab(menus: LumaLayoutTabItem[], path: string): LumaLayoutTabItem | undefined {
  return menus.find(tab => tab.path === path)
}

export function createAdminSidebarMenus(targetRouter: Router): SidebarMenuItem[] {
  return createSidebarMenus(getRouterRuntime(targetRouter).menus.value, {
    hasPermission,
    hasRole,
  })
}

export function createAdminTabs(activePath: string | undefined, targetRouter: Router): LumaLayoutTabItem[] {
  const menuTabs = flattenMenuTabs(createAdminSidebarMenus(targetRouter))
  const homeTab = resolveMenuTab(menuTabs, '/dashboard') ?? menuTabs[0]
  const activeTab = activePath ? resolveMenuTab(menuTabs, activePath) : undefined
  const tabs: LumaLayoutTabItem[] = []

  if (homeTab) {
    tabs.push({
      ...homeTab,
      closable: false,
    })
  }

  if (activeTab && activeTab.path !== homeTab?.path) {
    tabs.push({
      ...activeTab,
      closable: true,
    })
  }

  if (activePath === '/403' || activePath === '/404') {
    tabs.push({
      closable: false,
      path: activePath,
      title: activePath === '/403' ? '无权限' : '页面不存在',
    })
  }

  return tabs
}

export function resolveFirstAccessibleAdminPath(targetRouter: Router): string {
  return findFirstAccessibleMenu(getRouterRuntime(targetRouter).menus.value, {
    hasPermission,
    hasRole,
  })?.path ?? '/403'
}

/***********************路由创建*********************/
function createStaticRoutes(): RouteRecordRaw[] {
  return [
    {
      path: '/login',
      component: () => import('../views/login/LoginView.vue'),
      meta: {
        hideInMenu: true,
        layout: 'public',
        requireLogin: false,
        title: '登录',
      },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/403',
      name: 'AdminForbidden',
      component: () => import('../views/error/ForbiddenView.vue'),
      meta: {
        hideInMenu: true,
        title: '无权限',
      },
    },
    {
      path: '/404',
      name: 'AdminNotFound',
      component: () => import('../views/error/NotFoundView.vue'),
      meta: {
        hideInMenu: true,
        title: '页面不存在',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'AdminCatchAll',
      component: () => import('../views/error/NotFoundView.vue'),
      meta: {
        hideInMenu: true,
        title: '页面不存在',
      },
    },
  ]
}

export function createAdminRouter(history: RouterHistory = createWebHashHistory()): Router {
  const targetRouter = createRouter({
    history,
    routes: createStaticRoutes(),
  })
  const runtime: AdminRouterRuntime = {
    initialized: false,
    menus: shallowRef<NormalizedMenuNode[]>([]),
    registry: createRouteRegistry({
      addRoute: route => targetRouter.addRoute(route as RouteRecordRaw),
      hasRoute: name => targetRouter.hasRoute(name),
      removeRoute: name => targetRouter.removeRoute(name),
    } satisfies RouteRegistryRouterLike),
  }

  routerRuntimes.set(targetRouter, runtime)
  registerSessionResetHandler(() => resetRouterRuntime(runtime))

  targetRouter.beforeEach(async (to) => {
    if (!isAuthenticated()) {
      resetRouterRuntime(runtime)
      return true
    }

    if (to.path === '/login') {
      await ensureAdminRoutes(targetRouter)
      return resolveFirstAccessibleAdminPath(targetRouter)
    }

    const needsRematch = !runtime.initialized
    await ensureAdminRoutes(targetRouter)

    if (to.path === '/') {
      return resolveFirstAccessibleAdminPath(targetRouter)
    }

    if (to.name === 'AdminCatchAll') {
      if (targetRouter.resolve(to.fullPath).name !== 'AdminCatchAll') {
        return to.fullPath
      }

      return '/404'
    }

    if (needsRematch) {
      return to.fullPath
    }

    return true
  })

  setupPermissionGuard(targetRouter, permissionStore, {
    isAuthenticated,
    loginPath: '/login',
    mode: 'every',
    noAccessRedirect: '/403',
    redirectQueryKey: 'redirect',
    requireLoginByDefault: true,
    roleMode: 'every',
    whiteList: ['/login'],
  })

  return targetRouter
}

export const router = createAdminRouter()
