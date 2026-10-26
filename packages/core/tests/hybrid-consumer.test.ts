import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, onMounted, shallowRef } from 'vue'
import { createMemoryHistory, createRouter, RouterView, useRoute } from 'vue-router'
import { LumalLayout, LumalRouterView } from '../src/layout'
import { createPermissionStore, setupPermissionGuard } from '../src/permission'
import { createRouteRegistry, createSidebarMenus, normalizeMenuRecords } from '../src/router'
import { createDefaultPreferences } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

function createHybrid() {
  const authenticated = shallowRef(false)
  const permissions = createPermissionStore()
  const screenMounted = vi.fn()
  const screen = defineComponent({
    name: 'PublicScreen',
    setup() {
      const position = shallowRef(10)
      onMounted(screenMounted)
      return () => h('button', { 'data-map-state': position.value, 'onClick': () => position.value++ }, '公开画布')
    },
  })
  const adminMenus = normalizeMenuRecords([
    { name: 'Records', path: '/admin/records', meta: { title: '项目列表', authority: ['records:read'] } },
    { name: 'Settings', path: '/admin/settings', meta: { title: '设置', authority: ['settings:read'] } },
  ])
  const menus = computed(() => createSidebarMenus(adminMenus, { hasPermission: value => permissions.hasPermission(value) }))
  const admin = defineComponent({
    setup: () => () => h(LumalLayout, {
      title: '后台',
      preferences: createDefaultPreferences(),
      menus: menus.value,
      routeDriven: true,
      routeTabFilter: (route: { path: string }) => route.path.startsWith('/admin/'),
    }, { default: () => h(RouterView) }),
  })
  const view = (text: string) => defineComponent({ setup: () => () => h('section', text) })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/screen', name: 'Screen', component: screen, meta: { requireLogin: false, keepAlive: true, layout: 'public', title: '公开画布' } },
      { path: '/login', name: 'Login', component: view('登录'), meta: { keepAlive: false } },
      { path: '/403', name: 'Forbidden', component: view('无权访问'), meta: { requireLogin: false, keepAlive: false } },
      { path: '/admin', name: 'AdminRoot', component: admin, meta: { requireLogin: true }, children: [
        { path: 'records', name: 'Records', component: view('项目列表'), meta: { permissions: ['records:read'], title: '项目列表' } },
        { path: 'settings', name: 'Settings', component: view('设置'), meta: { permissions: ['settings:read'], title: '设置' } },
      ] },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: view('页面不存在'), meta: { requireLogin: false, keepAlive: false } },
    ],
  })
  setupPermissionGuard(router, permissions, {
    isAuthenticated: () => authenticated.value,
    requireLoginByDefault: true,
    noAccessRedirect: '/403',
  })
  return { router, permissions, authenticated, screenMounted, menus }
}

describe('single-router admin and screen consumer', () => {
  it('访客Screen、登录回跳、403和404均可结束导航，不循环重定向', async () => {
    const { router, authenticated, permissions } = createHybrid()
    await router.push('/screen')
    expect(router.currentRoute.value.name).toBe('Screen')
    await router.push('/admin/records?tab=one')
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe('/admin/records?tab=one')
    authenticated.value = true
    await router.replace(String(router.currentRoute.value.query.redirect))
    expect(router.currentRoute.value.name).toBe('Forbidden')
    permissions.setPermissions(['records:read'])
    await router.push('/admin/records')
    expect(router.currentRoute.value.name).toBe('Records')
    await router.push('/unknown')
    expect(router.currentRoute.value.name).toBe('NotFound')
  })

  it('身份切换同步更新菜单，并可用公开Router API立即重新鉴权当前页', async () => {
    const { router, authenticated, permissions, menus } = createHybrid()
    authenticated.value = true
    permissions.setPermissions(['records:read'])
    expect(menus.value.map(item => item.path)).toEqual(['/admin/records'])
    await router.push('/admin/records')
    permissions.setPermissions(['settings:read'])
    expect(menus.value.map(item => item.path)).toEqual(['/admin/settings'])
    await router.replace({ path: router.currentRoute.value.fullPath, force: true })
    expect(router.currentRoute.value.name).toBe('Forbidden')
    authenticated.value = false
    await router.push('/admin/settings')
    expect(router.currentRoute.value.name).toBe('Login')
    await router.push('/screen')
    expect(router.currentRoute.value.name).toBe('Screen')
  })

  it('动态Screen业务路由重复注册幂等，重置不删除应用静态路由', async () => {
    const { router } = createHybrid()
    const registry = createRouteRegistry(router)
    const routes = [{
      name: 'ScreenDetails',
      path: '/screen/items/:id',
      component: defineComponent({ setup: () => () => h('section', '公开详情') }),
      meta: { requireLogin: false },
    }]
    registry.register(routes)
    registry.register(routes)
    expect(router.getRoutes().filter(route => route.name === 'ScreenDetails')).toHaveLength(1)
    await router.push('/screen/items/example')
    expect(router.currentRoute.value.name).toBe('ScreenDetails')
    registry.reset()
    expect(router.hasRoute('ScreenDetails')).toBe(false)
    expect(router.hasRoute('Screen')).toBe(true)
    expect(router.hasRoute('AdminRoot')).toBe(true)
  })

  it('同一RouterView组合独立布局，后台标签不销毁公开画布状态', async () => {
    const { router, authenticated, permissions, screenMounted } = createHybrid()
    authenticated.value = true
    permissions.setPermissions(['records:read'])
    await router.push('/screen')
    const Root = defineComponent({
      setup() {
        const route = useRoute()
        return () => h(LumalRouterView, {
          cache: true,
          cacheKeys: ['Screen', 'AdminRoot'],
          viewKey: String(route.matched[0]?.name),
        })
      },
    })
    const wrapper = mount(Root, { global: { plugins: [router], stubs: elementPlusStubs } })
    try {
      expect(wrapper.findComponent(LumalLayout).exists()).toBe(false)
      await wrapper.get('[data-map-state]').trigger('click')
      await router.push('/admin/records')
      await flushPromises()
      const layout = wrapper.findComponent(LumalLayout)
      expect(layout.exists()).toBe(true)
      expect(layout.props('menus')).toMatchObject([{ path: '/admin/records' }])
      await router.push('/screen')
      await flushPromises()
      expect(wrapper.findComponent(LumalLayout).exists()).toBe(false)
      expect((layout.vm as unknown as { getTabs: () => { path: string }[] }).getTabs().map(tab => tab.path)).toEqual(['/admin/records'])
      expect(wrapper.get('[data-map-state]').attributes('data-map-state')).toBe('11')
      expect(screenMounted).toHaveBeenCalledOnce()
    }
    finally {
      wrapper.unmount()
    }
  })
})
