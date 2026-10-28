import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  LumalBreadcrumb,
  LumalContent,
  LumalHeader,
  LumalLayout,
  LumalRouterView,
  LumalSidebar,
  LumalTabs,
  LumalTopNav,
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
    redirect: '/system/user',
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

describe('lumal layout', () => {
  it('会组合 Element Plus 布局、头部、侧边栏、页签和内容区', () => {
    const wrapper = mount(LumalLayout, {
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
        title: 'Lumal Admin',
      },
      slots: {
        default: '<section class="layout-body">页面内容</section>',
        headerActions: '<button class="header-action" type="button">退出</button>',
      },
    })

    expect(wrapper.findComponent({ name: 'ElContainer' }).exists()).toBe(true)
    expect(wrapper.findComponent(LumalHeader).exists()).toBe(true)
    expect(wrapper.findComponent(LumalHeader).findComponent(LumalBreadcrumb).exists()).toBe(true)
    expect(wrapper.find('.lumal-layout__main > .lumal-breadcrumb').exists()).toBe(false)
    expect(wrapper.findComponent(LumalSidebar).exists()).toBe(true)
    expect(wrapper.findComponent(LumalTabs).exists()).toBe(true)
    expect(wrapper.findComponent(LumalContent).exists()).toBe(true)
    expect(wrapper.find('.lumal-header__title').text()).toBe('Lumal Admin')
    expect(wrapper.find('.header-action').text()).toBe('退出')
    expect(wrapper.find('.layout-body').text()).toBe('页面内容')
  })

  it('showHeader 为 false 时不渲染头部，其余布局保持完整', () => {
    const wrapper = mount(LumalLayout, {
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
        menus,
        preferences: createLayoutPreferences(),
        showHeader: false,
      },
      slots: {
        default: '<section class="layout-body">页面内容</section>',
      },
    })

    expect(wrapper.findComponent(LumalHeader).exists()).toBe(false)
    expect(wrapper.findComponent(LumalSidebar).exists()).toBe(true)
    expect(wrapper.find('.layout-body').text()).toBe('页面内容')
  })

  it('头部折叠按钮会由 layout 抛出统一切换事件', async () => {
    const wrapper = mount(LumalLayout, {
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
    expect(wrapper.get('[data-action="toggle-sidebar"] .lumal-icon').find('svg').exists()).toBe(true)
  })

  it('移动端抽屉使用独立状态且不会修改桌面折叠偏好', async () => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>()
    const mediaQuery = {
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      matches: true,
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

    const wrapper = mount(LumalLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        menus,
        preferences: createLayoutPreferences(),
      },
    })

    expect(wrapper.classes()).toContain('is-mobile-menu-hidden')
    expect(wrapper.find('.lumal-layout__mobile-sidebar').attributes('aria-hidden')).toBe('true')
    expect(wrapper.find('.lumal-layout__mobile-sidebar').attributes()).toHaveProperty('inert')
    await wrapper.find('[data-action="toggle-sidebar"]').trigger('click')
    expect(wrapper.classes()).not.toContain('is-mobile-menu-hidden')
    expect(wrapper.find('.lumal-layout__mobile-sidebar').attributes('aria-hidden')).toBe('false')
    expect(wrapper.find('.lumal-layout__mobile-sidebar').attributes()).not.toHaveProperty('inert')
    expect(wrapper.emitted('toggleSidebar')).toBeUndefined()

    await wrapper.find('.lumal-layout__sidebar-scrim').trigger('click')
    expect(wrapper.classes()).toContain('is-mobile-menu-hidden')

    wrapper.unmount()
    expect(listeners.size).toBe(0)
    vi.unstubAllGlobals()
  })

  it('顶部导航会从完整菜单树自动渲染并透传最终导航目标', async () => {
    const wrapper = mount(LumalLayout, {
      global: {
        // 真实 Transition 不生成包裹节点，继续检查面包屑的实际布局层级。
        stubs: { ...elementPlusStubs, transition: false },
      },
      props: {
        activeMenuPath: '/system/user',
        menus,
        preferences: createLayoutPreferences('top-nav'),
      },
    })

    expect(wrapper.findComponent(LumalTopNav).exists()).toBe(true)
    expect(wrapper.findComponent(LumalTopNav).props('activePath')).toBe('/system/user')
    expect(wrapper.find('.lumal-header__navigation').exists()).toBe(true)
    expect(wrapper.findComponent(LumalHeader).findComponent(LumalBreadcrumb).exists()).toBe(false)
    expect(wrapper.find('.lumal-layout__main > .lumal-breadcrumb').exists()).toBe(true)

    await wrapper.find('[data-menu-path="/system/user"]').trigger('click')

    expect(wrapper.emitted('topMenuSelect')?.[0]).toEqual(['/system/user'])
    expect(wrapper.emitted('menuSelect')?.[0]).toEqual(['/system/user'])
    wrapper.unmount()
  })
  it('关闭响应式时窄 CSS 视口仍执行桌面折叠，切回响应式恢复移动抽屉', async () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query.includes('max-width'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
    const wrapper = mount(LumalLayout, {
      global: { stubs: elementPlusStubs },
      props: { menus, tabs, preferences: createLayoutPreferences(), responsive: false },
    })
    try {
      expect(wrapper.findComponent(LumalTabs).props('responsive')).toBe(false)
      expect(wrapper.findComponent(LumalTabs).findAll('.lumal-tabs__item').every(item => !item.classes().includes('is-not-draggable'))).toBe(true)
      await wrapper.get('[data-action="toggle-sidebar"]').trigger('click')
      expect(wrapper.emitted('toggleSidebar')).toHaveLength(1)
      expect(wrapper.classes()).toContain('is-mobile-menu-hidden')
      await wrapper.setProps({ responsive: true })
      expect(wrapper.findComponent(LumalTabs).props('responsive')).toBe(true)
      expect(wrapper.findComponent(LumalTabs).findAll('.lumal-tabs__item').every(item => item.classes().includes('is-not-draggable'))).toBe(true)
      await wrapper.get('[data-action="toggle-sidebar"]').trigger('click')
      expect(wrapper.emitted('toggleSidebar')).toHaveLength(1)
      expect(wrapper.classes()).not.toContain('is-mobile-menu-hidden')
    }
    finally {
      wrapper.unmount()
      vi.unstubAllGlobals()
    }
  })

  it('混合导航默认只切换顶级分组并展示其侧栏子菜单', async () => {
    const wrapper = mount(LumalLayout, {
      global: {
        stubs: { ...elementPlusStubs, transition: false },
      },
      props: {
        activeMenuPath: '/dashboard',
        menus,
        preferences: createLayoutPreferences('mixed-nav'),
      },
    })

    expect(wrapper.findComponent(LumalTopNav).props('mode')).toBe('flat')
    expect(wrapper.find('[data-menu-path="/system"]').exists()).toBe(true)
    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)
    expect(wrapper.findComponent(LumalHeader).findComponent(LumalBreadcrumb).exists()).toBe(false)
    expect(wrapper.find('.lumal-layout__main > .lumal-breadcrumb').exists()).toBe(true)

    await wrapper.find('[data-menu-path="/system"]').trigger('click')

    expect(wrapper.findComponent(LumalTopNav).props('activePath')).toBe('/system')
    expect(wrapper.findComponent(LumalSidebar).props('menus')).toEqual(menus[1]!.children)
    expect(wrapper.emitted('topMenuSelect')?.at(-1)).toEqual(['/system'])
    expect(wrapper.emitted('menuSelect')).toBeUndefined()
    wrapper.unmount()
  })

  it('混合导航开启自动激活后会优先采用目录重定向', async () => {
    const wrapper = mount(LumalLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/dashboard',
        menus,
        preferences: createDefaultPreferences({
          app: { layout: 'mixed-nav' },
          sidebar: { autoActivateChild: true },
        }),
      },
    })

    await wrapper.find('[data-menu-path="/system"]').trigger('click')

    expect(wrapper.findComponent(LumalSidebar).props('menus')).toEqual(menus[1]!.children)
    expect(wrapper.emitted('menuSelect')?.at(-1)).toEqual(['/system/user'])
  })

  it('混合导航会随浏览分组和实际路由同步隐藏或显示侧栏', async () => {
    const wrapper = mount(LumalLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/dashboard',
        menus,
        preferences: createLayoutPreferences('mixed-nav'),
      },
    })

    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)

    await wrapper.find('[data-menu-path="/system"]').trigger('click')
    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(true)
    expect(wrapper.findComponent(LumalSidebar).props('menus')).toEqual(menus[1]!.children)

    await wrapper.setProps({ activeMenuPath: '/system/user' })
    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(true)
    expect(wrapper.findComponent(LumalSidebar).props('menus')).toEqual(menus[1]!.children)

    await wrapper.setProps({ activeMenuPath: '/dashboard' })
    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)
  })

  it('混合导航关闭侧栏后使用树形顶部菜单访问子项', async () => {
    const wrapper = mount(LumalLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/system/user',
        menus,
        preferences: createDefaultPreferences({
          app: { layout: 'mixed-nav' },
          sidebar: { enable: false },
        }),
      },
    })

    expect(wrapper.findComponent(LumalTopNav).props('mode')).toBe('tree')
    expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)

    await wrapper.find('[data-menu-path="/system/user"]').trigger('click')
    expect(wrapper.emitted('menuSelect')?.at(-1)).toEqual(['/system/user'])
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

    const wrapper = mount(LumalLayout, {
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

describe('lumal sidebar', () => {
  it('会渲染多级菜单并透传选择事件', async () => {
    const wrapper = mount(LumalSidebar, {
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

  it('新开页外链不进入 ElMenu 选中态追踪，避免点击后高亮与实际页面错位', async () => {
    const externalMenus = [
      { externalLink: 'https://example.com', path: '/docs', title: '文档', externalTarget: '_blank' as const },
      { externalLink: 'https://self.example.com', path: '/inner', title: '内嵌', externalTarget: '_self' as const },
    ]

    const wrapper = mount(LumalSidebar, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activePath: '/dashboard',
        menus: externalMenus,
      },
    })

    // 新开页外链渲染为原生元素，不带 data-menu-path（即没有 ElMenu 的 :index）
    expect(wrapper.find('[data-menu-path="/docs"]').exists()).toBe(false)
    const externalItem = wrapper.find('.lumal-sidebar-menu-item--external')
    expect(externalItem.exists()).toBe(true)
    expect(externalItem.text()).toContain('文档')
    expect(externalItem.get('.lumal-sidebar-menu-item__external').classes()).toContain('lumal-icon')

    await externalItem.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['/docs'])

    // _self 外链仍作为普通导航项参与选中态
    expect(wrapper.find('[data-menu-path="/inner"]').exists()).toBe(true)
  })
})

describe('lumal tabs', () => {
  it('会使用可聚焦标签按钮更新活动页签并透传关闭事件', async () => {
    const wrapper = mount(LumalTabs, {
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
    const wrapper = mount(LumalTabs, {
      props: {
        activePath: '/dashboard',
        showRefresh: false,
        tabs,
      },
    })

    expect(wrapper.find('[data-action="refresh-current-tab"]').exists()).toBe(false)
  })

  it('支持键盘切换和右键菜单批量操作', async () => {
    const wrapper = mount(LumalTabs, {
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
    await wrapper.findAll('.lumal-tabs__item')[1]?.trigger('contextmenu', {
      clientX: 120,
      clientY: 80,
    })
    const closeOthers = wrapper.findAll('.lumal-tabs-context-menu button')
      .find(button => button.text().includes('关闭其他'))
    await closeOthers?.trigger('click')

    expect(wrapper.emitted('closeOthers')?.[0]).toEqual(['/system'])

    await tabButtons[1]?.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('change')?.at(-1)).toEqual(['/project'])
    wrapper.unmount()
  })

  it('折叠状态使用不会被 Element Plus 隐藏的图标容器', () => {
    const wrapper = mount(LumalSidebar, {
      global: {
        stubs: {
          ...elementPlusStubs,
          LumalIcon: {
            name: 'LumalIcon',
            template: '<svg class="lumal-icon-stub" />',
          },
        },
      },
      props: {
        collapsed: true,
        menus,
      },
    })

    const icon = wrapper.find('.lumal-sidebar-menu-item__icon')
    expect(icon.element.tagName).toBe('I')
    expect(icon.find('.lumal-icon-stub').exists()).toBe(true)
  })
})

describe('lumal router view', () => {
  it('会包裹 RouterView 并保留内容容器', () => {
    const wrapper = mount(LumalRouterView, {
      global: {
        stubs: {
          RouterView: {
            name: 'RouterView',
            template: '<div class="router-view">路由内容</div>',
          },
        },
      },
    })

    expect(wrapper.find('.lumal-router-view').exists()).toBe(true)
    expect(wrapper.find('.router-view').text()).toBe('路由内容')
  })

  it('会支持路由切换动画和缓存，不再为 key 变化伪造加载反馈', async () => {
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

    const wrapper = mount(LumalRouterView, {
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

    expect(wrapper.find('.lumal-router-view__progress').exists()).toBe(false)
    expect(wrapper.find('.lumal-router-view__loading').exists()).toBe(false)

    wrapper.unmount()
  })
})
