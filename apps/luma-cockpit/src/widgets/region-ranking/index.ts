import type { CockpitWidgetDefinition } from '@luma/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'region-ranking',
  label: '区域排名',
  group: '示例模块',
  component: Widget,
}
