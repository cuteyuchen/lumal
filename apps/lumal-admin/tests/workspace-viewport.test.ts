import type { VueWrapper } from '@vue/test-utils'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import AppViewportModeSwitch from '../src/components/app/AppViewportModeSwitch.vue'
import AppWorkspaceViewport from '../src/components/app/AppWorkspaceViewport.vue'
import {
  adminViewportMode,
  adminViewportOptions,
  adminViewportStorageKey,
  isAdminViewportMode,
  readAdminViewportMode,
  resolveAdminWorkspacePolicy,
  setAdminViewportMode,
} from '../src/services/workspace-viewport'
import { viewportDesign } from '../viewport.config'

const wrappers: VueWrapper[] = []

function track<T extends VueWrapper>(wrapper: T): T {
  wrappers.push(wrapper)
  return wrapper
}

function mockMeasurements() {
  let width = 1000
  let height = 300
  let frameId = 0
  const frames = new Map<number, FrameRequestCallback>()
  const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn> }[] = []
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => height)
  vi.stubGlobal('innerWidth', 1280)
  vi.stubGlobal('innerHeight', 720)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback)
    return frameId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn()
    disconnect = vi.fn()
    constructor(callback: () => void) {
      observers.push({ callback, disconnect: this.disconnect })
    }
  })
  async function flushFrames() {
    const pending = [...frames.values()]
    frames.clear()
    pending.forEach(callback => callback(performance.now()))
    await nextTick()
  }
  return {
    flushFrames,
    resizeContainer(nextWidth: number, nextHeight: number) {
      width = nextWidth
      height = nextHeight
      observers.forEach(observer => observer.callback())
    },
  }
}

beforeEach(() => {
  setAdminViewportMode('responsive')
  localStorage.removeItem(adminViewportStorageKey)
})

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  setAdminViewportMode('responsive')
  localStorage.removeItem(adminViewportStorageKey)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('admin 工作区适配偏好', () => {
  it('保留响应式默认与 storage key，允许持久化 vw，未知值安全回退', () => {
    expect(adminViewportStorageKey).toBe('lumal-admin:workspace-viewport')
    expect(readAdminViewportMode()).toBe('responsive')
    expect(adminViewportMode.value).toBe('responsive')
    expect(isAdminViewportMode('vw')).toBe(true)
    setAdminViewportMode('vw')
    expect(adminViewportMode.value).toBe('vw')
    expect(localStorage.getItem(adminViewportStorageKey)).toBe('vw')
    expect(readAdminViewportMode()).toBe('vw')
    setAdminViewportMode('unknown')
    expect(adminViewportMode.value).toBe('vw')
    expect(localStorage.getItem(adminViewportStorageKey)).toBe('vw')
    localStorage.setItem(adminViewportStorageKey, 'unknown')
    expect(readAdminViewportMode()).toBe('responsive')
    const deniedStorage = {
      getItem() {
        throw new Error('blocked storage')
      },
    } as unknown as Storage
    expect(readAdminViewportMode(deniedStorage)).toBe('responsive')
  })

  it('vw 使用浏览器设计尺寸，画布保留内容区基准，自管理页面不叠加适配', () => {
    expect(viewportDesign).toEqual({ designWidth: 1920, designHeight: 1080 })
    expect(resolveAdminWorkspacePolicy('vw')).toMatchObject({ ...viewportDesign, mode: 'vw' })
    for (const mode of ['contain', 'width'] as const)
      expect(resolveAdminWorkspacePolicy(mode)).toMatchObject({ mode, designWidth: 1280, designHeight: 720, minScale: 0.75, minFontSize: 12 })
    for (const { value } of adminViewportOptions)
      expect(resolveAdminWorkspacePolicy(value, true).mode).toBe('responsive')
  })

  it('header 的真实菜单可连续切换全部模式，更新选中状态、标题和本地偏好并收起', async () => {
    const wrapper = track(mount(AppViewportModeSwitch, {
      attachTo: document.body,
      global: {
        stubs: { LumalIcon: true },
      },
    }))
    const trigger = wrapper.get<HTMLButtonElement>('[aria-label="工作区适配"]')
    // 查询真实 Teleport 的菜单，不以替身模拟 command 注入和点击关闭。
    for (const value of ['vw', 'contain', 'width', 'responsive'] as const) {
      trigger.element.click()
      await flushPromises()
      await vi.waitFor(() => expect(trigger.attributes('aria-expanded')).toBe('true'))
      const menu = document.querySelector<HTMLElement>(`[role="menu"][aria-labelledby="${trigger.attributes('id')}"]`)!
      expect(menu).not.toBeNull()
      expect(wrapper.element.contains(menu)).toBe(false)
      const items = [...menu.querySelectorAll<HTMLElement>('.el-dropdown-menu__item')]
      expect(items).toHaveLength(adminViewportOptions.length)
      const option = adminViewportOptions.find(option => option.value === value)!
      const item = items.find(item => item.textContent?.trim() === option.label)!
      expect(item).toBeDefined()
      item.click()
      await flushPromises()
      expect(trigger.attributes('data-mode')).toBe(value)
      expect(trigger.attributes('title')).toBe(`工作区适配：${option.label}`)
      await vi.waitFor(() => expect(trigger.attributes('aria-expanded')).toBe('false'))
      expect(item.getAttribute('role')).toBe('menuitem')
      expect(item.getAttribute('aria-current')).toBe('true')
      expect(items.filter(item => item.getAttribute('aria-current') === 'true')).toHaveLength(1)
      expect(localStorage.getItem(adminViewportStorageKey)).toBe(value)
    }
  })

  it('header 的真实菜单支持键盘打开与选择 vw', async () => {
    const wrapper = track(mount(AppViewportModeSwitch, {
      attachTo: document.body,
      global: { stubs: { LumalIcon: true } },
    }))
    const trigger = wrapper.get<HTMLButtonElement>('[aria-label="工作区适配"]')
    trigger.element.focus()
    await trigger.trigger('keydown', { key: 'Enter', code: 'Enter' })
    await flushPromises()
    await vi.waitFor(() => expect(trigger.attributes('aria-expanded')).toBe('true'))
    const menuSelector = `[role="menu"][aria-labelledby="${trigger.attributes('id')}"]`
    await vi.waitFor(() => expect(document.querySelector(`${menuSelector} .el-dropdown-menu__item`)).not.toBeNull())
    const item = [...document.querySelectorAll<HTMLElement>(`${menuSelector} .el-dropdown-menu__item`)]
      .find(item => item.textContent?.trim() === 'vw 流式')!
    expect(item).toBeDefined()
    item.focus()
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }))
    await flushPromises()
    expect(trigger.attributes('data-mode')).toBe('vw')
    await vi.waitFor(() => expect(trigger.attributes('aria-expanded')).toBe('false'))
    expect(localStorage.getItem(adminViewportStorageKey)).toBe('vw')
  })
})

describe('admin 工作区浏览器 vw 协作', () => {
  it('比例取浏览器宽度而非内容容器，不受画布缩放下限影响，也不反向补偿字号', async () => {
    const measurements = mockMeasurements()
    const wrapper = track(mount(AppWorkspaceViewport, {
      props: { policy: { ...resolveAdminWorkspacePolicy('vw'), minScale: 1, maxScale: 1 }, fontSize: 14 },
      slots: { default: '<p class="content">workspace</p>' },
    }))
    await nextTick()
    const host = wrapper.get<HTMLElement>('[data-testid="admin-workspace-viewport"]')
    const stage = wrapper.get<HTMLElement>('.admin-workspace-viewport__stage')
    expect(host.attributes('data-container-width')).toBe('1000')
    expect(host.attributes('data-container-height')).toBe('300')
    expect(Number(host.attributes('data-scale'))).toBeCloseTo(1280 / 1920)
    expect(host.element.style.getPropertyValue('--lumal-viewport-scale')).toBe(String(1280 / 1920))
    expect(host.element.style.getPropertyValue('--lumal-viewport-unit')).toBe(`${100 / 1920}vw`)
    expect(stage.element.style.transform).toBe('')
    expect(stage.element.style.getPropertyValue('--lumal-font-size-base')).toBe('')
    expect(stage.element.style.getPropertyValue('--el-font-size-base')).toBe('')
    expect(host.classes()).not.toContain('is-scaled')

    measurements.resizeContainer(600, 200)
    await measurements.flushFrames()
    expect(host.attributes('data-container-width')).toBe('600')
    expect(Number(host.attributes('data-scale'))).toBeCloseTo(1280 / 1920)
    vi.stubGlobal('innerWidth', 960)
    window.dispatchEvent(new Event('resize'))
    await measurements.flushFrames()
    expect(Number(host.attributes('data-scale'))).toBe(0.5)
    expect(host.element.style.getPropertyValue('--lumal-viewport-scale')).toBe('0.5')
  })

  it('切换流式与画布模式只改变缩放样式，保留子组件本地状态', async () => {
    mockMeasurements()
    const Page = defineComponent({
      setup() {
        const count = shallowRef(0)
        return () => h('button', { class: 'persistent-page', onClick: () => count.value++ }, String(count.value))
      },
    })
    const wrapper = track(mount(AppWorkspaceViewport, {
      props: { policy: resolveAdminWorkspacePolicy('vw'), fontSize: 14 },
      slots: { default: () => h(Page) },
    }))
    await nextTick()
    await wrapper.get('.persistent-page').trigger('click')
    const page = wrapper.get('.persistent-page').element
    for (const mode of ['contain', 'width', 'responsive', 'vw'] as const) {
      await wrapper.setProps({ policy: resolveAdminWorkspacePolicy(mode) })
      const stage = wrapper.get<HTMLElement>('.admin-workspace-viewport__stage')
      const host = wrapper.get<HTMLElement>('[data-testid="admin-workspace-viewport"]')
      expect(wrapper.get('.persistent-page').text()).toBe('1')
      expect(wrapper.get('.persistent-page').element).toBe(page)
      expect(host.element.style.getPropertyValue('--lumal-viewport-unit')).toBe(mode === 'vw' ? `${100 / 1920}vw` : '1px')
      if (mode === 'contain' || mode === 'width') {
        expect(stage.element.style.transform).toContain('scale(')
        expect(stage.element.style.width).toBe('1280px')
        expect(stage.element.style.height).toBe('720px')
      }
      else {
        expect(stage.element.style.transform).toBe('')
        expect(stage.element.style.getPropertyValue('--el-font-size-base')).toBe('')
      }
    }
    await wrapper.get('.persistent-page').trigger('click')
    expect(wrapper.get('.persistent-page').text()).toBe('2')
  })
})
