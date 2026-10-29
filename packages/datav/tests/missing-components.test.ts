import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  LumalCharts,
  LumalFlylineChart,
  LumalFlylineChartEnhanced,
} from '../src'
import { randomDuration } from '../src/flyline-utils'

const chartMocks = vi.hoisted(() => ({
  init: vi.fn(),
  instances: [] as Array<{
    dispose: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
    resize: ReturnType<typeof vi.fn>
    setOption: ReturnType<typeof vi.fn>
  }>,
}))

const dataVChartMocks = vi.hoisted(() => ({
  instances: [] as Array<{
    option: Record<string, unknown> | null
    render: { graphs: Array<{ animationEnd: ReturnType<typeof vi.fn> }> }
    resize: ReturnType<typeof vi.fn>
    setOption: ReturnType<typeof vi.fn>
  }>,
}))

vi.mock('echarts', () => ({
  init: chartMocks.init.mockImplementation(() => {
    const instance = {
      dispose: vi.fn(),
      group: '',
      hideLoading: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
      resize: vi.fn(),
      setOption: vi.fn(),
      showLoading: vi.fn(),
    }
    chartMocks.instances.push(instance)
    return instance
  }),
}))

vi.mock('@jiaminghi/charts', () => ({
  default: class ChartsMock {
    option: Record<string, unknown> | null = null
    render = { graphs: [{ animationEnd: vi.fn() }] }
    resize = vi.fn()
    setOption = vi.fn((option: Record<string, unknown>) => {
      this.option = option
    })

    constructor(_element: HTMLElement) {
      dataVChartMocks.instances.push(this)
    }
  },
}))

class ResizeObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  constructor(public callback: ResizeObserverCallback) {}
}

class IntersectionObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
}

let frameId = 0
let frames: Array<{ callback: FrameRequestCallback, id: number }> = []

async function flushFrames(): Promise<void> {
  const pending = frames
  frames = []
  pending.forEach(({ callback }) => callback(performance.now()))
  await nextTick()
  await vi.dynamicImportSettled()
}

beforeEach(() => {
  chartMocks.init.mockClear()
  chartMocks.instances = []
  dataVChartMocks.instances = []
  frames = []
  frameId = 0
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frameId += 1
    frames.push({ callback, id: frameId })
    return frameId
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
    frames = frames.filter(frame => frame.id !== id)
  }))
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({ addEventListener: vi.fn(), matches: false, removeEventListener: vi.fn() }),
  })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
  vi.spyOn(HTMLElement.prototype, 'isConnected', 'get').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('remaining DataV components', () => {
  it('异步引擎尚未加载时卸载，不创建实例或遗留尺寸监听', async () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const wrapper = mount(LumalCharts, { props: { config: {} } })
    wrapper.unmount()
    await vi.dynamicImportSettled()
    expect(dataVChartMocks.instances).toHaveLength(0)
    expect(chartMocks.init).not.toHaveBeenCalled()
    expect(addListener.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0)
  })
  it('flyline duration keeps DataV random integer tenths', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const duration = randomDuration([20, 30])
    expect(duration).toBe(2.5)
    expect(Number.isInteger(duration * 10)).toBe(true)
  })

  it('renders the original flyline quadratic path and emits dev coordinates', async () => {
    const onPosition = vi.fn()
    const wrapper = mount(LumalFlylineChart, {
      props: {
        config: {
          centerPoint: [0.5, 0.5],
          points: [{ position: [0.1, 0.2], text: '节点 A' }],
          relative: true,
        },
        dev: true,
        onPosition,
      },
    })
    await flushFrames()
    expect(wrapper.find('path').attributes('d')).toMatch(/^M40,40 Q/)
    expect(wrapper.find('path').attributes('d')).toContain('200,100')
    expect(wrapper.find('path').attributes('d')).toBe('M40,40 Q154.1760149812701,52.91199250936495 200,100')
    expect(wrapper.text()).toContain('节点 A')
    await wrapper.trigger('click', { clientX: 200, clientY: 100 })
    expect(onPosition).toHaveBeenCalled()
  })

  it('flyline animation keeps running while hovered like DataV 2.10.0', async () => {
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const wrapper = mount(LumalFlylineChart, {
      props: {
        config: {
          centerPoint: [0.5, 0.5],
          points: [[0.1, 0.2]],
        },
      },
    })
    await flushFrames()

    await wrapper.trigger('mouseenter')
    expect(wrapper.classes()).not.toContain('is-animation-paused')
  })

  it('flyline keeps the DataV 2.10.0 config field names and legacy aliases', async () => {
    const wrapper = mount(LumalFlylineChart, {
      props: {
        config: {
          bgImgUrl: '/map.png',
          centerPoint: [0.5, 0.5],
          centerPointImg: { height: 24, url: '/center.png', width: 30 },
          points: [[0.1, 0.2]],
          pointsImg: { height: 12, url: '/point.png', width: 10 },
        },
      },
    })
    await flushFrames()
    expect(wrapper.attributes('style')).toContain('/map.png')
    expect(wrapper.findAll('image')).toHaveLength(2)
    expect(wrapper.findAll('image')[0]!.attributes()).toMatchObject({ height: '24', href: '/center.png', width: '30' })
    expect(wrapper.findAll('image')[1]!.attributes()).toMatchObject({ height: '12', href: '/point.png', width: '10' })

    await wrapper.setProps({
      config: {
        backgroundImage: '/legacy-map.png',
        center: [0.5, 0.5],
        centerImage: { url: '/legacy-center.png' },
        pointImage: { url: '/legacy-point.png' },
        points: [[0.1, 0.2]],
      },
    })
    expect(wrapper.attributes('style')).toContain('/legacy-map.png')
  })

  it('enhanced flyline resolves named endpoints without mutating input', async () => {
    const config = {
      bgImgSrc: '/enhanced-map.png',
      line: { duration: [20, 20] as const },
      lines: [{ source: 'A', target: 'B' }],
      points: [
        { coordinate: [0.1, 0.2] as const, name: 'A' },
        { coordinate: [0.8, 0.7] as const, name: 'B' },
      ],
      relative: true,
    }
    const wrapper = mount(LumalFlylineChartEnhanced, { props: { config } })
    await flushFrames()
    expect(wrapper.attributes('style')).toContain('/enhanced-map.png')
    expect(wrapper.find('path').attributes('d')).toBe('M40,40 Q239.4642749893,60.2678625054 320,140')
    expect(wrapper.get('animateMotion').attributes('dur')).toBe('2')
    expect(config.points[0]!.coordinate).toEqual([0.1, 0.2])
  })

  it('charts keeps the upstream option protocol and cleans render graphs', async () => {
    const option = { xAxis: {}, yAxis: {}, series: [{ data: [1, 2], type: 'bar' as const }] }
    const click = vi.fn()
    const initOptions = { renderer: 'svg' as const }
    const wrapper = mount(LumalCharts, {
      attrs: { onClick: click },
      props: { initOptions, option, setOptionOptions: { lazyUpdate: true }, theme: 'dark' },
    })
    await flushFrames()
    await nextTick()
    const instance = chartMocks.instances[0]!
    expect(chartMocks.init).toHaveBeenCalledWith(expect.any(HTMLElement), 'dark', { ...initOptions, height: 200, width: 400 })
    expect(instance.setOption).toHaveBeenCalledWith(option, { lazyUpdate: true })
    expect(instance.on).toHaveBeenCalledWith('click', click)
    await wrapper.setProps({ option: { title: { text: '更新' } } })
    expect(instance.setOption).toHaveBeenLastCalledWith({ title: { text: '更新' } }, { lazyUpdate: true })
    wrapper.unmount()
    expect(instance.dispose).toHaveBeenCalled()
  })

  it('charts config 使用 DataV 官方运行时，并保留 ECharts option 扩展', async () => {
    const config = {
      series: [{ data: [10, 20, 30], type: 'line' }],
      xAxis: { data: ['一', '二', '三'] },
      yAxis: { data: 'value' },
    }
    const wrapper = mount(LumalCharts, { props: { config } })
    await flushFrames()
    await nextTick()

    expect(wrapper.attributes('data-renderer')).toBe('datav')
    expect(chartMocks.init).not.toHaveBeenCalled()
    const instance = dataVChartMocks.instances[0]!
    expect(instance.setOption).toHaveBeenCalledWith(config)

    const updated = { ...config, title: { text: '更新' } }
    await wrapper.setProps({ config: updated })
    expect(instance.setOption).toHaveBeenLastCalledWith(updated, true)

    ;(wrapper.vm as unknown as { resize: () => void }).resize()
    await flushFrames()
    expect(instance.resize).toHaveBeenCalled()

    wrapper.unmount()
    expect(instance.render.graphs[0]!.animationEnd).toHaveBeenCalled()
  })
})
