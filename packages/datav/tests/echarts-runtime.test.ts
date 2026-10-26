import type { EChartsOption } from 'echarts'
import { flushPromises, mount } from '@vue/test-utils'
import { getInstanceByDom, setPlatformAPI } from 'echarts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LumalCharts from '../src/components/LumalCharts.vue'

/***********************真实 ECharts 运行时*********************/
// SVG 渲染不依赖 Canvas，在 Node 中验证 DataV 的 ECharts 6 扩展入口。
setPlatformAPI({
  measureText: text => ({ width: String(text).length * 7 }),
})

const option: EChartsOption = {
  animation: false,
  xAxis: { type: 'category', data: ['Monday', 'Tuesday'] },
  yAxis: { type: 'value' },
  series: [{ id: 'visits', type: 'bar', data: [12, 24] }],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('echarts 6 runtime', () => {
  it('静态图表的首帧渲染也通知已配置的事件监听器', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(480)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(240)
    const finished = vi.fn()
    const rendered = vi.fn()
    const wrapper = mount(LumalCharts, {
      attachTo: document.body,
      props: {
        autoResize: false,
        events: { finished, rendered },
        initOptions: { renderer: 'svg' },
        option,
      },
    })

    try {
      await flushPromises()
      expect(wrapper.get('svg').attributes('width')).toBe('480')
      expect(rendered).toHaveBeenCalled()
      expect(finished).toHaveBeenCalled()
    }
    finally {
      wrapper.unmount()
    }
  })

  it('真实渲染、更新并在卸载时销毁 ECharts 实例', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(480)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(240)

    const wrapper = mount(LumalCharts, {
      attachTo: document.body,
      props: {
        autoResize: false,
        initOptions: { renderer: 'svg' },
        option,
        setOptionOptions: { notMerge: true },
      },
    })

    try {
      await flushPromises()
      const chart = getInstanceByDom(wrapper.get('.lumal-charts__host').element as HTMLElement)!

      expect(wrapper.get('svg').attributes('width')).toBe('480')
      expect(wrapper.text()).toContain('Monday')
      expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
      expect(chart.isDisposed()).toBeFalsy()

      await wrapper.setProps({
        option: {
          ...option,
          series: [{ id: 'visits', type: 'bar', data: [6, 10] }],
        },
      })
      await flushPromises()
      const series = chart.getOption().series as Array<{ data: number[] }>
      expect(series[0]!.data).toEqual([6, 10])

      wrapper.unmount()
      expect(chart.isDisposed()).toBe(true)
    }
    finally {
      if (wrapper.exists())
        wrapper.unmount()
    }
  })
})
