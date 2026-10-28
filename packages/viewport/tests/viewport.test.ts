import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, KeepAlive, nextTick, shallowRef } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { getViewportConfig, getViewportWidth, useElementSize, useViewportWidth, viewportLength, viewportPixels } from '../src'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('唯一的宽度契约', () => {
  const config = { enabled: true, designWidth: 1920 }
  it.each([[1280, 128], [1920, 192], [2560, 256]])('w=%s 时 192px 为 %s 实际像素', (width, expected) => {
    expect(viewportLength(192, config)).toBe('10vw')
    expect(viewportPixels(192, width, config)).toBe(expected)
    expect(viewportPixels(96, width, config)).toBe(expected / 2)
  })
  it('关闭保持 px；另一设计宽度不使用 1920 常量；负数和零合法', () => {
    expect(getViewportConfig()).toEqual({ enabled: false, designWidth: 1920 })
    expect(viewportLength(192)).toBe('192px')
    expect(viewportPixels(192, 1280)).toBe(192)
    expect(viewportLength(144, { enabled: true, designWidth: 1440 })).toBe('10vw')
    expect(viewportLength(-24, config)).toBe('-1.25vw')
    expect(viewportPixels(0, 1280, config)).toBe(0)
    expect(() => viewportLength(1, { ...config, designWidth: 0 })).toThrow('designWidth')
    expect(() => viewportPixels(Number.NaN, 1280, config)).toThrow('有限数')
  })
  it('布局视口测量使用实际 100vw，不使用容器、screen 或 DPR', () => {
    const children = document.documentElement.children.length
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 1263 } as DOMRect)
    vi.stubGlobal('innerWidth', 1280)
    expect(getViewportWidth()).toBe(1263)
    expect(document.documentElement.children).toHaveLength(children)
  })
  it('sSR 不触碰 DOM，CSS 长度可直接渲染', async () => {
    vi.stubGlobal('window', undefined)
    expect(getViewportWidth()).toBe(0)
    const html = await renderToString(createSSRApp({
      setup() {
        useViewportWidth(config)
        return () => h('div', { style: { width: viewportLength(192, config) } }, 'content')
      },
    }))
    expect(html).toContain('width:10vw')
    expect(html).not.toContain('transform')
  })
})

describe('共享窗口宽度与生命周期', () => {
  it('多个组件只注册一份 resize，最后卸载取消 RAF 和监听', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('innerWidth', 1280)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const Probe = defineComponent({
      setup() {
        const viewport = useViewportWidth({ enabled: true, designWidth: 1920 })
        return () => h('span', String(viewport.pixels(192)))
      },
    })
    const a = mount(Probe)
    const b = mount(Probe)
    expect(a.text()).toBe('128')
    expect(add.mock.calls.filter(call => call[0] === 'resize')).toHaveLength(1)
    vi.stubGlobal('innerWidth', 2560)
    window.dispatchEvent(new Event('resize'))
    vi.runOnlyPendingTimers()
    await nextTick()
    expect(b.text()).toBe('256')
    a.unmount()
    expect(remove.mock.calls.filter(call => call[0] === 'resize')).toHaveLength(0)
    window.dispatchEvent(new Event('resize'))
    b.unmount()
    vi.runOnlyPendingTimers()
    expect(remove.mock.calls.filter(call => call[0] === 'resize')).toHaveLength(1)
  })
  it('keepAlive 停用释放窗口监听，激活后重测且不重建内容', async () => {
    vi.stubGlobal('innerWidth', 1280)
    const visible = shallowRef(true)
    let setups = 0
    const Probe = defineComponent({
      setup() {
        setups++
        const { pixels } = useViewportWidth({ enabled: true, designWidth: 1920 })
        return () => h('span', pixels(192))
      },
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(KeepAlive, () => visible.value ? h(Probe) : h('div')),
    }))
    visible.value = false
    await nextTick()
    vi.stubGlobal('innerWidth', 1920)
    visible.value = true
    await nextTick()
    expect(wrapper.text()).toBe('192')
    expect(setups).toBe(1)
    wrapper.unmount()
  })
})

describe('容器测量与宽度适配独立', () => {
  function element(width = 960, height = 540) {
    const target = document.createElement('div')
    Object.defineProperties(target, { clientWidth: { configurable: true, value: width }, clientHeight: { configurable: true, value: height } })
    return target
  }
  it('首测、目标替换、禁用、旧观察回调与卸载均正确清理', async () => {
    vi.useFakeTimers()
    const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('ResizeObserver', class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(public callback: () => void) { observers.push(this) }
    })
    const target = shallowRef<HTMLElement | null>(element())
    const enabled = shallowRef(true)
    let measured!: ReturnType<typeof useElementSize>
    const wrapper = mount(defineComponent({
      setup() {
        measured = useElementSize({ target, enabled })
        return () => h('div')
      },
    }))
    expect(measured.size.value.width).toBe(960)
    Object.defineProperty(target.value, 'clientWidth', { value: 480 })
    observers[0]!.callback()
    vi.runOnlyPendingTimers()
    expect(measured.size.value.width).toBe(480)
    target.value = element(1000, 300)
    await nextTick()
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    enabled.value = false
    await nextTick()
    expect(observers[1]!.disconnect).toHaveBeenCalledOnce()
    enabled.value = true
    await nextTick()
    observers[2]!.callback()
    wrapper.unmount()
    vi.runOnlyPendingTimers()
    expect(observers[2]!.disconnect).toHaveBeenCalledOnce()
  })
  it('无 ResizeObserver 使用窗口回退，禁用不监听', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(defineComponent({
      setup() {
        useElementSize()
        useElementSize({ target: element(), enabled: false })
        return () => h('div')
      },
    }))
    const resize = add.mock.calls.filter(call => call[0] === 'resize')
    expect(resize).toHaveLength(1)
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('resize', resize[0]![1])
  })
  it('keepAlive 只重测容器，不以其宽度替换浏览器适配基准', async () => {
    vi.useFakeTimers()
    const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('ResizeObserver', class {
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(public callback: () => void) { observers.push(this) }
    })
    const target = element()
    const visible = shallowRef(true)
    let measured!: ReturnType<typeof useElementSize>
    let setups = 0
    const Probe = defineComponent({
      setup() {
        setups++
        measured = useElementSize({ target })
        return () => h('div', measured.size.value.width)
      },
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(KeepAlive, () => visible.value ? h(Probe) : h('div')),
    }))
    visible.value = false
    await nextTick()
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    Object.defineProperty(target, 'clientWidth', { value: 480 })
    observers[0]!.callback()
    vi.runOnlyPendingTimers()
    expect(measured.size.value.width).toBe(960)
    visible.value = true
    await nextTick()
    expect(setups).toBe(1)
    expect(measured.size.value.width).toBe(480)
    wrapper.unmount()
    expect(observers[1]!.disconnect).toHaveBeenCalledOnce()
  })
})
