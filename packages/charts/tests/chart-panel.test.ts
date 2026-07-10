import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumaChartPanel } from '../src'

describe('luma chart panel', () => {
  it('loading 时展示加载状态，不渲染图表', () => {
    const wrapper = mount(LumaChartPanel, {
      global: {
        stubs: { LumaChart: true, VChart: true },
      },
      props: {
        loading: true,
        title: '访问趋势',
      },
    })

    expect(wrapper.text()).toContain('访问趋势')
    expect(wrapper.text()).toContain('加载中')
  })

  it('noData 时展示空状态文案', () => {
    const wrapper = mount(LumaChartPanel, {
      global: {
        stubs: { LumaChart: true, VChart: true },
      },
      props: {
        emptyText: '暂无数据',
        noData: true,
      },
    })

    expect(wrapper.text()).toContain('暂无数据')
  })
})
