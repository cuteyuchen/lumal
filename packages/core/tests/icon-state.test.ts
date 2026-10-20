import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { LumalCrudTable } from '../src/components/crud-table'
import { LumalHeader, LumalLayout, LumalTabs } from '../src/layout'
import { createDefaultPreferences } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const IconStub = defineComponent({
  props: { name: String, morph: Boolean },
  template: '<svg :data-icon="name" :data-morph="morph" />',
})
const global = { stubs: { ...elementPlusStubs, LumalIcon: IconStub, Teleport: true } }
enableAutoUnmount(afterEach)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'fullscreenElement')
  Reflect.deleteProperty(document, 'exitFullscreen')
})

describe('系统状态图标', () => {
  it('侧栏由 collapsed 驱动，点击仍抛出业务事件', async () => {
    const wrapper = mount(LumalHeader, { global, props: { collapsed: false } })
    const button = wrapper.get('[data-action="toggle-sidebar"]')
    expect(button.get('svg').attributes()).toMatchObject({ 'data-icon': 'lumal:sidebar-collapse', 'data-morph': 'true' })
    await wrapper.setProps({ collapsed: true })
    expect(button.attributes('aria-label')).toBe('展开侧边栏')
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:sidebar-expand')
    await button.trigger('click')
    expect(wrapper.emitted('toggleCollapse')).toHaveLength(1)
  })

  it('移动菜单的打开和关闭复用同一组侧栏形变图标', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })))
    const wrapper = mount(LumalLayout, {
      global,
      props: {
        title: 'Admin',
        menus: [{ path: '/work', title: '工作台' }],
        preferences: createDefaultPreferences({ app: { layout: 'sidebar-nav' } }),
      },
    })
    await flushPromises()
    const button = wrapper.get('[data-action="toggle-sidebar"]')
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:sidebar-expand')
    await button.trigger('click')
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:sidebar-collapse')
    await button.trigger('click')
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:sidebar-expand')
  })

  it('内容最大化保留图标实例，工具栏和菜单状态一致', async () => {
    const wrapper = mount(LumalTabs, {
      global,
      props: { activePath: '/work', tabs: [{ path: '/work', title: '工作台' }] },
    })
    const button = wrapper.get('[data-action="maximize-content"]')
    const icon = button.get('svg').element
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:maximize')
    await button.trigger('click')
    expect(wrapper.emitted('maximize')?.at(-1)).toEqual([true])
    expect(button.get('svg').element).toBe(icon)
    expect(button.get('svg').attributes()).toMatchObject({ 'data-icon': 'lumal:restore', 'data-morph': 'true' })
    await wrapper.get('[data-tab-menu-trigger]').trigger('click')
    expect(wrapper.get('.lumal-tabs-context-menu [data-icon="lumal:restore"]').exists()).toBe(true)
    await button.trigger('click')
    expect(wrapper.emitted('maximize')?.at(-1)).toEqual([false])
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:maximize')
  })

  it('表格全屏以真实 Fullscreen 状态为准，包含 Escape 引起的退出', async () => {
    const wrapper = mount(LumalCrudTable, { global, props: { columns: [{ field: 'name', label: '名称' }], rows: [] } })
    let fullscreenElement: Element | null = null
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement })
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(wrapper.element, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    const button = wrapper.get('[data-action="fullscreen"]')
    await button.trigger('click')
    expect(requestFullscreen).toHaveBeenCalledOnce()
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:fullscreen')
    fullscreenElement = wrapper.element
    document.dispatchEvent(new Event('fullscreenchange'))
    await flushPromises()
    expect(button.attributes('aria-label')).toBe('退出全屏')
    expect(button.get('svg').attributes()).toMatchObject({ 'data-icon': 'lumal:fullscreen-exit', 'data-morph': 'true' })
    // Escape 由浏览器处理，组件消费的是浏览器随后的 fullscreenchange。
    fullscreenElement = null
    document.dispatchEvent(new Event('fullscreenchange'))
    await flushPromises()
    expect(button.attributes('aria-label')).toBe('全屏')
    expect(button.get('svg').attributes('data-icon')).toBe('lumal:fullscreen')
  })
})
