import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import {
  LumaContent,
  LumaHeader,
  LumaLayout,
  LumaRouterView,
  LumaSidebar,
  LumaTabs,
  LumaTopNav,
} from '../src/layout'
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

  it('头部折叠按钮会通过 layout 更新 collapsed', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        collapsed: false,
        menus,
      },
    })

    await wrapper.find('[data-action="toggle-sidebar"]').trigger('click')

    expect(wrapper.emitted('update:collapsed')?.[0]).toEqual([true])
  })

  it('会在传入顶部菜单时渲染顶部导航并透传选择事件', async () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activeTopMenuPath: '/system',
        menus: [],
        topMenus: menus,
      },
    })

    expect(wrapper.findComponent(LumaTopNav).exists()).toBe(true)
    expect(wrapper.findComponent(LumaTopNav).props('activePath')).toBe('/system')
    expect(wrapper.find('.luma-header__navigation').exists()).toBe(true)

    await wrapper.find('[data-menu-path="/system/user"]').trigger('click')

    expect(wrapper.emitted('topMenuSelect')?.[0]).toEqual(['/system/user'])
  })

  it('混合导航会把一级菜单渲染为可直接切换的平级入口', () => {
    const wrapper = mount(LumaLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        menus: menus[1]!.children,
        topMenuMode: 'flat',
        topMenus: menus,
      },
    })

    expect(wrapper.findComponent(LumaTopNav).props('mode')).toBe('flat')
    expect(wrapper.find('[data-menu-path="/system"]').exists()).toBe(true)
    expect(wrapper.findComponent(LumaSidebar).props('menus')).toEqual(menus[1]!.children)
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
  it('会更新活动页签并透传关闭事件', async () => {
    const wrapper = mount(LumaTabs, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        activePath: '/dashboard',
        tabs,
      },
    })

    expect(wrapper.findComponent({ name: 'ElTabs' }).props('modelValue')).toBe('/dashboard')

    await wrapper.find('[data-action="change-tab"]').trigger('click')
    await wrapper.find('[data-action="remove-tab"]').trigger('click')

    expect(wrapper.emitted('update:activePath')?.[0]).toEqual(['/system'])
    expect(wrapper.emitted('change')?.[0]).toEqual(['/system'])
    expect(wrapper.emitted('remove')?.[0]).toEqual(['/system'])
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
