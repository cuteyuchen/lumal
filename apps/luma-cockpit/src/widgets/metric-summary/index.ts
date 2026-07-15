import type { CockpitWidgetDefinition } from '@luma/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'metric-summary',
  label: '指标摘要',
  group: '示例模块',
  component: Widget,
}
