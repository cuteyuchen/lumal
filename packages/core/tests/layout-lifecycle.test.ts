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
  it('按 Esc 同时恢复壳层和标签栏的最大化状态', async () => {
    const wrapper = mount(LumalLayout, {
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences(),
        tabs: [{ path: '/dashboard', title: '工作台' }],
      },
    })
    try {
      wrapper.getComponent(LumalTabs).vm.$emit('maximize', true)
      await flushPromises()
      expect(wrapper.classes()).toContain('is-content-maximized')
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushPromises()
      expect(wrapper.classes()).not.toContain('is-content-maximized')
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
