import type { CockpitMessage, CockpitWidgetContext } from '@luma/cockpit'
import { createCockpitMessageBus } from '@luma/cockpit'
import { LumaDigitalFlop, LumaPercentPond, LumaScrollBoard, LumaScrollRankingBoard } from '@luma/datav'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { demoEvents, demoScene, metricSummaries, statusDistribution, trendSeries } from '../src/data/demo-scene'
import { cockpitTopics } from '../src/messages/topics'
import EventList from '../src/widgets/event-list/Widget.vue'
import MetricSummary from '../src/widgets/metric-summary/Widget.vue'
import RegionRanking from '../src/widgets/region-ranking/Widget.vue'
import StatusDistribution from '../src/widgets/status-distribution/Widget.vue'
import TrendPanel from '../src/widgets/trend-panel/Widget.vue'

const widgetMocks = vi.hoisted(() => ({
  context: undefined as CockpitWidgetContext | undefined,
}))

vi.mock('@luma/cockpit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@luma/cockpit')>()
  return {
    ...actual,
    useCockpitContext: () => widgetMocks.context,
  }
})

// 用轻量 stub 替换 @luma/datav 的 LumaCharts，避免测试中初始化真实 ECharts。
// stub 暴露 option 与 events，便于断言配置与模拟图表交互。
vi.mock('@luma/datav', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@luma/datav')>()
  // 在工厂内部按需引入 vue 辅助函数：@luma/datav 是静态导入，其 mock 工厂会
  // 早于顶部的 vue import 求值，直接引用 defineComponent/h 会触发 TDZ。
  const { defineComponent: define, h: createElement } = await import('vue')
  return {
    ...actual,
    LumaCharts: define({
      name: 'LumaChartsStub',
      inheritAttrs: false,
      props: {
        option: { type: Object, required: true },
        events: { type: Object, default: () => ({}) },
      },
      setup() {
        return () => createElement('div', { class: 'luma-charts-stub' })
      },
    }),
  }
})

function createContext(): CockpitWidgetContext {
  return {
    cockpitId: 'test-cockpit',
    layoutId: 'layout-overview',
    instanceId: 'test-widget',
    mode: 'runtime',
    messages: createCockpitMessageBus(),
  }
}

describe('驾驶舱数据模块', () => {
  const originalMatchMedia = window.matchMedia
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

  beforeEach(() => {
    widgetMocks.context = createContext()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    widgetMocks.context = undefined
  })

  it('趋势图使用 ECharts 并通过图例和曲线发布状态筛选', async () => {
    const filters: CockpitMessage[] = []
    widgetMocks.context!.messages.subscribe(cockpitTopics.sceneFilterChange, message => filters.push(message))
    const wrapper = mount(TrendPanel)
    const chart = wrapper.getComponent({ name: 'LumaChartsStub' })
    const option = chart.props('option') as { series: Array<{ name: string, type: string }> }

    expect(option.series).toHaveLength(trendSeries.length)
    expect(option.series.every(item => item.type === 'line')).toBe(true)
    await wrapper.get('button[data-status="active"]').trigger('click')
    expect(filters.at(-1)?.payload).toEqual({ status: 'active' })

    const trendEvents = chart.props('events') as { click: (params: unknown) => void }
    trendEvents.click({ seriesName: '待关注' })
    await nextTick()
    expect(filters.at(-1)?.payload).toEqual({ status: 'watch' })

    widgetMocks.context!.messages.publish({
      topic: cockpitTopics.sceneSelectionChange,
      sourceId: 'center',
      payload: { ids: ['p-beijing'] },
    })
    await nextTick()
    expect(wrapper.get('.trend-panel__summary span').text()).toContain('北京枢纽')
    expect(wrapper.get('.trend-panel__summary strong').text()).toBe('96')
    wrapper.unmount()
  })

  it('状态环图使用 ECharts 并可点击扇区筛选中央地图', async () => {
    const filters: CockpitMessage[] = []
    widgetMocks.context!.messages.subscribe(cockpitTopics.sceneFilterChange, message => filters.push(message))
    const wrapper = mount(StatusDistribution)
    const chart = wrapper.getComponent({ name: 'LumaChartsStub' })
    const option = chart.props('option') as {
      series: Array<{ type: string, data: Array<{ status: string, value: number }> }>
    }

    expect(option.series[0]?.type).toBe('pie')
    expect(option.series[0]?.data).toHaveLength(statusDistribution.length)
    expect(option.series[0]?.data.reduce((sum, item) => sum + item.value, 0)).toBe(demoScene.regions.length)

    const statusEvents = chart.props('events') as { click: (params: unknown) => void }
    statusEvents.click({ data: { status: 'active' } })
    await nextTick()
    expect(filters.at(-1)?.payload).toEqual({ status: 'active' })
    wrapper.unmount()
  })

  it('事件和区域表格接入自动滚动并保留地图双向选择', async () => {
    const pointFocus: CockpitMessage[] = []
    widgetMocks.context!.messages.subscribe(cockpitTopics.scenePointFocus, message => pointFocus.push(message))
    const eventWrapper = mount(EventList)
    expect(eventWrapper.getComponent(LumaScrollBoard).props('rows')).toHaveLength(demoEvents.length)
    await eventWrapper.get('.event-list__row').trigger('click')
    expect(pointFocus.at(-1)?.payload).toEqual({ id: demoEvents[0]?.targetId })
    eventWrapper.unmount()

    widgetMocks.context = createContext()
    const regionFocus: CockpitMessage[] = []
    widgetMocks.context.messages.subscribe(cockpitTopics.sceneRegionFocus, message => regionFocus.push(message))
    const rankingWrapper = mount(RegionRanking)
    const sortedRegions = [...demoScene.regions].sort((a, b) => b.value - a.value)
    expect(rankingWrapper.getComponent(LumaScrollRankingBoard).props('items')).toHaveLength(demoScene.regions.length)
    await rankingWrapper.get('.region-ranking__scroll button').trigger('click')
    expect(regionFocus.at(-1)?.payload).toEqual({ id: sortedRegions[0]?.id })

    widgetMocks.context.messages.publish({
      topic: cockpitTopics.sceneSelectionChange,
      sourceId: 'center',
      payload: { ids: [sortedRegions[0]!.id] },
    })
    await nextTick()
    expect(rankingWrapper.get(`button[data-region-id="${sortedRegions[0]!.id}"]`).attributes('aria-pressed')).toBe('true')
    rankingWrapper.unmount()
  })

  it('指标摘要使用数值数据并区分翻牌与百分比展示', () => {
    const wrapper = mount(MetricSummary)
    const digitalValues = wrapper.findAllComponents(LumaDigitalFlop)
    const percentValues = wrapper.findAllComponents(LumaPercentPond)

    expect(metricSummaries.every(item => typeof item.value === 'number')).toBe(true)
    expect(digitalValues).toHaveLength(metricSummaries.filter(item => item.visual === 'digital').length)
    expect(percentValues).toHaveLength(metricSummaries.filter(item => item.visual === 'percent').length)
    expect(percentValues.map(component => component.props('value'))).toEqual(
      metricSummaries.filter(item => item.visual === 'percent').map(item => item.value),
    )
    wrapper.unmount()
  })
})
