import { describe, expect, it } from 'vitest'
import { resolveChartPanelStyle } from '../src'

describe('resolveChartPanelStyle', () => {
  it('会把数值宽度映射为 px CSS 变量', () => {
    expect(resolveChartPanelStyle({ chartWidth: 560, tableWidth: 240 })).toEqual({
      '--luma-chart-panel-chart-width': '560px',
      '--luma-chart-panel-table-width': '240px',
    })
  })

  it('会保留字符串宽度值', () => {
    expect(resolveChartPanelStyle({ chartWidth: '65%', tableWidth: '35%' })).toEqual({
      '--luma-chart-panel-chart-width': '65%',
      '--luma-chart-panel-table-width': '35%',
    })
  })

  it('空宽度值会被省略以保留样式表默认值', () => {
    expect(resolveChartPanelStyle({ chartWidth: '', tableWidth: undefined })).toBeUndefined()
  })
})
