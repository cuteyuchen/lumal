import type { App } from 'vue'
import LumaChartComp from './LumaChart.vue'
import LumaChartPanelComp from './LumaChartPanel.vue'

/***********************组件安装包装*********************/
type WithInstall<T> = T & { install: (app: App) => void }

function withInstall<T extends Record<string, unknown>>(component: T, name: string): WithInstall<T> {
  const installable = component as WithInstall<T>

  installable.install = function install(app: App): void {
    app.component(name, component as never)
  }

  return installable
}

/***********************导出*********************/
export const LumaChart = withInstall(LumaChartComp as unknown as Record<string, unknown>, 'LumaChart') as typeof LumaChartComp & { install: (app: App) => void }
export const LumaChartPanel = withInstall(LumaChartPanelComp as unknown as Record<string, unknown>, 'LumaChartPanel') as typeof LumaChartPanelComp & { install: (app: App) => void }

export {
  resolveChartPanelStyle,
} from './panel-style'
export type {
  ChartPanelStyle,
  ChartPanelWidth,
} from './panel-style'
export {
  useChartResize,
} from './useChartResize'
export type {
  ChartResizeTarget,
  UseChartResizeOptions,
} from './useChartResize'
