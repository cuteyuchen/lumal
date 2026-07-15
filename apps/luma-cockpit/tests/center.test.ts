import type { CockpitCenterContext, CockpitMessage } from '@luma/cockpit'
import { createCockpitMessageBus } from '@luma/cockpit'
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
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
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

    const activeLineMetric = metricSummaries.find(item => item.label === '活跃链路')
    expect(activeLineMetric?.value).toBe(String(demoScene.lines.filter(line => line.status === 'active').length))
    expect(activeLineMetric?.trend).toBe(`共 ${demoScene.lines.length} 条`)
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

    const wrapper = mount(EchartsGeoCenter, {
      props: {
        selectedIds: [region.id],
        focusedId: '',
        filterStatus: region.status,
        theme: 'dark',
        reducedMotion: false,
      },
    })

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
