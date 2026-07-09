import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { LumaMenuRecord, SidebarMenuItem } from '@luma/core/router'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { createPermissionStore, setupPermissionGuard } from '@luma/core/permission'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuRecords,
} from '@luma/core/router'
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/dashboard/DashboardView.vue'
import ForbiddenView from '../views/error/ForbiddenView.vue'
import ProjectView from '../views/project/ProjectView.vue'

/***********************权限状态*********************/
export const permissionStore = createPermissionStore({
  permissions: ['dashboard:view'],
  roles: ['admin'],
})

/***********************菜单配置*********************/
export const adminRouteRecords: LumaMenuRecord[] = [
  {
    component: 'dashboard/index',
    name: 'Dashboard',
    path: '/dashboard',
    meta: {
      authority: ['dashboard:view'],
      icon: 'app:dashboard',
      order: 1,
      title: '工作台',
    },
  },
  {
    component: 'project/index',
    name: 'Project',
    path: '/project',
    meta: {
      authority: ['project:list'],
      icon: 'app:dashboard',
      order: 2,
      title: '项目管理',
    },
  },
  {
    component: 'error/forbidden',
    name: 'Forbidden',
    path: '/403',
    meta: {
      hideInMenu: true,
      title: '无权限',
    },
  },
]

export const normalizedAdminMenus = normalizeMenuRecords(adminRouteRecords)

/***********************菜单生成*********************/
function hasPermission(permissions: string[]): boolean {
  return permissionStore.hasPermission(permissions, 'every')
}

function hasRole(roles: string[]): boolean {
  return permissionStore.hasRole(roles, 'every')
}

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

export function createAdminSidebarMenus(): SidebarMenuItem[] {
  return createSidebarMenus(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })
}

export function createAdminTabs(activePath?: string): LumaLayoutTabItem[] {
  const tabs = flattenMenuTabs(createAdminSidebarMenus())

  if (activePath === '/403' && !tabs.some(tab => tab.path === '/403')) {
    tabs.push({
      closable: false,
      path: '/403',
      title: '无权限',
    })
  }

  return tabs
}

/***********************路由创建*********************/
function resolveRouteComponent(component: string): RouteRecordRaw['component'] | undefined {
  const components: Record<string, RouteRecordRaw['component']> = {
    'dashboard/index': DashboardView,
    'error/forbidden': ForbiddenView,
    'project/index': ProjectView,
  }

  return components[component]
}

function createRoutes(): RouteRecordRaw[] {
  const firstAccessibleMenu = findFirstAccessibleMenu(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })
  const menuRoutes = createRouteRecords(normalizedAdminMenus, {
    componentResolver: resolveRouteComponent,
  }) as RouteRecordRaw[]

  return [
    {
      path: '/',
      redirect: firstAccessibleMenu?.path ?? '/403',
    },
    ...menuRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: firstAccessibleMenu?.path ?? '/403',
    },
  ]
}

export function createAdminRouter(history: RouterHistory = createWebHashHistory()): Router {
  const router = createRouter({
    history,
    routes: createRoutes(),
  })

  setupPermissionGuard(router, permissionStore, {
    mode: 'every',
    noAccessRedirect: '/403',
    roleMode: 'every',
  })

  return router
}

export const router = createAdminRouter()
