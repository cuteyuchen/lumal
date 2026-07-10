import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { SidebarMenuItem } from '@luma/core/router'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { setupPermissionGuard } from '@luma/core/permission'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuRecords,
} from '@luma/core/router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { permissionStore } from '../services/permission'
import { isAuthenticated } from '../services/session'
import { resolveRouteComponent } from './components'
import { adminRouteRecords } from './routes'

export { permissionStore } from '../services/permission'
export { adminRouteRecords } from './routes'

/***********************菜单状态*********************/
export const normalizedAdminMenus = normalizeMenuRecords(adminRouteRecords)

/***********************权限判断*********************/
function hasPermission(permissions: string[]): boolean {
  return permissionStore.hasPermission(permissions, 'every')
}

function hasRole(roles: string[]): boolean {
  return permissionStore.hasRole(roles, 'every')
}

/***********************菜单生成*********************/
function flattenMenuTabs(menus: SidebarMenuItem[]): LumaLayoutTabItem[] {
  return menus.flatMap((menu) => {
    if (menu.children.length > 0) {
      return flattenMenuTabs(menu.children)
    }

    return {
      path: menu.path,
      title: menu.title,
    }
  })
}

function resolveMenuTab(menus: LumaLayoutTabItem[], path: string): LumaLayoutTabItem | undefined {
  return menus.find(tab => tab.path === path)
}

export function createAdminSidebarMenus(): SidebarMenuItem[] {
  return createSidebarMenus(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })
}

export function createAdminTabs(activePath?: string): LumaLayoutTabItem[] {
  const menuTabs = flattenMenuTabs(createAdminSidebarMenus())
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

  if (activePath === '/403' && !tabs.some(tab => tab.path === '/403')) {
    tabs.push({
      closable: false,
      path: '/403',
      title: '无权限',
    })
  }

  return tabs
}

export function resolveFirstAccessibleAdminPath(): string {
  return findFirstAccessibleMenu(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })?.path ?? '/403'
}

/***********************路由创建*********************/
function createRoutes(): RouteRecordRaw[] {
  const menuRoutes = createRouteRecords(normalizedAdminMenus, {
    componentResolver: resolveRouteComponent,
  }) as RouteRecordRaw[]

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
      redirect: () => resolveFirstAccessibleAdminPath(),
    },
    ...menuRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: () => resolveFirstAccessibleAdminPath(),
    },
  ]
}

export function createAdminRouter(history: RouterHistory = createWebHashHistory()): Router {
  const router = createRouter({
    history,
    routes: createRoutes(),
  })

  setupPermissionGuard(router, permissionStore, {
    isAuthenticated,
    loginPath: '/login',
    mode: 'every',
    noAccessRedirect: '/403',
    redirectQueryKey: 'redirect',
    requireLoginByDefault: true,
    roleMode: 'every',
    whiteList: ['/login'],
  })

  return router
}

export const router = createAdminRouter()
