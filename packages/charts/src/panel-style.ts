import type { CSSProperties } from 'vue'

/***********************面板尺寸变量*********************/
export type ChartPanelWidth = number | string

export type ChartPanelStyle = CSSProperties & {
  '--luma-chart-panel-chart-width'?: string
  '--luma-chart-panel-table-width'?: string
}

function toCssSize(value: ChartPanelWidth | undefined): string | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `${value}px` : undefined
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  return undefined
}

/**
 * 把图表区/表格区宽度映射为 CSS 变量；空值省略以保留样式表默认值。
 */
export function resolveChartPanelStyle(options: {
  chartWidth?: ChartPanelWidth
  tableWidth?: ChartPanelWidth
}): ChartPanelStyle | undefined {
  const chartWidth = toCssSize(options.chartWidth)
  const tableWidth = toCssSize(options.tableWidth)
  const style: ChartPanelStyle = {}

  if (chartWidth) {
    style['--luma-chart-panel-chart-width'] = chartWidth
  }

  if (tableWidth) {
    style['--luma-chart-panel-table-width'] = tableWidth
  }

  return Object.keys(style).length > 0 ? style : undefined
}
