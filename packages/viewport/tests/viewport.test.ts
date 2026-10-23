import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, KeepAlive, nextTick, shallowRef, Teleport } from 'vue'
import { computeViewportFontSize, computeViewportScale, createViewportPlugin, LumalViewport, resolveViewportPolicy, useViewportPolicy, useViewportScale } from '../src'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('视口纯算法', () => {
  it.each([[1280, 720], [1366, 768], [1920, 1080], [2560, 1440], [1440, 900]])('完整适配 %sx%s 并保持比例', (width, height) => {
    const result = computeViewportScale(width, height, 1920, 1080)
    expect(result.scaledWidth).toBeLessThanOrEqual(width)
    expect(result.scaledHeight).toBeLessThanOrEqual(height)
    expect(result.scaledWidth / result.scaledHeight).toBeCloseTo(16 / 9)
    expect(result.offsetX * 2 + result.scaledWidth).toBeCloseTo(width)
  })
  it('宽度模式不裁剪算法输出，明确可能溢出高度', () => {
    const result = computeViewportScale(1920, 540, 1920, 1080, 'width')
    expect(result).toMatchObject({ scale: 1, scaledHeight: 1080, offsetY: 0 })
    expect(computeViewportScale(0, 0, 1920, 1080).scale).toBe(1)
  })
  it('可读性缩放下限保留可滚动区域，不把溢出画布居中到负坐标', () => {
    expect(computeViewportScale(960, 400, 1920, 1080, 'contain', { minScale: 0.75 })).toMatchObject({
      scale: 0.75,
      offsetX: 0,
      offsetY: 0,
      scaledWidth: 1440,
      scaledHeight: 810,
    })
    expect(computeViewportScale(2560, 1440, 1920, 1080, 'contain', { maxScale: 1 }).scale).toBe(1)
    expect(computeViewportFontSize(14, 0.5, 12)).toBe(12)
    expect(computeViewportFontSize(16, 1.25, 12)).toBe(20)
  })
})

describe('响应式尺寸生命周期', () => {
  function element(width = 960, height = 540) {
    const target = document.createElement('div')
    Object.defineProperties(target, { clientWidth: { configurable: true, value: width }, clientHeight: { configurable: true, value: height } })
    return target
  }

  it('首测、ResizeObserver、目标替换、禁用与卸载只保留一份观察', async () => {
    vi.useFakeTimers()
    const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn>, observe: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('ResizeObserver', class {
      callback: () => void
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(callback: () => void) {
        this.callback = callback
        observers.push(this)
      }
    })
    const target = shallowRef<HTMLElement | null>(element())
    const enabled = shallowRef(true)
    const designWidth = shallowRef(1920)
    let viewport!: ReturnType<typeof useViewportScale>
    let column!: ReturnType<typeof computed<number>>
    const wrapper = mount(defineComponent({
      setup() {
        viewport = useViewportScale({ target, enabled, designWidth })
        column = computed(() => 200 * viewport.scale.value)
        return () => h('div')
      },
    }))
    expect(viewport.ready.value).toBe(true)
    expect(column.value).toBe(100)
    expect(observers).toHaveLength(1)
    Object.defineProperty(target.value, 'clientWidth', { value: 480 })
    observers[0]!.callback()
    vi.runOnlyPendingTimers()
    expect(column.value).toBe(50)
    designWidth.value = 960
    await nextTick()
    expect(column.value).toBe(100)
    target.value = element(1920, 1080)
    await nextTick()
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    expect(observers).toHaveLength(2)
    enabled.value = false
    await nextTick()
    expect(observers[1]!.disconnect).toHaveBeenCalledOnce()
    enabled.value = true
    await nextTick()
    expect(observers).toHaveLength(3)
    observers[2]!.callback()
    wrapper.unmount()
    vi.runOnlyPendingTimers()
    expect(observers[2]!.disconnect).toHaveBeenCalledOnce()
  })

  it('无观察器使用窗口回退并清理监听', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(defineComponent({
      setup() {
        useViewportScale()
        return () => h('div')
      },
    }))
    const resize = add.mock.calls.filter(call => call[0] === 'resize')
    expect(resize).toHaveLength(1)
    wrapper.unmount()
    expect(remove).toHaveBeenCalledWith('resize', resize[0]![1])
    add.mockRestore()
    remove.mockRestore()
  })

  it('外部适配禁用时不注册尺寸监听', () => {
    const observer = vi.fn()
    vi.stubGlobal('ResizeObserver', observer)
    const wrapper = mount(defineComponent({
      setup() {
        useViewportScale({ target: element(), enabled: false })
        return () => h('div')
      },
    }))
    expect(observer).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keepAlive 停用清理，旧回调无效，激活重新测量且保留页面状态', async () => {
    vi.useFakeTimers()
    const observers: { callback: () => void, disconnect: ReturnType<typeof vi.fn> }[] = []
    vi.stubGlobal('ResizeObserver', class {
      callback: () => void
      disconnect = vi.fn()
      observe = vi.fn()
      constructor(callback: () => void) {
        this.callback = callback
        observers.push(this)
      }
    })
    const target = element()
    const visible = shallowRef(true)
    let viewport!: ReturnType<typeof useViewportScale>
    let setups = 0
    const Screen = defineComponent({
      setup() {
        setups++
        viewport = useViewportScale({ target })
        return () => h('div', 'screen')
      },
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h(KeepAlive, () => visible.value ? h(Screen) : h('div', 'admin')),
    }))
    expect(observers).toHaveLength(1)
    visible.value = false
    await nextTick()
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    Object.defineProperty(target, 'clientWidth', { value: 480 })
    observers[0]!.callback()
    vi.runOnlyPendingTimers()
    expect(viewport.size.value.width).toBe(960)
    visible.value = true
    await nextTick()
    expect(setups).toBe(1)
    expect(viewport.size.value.width).toBe(480)
    expect(observers).toHaveLength(2)
    wrapper.unmount()
    expect(observers[1]!.disconnect).toHaveBeenCalledOnce()
  })
})

describe('全局默认、页面和容器策略', () => {
  it('纯策略合并与禁用，不混合作用范围枚举', () => {
    expect(resolveViewportPolicy({ mode: 'contain', designWidth: 1600 }, { mode: 'width', designHeight: 900 }))
      .toMatchObject({ mode: 'width', designWidth: 1600, designHeight: 900 })
    expect(resolveViewportPolicy({ mode: 'contain' }, false).mode).toBe('disabled')
    expect(resolveViewportPolicy({ designWidth: -1, designHeight: Number.NaN }))
      .toMatchObject({ designWidth: 1920, designHeight: 1080 })
  })

  it('插件只提供响应式默认值，局部覆盖不反向污染应用与其他实例', async () => {
    const defaults = shallowRef({ mode: 'contain' as const, designWidth: 1920 })
    const Probe = defineComponent({
      props: { disabled: Boolean },
      setup(props) {
        const policy = useViewportPolicy(() => props.disabled ? false : { designHeight: 900 })
        return () => h('span', `${policy.value.mode}:${policy.value.designWidth}:${policy.value.designHeight}`)
      },
    })
    const wrapper = mount(defineComponent({
      setup: () => () => h('div', [h(Probe), h(Probe, { disabled: true })]),
    }), { global: { plugins: [createViewportPlugin(defaults)] } })
    expect(wrapper.text()).toBe('contain:1920:900disabled:1920:1080')
    defaults.value = { mode: 'contain', designWidth: 1600 }
    await nextTick()
    expect(wrapper.text()).toBe('contain:1600:900disabled:1600:1080')
    const isolated = mount(Probe)
    expect(isolated.text()).toBe('responsive:1920:900')
    expect(document.documentElement.style.transform).toBe('')
    expect(document.body.style.transform).toBe('')
    wrapper.unmount()
    isolated.unmount()
  })

  it('响应式和关闭不 transform，页面切换清除局部变量，Teleport 不继承画布样式', async () => {
    const policy = shallowRef<false | { mode: 'vw' | 'responsive' }>({ mode: 'vw' })
    const wrapper = mount(defineComponent({
      setup: () => () => h(LumalViewport, { policy: policy.value }, () => [
        h('div', { class: 'content' }, 'page'),
        h(Teleport, { to: 'body' }, h('div', { class: 'viewport-test-dialog' }, 'dialog')),
      ]),
    }))
    expect(wrapper.attributes('data-viewport-mode')).toBe('vw')
    expect(wrapper.attributes('style')).toContain('--lumal-viewport-x-unit')
    expect(wrapper.find('.content').element.parentElement?.style.transform).toBe('')
    expect(document.querySelector('.viewport-test-dialog')?.parentElement).toBe(document.body)
    policy.value = false
    await nextTick()
    expect(wrapper.attributes('data-viewport-mode')).toBe('disabled')
    expect(wrapper.attributes('style')).not.toContain('--lumal-viewport')
    expect(wrapper.text()).toContain('page')
    wrapper.unmount()
    expect(document.querySelector('.viewport-test-dialog')).toBeNull()
  })
})
