import type { CockpitWidgetDefinition } from '@lumal/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'capacity-monitor',
  label: '区域容量态势',
  group: '地图联动',
  component: Widget,
}
