import { addIcon } from '@iconify/vue'
import { registerIcons } from '@lumal/icons'
import { prepareIconMorph } from '@lumal/icons/morph'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { LumalIcon } from '../src'
import * as morphRuntime from '../src/runtime/morph'

const firstSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4L20 20"/></svg>'
const secondSvg = firstSvg.replace('M4 4L20 20', 'M4 20L20 4')

enableAutoUnmount(afterEach)

describe('lumalIcon morph', () => {
  let frames: Map<number, FrameRequestCallback>
  let sequence: number
  let time: number
  let media: MediaQueryList
  let mediaListeners: Set<(event: MediaQueryListEvent) => void>

  function frame(): void {
    time += 16
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback(time))
  }

  function settle(): void {
    for (let index = 0; index < 300 && frames.size > 0; index++)
      frame()
    expect(frames.size).toBe(0)
  }

  async function ready(wrapper: ReturnType<typeof mount>): Promise<void> {
    await vi.waitFor(() => expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(true))
  }

  beforeEach(() => {
    frames = new Map()
    sequence = 0
    time = 0
    mediaListeners = new Set()
    media = {
      matches: false,
      addEventListener: vi.fn((_name, callback) => mediaListeners.add(callback)),
      removeEventListener: vi.fn((_name, callback) => mediaListeners.delete(callback)),
    } as unknown as MediaQueryList
    vi.stubGlobal('matchMedia', vi.fn(() => media))
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.set(++sequence, callback)
      return sequence
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('默认不加载引擎，启用后首次仍直接显示原图标', async () => {
    const load = vi.spyOn(morphRuntime, 'loadMorphRuntime')
    const wrapper = mount(LumalIcon, { props: { icon: firstSvg, size: 20, title: '切换状态' } })
    await flushPromises()
    expect(load).not.toHaveBeenCalled()
    expect(mediaListeners.size).toBe(0)
    expect(wrapper.get('path').attributes('d')).toBe('M4 4L20 20')

    await wrapper.setProps({ morph: true })
    expect(wrapper.find('svg').exists()).toBe(true)
    await ready(wrapper)
    expect(frames.size).toBe(0)
    expect(wrapper.attributes('title')).toBe('切换状态')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('style')).toContain('--lumal-icon-size: calc(20 * var(--lumal-viewport-unit, 1px))')
    await wrapper.setProps({ morph: false })
    expect(mediaListeners.size).toBe(0)
    expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(false)
  })

  it('名称切换保留实例，产生中间帧并抵达目标，改色不播放', async () => {
    registerIcons([
      { key: 'morph:first', source: 'local-svg', svgText: firstSvg },
      { key: 'morph:second', source: 'local-svg', svgText: secondSvg },
    ])
    const wrapper = mount(LumalIcon, { props: { name: 'morph:first', morph: true } })
    await ready(wrapper)
    const path = wrapper.get('path').element
    const start = path.getAttribute('d')
    const end = (await prepareIconMorph(secondSvg))!.d

    await wrapper.setProps({ name: 'morph:second', morphSpring: 'snappy' })
    await flushPromises()
    frame()
    frame()
    expect(wrapper.get('path').element).toBe(path)
    expect(path.getAttribute('d')).not.toBe(start)
    expect(path.getAttribute('d')).not.toBe(end)
    settle()
    expect(path.getAttribute('d')).toBe(end)

    await wrapper.setProps({ color: '#e11d48', size: '2em' })
    expect(frames.size).toBe(0)
    expect(wrapper.get('path').element).toBe(path)
    expect(wrapper.attributes('style')).toContain('color: rgb(225, 29, 72)')
    expect(wrapper.attributes('style')).toContain('--lumal-icon-size: 2em')
  })

  it('连续反向切换从中间形状继续，最终回到最新目标', async () => {
    const wrapper = mount(LumalIcon, { props: { icon: firstSvg, morph: true, morphSpring: 'bouncy' } })
    await ready(wrapper)
    const path = wrapper.get('path').element
    const start = path.getAttribute('d')
    await wrapper.setProps({ icon: secondSvg })
    await flushPromises()
    frame()
    frame()
    frame()
    const intermediate = path.getAttribute('d')
    await wrapper.setProps({ icon: firstSvg })
    await flushPromises()
    expect(path.getAttribute('d')).toBe(intermediate)
    frame()
    expect(path.getAttribute('d')).not.toBe(start)
    settle()
    expect(path.getAttribute('d')).toBe(start)
  })

  it('填充与混合图形归一化后显示，太阳/月亮均能完整抵达终态', async () => {
    const wrapper = mount(LumalIcon, { props: { name: 'lumal:sun', morph: true } })
    expect(wrapper.find('circle').exists()).toBe(true)
    await ready(wrapper)
    const initial = wrapper.get('path').attributes('d')
    expect(wrapper.get('path').attributes('fill')).toBe('currentColor')
    expect(initial.match(/M/g)!.length).toBeGreaterThan(1)
    await wrapper.setProps({ name: 'lumal:moon' })
    await flushPromises()
    frame()
    frame()
    expect(wrapper.get('path').attributes('d')).not.toBe(initial)
    settle()
    await wrapper.setProps({ name: 'lumal:sun' })
    await flushPromises()
    settle()
    expect(wrapper.get('path').attributes('d')).toBe(initial)
  })

  it('系统减少动画时保留静态，运行中开启会取消帧并移除监听', async () => {
    Object.assign(media, { matches: true })
    const load = vi.spyOn(morphRuntime, 'loadMorphRuntime')
    const wrapper = mount(LumalIcon, { props: { icon: firstSvg, morph: true } })
    await flushPromises()
    expect(load).not.toHaveBeenCalled()
    expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(false)

    Object.assign(media, { matches: false })
    mediaListeners.forEach(callback => callback({ matches: false } as MediaQueryListEvent))
    await ready(wrapper)
    await wrapper.setProps({ icon: secondSvg })
    await flushPromises()
    frame()
    Object.assign(media, { matches: true })
    mediaListeners.forEach(callback => callback({ matches: true } as MediaQueryListEvent))
    await flushPromises()
    expect(frames.size).toBe(0)
    expect(wrapper.get('path').attributes('d')).toBe('M4 20L20 4')
    wrapper.unmount()
    expect(mediaListeners.size).toBe(0)
  })

  it('加载失败保留静态，重新启用可以重试', async () => {
    vi.spyOn(morphRuntime, 'loadMorphRuntime').mockRejectedValueOnce(new Error('offline'))
    const wrapper = mount(LumalIcon, { props: { icon: firstSvg, morph: true } })
    await flushPromises()
    expect(wrapper.get('path').attributes('d')).toBe('M4 4L20 20')
    await wrapper.setProps({ morph: false })
    await wrapper.setProps({ morph: true })
    await ready(wrapper)
  })

  it('加载期间只接受最新目标，关闭或卸载不会创建过期实例', async () => {
    const runtime = await morphRuntime.loadMorphRuntime()
    let resolve!: (value: typeof runtime) => void
    const load = vi.spyOn(morphRuntime, 'loadMorphRuntime').mockReturnValueOnce(new Promise((done) => {
      resolve = done
    }))
    const wrapper = mount(LumalIcon, { props: { icon: firstSvg, morph: true } })
    await vi.waitFor(() => expect(load).toHaveBeenCalled())
    await wrapper.setProps({ morph: false })
    resolve(runtime)
    await flushPromises()
    expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(false)
    await wrapper.setProps({ morph: true, icon: secondSvg })
    await ready(wrapper)
    expect(frames.size).toBe(0)
    await wrapper.setProps({ icon: firstSvg })
    await flushPromises()
    frame()
    wrapper.unmount()
    expect(frames.size).toBe(0)
  })

  it.each([
    firstSvg.replace('stroke="currentColor"', 'stroke="url(#paint)"'),
    firstSvg.replace('<path', '<path opacity="0.4"'),
    firstSvg.replace('<path', '<path stroke-dasharray="2 3"'),
    firstSvg.replace('<path', '<path transform="scale(2)"'),
    firstSvg.replace('<path', '<path class="external-paint"'),
    '<svg viewBox="0 0 24 24"><text x="2" y="12">A</text></svg>',
    '<svg viewBox="0 0 24 24"><defs><clipPath id="x"/></defs><path d="M4 4h8v8z"/></svg>',
  ])('无法保真转换的 SVG 保持静态：%s', async (icon) => {
    const load = vi.spyOn(morphRuntime, 'loadMorphRuntime')
    const wrapper = mount(LumalIcon, { props: { icon, morph: true } })
    await flushPromises()
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(false)
    expect(load).not.toHaveBeenCalled()
  })

  it('直接定义可形变，组件、Iconify 和渐变仍使用原渲染', async () => {
    const wrapper = mount(LumalIcon, { props: { icon: { key: 'direct:morph', source: 'local-svg', svgText: firstSvg }, morph: true } })
    await ready(wrapper)
    await wrapper.setProps({ gradient: { from: '#1677ff', to: '#10b981' } })
    expect(wrapper.find('linearGradient').exists()).toBe(true)
    expect(wrapper.find('svg.lumal-icon__component').exists()).toBe(false)
    await wrapper.setProps({
      gradient: undefined,
      icon: defineComponent({ setup: () => () => h('svg', { 'data-component': 'static' }) }),
    })
    expect(wrapper.find('[data-component="static"]').exists()).toBe(true)
    addIcon('morph:test', { width: 24, height: 24, body: '<path data-iconify="static" d="M4 4h8v8z"/>' })
    await wrapper.setProps({ icon: { key: 'direct:iconify-morph', source: 'iconify', icon: 'morph:test' } })
    expect(wrapper.find('[data-iconify="static"]').exists()).toBe(true)
  })
})
