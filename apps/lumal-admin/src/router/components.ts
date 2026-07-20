import type { RouteRecordRaw } from 'vue-router'

/***********************组件映射*********************/
// 全部页面组件改为动态 import，交由 Vite 拆分独立 chunk，避免首包吞下所有视图。
const routeComponents: Record<string, () => Promise<unknown>> = {
  'dashboard/index': () => import('../views/dashboard/DashboardView.vue'),
  'examples/chart': () => import('../views/examples/ChartView.vue'),
  'examples/chart-panel': () => import('../views/examples/ChartPanelView.vue'),
  'examples/composables': () => import('../views/examples/ComposablesView.vue'),
  'examples/crud-table': () => import('../views/examples/CrudTableView.vue'),
  'examples/dictionary': () => import('../views/examples/DictionaryView.vue'),
  'examples/info-reference': () => import('../views/examples/InfoReferenceView.vue'),
  'examples/overview': () => import('../views/examples/OverviewView.vue'),
  'examples/page-layout': () => import('../views/examples/PageLayoutView.vue'),
  'examples/schema-form': () => import('../views/examples/SchemaFormView.vue'),
  'examples/schema-table': () => import('../views/examples/SchemaTableView.vue'),
  'examples/services': () => import('../views/examples/ServicesView.vue'),
  'examples/theme-settings': () => import('../views/examples/ThemeSettingsView.vue'),
  'examples/utils': () => import('../views/examples/UtilsView.vue'),
  'profile/index': () => import('../views/profile/ProfileView.vue'),
  'project/index': () => import('../views/project/ProjectView.vue'),
  'shared/external-frame': () => import('../views/shared/ExternalFrameView.vue'),
  'system/config': () => import('../views/system/ConfigView.vue'),
  'system/dict': () => import('../views/system/DictionaryTypeView.vue'),
  'system/dict-item': () => import('../views/system/DictionaryItemView.vue'),
  'system/menu': () => import('../views/system/MenuView.vue'),
  'system/organization': () => import('../views/system/OrganizationView.vue'),
  'system/role': () => import('../views/system/RoleView.vue'),
  'system/user': () => import('../views/system/UserView.vue'),
}

/***********************组件解析*********************/
export function resolveRouteComponent(component: string): RouteRecordRaw['component'] | undefined {
  return routeComponents[component] as RouteRecordRaw['component'] | undefined
}
