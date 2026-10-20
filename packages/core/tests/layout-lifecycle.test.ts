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
  it('最大化内容区覆盖普通 Flex 布局的零宽度', () => {
    // jsdom 不计算实际布局，直接保护曾导致页面空白的宽度覆盖规则。
    const source = readFileSync(join(process.cwd(), 'src/layout/LumalLayout.vue'), 'utf8')
    const maximizedStyles = source.match(/\.lumal-layout\.is-content-maximized \.lumal-layout__main\s*\{([^}]+)\}/)?.[1]
    expect(maximizedStyles).toMatch(/width:\s*100%;/)
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
