import type { CockpitWidgetDefinition } from '@lumal/cockpit'
import Widget from './Widget.vue'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'node-pulse',
  label: '重点节点脉冲',
  group: '地图联动',
  component: Widget,
}
