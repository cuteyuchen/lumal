import type { EChartsOption } from 'echarts'
import { flushPromises, mount } from '@vue/test-utils'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { getInstanceByDom, setPlatformAPI, use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { INIT_OPTIONS_KEY } from 'vue-echarts'
import LumalChart from '../src/LumalChart.vue'

/***********************真实图表运行时*********************/
// 使用 SVG 和确定性的文字宽度，在 Node 中验证升级后的实际运行时，无需浏览器或 Canvas。
use([SVGRenderer, GridComponent, BarChart, LineChart])
setPlatformAPI({
  measureText: text => ({ width: String(text).length * 7 }),
})

const option: EChartsOption = {
  xAxis: { type: 'category', data: ['Monday', 'Tuesday'] },
  yAxis: { type: 'value' },
  series: [
    { id: 'visits', type: 'bar', data: [12, 24] },
    { id: 'trend', type: 'line', data: [8, 18] },
  ],
}

function mountChart() {
  return mount(LumalChart, {
    props: { animation: false, autoResize: false, options: option },
    global: {
      provide: {
        [INIT_OPTIONS_KEY]: { renderer: 'svg', width: 480, height: 240 },
      },
    },
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('echarts 6 / vue-echarts 8 runtime', () => {
  it('保留 option 动画配置，透传真实图表事件且不启用重复尺寸监听', async () => {
    const onClick = vi.fn()
    const addListener = vi.spyOn(window, 'addEventListener')
    const wrapper = mount(LumalChart, {
      props: { options: { ...option, animation: false }, autoResize: false },
      attrs: { onClick, class: 'consumer-chart' },
      global: { provide: { [INIT_OPTIONS_KEY]: { renderer: 'svg', width: 480, height: 240 } } },
    })
    try {
      await flushPromises()
      const chart = getInstanceByDom(wrapper.get('.echarts-host').element as HTMLElement)!
      expect(chart.getOption().animation).toBe(false)
      expect(wrapper.classes()).toContain('consumer-chart')
      await wrapper.trigger('click')
      expect(onClick).not.toHaveBeenCalled()
      // 通过引擎事件接口模拟命中数据点，验证收到的不是根节点 MouseEvent。
      chart.trigger('click', { seriesIndex: 0, dataIndex: 1, name: 'Tuesday' })
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Tuesday', dataIndex: 1 }))
      expect(addListener.mock.calls.filter(([type]) => type === 'resize')).toHaveLength(0)
      await wrapper.setProps({ animation: true })
      expect(chart.getOption().animation).toBe(true)
    }
    finally {
      wrapper.unmount()
    }
  })

  it('按需注册后实际渲染 SVG，并在卸载时销毁实例', async () => {
    const wrapper = mountChart()
    try {
      await flushPromises()
      const chart = getInstanceByDom(wrapper.get('.echarts-host').element as HTMLElement)!

      expect(wrapper.get('svg').attributes('width')).toBe('480')
      expect(wrapper.text()).toContain('Monday')
      expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
      expect(chart.getOption().series).toHaveLength(2)
      expect(chart.isDisposed()).toBeFalsy()

      wrapper.unmount()
      expect(chart.isDisposed()).toBe(true)
    }
    finally {
      if (wrapper.exists())
        wrapper.unmount()
    }
  })

  it('响应式更新删除系列时不会保留旧系列', async () => {
    const wrapper = mountChart()
    try {
      await flushPromises()
      await wrapper.setProps({
        options: {
          ...option,
          series: [{ id: 'visits', type: 'bar', data: [6, 10] }],
        },
      })
      await flushPromises()

      const chart = getInstanceByDom(wrapper.get('.echarts-host').element as HTMLElement)!
      const series = chart.getOption().series as Array<{ id: string }>
      expect(series).toHaveLength(1)
      expect(series[0]!.id).toBe('visits')
    }
    finally {
      wrapper.unmount()
    }
  })

  it('继续支持显式 setOption 更新参数', async () => {
    const wrapper = mountChart()
    try {
      await flushPromises()
      await wrapper.setProps({
        options: {
          ...option,
          series: [{ id: 'replacement', type: 'line', data: [3, 5] }],
        },
        updateOptions: { notMerge: true },
      })
      await flushPromises()

      const chart = getInstanceByDom(wrapper.get('.echarts-host').element as HTMLElement)!
      const series = chart.getOption().series as Array<{ id: string }>
      expect(series).toHaveLength(1)
      expect(series[0]!.id).toBe('replacement')
    }
    finally {
      wrapper.unmount()
    }
  })
})
