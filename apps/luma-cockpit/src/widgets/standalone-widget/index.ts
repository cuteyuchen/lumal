import type { CockpitWidgetDefinition } from '@luma/cockpit'

export const widgetDefinition: CockpitWidgetDefinition = {
  type: 'standalone-widget',
  label: '独立业务模块',
  group: 'standalone-group',
  component: () => import('./Widget.vue'),
}
