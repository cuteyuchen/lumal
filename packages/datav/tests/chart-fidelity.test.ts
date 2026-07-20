import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { LumalActiveRingChart, LumalCapsuleChart, LumalConicalColumnChart, LumalDigitalFlop } from '../src'

const chartMocks = vi.hoisted(() => ({
  instances: [] as Array<{
    dispose: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    resize: ReturnType<typeof vi.fn>
    setOption: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('echarts', () => ({
  init: vi.fn(() => {
    const instance = {
      dispose: vi.fn(), group: '', hideLoading: vi.fn(), off: vi.fn(), on: vi.fn(),
      resize: vi.fn(), setOption: vi.fn(), showLoading: vi.fn(),
    }
    chartMocks.instances.push(instance)
    return instance
  }),
}))

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(public callback: ResizeObserverCallback) {
    ResizeObserverMock.instances.push(this)
  }

  emit(): void {
    this.callback([], this as unknown as ResizeObserver)
  }
}

class IntersectionObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
}

let boxWidth = 400
let boxHeight = 200
let nextFrame = 0
let frames = new Map<number, FrameRequestCallback>()

async function flushFrames(): Promise<void> {
  const callbacks = [...frames.values()]
  frames.clear()
  callbacks.forEach(callback => callback(performance.now()))
  await nextTick()
}

beforeEach(() => {
  chartMocks.instances = []
  ResizeObserverMock.instances = []
  boxWidth = 400
  boxHeight = 200
  nextFrame = 0
  frames = new Map()
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    nextFrame += 1
    frames.set(nextFrame, callback)
    return nextFrame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => boxWidth)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => boxHeight)
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
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('DataV chart fidelity', () => {
  it('active ring 保留上游 pie option、半径动画、中心翻牌和销毁清理', async () => {
    const wrapper = mount(LumalActiveRingChart, {
      props: {
        config: {
          activeRadius: '50%',
          activeTimeGap: 600,
          animationFrame: 0,
          color: ['#37a2da', '#32c5e9'],
          data: [
            { name: '甲', value: 20 },
            { name: '乙', value: 60 },
          ],
          digitalFlopStyle: {
            fill: '#abcdef',
            fontFamily: 'monospace',
            fontSize: 18,
            fontStyle: 'italic',
            fontVarient: 'small-caps',
            fontWeight: 700,
            opacity: 0.6,
            shadowBlur: 4,
            shadowColor: '#fedcba',
            stroke: '#123456',
          },
          lineWidth: 10,
          radius: '40%',
        },
      },
    })
    await flushFrames()

    const instance = chartMocks.instances[0]!
    const firstOption = instance.setOption.mock.calls.at(-1)![0] as {
      color: string[]
      series: Array<{
        data: Array<{ itemStyle: { opacity?: number }, name: string, value: number }>
        radius: [number, number]
        type: string
      }>
    }
    expect(firstOption.color).toEqual(['#37a2da', '#32c5e9'])
    expect(firstOption.series[0]!.type).toBe('pie')
    expect(firstOption.series.map(series => series.radius)).toEqual([[35, 45], [45, 55]])
    expect(firstOption.series[0]!.data.map(item => item.itemStyle.opacity)).toEqual([0, 1])
    expect(firstOption.series[1]!.data.map(item => item.itemStyle.opacity)).toEqual([1, 0])
    expect(wrapper.get('.active-ring-name').text()).toBe('甲')
    expect(wrapper.get('.dv-digital-flop text').attributes()).toMatchObject({
      fill: '#abcdef',
      'font-family': 'monospace',
      'font-style': 'italic',
      'font-variant': 'small-caps',
      'font-weight': '700',
      opacity: '0.6',
      stroke: '#123456',
    })
    expect(wrapper.getComponent(LumalDigitalFlop).props('config').style).toMatchObject({
      shadowBlur: 4,
      shadowColor: '#fedcba',
    })
    expect(wrapper.get('.dv-digital-flop text').text()).toBe('25%')

    await vi.advanceTimersByTimeAsync(600)
    await nextTick()
    const nextOption = instance.setOption.mock.calls.at(-1)![0] as typeof firstOption
    expect(nextOption.series[0]!.data.map(item => item.itemStyle.opacity)).toEqual([1, 0])
    expect(nextOption.series[1]!.data.map(item => item.itemStyle.opacity)).toEqual([0, 1])
    expect(wrapper.attributes('data-active-index')).toBe('1')
    expect(wrapper.get('.active-ring-name').text()).toBe('乙')

    wrapper.unmount()
    expect(instance.dispose).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('active ring 使用完整上游调色板并允许低于 250ms 的切换间隔', async () => {
    const wrapper = mount(LumalActiveRingChart, {
      props: {
        config: {
          activeTimeGap: 100,
          animationFrame: 0,
          data: Array.from({ length: 13 }, (_, index) => ({ name: `${index}`, value: 1 })),
        },
      },
    })
    await flushFrames()

    const option = chartMocks.instances[0]!.setOption.mock.calls.at(-1)![0] as { color: string[] }
    expect(option.color).toEqual([
      '#37a2da', '#32c5e9', '#67e0e3', '#9fe6b8', '#ffdb5c', '#ff9f7f', '#fb7293',
      '#e062ae', '#e690d1', '#e7bcf3', '#9d96f5', '#8378ea', '#96bfff',
    ])

    await vi.advanceTimersByTimeAsync(101)
    expect(wrapper.attributes('data-active-index')).toBe('1')
    wrapper.unmount()
  })

  it('capsule 保留上游标签列、五等分刻度、数组深合并颜色与独立单位', () => {
    const wrapper = mount(LumalCapsuleChart, {
      props: {
        config: {
          colors: ['#ff0000'],
          data: [
            { name: '甲', value: 50 },
            { name: '乙', value: 100 },
          ],
          showValue: true,
          unit: '件',
        },
      },
    })

    expect(wrapper.findAll('.label-column div').map(node => node.text())).toEqual(['甲', '乙', ''])
    expect(wrapper.findAll('.unit-label div').map(node => node.text())).toEqual(['0', '20', '40', '60', '80', '100'])
    const columns = wrapper.findAll('.capsule-item-column')
    expect(columns[0]!.attributes('style')).toContain('width: 50%')
    expect(columns[0]!.attributes('style')).toContain('background-color: rgb(255, 0, 0)')
    expect(columns[1]!.attributes('style')).toContain('background-color: rgb(50, 197, 233)')
    expect(wrapper.findAll('.capsule-item-value').map(node => node.text())).toEqual(['50', '100'])
    expect(wrapper.get('.unit-text').text()).toBe('件')
  })

  it('capsule 默认不显示数值，显式 max 与排序入口不改变上游布局', () => {
    const wrapper = mount(LumalCapsuleChart, {
      props: {
        items: [
          { key: 'a', label: '甲', value: 30 },
          { key: 'b', label: '乙', value: 10 },
        ],
        max: 50,
        sort: 'asc',
      },
    })
    expect(wrapper.find('.label-column div').text()).toBe('乙')
    expect(wrapper.find('.capsule-item-column').attributes('style')).toContain('width: 20%')
    expect(wrapper.findAll('.capsule-item-value')).toHaveLength(0)
    expect(wrapper.findAll('.unit-label div').map(node => node.text())).toEqual(['0', '10', '20', '30', '40', '50'])
  })

  it('conical 按上游降序和二次贝塞尔公式响应容器尺寸', async () => {
    const wrapper = mount(LumalConicalColumnChart, {
      props: {
        config: {
          columnColor: 'rgba(0, 194, 255, 0.4)',
          data: [
            { color: '#ff0000', name: '甲', value: 20 },
            { name: '乙', value: 60 },
            { name: '丙', value: 40 },
          ],
          showValue: true,
        },
      },
    })
    await flushFrames()

    const groups = wrapper.findAll('g')
    expect(groups[0]!.find('text').text()).toBe('乙')
    expect(groups[0]!.find('path').attributes()).toMatchObject({
      d: 'M0, 183 Q100, 121.8 100,30 M100,30 Q100, 121.8 200,183 L0, 183 Z',
      fill: 'rgba(0, 194, 255, 0.4)',
    })
    expect(groups[0]!.findAll('text')[1]!.text()).toBe('60')

    boxWidth = 300
    boxHeight = 180
    ResizeObserverMock.instances.at(-1)!.emit()
    await flushFrames()
    expect(wrapper.find('path').attributes('d')).toBe('M0, 163 Q75, 109.8 75,30 M75,30 Q75, 109.8 150,163 L0, 163 Z')
    wrapper.unmount()
    expect(ResizeObserverMock.instances.at(-1)!.disconnect).toHaveBeenCalled()
  })

  it('conical 仅让显式 items API 覆盖单柱颜色', async () => {
    const wrapper = mount(LumalConicalColumnChart, {
      props: {
        items: [{ key: 'a', label: '甲', value: 10, color: '#ff0000' }],
      },
    })
    await flushFrames()
    expect(wrapper.get('path').attributes('fill')).toBe('#ff0000')
  })

  it('conical 对全零、非法数值和非正 max 生成有限路径', async () => {
    const wrapper = mount(LumalConicalColumnChart, {
      props: {
        fontSize: Number.NaN,
        imageSideLength: Number.POSITIVE_INFINITY,
        items: [
          { key: 'zero', label: '零值', value: 0 },
          { key: 'negative', label: '负值', value: -10 },
          { key: 'invalid', label: '非法值', value: Number.NaN },
        ],
        max: 0,
        showValue: true,
      },
    })
    await flushFrames()

    const paths = wrapper.findAll('path')
    expect(paths).toHaveLength(3)
    paths.forEach((path) => {
      expect(path.attributes('d')).not.toMatch(/NaN|Infinity/)
    })
    expect(wrapper.findAll('g').map(group => group.findAll('text')[1]!.text())).toEqual(['0', '0', '0'])

    boxHeight = 10
    ResizeObserverMock.instances.at(-1)!.emit()
    await flushFrames()
    wrapper.findAll('path').forEach((path) => {
      expect(path.attributes('d')).not.toMatch(/NaN|Infinity|,-/)
    })
  })

  it('conical 不让小于数据最大值的 max 把锥柱绘制到容器外', async () => {
    const wrapper = mount(LumalConicalColumnChart, {
      props: {
        items: [
          { key: 'a', label: '甲', value: 100 },
          { key: 'b', label: '乙', value: 50 },
        ],
        max: 10,
      },
    })
    await flushFrames()

    expect(wrapper.get('path').attributes('d')).not.toMatch(/,-/)
  })

  it('conical 的 DataV config 支持重复名称', async () => {
    const wrapper = mount(LumalConicalColumnChart, {
      props: {
        config: {
          data: [
            { name: '同名', value: 20 },
            { name: '同名', value: 10 },
          ],
        },
      },
    })
    await flushFrames()

    expect(wrapper.findAll('g')).toHaveLength(2)
  })
})
