import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter, createWebHashHistory } from 'vue-router'
import { LumalLayout, LumalTabs } from '../src/layout'
import { createDefaultPreferences } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const View = defineComponent({ template: '<div />' })
const routes = [
  { path: '/dashboard', component: View, meta: { title: '工作台' } },
  { path: '/users', component: View, meta: { title: '用户管理' } },
]

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe('layout lifecycle', () => {
  it('最大化内容区保持 Flex 布局并覆盖普通布局的零宽度', () => {
    // jsdom 不计算实际布局，保护有效宽度和连续伸展所需的布局规则。
    const source = readFileSync(join(process.cwd(), 'src/layout/LumalLayout.vue'), 'utf8')
    const maximizedStyles = source.match(/\.lumal-layout\.is-content-maximized \.lumal-layout__main\s*\{([^}]+)\}/)?.[1]
    expect(maximizedStyles).toMatch(/width:\s*100%;/)
    expect(maximizedStyles).not.toMatch(/position:\s*(absolute|fixed);/)
  })

  it('最大化过渡沿用主题动效参数并尊重减少动态效果设置', () => {
    const source = readFileSync(join(process.cwd(), 'src/layout/LumalLayout.vue'), 'utf8')
    const reducedMotion = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(source).toContain('height var(--lumal-motion-duration-base) var(--lumal-easing-standard)')
    for (const region of ['header', 'breadcrumb', 'sidebar']) {
      expect(reducedMotion).toContain(`.lumal-layout-${region}-enter-active`)
      expect(reducedMotion).toContain(`.lumal-layout-${region}-leave-active`)
    }
    expect(reducedMotion).toMatch(/transition:\s*none;/)
  })

  it.each(['sidebar-nav', 'top-nav', 'mixed-nav'] as const)('真实过渡下最大化与还原保留页面，快速反向切换不残留动画（%s）', async (layout) => {
    const wrapper = mount(LumalLayout, {
      attachTo: document.body,
      // 使用真实 Transition，确保离场节点先执行过渡，而非立即销毁布局。
      global: { stubs: { ...elementPlusStubs, transition: false } },
      props: {
        activeTabPath: '/system/users',
        menus: [{ path: '/system', title: '系统管理', children: [{ path: '/system/users', title: '用户管理' }] }],
        preferences: createDefaultPreferences({ app: { layout } }),
        tabs: [{ path: '/system/users', title: '用户管理' }],
      },
      slots: {
        default: '<input aria-label="页面草稿" />',
      },
    })
    try {
      await vi.waitFor(() => expect(wrapper.find('.lumal-layout-sidebar-enter-active').exists()).toBe(false))
      const draft = wrapper.get<HTMLInputElement>('[aria-label="页面草稿"]')
      await draft.setValue('保留草稿')
      const maximizeButton = wrapper.get('[data-action="maximize-content"]')
      await maximizeButton.trigger('click')

      expect(wrapper.get('.lumal-header').classes()).toContain('lumal-layout-header-leave-active')
      if (layout !== 'top-nav') {
        expect(wrapper.get('.lumal-layout__desktop-sidebar').classes()).toContain('lumal-layout-sidebar-leave-active')
      }
      if (layout !== 'sidebar-nav') {
        expect(wrapper.find('.lumal-layout-breadcrumb-leave-active').exists()).toBe(true)
      }
      await vi.waitFor(() => {
        expect(wrapper.get('.lumal-header').isVisible()).toBe(false)
        expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)
      })

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushPromises()
      expect(wrapper.get('.lumal-header').classes()).toContain('lumal-layout-header-enter-active')
      await vi.waitFor(() => expect(wrapper.find('.lumal-layout-header-enter-active').exists()).toBe(false))

      await maximizeButton.trigger('click')
      await maximizeButton.trigger('click')
      await vi.waitFor(() => {
        expect(wrapper.find('[class*="-enter-active"], [class*="-leave-active"]').exists()).toBe(false)
        expect(wrapper.get('.lumal-header').isVisible()).toBe(true)
        expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(layout !== 'top-nav')
      })
      expect(wrapper.classes()).not.toContain('is-content-maximized')
      expect(maximizeButton.attributes('aria-label')).toBe('内容最大化')
      expect(wrapper.get('[aria-label="页面草稿"]').element).toBe(draft.element)
      expect(draft.element.value).toBe('保留草稿')
    }
    finally {
      wrapper.unmount()
    }
  })

  it.each(['按钮', 'Escape'])('点击最大化后通过 %s 还原时保留内容并同步布局状态', async (restoreAction) => {
    const wrapper = mount(LumalLayout, {
      attachTo: document.body,
      global: { stubs: elementPlusStubs },
      props: {
        activeTabPath: '/dashboard',
        menus: [{ path: '/dashboard', title: '工作台' }],
        preferences: createDefaultPreferences({ app: { layout: 'sidebar-nav' } }),
        tabs: [{ path: '/dashboard', title: '工作台' }],
      },
      slots: {
        default: '<section class="dashboard-content">工作台内容</section>',
      },
    })
    try {
      const content = wrapper.get('.dashboard-content').element
      const maximizeButton = wrapper.get('[data-action="maximize-content"]')
      await maximizeButton.trigger('click')
      await flushPromises()
      expect(wrapper.classes()).toContain('is-content-maximized')
      expect(maximizeButton.attributes('aria-label')).toBe('退出内容最大化')
      expect(wrapper.get('.lumal-header').isVisible()).toBe(false)
      expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(false)
      expect(wrapper.get('.dashboard-content').element).toBe(content)

      if (restoreAction === 'Escape') {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      }
      else {
        await maximizeButton.trigger('click')
      }
      await flushPromises()
      expect(wrapper.classes()).not.toContain('is-content-maximized')
      expect(maximizeButton.attributes('aria-label')).toBe('内容最大化')
      expect(wrapper.get('.lumal-header').isVisible()).toBe(true)
      expect(wrapper.find('.lumal-layout__desktop-sidebar').exists()).toBe(true)
      expect(wrapper.get('.dashboard-content').element).toBe(content)
      expect(wrapper.emitted('tabMaximize')).toEqual([[true], [false]])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('新窗口使用含 base 和 hash 的路由 href', async () => {
    const router = createRouter({ history: createWebHashHistory('/console/'), routes })
    await router.push('/dashboard')
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const wrapper = mount(LumalLayout, {
      global: { plugins: [router], stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences(),
        tabs: [{ path: '/dashboard', title: '工作台' }],
      },
    })
    try {
      wrapper.getComponent(LumalTabs).vm.$emit('newWindow', '/users?role=admin')
      expect(open).toHaveBeenCalledWith(router.resolve('/users?role=admin').href, '_blank', 'noopener,noreferrer')
      expect(open.mock.calls[0]?.[0]).toContain('#/users?role=admin')
    }
    finally {
      wrapper.unmount()
      router.options.history.destroy()
    }
  })

  it('首次挂载先恢复快照，退出清理后卸载不再写回', async () => {
    const key = 'test:layout-tabs'
    sessionStorage.setItem(key, JSON.stringify({
      v: 1,
      tabs: [{ path: '/users', title: '旧标题', closable: true }],
      history: ['/users'],
    }))
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/dashboard')
    const wrapper = mount(LumalLayout, {
      global: { plugins: [router], stubs: elementPlusStubs },
      props: {
        routeDriven: true,
        tabStorageKey: key,
        preferences: createDefaultPreferences({ tabbar: { persist: true } }),
      },
    })
    await flushPromises()
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['用户管理', '工作台'])
    expect(wrapper.emitted('tabsChange')?.at(-1)?.[0]).toMatchObject([
      { path: '/users', title: '用户管理' },
      { path: '/dashboard' },
    ])
    expect(JSON.parse(sessionStorage.getItem(key)!).tabs).toHaveLength(2)
    sessionStorage.removeItem(key)
    wrapper.unmount()
    expect(sessionStorage.getItem(key)).toBeNull()
  })

  it('关闭持久化会清理已保存的 sessionStorage 快照', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/dashboard')
    const wrapper = mount(LumalLayout, {
      global: { plugins: [router], stubs: elementPlusStubs },
      props: {
        routeDriven: true,
        tabStorageKey: 'test:layout-tabs',
        preferences: createDefaultPreferences({ tabbar: { persist: true } }),
      },
    })
    try {
      expect(sessionStorage.getItem('test:layout-tabs')).not.toBeNull()
      await wrapper.setProps({ preferences: createDefaultPreferences({ tabbar: { persist: false } }) })
      expect(sessionStorage.getItem('test:layout-tabs')).toBeNull()
    }
    finally {
      wrapper.unmount()
    }
  })
})
