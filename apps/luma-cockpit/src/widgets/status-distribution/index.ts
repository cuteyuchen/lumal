import type { CockpitWidgetDefinition } from '@luma/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'status-distribution',
  label: '状态分布',
  group: '示例模块',
  component: Widget,
}
