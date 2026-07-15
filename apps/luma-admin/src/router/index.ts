import type { LumaLayoutTabItem } from '@luma/core/layout'
import type {
  LumaMenuInputRecord,
  MenuRouteRuntime,
  RouteRegistryRouterLike,
  SidebarMenuItem,
} from '@luma/core/router'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { setupPermissionGuard } from '@luma/core/permission'
import { createMenuRouteRuntime } from '@luma/core/router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { loadAdminMenus } from '../api/menu'
import { permissionStore } from '../services/permission'
import {
  isAuthenticated,
  registerSessionResetHandler,
} from '../services/session'
import { resolveRouteComponent } from './components'
import { staticAdminRouteRecords } from './routes'

export { permissionStore } from '../services/permission'
export { adminRouteRecords, staticAdminRouteRecords } from './routes'

interface AdminRouterRuntime {
  menuRoutes: MenuRouteRuntime
  staticRouteNames: ReadonlySet<string>
}

const routerRuntimes = new WeakMap<Router, AdminRouterRuntime>()

function loadNormalizedAdminMenus(): Promise<LumaMenuInputRecord[]> {
  return loadAdminMenus() as unknown as Promise<LumaMenuInputRecord[]>
}

export interface CreateAdminRouterOptions {
  loadRemoteMenus?: () => Promise<LumaMenuInputRecord[]>
}

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
  runtime.menuRoutes.resetRemote()
}

export async function ensureAdminRoutes(targetRouter: Router): Promise<void> {
  const runtime = getRouterRuntime(targetRouter)

  if (!isAuthenticated()) {
    resetRouterRuntime(runtime)
    return
  }

  await runtime.menuRoutes.loadRemote()
}

export function resetAdminRoutes(targetRouter: Router): void {
  resetRouterRuntime(getRouterRuntime(targetRouter))
}

export function getAdminRouteNames(targetRouter: Router): readonly string[] {
  const runtime = getRouterRuntime(targetRouter)
  return runtime.menuRoutes.routeNames.filter(name => !runtime.staticRouteNames.has(name))
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
  return isAuthenticated() ? getRouterRuntime(targetRouter).menuRoutes.sidebarMenus : []
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
  return getRouterRuntime(targetRouter).menuRoutes.firstAccessiblePath || '/403'
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
      path: '/cockpit/:cockpitId?',
      name: 'AdminCockpit',
      component: () => import('../cockpit/CockpitView.vue'),
      meta: {
        hideInMenu: true,
        hideInTab: true,
        // layout: public 仅用于绕过 Admin 壳层
        layout: 'public',
        // 静态路由不经 authority→permissions 转换，需直接声明 permissions
        permissions: ['cockpit:view'],
        title: '驾驶舱',
      },
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

export function createAdminRouter(
  history: RouterHistory = createWebHashHistory(),
  options: CreateAdminRouterOptions = {},
): Router {
  const targetRouter = createRouter({
    history,
    routes: createStaticRoutes(),
  })
  const menuRoutes = createMenuRouteRuntime({
    componentResolver: resolveRouteComponent,
    hasPermission,
    hasRole,
    loadRemoteMenus: options.loadRemoteMenus ?? loadNormalizedAdminMenus,
    router: {
      addRoute: route => targetRouter.addRoute(route as RouteRecordRaw),
      getRoutes: () => targetRouter.getRoutes(),
      hasRoute: name => targetRouter.hasRoute(name),
      removeRoute: name => targetRouter.removeRoute(name),
    } satisfies RouteRegistryRouterLike,
    staticMenus: staticAdminRouteRecords,
  })
  const runtime: AdminRouterRuntime = {
    menuRoutes,
    staticRouteNames: new Set(menuRoutes.routeNames),
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

    const needsRematch = !runtime.menuRoutes.remoteLoaded
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
