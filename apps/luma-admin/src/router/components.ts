import type { RouteRecordRaw } from 'vue-router'
import DashboardView from '../views/dashboard/DashboardView.vue'
import ForbiddenView from '../views/error/ForbiddenView.vue'
import ChartPanelView from '../views/examples/ChartPanelView.vue'
import ChartView from '../views/examples/ChartView.vue'
import ComposablesView from '../views/examples/ComposablesView.vue'
import CrudTableView from '../views/examples/CrudTableView.vue'
import DictionaryView from '../views/examples/DictionaryView.vue'
import InfoReferenceView from '../views/examples/InfoReferenceView.vue'
import OverviewView from '../views/examples/OverviewView.vue'
import PageLayoutView from '../views/examples/PageLayoutView.vue'
import SchemaFormView from '../views/examples/SchemaFormView.vue'
import SchemaTableView from '../views/examples/SchemaTableView.vue'
import ServicesView from '../views/examples/ServicesView.vue'
import ThemeSettingsView from '../views/examples/ThemeSettingsView.vue'
import UtilsView from '../views/examples/UtilsView.vue'
import ProjectView from '../views/project/ProjectView.vue'
import ConfigView from '../views/system/ConfigView.vue'
import DictView from '../views/system/DictView.vue'
import MenuView from '../views/system/MenuView.vue'
import RoleView from '../views/system/RoleView.vue'
import UserView from '../views/system/UserView.vue'

/***********************组件映射*********************/
const routeComponents: Record<string, RouteRecordRaw['component']> = {
  'dashboard/index': DashboardView,
  'error/forbidden': ForbiddenView,
  'examples/chart': ChartView,
  'examples/chart-panel': ChartPanelView,
  'examples/composables': ComposablesView,
  'examples/crud-table': CrudTableView,
  'examples/dictionary': DictionaryView,
  'examples/info-reference': InfoReferenceView,
  'examples/overview': OverviewView,
  'examples/page-layout': PageLayoutView,
  'examples/schema-form': SchemaFormView,
  'examples/schema-table': SchemaTableView,
  'examples/services': ServicesView,
  'examples/theme-settings': ThemeSettingsView,
  'examples/utils': UtilsView,
  'project/index': ProjectView,
  'system/config': ConfigView,
  'system/dict': DictView,
  'system/menu': MenuView,
  'system/role': RoleView,
  'system/user': UserView,
}

/***********************组件解析*********************/
export function resolveRouteComponent(component: string): RouteRecordRaw['component'] | undefined {
  return routeComponents[component]
}
