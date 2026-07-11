import { mergePreferences } from '@luma/core/theme'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory } from 'vue-router'
import App from '../src/App.vue'
import AppSettingsDrawer from '../src/components/app/AppSettingsDrawer.vue'
import { createAdminRouter } from '../src/router'
import { createAdminPreferences, resetAdminSystemConfig } from '../src/services/preferences'
import { login, logout } from '../src/services/session'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const LayoutStub = defineComponent({
  name: 'LumaLayout',
  props: {
    activeMenuPath: String,
    activeTopMenuPath: String,
    headerMenuAlign: String,
    headerMenuMaxWidth: [Number, String],
    fixedTabs: Array,
    menus: Array,
    routeDriven: Boolean,
    routeTabResolver: Function,
    showTabIcons: Boolean,
    showTabMaximize: Boolean,
    sidebarWidth: String,
    tabFallbackPath: String,
    tabMaxCount: Number,
    tabsVisible: Boolean,
    title: String,
    topMenus: Array,
    topMenuMode: String,
  },
  template: `
    <section
      class="layout-stub"
      :data-menu-count="menus?.length ?? 0"
      :data-header-menu-align="headerMenuAlign"
      :data-header-menu-max-width="headerMenuMaxWidth"
      :data-show-tab-icons="String(showTabIcons)"
      :data-show-tab-maximize="String(showTabMaximize)"
      :data-sidebar-width="sidebarWidth"
      :data-title="title"
      :data-fixed-tab-count="fixedTabs?.length ?? 0"
      :data-fixed-tab-paths="fixedTabs?.map(tab => tab.path).join(',')"
      :data-route-driven="String(routeDriven)"
      :data-route-tab-resolver="String(typeof routeTabResolver === 'function')"
      :data-tab-fallback-path="tabFallbackPath"
      :data-tab-max-count="tabMaxCount"
      :data-tabs-visible="String(tabsVisible)"
      :data-top-menu-mode="topMenuMode"
      :data-top-menu-count="topMenus?.length ?? 0"
    >
      <slot name="headerActions" />
      <slot />
    </section>
  `,
})

const RouterViewStub = defineComponent({
  name: 'LumaRouterView',
  props: {
    cache: Boolean,
    cacheMax: Number,
    loading: Boolean,
    progress: Boolean,
    transition: Boolean,
    transitionName: String,
  },
  template: `
    <section
      class="router-view-stub"
      :data-cache="String(cache)"
      :data-cache-max="cacheMax"
      :data-loading="String(loading)"
      :data-progress="String(progress)"
      :data-transition="String(transition)"
      :data-transition-name="transitionName"
    />
  `,
})

const IconStub = defineComponent({
  name: 'LumaIcon',
  template: '<i class="luma-icon-stub" />',
})

const DrawerStub = defineComponent({
  name: 'ElDrawer',
  props: {
    modelValue: Boolean,
    title: String,
  },
  template: '<section v-if="modelValue" class="el-drawer" :data-title="title"><slot /></section>',
})

describe('app shell', () => {
  afterEach(async () => {
    resetAdminSystemConfig()
    await logout()
  })

  it('会使用默认偏好驱动混合导航、侧栏宽度和路由视图配置', async () => {
    await login('admin')

    const router = createAdminRouter(createMemoryHistory())
    await router.push('/examples/overview')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          ...elementPlusStubs,
          ElDrawer: DrawerStub,
          LumaIcon: IconStub,
          LumaLayout: LayoutStub,
          LumaRouterView: RouterViewStub,
        },
      },
    })

    expect(wrapper.find('.layout-stub').attributes('data-title')).toBe('Luma Admin')
    expect(wrapper.find('.layout-stub').attributes('data-top-menu-count')).toBe('5')
    expect(wrapper.find('.layout-stub').attributes('data-menu-count')).toBe('13')
    expect(wrapper.find('.layout-stub').attributes('data-header-menu-align')).toBe('center')
    expect(wrapper.find('.layout-stub').attributes('data-header-menu-max-width')).toBe('1120')
    expect(wrapper.find('.layout-stub').attributes('data-show-tab-icons')).toBe('true')
    expect(wrapper.find('.layout-stub').attributes('data-show-tab-maximize')).toBe('true')
    expect(wrapper.find('.layout-stub').attributes('data-sidebar-width')).toBe('280px')
    expect(wrapper.find('.layout-stub').attributes('data-fixed-tab-count')).toBe('1')
    expect(wrapper.find('.layout-stub').attributes('data-fixed-tab-paths')).toBe('/dashboard')
    expect(wrapper.find('.layout-stub').attributes('data-route-driven')).toBe('true')
    expect(wrapper.find('.layout-stub').attributes('data-route-tab-resolver')).toBe('true')
    expect(wrapper.find('.layout-stub').attributes('data-tab-fallback-path')).toBe('/dashboard')
    expect(wrapper.find('.layout-stub').attributes('data-tab-max-count')).toBe('8')
    expect(wrapper.find('.layout-stub').attributes('data-top-menu-mode')).toBe('flat')
    expect(wrapper.find('.layout-stub').attributes('data-tabs-visible')).toBe('true')
    expect(wrapper.find('[data-action="open-settings"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('超级管理员')
    expect(wrapper.find('.router-view-stub').attributes()).toMatchObject({
      'data-cache': 'true',
      'data-cache-max': '8',
      'data-loading': 'true',
      'data-progress': 'true',
      'data-transition': 'true',
      'data-transition-name': 'fade-side',
    })

    await router.push('/system/user')
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.layout-stub').attributes('data-route-driven')).toBe('true')
  })

  it('设置抽屉更新布局偏好后会重新拆分菜单', async () => {
    await login('admin')

    const router = createAdminRouter(createMemoryHistory())
    await router.push('/examples/overview')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          ...elementPlusStubs,
          ElDrawer: DrawerStub,
          LumaIcon: IconStub,
          LumaLayout: LayoutStub,
          LumaRouterView: RouterViewStub,
        },
      },
    })

    const topNavPreferences = mergePreferences(createAdminPreferences(), {
      app: { layout: 'top-nav' },
    })

    wrapper.findComponent(AppSettingsDrawer).vm.$emit('update:preferences', topNavPreferences)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.layout-stub').attributes('data-top-menu-count')).toBe('5')
    expect(wrapper.find('.layout-stub').attributes('data-menu-count')).toBe('0')
    expect(wrapper.find('.layout-stub').attributes('data-top-menu-mode')).toBe('tree')
  })

  it('登录页使用 public layout，不渲染后台壳', async () => {
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          ...elementPlusStubs,
          ElDrawer: DrawerStub,
          LumaIcon: IconStub,
          LumaLayout: LayoutStub,
          LumaRouterView: RouterViewStub,
        },
      },
    })

    expect(wrapper.find('.layout-stub').exists()).toBe(false)
    expect(wrapper.find('.router-view-stub').exists()).toBe(true)
  })

  it('应用挂载后登录会刷新菜单并显示后台壳', async () => {
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/login')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          ...elementPlusStubs,
          ElDrawer: DrawerStub,
          LumaIcon: IconStub,
          LumaLayout: LayoutStub,
          LumaRouterView: RouterViewStub,
        },
      },
    })

    expect(wrapper.find('.layout-stub').exists()).toBe(false)

    await login('admin')
    await router.push('/system/user')
    await flushPromises()

    expect(wrapper.find('.layout-stub').attributes('data-top-menu-count')).toBe('5')
    expect(wrapper.find('.layout-stub').attributes('data-menu-count')).toBe('7')
  })
})
