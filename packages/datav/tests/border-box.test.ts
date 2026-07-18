import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { LumaBorderBox } from '../src'

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(public callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }
}

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this)
  }

  emit(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

let animationFrames: Map<number, FrameRequestCallback>
let nextAnimationFrame: number

function flushAnimationFrames(): void {
  const callbacks = [...animationFrames.values()]
  animationFrames.clear()
  callbacks.forEach(callback => callback(0))
}

beforeEach(() => {
  ResizeObserverMock.instances = []
  IntersectionObserverMock.instances = []
  animationFrames = new Map()
  nextAnimationFrame = 0

  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    nextAnimationFrame += 1
    animationFrames.set(nextAnimationFrame, callback)
    return nextAnimationFrame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => animationFrames.delete(id)))
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(220)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('lumaBorderBox DataV SVG fidelity', () => {
  it('支持 DataV 原生 color、backgroundColor 与 borderBox8 dur 属性', async () => {
    const wrapper = mount(LumaBorderBox, {
      props: {
        backgroundColor: '#010203',
        color: ['#112233', '#445566'],
        dur: 4,
        variant: 8,
      },
    })
    flushAnimationFrames()
    await nextTick()

    expect(wrapper.attributes('style')).toContain('--luma-datav-duration: 4000ms')
    expect(wrapper.get('polygon').attributes('fill')).toBe('#010203')
    expect(wrapper.findAll('use')[0]!.attributes('stroke')).toBe('#112233')
    expect(wrapper.findAll('use')[1]!.attributes('stroke')).toBe('#445566')
    expect(wrapper.get('animateMotion').attributes('dur')).toBe('4s')
  })

  it('保留 1 号四角 SVG 几何、默认颜色和原始 SMIL 节奏', async () => {
    const wrapper = mount(LumaBorderBox, {
      props: { background: '#010203', variant: 1 },
      slots: { default: '内容' },
    })
    flushAnimationFrames()
    await nextTick()

    expect(wrapper.findAll('svg.luma-border-box__bb1-corner')).toHaveLength(4)
    expect(wrapper.findAll('animate')).toHaveLength(12)
    expect(wrapper.find('svg > polygon').attributes('fill')).toBe('#010203')
    expect(wrapper.find('animate').attributes('dur')).toBe('0.5s')
    expect(wrapper.attributes('style')).toContain('--luma-datav-primary: #4fd2dd')
    expect(wrapper.attributes('style')).toContain('--luma-datav-secondary: #235fa7')
    expect(wrapper.get('.luma-border-box__content').text()).toBe('内容')
  })

  it('13 种边框均输出上游对应的 SVG 元素签名和默认颜色', async () => {
    const cases = [
      { circles: 0, color: '#4fd2dd', groups: 0, paths: 0, polygons: 13, polylines: 0, variant: 1 },
      { circles: 4, color: '#fff', groups: 0, paths: 0, polygons: 1, polylines: 2, variant: 2 },
      { circles: 0, color: '#2862b7', groups: 0, paths: 0, polygons: 1, polylines: 4, variant: 3 },
      { circles: 0, color: 'red', groups: 0, paths: 0, polygons: 1, polylines: 10, variant: 4 },
      { circles: 0, color: 'rgba(255, 255, 255, 0.35)', groups: 0, paths: 0, polygons: 1, polylines: 6, variant: 5 },
      { circles: 4, color: 'rgba(255, 255, 255, 0.35)', groups: 0, paths: 0, polygons: 1, polylines: 12, variant: 6 },
      { circles: 0, color: 'rgba(128,128,128,0.3)', groups: 0, paths: 0, polygons: 0, polylines: 8, variant: 7 },
      { circles: 1, color: '#235fa7', groups: 0, paths: 1, polygons: 1, polylines: 0, variant: 8 },
      { circles: 0, color: '#11eefd', groups: 0, paths: 0, polygons: 1, polylines: 9, variant: 9 },
      { circles: 0, color: '#1d48c4', groups: 4, paths: 0, polygons: 5, polylines: 0, variant: 10 },
      { circles: 0, color: '#8aaafb', groups: 0, paths: 0, polygons: 12, polylines: 1, variant: 11 },
      { circles: 0, color: '#2e6099', groups: 0, paths: 5, polygons: 0, polylines: 0, variant: 12 },
      { circles: 0, color: '#6586ec', groups: 0, paths: 4, polygons: 0, polylines: 0, variant: 13 },
    ] as const

    for (const signature of cases) {
      const wrapper = mount(LumaBorderBox, { props: { variant: signature.variant } })
      flushAnimationFrames()
      await nextTick()
      expect(wrapper.findAll('circle')).toHaveLength(signature.circles)
      expect(wrapper.findAll('g')).toHaveLength(signature.groups)
      expect(wrapper.findAll('path')).toHaveLength(signature.paths)
      expect(wrapper.findAll('polygon')).toHaveLength(signature.polygons)
      expect(wrapper.findAll('polyline')).toHaveLength(signature.polylines)
      expect(wrapper.attributes('style')).toContain(`--luma-datav-primary: ${signature.color}`)
      wrapper.unmount()
    }
  })

  it('8 号使用唯一 SVG id、真实环绕路径并支持反向和时长', async () => {
    const first = mount(LumaBorderBox, { props: { duration: 4200, variant: 8 } })
    const second = mount(LumaBorderBox, { props: { variant: 8 } })
    flushAnimationFrames()
    await nextTick()

    const firstPath = first.get('defs > path')
    const secondPath = second.get('defs > path')
    expect(firstPath.attributes('id')).not.toBe(secondPath.attributes('id'))
    expect(first.get('use').attributes('href')).toBe(`#${firstPath.attributes('id')}`)
    expect(first.get('animateMotion').attributes('dur')).toBe('4.2s')
    expect(firstPath.attributes('d')).toBe('M2.5, 2.5 L397.5, 2.5 L397.5, 217.5 L2.5, 217.5 L2.5, 2.5')

    await first.setProps({ reverse: true })
    expect(first.get('defs > path').attributes('d')).toBe('M 2.5, 2.5 L 2.5, 217.5 L 397.5, 217.5 L 397.5, 2.5 L 2.5, 2.5')

    await first.setProps({ variant: 4 })
    expect(first.get('.luma-border-box__svg').classes()).toContain('is-frame-reverse')
  })

  it('页面、视口和交互暂停会暂停原生 SVG 动画并在卸载时清理', async () => {
    const pauseAnimations = vi.fn()
    const unpauseAnimations = vi.fn()
    Object.defineProperty(SVGSVGElement.prototype, 'pauseAnimations', { configurable: true, value: pauseAnimations })
    Object.defineProperty(SVGSVGElement.prototype, 'unpauseAnimations', { configurable: true, value: unpauseAnimations })

    const wrapper = mount(LumaBorderBox, { props: { variant: 8 } })
    flushAnimationFrames()
    await nextTick()
    const intersectionObserver = IntersectionObserverMock.instances.at(-1)!
    const resizeObserver = ResizeObserverMock.instances.at(-1)!

    intersectionObserver.emit(false)
    await nextTick()
    await nextTick()
    expect(wrapper.classes()).toContain('is-animation-paused')
    expect(pauseAnimations).toHaveBeenCalled()

    intersectionObserver.emit(true)
    await nextTick()
    await nextTick()
    expect(unpauseAnimations).toHaveBeenCalled()

    await wrapper.trigger('mouseenter')
    await nextTick()
    expect(pauseAnimations).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    expect(intersectionObserver.disconnect).toHaveBeenCalled()
    expect(resizeObserver.disconnect).toHaveBeenCalled()

    delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).pauseAnimations
    delete (SVGSVGElement.prototype as Partial<SVGSVGElement>).unpauseAnimations
  })
})
