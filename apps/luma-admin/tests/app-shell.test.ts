import { mergePreferences } from '@luma/core/theme'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { elementPlusStubs } from '../../../packages/core/tests/helpers/element-plus-stubs'
import App from '../src/App.vue'
import AppSettingsDrawer from '../src/components/app/AppSettingsDrawer.vue'
import { createAdminRouter } from '../src/router'
import { createAdminPreferences, resetAdminSystemConfig } from '../src/services/preferences'
import { login, logout } from '../src/services/session'

const LayoutStub = defineComponent({
  name: 'LumaLayout',
  props: {
    activeMenuPath: String,
    activeTopMenuPath: String,
    menus: Array,
    sidebarWidth: String,
    tabs: Array,
    title: String,
    topMenus: Array,
  },
  template: `
    <section
      class="layout-stub"
      :data-menu-count="menus?.length ?? 0"
      :data-sidebar-width="sidebarWidth"
      :data-title="title"
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
    expect(wrapper.find('.layout-stub').attributes('data-top-menu-count')).toBe('4')
    expect(wrapper.find('.layout-stub').attributes('data-menu-count')).toBe('13')
    expect(wrapper.find('.layout-stub').attributes('data-sidebar-width')).toBe('248px')
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

    expect(wrapper.find('.layout-stub').attributes('data-top-menu-count')).toBe('4')
    expect(wrapper.find('.layout-stub').attributes('data-menu-count')).toBe('0')
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
})
