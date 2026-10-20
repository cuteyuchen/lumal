import type { LumalLayoutTabItem } from '@lumal/core/layout'
import type { LumalMenuInputRecord, SidebarMenuItem } from '@lumal/core/router'
import type { RouteRecordRaw, RouterHistory } from 'vue-router'
import { setupPermissionGuard } from '@lumal/core/permission'
import { createMenuRouteRuntime } from '@lumal/core/router'
import { shallowRef } from 'vue'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { appConfig } from '../app.config'
import { application, permissionStore } from '../services/session'
import { viewComponents } from './views'

/***********************路由初始化*********************/
export const routeError = shallowRef('')
export function createAdminRouter(history?: RouterHistory) {
  const targetRouter = createRouter({
    history: history ?? (appConfig.routerMode === 'history' ? createWebHistory(import.meta.env.BASE_URL) : createWebHashHistory(import.meta.env.BASE_URL)),
    routes: [
      { path: '/login', name: 'Login', component: () => import('../views/auth/LoginView.vue'), meta: { layout: 'public', requireLogin: false, title: '登录' } },
      { path: '/', redirect: '/dashboard' },
      { path: '/403', component: () => import('../views/error/ForbiddenView.vue'), meta: { title: '无权限' } },
      { path: '/404', component: () => import('../views/error/NotFoundView.vue'), meta: { title: '页面不存在' } },
      { path: '/:pathMatch(.*)*', name: 'CatchAll', component: () => import('../views/error/NotFoundView.vue') },
    ],
  })
  const runtime = createMenuRouteRuntime({
    router: {
      addRoute: route => targetRouter.addRoute(route as RouteRecordRaw),
      getRoutes: () => targetRouter.getRoutes(),
      hasRoute: name => targetRouter.hasRoute(name),
      removeRoute: name => targetRouter.removeRoute(name),
    },
    componentResolver: name => viewComponents[name],
    hasPermission: values => permissionStore.hasPermission(values, 'every'),
    hasRole: values => permissionStore.hasRole(values, 'some'),
    loadRemoteMenus: async () => {
      await application.initialize()
      return application.menus.value as unknown as LumalMenuInputRecord[]
    },
  })
  application.onReset((expired) => {
    runtime.resetRemote()
    if (expired && targetRouter.currentRoute.value.path !== '/login')
      void targetRouter.replace({ path: '/login', query: { redirect: targetRouter.currentRoute.value.fullPath } })
  })

  targetRouter.beforeEach(async (to) => {
    if (!application.isAuthenticated())
      return to.path === '/login' ? true : { path: '/login', query: { redirect: to.fullPath } }
    const rematch = !runtime.remoteLoaded
    try {
      await runtime.loadRemote()
      routeError.value = ''
    }
    catch (reason) {
      routeError.value = reason instanceof Error ? reason.message : '菜单加载失败'
      application.reset()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.path === '/login' || to.path === '/')
      return runtime.firstAccessiblePath || '/403'
    if (rematch)
      return to.fullPath
    return to.name === 'CatchAll' ? '/404' : true
  })
  setupPermissionGuard(targetRouter, permissionStore, {
    isAuthenticated: application.isAuthenticated,
    mode: 'every',
    roleMode: 'some',
    requireLoginByDefault: true,
    noAccessRedirect: '/403',
  })
  return { router: targetRouter, runtime }
}

const { router, runtime } = createAdminRouter()
export { router }
export function createAdminSidebarMenus(): SidebarMenuItem[] {
  // ready 使非响应式菜单运行时在退出和初始化完成后重新计算。
  return application.ready.value ? runtime.sidebarMenus : []
}
export function createAdminTabs(): LumalLayoutTabItem[] {
  return runtime.routes.filter(route => route.meta.affixTab === true
    && permissionStore.hasPermission(route.meta.permissions, 'every')
    && permissionStore.hasRole(route.meta.roles, 'some'))
    .map(route => ({ path: route.path, title: route.meta.title, closable: false }))
}
