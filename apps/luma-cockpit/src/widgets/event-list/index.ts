import type { CockpitWidgetDefinition } from '@luma/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'event-list',
  label: '事件列表',
  group: '示例模块',
  component: Widget,
}
