import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveChartPanelStyle } from '../src'

describe('resolveChartPanelStyle', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('数字宽度使用消费项目设计基准，字符串不被二次转换', () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1440 })
    expect(resolveChartPanelStyle({ chartWidth: 144, tableWidth: '10vw' })).toEqual({
      '--lumal-chart-panel-chart-width': '10vw',
      '--lumal-chart-panel-table-width': '10vw',
    })
  })
  it('会把数值宽度映射为 px CSS 变量', () => {
    expect(resolveChartPanelStyle({ chartWidth: 560, tableWidth: 240 })).toEqual({
      '--lumal-chart-panel-chart-width': '560px',
      '--lumal-chart-panel-table-width': '240px',
    })
  })

  it('会保留字符串宽度值', () => {
    expect(resolveChartPanelStyle({ chartWidth: '65%', tableWidth: '35%' })).toEqual({
      '--lumal-chart-panel-chart-width': '65%',
      '--lumal-chart-panel-table-width': '35%',
    })
  })

  it('空宽度值会被省略以保留样式表默认值', () => {
    expect(resolveChartPanelStyle({ chartWidth: '', tableWidth: undefined })).toBeUndefined()
  })
})
