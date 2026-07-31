import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LumalActiveRingChart,
  LumalBorderBox,
  LumalCapsuleChart,
  LumalConicalColumnChart,
  LumalDecoration,
  LumalDigitalFlop,
  LumalLoading,
  LumalPercentPond,
  LumalWaterLevelPond,
} from '../src'

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    dispose: vi.fn(),
    group: '',
    hideLoading: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    resize: vi.fn(),
    setOption: vi.fn(),
    showLoading: vi.fn(),
  })),
}))

beforeEach(() => {
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

describe('visual primitives', () => {
  it('覆盖 13 种边框并保留内容插槽', async () => {
    const wrapper = mount(LumalBorderBox, { props: { variant: 1 }, slots: { default: '驾驶舱内容' } })
    for (let variant = 1; variant <= 13; variant += 1) {
      await wrapper.setProps({ variant })
      expect(wrapper.get('.lumal-border-box').attributes('data-variant')).toBe(String(variant))
    }
    expect(wrapper.get('.lumal-border-box__content').text()).toBe('驾驶舱内容')
  })

  it('覆盖 12 种装饰并应用颜色、方向和时长', async () => {
    const wrapper = mount(LumalDecoration, {
      props: { colors: ['#123456', '#abcdef'], duration: 1200, reverse: true, variant: 1 },
    })
    for (let variant = 1; variant <= 12; variant += 1) {
      await wrapper.setProps({ variant })
      expect(wrapper.get('.lumal-decoration').attributes('data-variant')).toBe(String(variant))
    }
    expect(wrapper.classes()).toContain('is-reverse')
    expect(wrapper.attributes('style')).toContain('--lumal-datav-duration: 1200ms')
  })

  it('loading 支持状态、尺寸和样式变体', () => {
    const wrapper = mount(LumalLoading, { props: { label: '同步完成', size: 32, status: 'success', variant: 'pulse' } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.classes()).toContain('is-success')
    expect(wrapper.attributes('data-variant')).toBe('pulse')
    expect(wrapper.text()).toContain('同步完成')
  })
})

describe('numeric components', () => {
  it('digital flop 支持精度、前后缀和格式化函数', async () => {
    const wrapper = mount(LumalDigitalFlop, {
      props: { duration: 0, precision: 1, prefix: '¥', suffix: '万', value: 12.34 },
    })
    expect(wrapper.text()).toBe('¥12.3万')
    await wrapper.setProps({ formatter: value => `约${Math.round(value)}`, value: 20 })
    expect(wrapper.text()).toBe('¥约20万')
  })

  it('digital flop 在更新与卸载时取消 RAF，并完成可中断插值', async () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    const cancel = vi.fn((id: number) => callbacks.delete(id))
    let nextFrame = 0
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      nextFrame += 1
      callbacks.set(nextFrame, callback)
      return nextFrame
    }))
    vi.stubGlobal('cancelAnimationFrame', cancel)

    const wrapper = mount(LumalDigitalFlop, { props: { duration: 100, precision: 0, value: 0 } })
    await wrapper.setProps({ value: 100 })
    expect(callbacks.has(1)).toBe(true)

    await wrapper.setProps({ value: 200 })
    expect(cancel).toHaveBeenCalledWith(1)
    expect(callbacks.has(2)).toBe(true)

    const finishingCallback = callbacks.get(2)
    callbacks.delete(2)
    finishingCallback?.(100)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('200')

    await wrapper.setProps({ value: 300 })
    wrapper.unmount()
    expect(cancel).toHaveBeenCalledWith(3)
    expect(callbacks.size).toBe(0)
  })

  it('digital flop 按 animationCurve 区分上游缓动曲线', async () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextFrame = 0
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      nextFrame += 1
      callbacks.set(nextFrame, callback)
      return nextFrame
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => callbacks.delete(id)))

    const wrapper = mount(LumalDigitalFlop, {
      props: { animationCurve: 'easeInQuad', duration: 100, precision: 0, value: 0 },
    })
    await wrapper.setProps({ value: 100 })
    callbacks.get(1)?.(50)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('25')

    await wrapper.setProps({ animationCurve: 'easeOutCubic', value: 200 })
    callbacks.get(Math.max(...callbacks.keys()))?.(50)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toBe('178')
    wrapper.unmount()
  })

  it('percent pond 将输入限制在 0 到 100 并支持格式化', async () => {
    const wrapper = mount(LumalPercentPond, { props: { value: 125 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('100')
    expect(wrapper.text()).toContain('100%')
    await wrapper.setProps({ formatter: value => `完成 ${value}`, value: -8 })
    expect(wrapper.attributes('aria-valuenow')).toBe('0')
    expect(wrapper.text()).toContain('完成 0')
  })

  it('water level pond 限制边界并限制波浪数量', () => {
    const wrapper = mount(LumalWaterLevelPond, { props: { shape: 'rounded', value: 48, waveCount: 8 } })
    expect(wrapper.attributes('aria-valuenow')).toBe('48')
    expect(wrapper.classes()).toContain('is-rounded')
    expect((wrapper.vm as unknown as { getWavePaths: () => unknown[] }).getWavePaths()).toHaveLength(1)
    expect(wrapper.findAll('.lumal-water-level-pond__water path')).toHaveLength(1)
  })
})

describe('data charts', () => {
  const items = [
    { key: 'a', label: '甲', value: 20, color: '#34c8ff' },
    { key: 'b', label: '乙', value: 60, color: '#796cff' },
    { key: 'c', label: '丙', value: 40, color: '#6ff7cd' },
  ]

  it('active ring 支持受控选择并仅在用户点击时发出 select', async () => {
    const onUpdate = vi.fn()
    const onSelect = vi.fn()
    const wrapper = mount(LumalActiveRingChart, {
      props: {
        'activeKey': 'a',
        'autoplay': false,
        items,
        onSelect,
        'onUpdate:activeKey': onUpdate,
      },
    })
    await wrapper.findAll('button')[1]!.trigger('click')
    expect(onUpdate).toHaveBeenCalledWith('b')
    expect(onSelect).toHaveBeenCalledWith(items[1])
  })

  it('capsule 与 conical chart 支持排序、单位和数值显示', () => {
    const capsule = mount(LumalCapsuleChart, { props: { items, showValue: true, sort: 'desc', unit: '次' } })
    const conical = mount(LumalConicalColumnChart, { props: { items, showValue: true, sort: 'asc', unit: '%' } })
    expect(capsule.find('.label-column div').text()).toBe('乙')
    expect(capsule.text()).toContain('60')
    expect(capsule.text()).toContain('次')
    expect(conical.find('g text').text()).toBe('甲')
    expect(conical.text()).toContain('20%')
  })
})
