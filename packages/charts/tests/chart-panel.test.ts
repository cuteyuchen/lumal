import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { compileString } from 'sass-embedded'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LumalChartPanel } from '../src'

describe('lumal chart panel', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('数字高度与面板宽度统一按设计宽度换算，切换视图不叠乘', async () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1440 })
    const wrapper = mount(LumalChartPanel, { props: { height: 144, chartWidth: 720, tableWidth: 360 }, slots: { chart: '图表', table: '表格' } })
    expect(wrapper.get('.lumal-chart-panel__body').attributes('style')).toContain('height: 10vw')
    expect(wrapper.attributes('style')).toContain('--lumal-chart-panel-chart-width: 50vw')
    await wrapper.setProps({ view: 'table' })
    expect(wrapper.get('.lumal-chart-panel__body').attributes('style')).toContain('height: 10vw')
    expect(wrapper.attributes('style')).toContain('--lumal-chart-panel-table-width: 25vw')
    expect(wrapper.classes()).not.toContain('is-responsive')
    wrapper.unmount()
  })
  it('两种视图实际消费各自宽度变量，并受父容器宽度约束', async () => {
    const source = readFileSync(resolve(process.cwd(), 'src/LumalChartPanel.vue'), 'utf8')
    const scss = source.match(/<style scoped lang="scss">([\s\S]*?)<\/style>/)![1]!
    const style = document.createElement('style')
    style.textContent = compileString(scss).css
    document.head.append(style)
    const wrapper = mount(LumalChartPanel, {
      attachTo: document.body,
      props: { chartWidth: 560, tableWidth: '75%' },
      slots: { chart: '<div>chart</div>', table: '<table />' },
    })
    try {
      const body = wrapper.get('.lumal-chart-panel__body').element
      expect((wrapper.element as HTMLElement).style.getPropertyValue('--lumal-chart-panel-chart-width')).toBe('560px')
      expect(getComputedStyle(body).width).toBe('var(--lumal-chart-panel-chart-width, 100%)')
      expect(getComputedStyle(body).maxWidth).toBe('100%')
      await wrapper.setProps({ view: 'table' })
      expect((wrapper.element as HTMLElement).style.getPropertyValue('--lumal-chart-panel-table-width')).toBe('75%')
      expect(getComputedStyle(body).width).toBe('var(--lumal-chart-panel-table-width, 100%)')
      expect(getComputedStyle(body).maxWidth).toBe('100%')
    }
    finally {
      wrapper.unmount()
      style.remove()
    }
  })

  it('loading 时展示加载状态，不渲染图表', () => {
    const wrapper = mount(LumalChartPanel, {
      global: {
        stubs: { LumalChart: true, VChart: true },
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
    const wrapper = mount(LumalChartPanel, {
      global: {
        stubs: { LumalChart: true, VChart: true },
      },
      props: {
        emptyText: '暂无数据',
        noData: true,
      },
    })

    expect(wrapper.text()).toContain('暂无数据')
  })

  it('支持查询区、表格视图和导出事件', async () => {
    const onExport = vi.fn()
    const wrapper = mount(LumalChartPanel, {
      global: {
        stubs: { LumalChart: true, VChart: true },
      },
      props: {
        options: {},
        showExport: true,
        showViewToggle: true,
        summary: '最近七天共 120 次访问',
        onExport,
      },
      slots: {
        query: '<label>统计周期</label>',
        table: '<table><tbody><tr><td>120</td></tr></tbody></table>',
      },
    })

    expect(wrapper.text()).toContain('统计周期')
    expect(wrapper.get('.lumal-chart-panel__summary').text()).toContain('120 次访问')
    await wrapper.findAll('.lumal-chart-panel__view-toggle button')[1]!.trigger('click')
    expect(wrapper.text()).toContain('120')
    await wrapper.get('.lumal-chart-panel__actions > button').trigger('click')
    expect(onExport).toHaveBeenCalledWith('table')
  })

  it('错误状态可以触发重试', async () => {
    const onRetry = vi.fn()
    const wrapper = mount(LumalChartPanel, {
      props: {
        error: new Error('服务暂不可用'),
        onRetry,
      },
    })

    expect(wrapper.get('[role="alert"]').text()).toContain('服务暂不可用')
    await wrapper.get('[role="alert"] button').trigger('click')
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
