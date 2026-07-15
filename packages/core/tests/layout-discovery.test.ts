import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  LumaBreadcrumb,
  LumaGlobalSearch,
  LumaLayout,
  LumaSidebar,
  LumaTopNav,
} from '../src/layout'
import { createDefaultPreferences } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const menus = [
  { badge: 3, badgeTone: 'danger' as const, icon: 'app:dashboard', path: '/dashboard', title: '工作台' },
  {
    badgeType: 'dot' as const,
    children: [
      { badge: 'NEW', badgeTone: 'success' as const, path: '/system/user', title: '用户管理' },
    ],
    path: '/system',
    title: '系统管理',
  },
]

describe('layout discovery components', () => {
  it('面包屑会解析菜单层级、补充首页并透传选择', async () => {
    const wrapper = mount(LumaBreadcrumb, {
      props: {
        activePath: '/system/user',
        menus,
      },
    })

    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('系统管理')
    expect(wrapper.text()).toContain('用户管理')

    await wrapper.find('.luma-breadcrumb__link').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['/dashboard'])
  })

  it('全局搜索支持快捷键、过滤和键盘选择', async () => {
    const wrapper = mount(LumaGlobalSearch, {
      global: {
        stubs: { Teleport: true },
      },
      props: { menus },
    })

    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'k' }))
    await wrapper.vm.$nextTick()

    const input = wrapper.find('[role="combobox"]')
    expect(input.exists()).toBe(true)
    await input.setValue('用户')
    expect(wrapper.findAll('[role="option"]')).toHaveLength(1)

    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')?.[0]?.[0]).toBe('/system/user')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('侧栏、树形顶栏和扁平顶栏都渲染菜单徽标', () => {
    const sidebar = mount(LumaSidebar, {
      global: { stubs: elementPlusStubs },
      props: { menus },
    })
    const tree = mount(LumaTopNav, {
      global: { stubs: elementPlusStubs },
      props: { menus, mode: 'tree' },
    })
    const flat = mount(LumaTopNav, {
      global: { stubs: elementPlusStubs },
      props: { menus, mode: 'flat' },
    })

    expect(sidebar.findAll('.luma-menu-badge')).toHaveLength(3)
    expect(tree.findAll('.luma-menu-badge')).toHaveLength(3)
    expect(flat.findAll('.luma-menu-badge')).toHaveLength(2)
    expect(sidebar.find('[aria-label="工作台：3"]').classes()).toContain('is-danger')
    expect(tree.find('[aria-label="系统管理有新内容"]').classes()).toContain('is-dot')
  })

  it('路由 activeMenu 驱动导航高亮，并在面包屑保留真实页面标题', async () => {
    const RouteView = defineComponent({ template: '<div />' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          component: RouteView,
          meta: { activeMenu: '/missing', title: '工作台' },
          path: '/dashboard',
        },
        {
          component: RouteView,
          meta: { activeMenu: '/system/user', title: '用户详情' },
          path: '/system/user/detail',
        },
      ],
    })
    await router.push('/system/user/detail')
    await router.isReady()

    const wrapper = mount(LumaLayout, {
      global: {
        plugins: [router],
        stubs: elementPlusStubs,
      },
      props: {
        activeMenuPath: '/system/user/detail',
        menus,
        preferences: createDefaultPreferences({ app: { layout: 'sidebar-nav' } }),
        title: 'Luma Admin',
      },
    })

    expect(wrapper.findComponent({ name: 'ElMenu' }).props('defaultActive')).toBe('/system/user')
    expect(wrapper.findComponent(LumaBreadcrumb).text()).toContain('用户详情')
    expect(wrapper.findComponent(LumaGlobalSearch).props('menus')).toEqual(menus)
    expect(document.title).toBe('用户详情 - Luma Admin')

    await router.push('/dashboard')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'ElMenu' }).props('defaultActive')).toBe('/dashboard')

    await wrapper.setProps({
      preferences: createDefaultPreferences({
        app: { dynamicTitle: false, layout: 'sidebar-nav' },
      }),
    })
    expect(document.title).toBe('Luma Admin')
    wrapper.unmount()
  })

  it('面包屑优先使用 route.matched 并过滤 hideInBreadcrumb', async () => {
    const RouteView = defineComponent({ template: '<div />' })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          children: [
            {
              children: [
                {
                  component: RouteView,
                  meta: { hideInBreadcrumb: true, title: '用户详情' },
                  path: 'detail',
                },
              ],
              component: RouteView,
              meta: { title: '用户管理' },
              path: 'user',
            },
          ],
          component: RouteView,
          meta: { title: '系统管理' },
          path: '/system',
        },
      ],
    })
    await router.push('/system/user/detail')
    await router.isReady()

    const wrapper = mount(LumaBreadcrumb, {
      global: { plugins: [router] },
      props: {
        activeMenuPath: '/system/user',
        activePath: '/system/user/detail',
        menus,
        showHome: false,
      },
    })

    expect(wrapper.text()).toContain('系统管理')
    expect(wrapper.text()).toContain('用户管理')
    expect(wrapper.text()).not.toContain('用户详情')
    expect(wrapper.findAll('.luma-breadcrumb__item')).toHaveLength(2)
    wrapper.unmount()
  })
})
