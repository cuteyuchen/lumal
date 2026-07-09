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
import ChartPanelView from '../views/examples/ChartPanelView.vue'
import ChartView from '../views/examples/ChartView.vue'
import ComposablesView from '../views/examples/ComposablesView.vue'
import CrudTableView from '../views/examples/CrudTableView.vue'
import DictionaryView from '../views/examples/DictionaryView.vue'
import InfoReferenceView from '../views/examples/InfoReferenceView.vue'
import OverviewView from '../views/examples/OverviewView.vue'
import PageLayoutView from '../views/examples/PageLayoutView.vue'
import SchemaFormView from '../views/examples/SchemaFormView.vue'
import SchemaTableView from '../views/examples/SchemaTableView.vue'
import ServicesView from '../views/examples/ServicesView.vue'
import ThemeSettingsView from '../views/examples/ThemeSettingsView.vue'
import UtilsView from '../views/examples/UtilsView.vue'
import ProjectView from '../views/project/ProjectView.vue'

/***********************权限状态*********************/
export const permissionStore = createPermissionStore({
  permissions: ['dashboard:view', 'examples:view', 'examples:dictionary'],
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
    children: [
      {
        component: 'examples/overview',
        name: 'ExamplesOverview',
        path: 'overview',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 1,
          title: '示例总览',
        },
      },
      {
        component: 'examples/theme-settings',
        name: 'ExamplesThemeSettings',
        path: 'theme-settings',
        meta: {
          authority: ['examples:view'],
          icon: 'app:theme',
          order: 2,
          title: '主题与动画',
        },
      },
      {
        component: 'examples/page-layout',
        name: 'ExamplesPageLayout',
        path: 'page-layout',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 3,
          title: '页面布局',
        },
      },
      {
        component: 'examples/schema-form',
        name: 'ExamplesSchemaForm',
        path: 'schema-form',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:form',
          order: 4,
          title: 'Schema Form',
        },
      },
      {
        component: 'examples/schema-table',
        name: 'ExamplesSchemaTable',
        path: 'schema-table',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 5,
          title: 'Schema Table',
        },
      },
      {
        component: 'examples/crud-table',
        name: 'ExamplesCrudTable',
        path: 'crud-table',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:table',
          order: 6,
          title: 'CRUD Table',
        },
      },
      {
        component: 'examples/dictionary',
        name: 'ExamplesDictionary',
        path: 'dictionary',
        meta: {
          authority: ['examples:view', 'examples:dictionary'],
          icon: 'app:form',
          order: 7,
          title: 'Dictionary',
        },
      },
      {
        component: 'examples/info-reference',
        name: 'ExamplesInfoReference',
        path: 'info-reference',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 8,
          title: 'Info Reference',
        },
      },
      {
        component: 'examples/composables',
        name: 'ExamplesComposables',
        path: 'composables',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 9,
          title: 'Composables',
        },
      },
      {
        component: 'examples/utils',
        name: 'ExamplesUtils',
        path: 'utils',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 10,
          title: 'Utils',
        },
      },
      {
        component: 'examples/services',
        name: 'ExamplesServices',
        path: 'services',
        meta: {
          authority: ['examples:view'],
          icon: 'app:examples',
          order: 11,
          title: 'Services',
        },
      },
      {
        component: 'examples/chart',
        name: 'ExamplesChart',
        path: 'chart',
        meta: {
          authority: ['examples:view'],
          icon: 'app:chart',
          order: 12,
          title: 'Chart',
        },
      },
      {
        component: 'examples/chart-panel',
        name: 'ExamplesChartPanel',
        path: 'chart-panel',
        meta: {
          authority: ['examples:view'],
          icon: 'app:chart',
          order: 13,
          title: 'Chart Panel',
        },
      },
      {
        component: 'examples/info-reference',
        name: 'ExamplesRestricted',
        path: 'restricted',
        meta: {
          authority: ['examples:restricted'],
          hideInMenu: true,
          title: '受限示例',
        },
      },
    ],
    name: 'Examples',
    path: '/examples',
    redirect: '/examples/overview',
    meta: {
      authority: ['examples:view'],
      icon: 'app:examples',
      order: 2,
      title: '功能示例',
    },
  },
  {
    component: 'project/index',
    name: 'Project',
    path: '/project',
    meta: {
      authority: ['project:list'],
      icon: 'app:dashboard',
      order: 3,
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
    'examples/chart': ChartView,
    'examples/chart-panel': ChartPanelView,
    'examples/composables': ComposablesView,
    'examples/crud-table': CrudTableView,
    'examples/dictionary': DictionaryView,
    'examples/info-reference': InfoReferenceView,
    'examples/overview': OverviewView,
    'examples/page-layout': PageLayoutView,
    'examples/schema-form': SchemaFormView,
    'examples/schema-table': SchemaTableView,
    'examples/services': ServicesView,
    'examples/theme-settings': ThemeSettingsView,
    'examples/utils': UtilsView,
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
