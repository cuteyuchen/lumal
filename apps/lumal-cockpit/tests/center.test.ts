import type { CockpitCenterContext, CockpitMessage } from '@lumal/cockpit'
import { createCockpitMessageBus } from '@lumal/cockpit'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import EchartsGeoCenter from '../src/centers/echarts-geo-center/Center.vue'
import SceneCenter from '../src/centers/scene-center/Center.vue'
import { demoScene, metricSummaries } from '../src/data/demo-scene'
import { cockpitTopics } from '../src/messages/topics'

vi.mock('vue-echarts', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'VChartStub',
      inheritAttrs: false,
      props: { option: { type: Object, required: true } },
      emits: ['click'],
      setup(_, { expose }) {
        expose({ resize: vi.fn() })
        return () => h('div', { class: 'v-chart-stub' })
      },
    }),
  }
})

vi.mock('../src/centers/openlayers-center/Center.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    __esModule: true,
    default: defineComponent({
      name: 'OpenLayersCenterStub',
      emits: ['select'],
      setup() {
        return () => h('div', { class: 'openlayers-center-stub' })
      },
    }),
  }
})

vi.mock('../src/centers/cesium-center/Center.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    __esModule: true,
    default: defineComponent({
      name: 'CesiumCenterStub',
      props: {
        selectedIds: { type: Array, default: () => [] },
        focusedId: { type: String, default: '' },
        filterStatus: { type: String, default: undefined },
        theme: { type: String, default: 'dark' },
        reducedMotion: { type: Boolean, default: false },
      },
      emits: ['select'],
      setup(_, { emit }) {
        return () => h('button', {
          class: 'cesium-center-stub',
          type: 'button',
          onClick: () => emit('select', 'p-beijing'),
        }, 'Cesium stub')
      },
    }),
  }
})

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

/***********************动画帧桩状态*********************/
const animationFrameHandles = new Map<number, ReturnType<typeof setTimeout>>()
let animationFrameTimestamp = 0

function createContext(): CockpitCenterContext {
  return {
    cockpitId: 'test-cockpit',
    layoutId: 'layout-overview',
    instanceId: 'layout-overview:center',
    mode: 'runtime',
    messages: createCockpitMessageBus(),
  }
}

describe('驾驶舱中央地图', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    // rAF 必须异步回调并推进时间戳：同步执行会让依赖 rAF 递归的动画
    //（如 LumalDigitalFlop）在同一调用栈里无限递归而爆栈
    animationFrameHandles.clear()
    animationFrameTimestamp = 0
    let nextAnimationFrameHandle = 1
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const handle = nextAnimationFrameHandle
      nextAnimationFrameHandle += 1
      const timer = setTimeout(() => {
        animationFrameHandles.delete(handle)
        animationFrameTimestamp += 16
        callback(animationFrameTimestamp)
      }, 0)
      animationFrameHandles.set(handle, timer)
      return handle
    })
    vi.stubGlobal('cancelAnimationFrame', (handle: number) => {
      const timer = animationFrameHandles.get(handle)
      if (timer !== undefined) {
        clearTimeout(timer)
        animationFrameHandles.delete(handle)
      }
    })
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // 还原对 clientWidth/clientHeight 等原型属性的打桩，避免污染其它用例
    vi.restoreAllMocks()
  })

  it('使用真实省级数据生成共享飞线路径', () => {
    expect(demoScene.geoJson.features.length).toBeGreaterThanOrEqual(34)
    expect(demoScene.regions).toHaveLength(34)
    expect(demoScene.lines).toHaveLength(33)
    expect(demoScene.lines.every(line => line.coordinates.length === 25)).toBe(true)
    expect(demoScene.lines.every(line => demoScene.regions.some(region => region.id === line.toId))).toBe(true)
    expect(new Set(demoScene.regions.map(region => region.id)).size).toBe(demoScene.regions.length)
    expect(new Set(demoScene.regions.map(region => region.center.join(','))).size).toBe(demoScene.regions.length)
    expect(demoScene.regions.find(region => region.name === '香港')?.id).toBe('r-81')
    expect(demoScene.regions.find(region => region.name === '澳门')?.id).toBe('r-82')

    const beijing = demoScene.regions.find(region => region.name === '北京')
    expect(beijing?.center[0]).toBeCloseTo(116.389, 3)
    expect(beijing?.center[1]).toBeCloseTo(39.9488, 3)

    const lineMetric = metricSummaries.find(item => item.label === '运行链路')
    expect(lineMetric?.value).toBe(demoScene.lines.length)
    expect(lineMetric?.trend).toBe(`高负载 ${demoScene.lines.filter(line => line.status === 'active').length} 条`)
  })

  it('响应侧栏消息并在三种引擎间保留和反向发布状态', async () => {
    const context = createContext()
    const selections: CockpitMessage[] = []
    let readyCount = 0
    context.messages.subscribe(cockpitTopics.sceneSelectionChange, message => selections.push(message))
    context.messages.subscribe(cockpitTopics.centerReady, () => readyCount += 1)

    const wrapper = mount(SceneCenter, {
      props: { context },
      attachTo: document.body,
    })
    await flushPromises()
    expect(readyCount).toBe(1)

    const xinjiang = demoScene.regions.find(region => region.name === '新疆')
    expect(xinjiang).toBeTruthy()
    context.messages.publish({
      topic: cockpitTopics.sceneRegionFocus,
      sourceId: 'w-region-ranking',
      payload: { id: xinjiang!.id },
    })
    await nextTick()

    expect(selections.at(-1)?.payload).toEqual({ ids: [xinjiang!.id] })
    expect(wrapper.get('.scene-center__status strong').text()).toBe('新疆')

    context.messages.publish({
      topic: cockpitTopics.sceneFilterChange,
      sourceId: 'w-status-distribution',
      payload: { status: xinjiang!.status },
    })
    await nextTick()

    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    await wrapper.get('button[data-center-engine="echarts"]').trigger('keydown', { key: 'End' })
    await flushPromises()
    expect(wrapper.get('.scene-center').attributes('data-center-engine')).toBe('cesium')
    expect(document.activeElement).toBe(wrapper.get('button[data-center-engine="cesium"]').element)
    expect(wrapper.get('.scene-center__status strong').text()).toBe('新疆')

    const cesium = wrapper.getComponent({ name: 'CesiumCenterStub' })
    expect(cesium.props('selectedIds')).toEqual([xinjiang!.id])
    expect(cesium.props('focusedId')).toBe(xinjiang!.id)
    expect(cesium.props('filterStatus')).toBe(xinjiang!.status)

    await cesium.trigger('click')
    await nextTick()
    expect(selections.at(-1)?.payload).toEqual({ ids: ['p-beijing'] })
    expect(wrapper.get('.scene-center__status strong').text()).toBe('北京枢纽')

    await wrapper.get('button[data-center-engine="openlayers"]').trigger('click')
    await flushPromises()
    await wrapper.get('button[data-center-engine="cesium"]').trigger('click')
    await flushPromises()
    expect(wrapper.getComponent({ name: 'CesiumCenterStub' }).props('selectedIds')).toEqual(['p-beijing'])
    expect(readyCount).toBe(1)
    wrapper.unmount()
  })

  it('echarts 渲染器启用飞线 effect 并发布地图选择', async () => {
    const region = demoScene.regions[0]
    const fadedRegion = demoScene.regions.find(item => item.status !== region.status)
    expect(fadedRegion).toBeTruthy()

    // jsdom 中元素尺寸恒为 0，而组件只有在容器有实际尺寸时才渲染图表，
    // 因此需要为 clientWidth/clientHeight 打桩
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(960)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(540)

    const wrapper = mount(EchartsGeoCenter, {
      attachTo: document.body,
      props: {
        selectedIds: [region.id],
        focusedId: '',
        filterStatus: region.status,
        theme: 'dark',
        reducedMotion: false,
      },
    })
    await nextTick()

    const chart = wrapper.getComponent({ name: 'VChartStub' })
    const option = chart.props('option') as {
      geo: {
        regions: Array<{
          name: string
          itemStyle: { borderWidth: number, opacity: number }
        }>
      }
      series: Array<{ name: string, effect?: { show?: boolean }, data?: unknown[] }>
    }
    const flightSeries = option.series.find(series => series.name === '实时飞线')
    const selectedGeoRegion = option.geo.regions.find(item => item.name === region.name)
    const fadedGeoRegion = option.geo.regions.find(item => item.name === fadedRegion!.name)
    expect(flightSeries?.effect?.show).toBe(true)
    expect(flightSeries?.data).toHaveLength(demoScene.lines.length)
    expect(selectedGeoRegion?.itemStyle.borderWidth).toBe(1.8)
    expect(selectedGeoRegion?.itemStyle.opacity).toBe(1)
    expect(fadedGeoRegion?.itemStyle.opacity).toBe(0.16)

    chart.vm.$emit('click', { data: { id: region.id } })
    await nextTick()
    expect(wrapper.emitted('select')?.at(-1)).toEqual([region.id])
    wrapper.unmount()
  })
})
