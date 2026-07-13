import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  LumaContent,
  LumaHeader,
  LumaLayout,
  LumaRouterView,
  LumaSidebar,
  LumaTabs,
  LumaTopNav,
} from '../src/layout'
import { createDefaultPreferences } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const menus = [
  {
    icon: 'app:dashboard',
    path: '/dashboard',
    title: '工作台',
  },
  {
    children: [
      {
        path: '/system/user',
        title: '用户管理',
      },
    ],
    path: '/system',
    title: '系统管理',
  },
]

const tabs = [
  {
    path: '/dashboard',
    title: '工作台',
  },
  {
    closable: true,
    path: '/system',
    title: '系统管理',
  },
]

function createLayoutPreferences(layout: 'mixed-nav' | 'sidebar-nav' | 'top-nav' = 'sidebar-nav') {
  return createDefaultPreferences({ app: { layout } })
}

describe('luma layout', () => {
  it('会组合 Element Plus 布局、头部、侧边栏、页签和内容区', () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: {
          ...elementPlusStubs,
          RouterView: {
            name: 'RouterView',
            template: '<div class="router-view">路由内容</div>',
          },
        },
      },
      props: {
        activeMenuPath: '/dashboard',
        activeTabPath: '/dashboard',
        menus,
        preferences: createLayoutPreferences(),
        tabs,
        title: 'Luma Admin',
      },
      slots: {
        default: '<section class="layout-body">页面内容</section>',
        headerActions: '<button class="header-action" type="button">退出</button>',
      },
    })

    expect(wrapper.findComponent({ name: 'ElContainer' }).exists()).toBe(true)
    expect(wrapper.findComponent(LumaHeader).exists()).toBe(true)
    expect(wrapper.findComponent(LumaSidebar).exists()).toBe(true)
    expect(wrapper.findComponent(LumaTabs).exists()).toBe(true)
    expect(wrapper.findComponent(LumaContent).exists()).toBe(true)
    expect(wrapper.find('.luma-header__title').text()).toBe('Luma Admin')
    expect(wrapper.find('.header-action').text()).toBe('退出')
    expect(wrapper.find('.layout-body').text()).toBe('页面内容')
  })

  it('头部折叠按钮会由 layout 抛出统一切换事件', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        menus,
        preferences: createLayoutPreferences(),
      },
    })

    await wrapper.find('[data-action="toggle-sidebar"]').trigger('click')

    expect(wrapper.emitted('toggleSidebar')?.[0]).toEqual([])
  })

  it('移动端抽屉使用独立状态且不会修改桌面折叠偏好', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const mediaQuery = {
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      matches: true,
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        menus,
        preferences: createLayoutPreferences(),
      },
    })

    expect(wrapper.classes()).toContain('is-mobile-menu-hidden')
    expect(wrapper.find('.luma-layout__mobile-sidebar').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.luma-layout__mobile-sidebar').attributes()).toHaveProperty('inert')
    await wrapper.find('[data-action="toggle-sidebar"]').trigger('click')
    expect(wrapper.classes()).not.toContain('is-mobile-menu-hidden')
    expect(wrapper.find('.luma-layout__mobile-sidebar').attributes('aria-hidden')).toBe('false')
    expect(wrapper.find('.luma-layout__mobile-sidebar').attributes()).not.toHaveProperty('inert')
    expect(wrapper.emitted('toggleSidebar')).toBeUndefined()

    await wrapper.find('.luma-layout__sidebar-scrim').trigger('click')
    expect(wrapper.classes()).toContain('is-mobile-menu-hidden')

    wrapper.unmount()
    expect(listeners.size).toBe(0)
    vi.unstubAllGlobals()
  })

  it('顶部导航会从完整菜单树自动渲染并透传最终导航目标', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/system/user',
        menus,
        preferences: createLayoutPreferences('top-nav'),
      },
    })

    expect(wrapper.findComponent(LumaTopNav).exists()).toBe(true)
    expect(wrapper.findComponent(LumaTopNav).props('activePath')).toBe('/system/user')
    expect(wrapper.find('.luma-header__navigation').exists()).toBe(true)

    await wrapper.find('[data-menu-path="/system/user"]').trigger('click')

    expect(wrapper.emitted('topMenuSelect')?.[0]).toEqual(['/system/user'])
    expect(wrapper.emitted('menuSelect')?.[0]).toEqual(['/system/user'])
  })

  it('混合导航会自动拆分菜单并把一级菜单下钻到首个子项', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/system/user',
        menus,
        preferences: createLayoutPreferences('mixed-nav'),
      },
    })

    expect(wrapper.findComponent(LumaTopNav).props('mode')).toBe('flat')
    expect(wrapper.find('[data-menu-path="/system"]').exists()).toBe(true)
    expect(wrapper.findComponent(LumaSidebar).props('menus')).toEqual(menus[1]!.children)

    await wrapper.find('[data-menu-path="/system"]').trigger('click')
    expect(wrapper.emitted('menuSelect')?.at(-1)).toEqual(['/system/user'])
  })

  it('混合导航会随一级菜单是否有子级自动隐藏和显示侧栏', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/dashboard',
        menus,
        preferences: createLayoutPreferences('mixed-nav'),
      },
    })

    expect(wrapper.find('.luma-layout__desktop-sidebar').exists()).toBe(false)

    await wrapper.setProps({ activeMenuPath: '/system/user' })
    expect(wrapper.find('.luma-layout__desktop-sidebar').exists()).toBe(true)
    expect(wrapper.findComponent(LumaSidebar).props('menus')).toEqual(menus[1]!.children)

    await wrapper.setProps({ activeMenuPath: '/dashboard' })
    expect(wrapper.find('.luma-layout__desktop-sidebar').exists()).toBe(false)
  })

  it('路由驱动模式会解析访问标签、限制数量并在关闭后进入 fallback', async () => {
    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
    const RouteView = defineComponent({ template: '<div />' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { component: RouteView, meta: { affixTab: true, title: '工作台' }, path: '/dashboard' },
        { component: RouteView, meta: { title: '用户管理' }, path: '/system/user' },
        { component: RouteView, meta: { title: '角色管理' }, path: '/system/role' },
      ],
    })

    await router.push('/dashboard')
    await router.isReady()

    const wrapper = mount(LumaLayout, {
      global: {
        plugins: [router],
        stubs: elementPlusStubs,
      },
      props: {
        fixedTabs: [{ path: '/dashboard', title: '工作台' }],
        preferences: createLayoutPreferences(),
        routeDriven: true,
        tabFallbackPath: '/dashboard',
        tabMaxCount: 2,
      },
    })

    await router.push('/system/user')
    await wrapper.vm.$nextTick()
    await router.push('/system/role')
    await wrapper.vm.$nextTick()

    const tabLabels = wrapper.findAll('[role="tab"]').map(tab => tab.text())
    expect(tabLabels).toEqual(['工作台', '角色管理'])

    await wrapper.find('[aria-label="关闭角色管理"]').trigger('click')

    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/dashboard'))
    expect(wrapper.emitted('tabRemove')?.[0]).toEqual(['/system/role'])

    wrapper.unmount()
    Element.prototype.scrollIntoView = originalScrollIntoView
  })
})

describe('luma sidebar', () => {
  it('会渲染多级菜单并透传选择事件', async () => {
    const wrapper = mount(LumaSidebar, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activePath: '/dashboard',
        menus,
      },
    })

    expect(wrapper.findComponent({ name: 'ElMenu' }).props('defaultActive')).toBe('/dashboard')
    expect(wrapper.find('[data-menu-path="/dashboard"]').text()).toContain('工作台')
    expect(wrapper.find('[data-menu-path="/system/user"]').text()).toContain('用户管理')

    await wrapper.find('[data-menu-path="/system/user"]').trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual(['/system/user'])
  })
})

describe('luma tabs', () => {
  it('会使用可聚焦标签按钮更新活动页签并透传关闭事件', async () => {
    const wrapper = mount(LumaTabs, {
      props: {
        activePath: '/dashboard',
        tabs,
      },
    })

    const tabButtons = wrapper.findAll('[role="tab"]')
    expect(tabButtons).toHaveLength(2)
    expect(tabButtons[0]?.attributes('aria-selected')).toBe('true')
    expect(tabButtons[0]?.attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-action="refresh-current-tab"]').exists()).toBe(true)

    await wrapper.find('[data-action="refresh-current-tab"]').trigger('click')
    await tabButtons[1]?.trigger('click')
    await wrapper.find('[aria-label="关闭系统管理"]').trigger('click')

    expect(wrapper.emitted('update:activePath')?.[0]).toEqual(['/system'])
    expect(wrapper.emitted('refresh')?.[0]).toEqual(['/dashboard'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['/system'])
    expect(wrapper.emitted('remove')?.[0]).toEqual(['/system'])
  })

  it('允许消费方隐藏常驻刷新按钮', () => {
    const wrapper = mount(LumaTabs, {
      props: {
        activePath: '/dashboard',
        showRefresh: false,
        tabs,
      },
    })

    expect(wrapper.find('[data-action="refresh-current-tab"]').exists()).toBe(false)
  })

  it('支持键盘切换和右键菜单批量操作', async () => {
    const wrapper = mount(LumaTabs, {
      attachTo: document.body,
      global: {
        stubs: {
          Teleport: true,
        },
      },
      props: {
        activePath: '/system',
        tabs: [
          { closable: false, path: '/dashboard', title: '工作台' },
          { closable: true, path: '/system', title: '系统管理' },
          { closable: true, path: '/project', title: '项目管理' },
        ],
      },
    })

    const tabButtons = wrapper.findAll('[role="tab"]')
    await wrapper.findAll('.luma-tabs__item')[1]?.trigger('contextmenu', {
      clientX: 120,
      clientY: 80,
    })
    const closeOthers = wrapper.findAll('.luma-tabs-context-menu button')
      .find(button => button.text().includes('关闭其他'))
    await closeOthers?.trigger('click')

    expect(wrapper.emitted('closeOthers')?.[0]).toEqual(['/system'])

    await tabButtons[1]?.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['/project'])
    wrapper.unmount()
  })

  it('折叠状态使用不会被 Element Plus 隐藏的图标容器', () => {
    const wrapper = mount(LumaSidebar, {
      global: {
        stubs: {
          ...elementPlusStubs,
          LumaIcon: {
            name: 'LumaIcon',
            template: '<svg class="luma-icon-stub" />',
          },
        },
      },
      props: {
        collapsed: true,
        menus,
      },
    })

    const icon = wrapper.find('.luma-sidebar-menu-item__icon')
    expect(icon.element.tagName).toBe('I')
    expect(icon.find('.luma-icon-stub').exists()).toBe(true)
  })
})

describe('luma router view', () => {
  it('会包裹 RouterView 并保留内容容器', () => {
    const wrapper = mount(LumaRouterView, {
      global: {
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="router-view">路由内容</div>',
          },
        },
      },
    })

    expect(wrapper.find('.luma-router-view').exists()).toBe(true)
    expect(wrapper.find('.router-view').text()).toBe('路由内容')
  })

  it('会支持路由切换动画、缓存和加载反馈', async () => {
    vi.useFakeTimers()

    const DemoView = defineComponent({
      name: 'DemoView',
      template: '<section class="demo-view">页面内容</section>',
    })
    const RouterViewStub = defineComponent({
      name: 'RouterView',
      setup(_props, { slots }) {
        return () => slots.default?.({ Component: DemoView })
      },
    })

    const wrapper = mount(LumaRouterView, {
      global: {
        stubs: {
          'keep-alive': {
            name: 'KeepAlive',
            template: '<div class="keep-alive-stub"><slot /></div>',
          },
          'transition': {
            name: 'Transition',
            template: '<div class="transition-stub"><slot /></div>',
          },
          'RouterView': RouterViewStub,
        },
      },
      props: {
        cache: true,
        cacheMax: 3,
        loading: true,
        progress: true,
        transition: true,
        transitionName: 'fade',
        viewKey: 'dashboard',
      },
    })

    expect(wrapper.find('.transition-stub').exists()).toBe(true)
    expect(wrapper.find('.keep-alive-stub').exists()).toBe(true)
    expect(wrapper.find('.demo-view').text()).toBe('页面内容')

    await wrapper.setProps({ viewKey: 'project' })

    expect(wrapper.find('.luma-router-view__progress').exists()).toBe(true)
    expect(wrapper.find('.luma-router-view__loading').exists()).toBe(true)

    vi.runAllTimers()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.luma-router-view__progress').exists()).toBe(false)
    expect(wrapper.find('.luma-router-view__loading').exists()).toBe(false)

    wrapper.unmount()
    vi.useRealTimers()
  })
})
