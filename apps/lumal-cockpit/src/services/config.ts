import type { CockpitConfig, CockpitSide, CockpitWidgetInstance } from '@lumal/cockpit'
import { COCKPIT_SCHEMA_VERSION, prepareCockpitConfig } from '@lumal/cockpit'

/***********************独立应用配置与保存实现*********************/

const STORAGE_KEY = 'lumal-cockpit:config'
const INTERACTIVE_WIDGET_MIGRATION_KEY = 'lumal-cockpit:interactive-widgets-v1'

const defaultConfig: CockpitConfig = {
  schemaVersion: 3,
  id: 'standalone-cockpit',
  title: '全国智慧运行态势',
  activeLayoutId: 'layout-overview',
  layouts: [
    {
      id: 'layout-overview',
      title: '综合态势',
      left: {
        width: 420,
        columns: [{ id: 'left-overview-column', width: 420 }],
        rows: [
          {
            id: 'left-overview-summary',
            height: 42,
            mode: 'grid',
            widgets: [],
            cells: [{ id: 'left-overview-summary-cell', widget: { id: 'w-metric-summary-a', type: 'metric-summary', title: '核心运行指标' } }],
          },
          {
            id: 'left-overview-tabs',
            height: 58,
            mode: 'tabs',
            cells: [],
            activeWidgetId: 'w-trend-main',
            widgets: [
              { id: 'w-trend-main', type: 'trend-panel', title: '近七日运行趋势' },
              { id: 'w-status-tabs', type: 'status-distribution', title: '区域状态分布' },
              { id: 'w-capacity-overview', type: 'capacity-monitor', title: '区域容量态势' },
            ],
          },
        ],
      },
      right: {
        width: 420,
        columns: [{ id: 'right-overview-column', width: 420 }],
        rows: [
          {
            id: 'right-overview-events',
            height: 50,
            mode: 'grid',
            widgets: [],
            cells: [{ id: 'right-overview-events-cell', widget: { id: 'w-event-list', type: 'event-list', title: '实时告警动态' } }],
          },
          {
            id: 'right-overview-tabs',
            height: 50,
            mode: 'tabs',
            cells: [],
            activeWidgetId: 'w-region-ranking',
            widgets: [
              { id: 'w-region-ranking', type: 'region-ranking', title: '区域运行指数' },
              { id: 'w-metric-summary-b', type: 'metric-summary', title: '重点节点概览' },
              { id: 'w-node-pulse-overview', type: 'node-pulse', title: '重点节点脉冲' },
            ],
          },
        ],
      },
    },
    {
      id: 'layout-analysis',
      title: '运行分析',
      left: {
        width: 420,
        columns: [{ id: 'left-analysis-column', width: 420 }],
        rows: [
          {
            id: 'left-analysis-tabs',
            height: 100,
            mode: 'tabs',
            cells: [],
            activeWidgetId: 'w-trend-analysis',
            widgets: [
              { id: 'w-trend-analysis', type: 'trend-panel', title: '运行趋势对比' },
              { id: 'w-status-analysis', type: 'status-distribution', title: '区域状态分布' },
              { id: 'w-capacity-analysis', type: 'capacity-monitor', title: '区域容量态势' },
            ],
          },
        ],
      },
      right: {
        width: 420,
        columns: [{ id: 'right-analysis-column', width: 420 }],
        rows: [
          {
            id: 'right-analysis-tabs',
            height: 100,
            mode: 'tabs',
            cells: [],
            activeWidgetId: 'w-region-ranking-analysis',
            widgets: [
              { id: 'w-region-ranking-analysis', type: 'region-ranking', title: '区域运行指数' },
              { id: 'w-event-list-analysis', type: 'event-list', title: '实时告警动态' },
              { id: 'w-node-pulse-analysis', type: 'node-pulse', title: '重点节点脉冲' },
            ],
          },
        ],
      },
    },
  ],
}

interface InteractiveWidgetTarget {
  layoutId: string
  rowId: string
  side: CockpitSide
  widget: CockpitWidgetInstance
}

const interactiveWidgetTargets: InteractiveWidgetTarget[] = [
  {
    layoutId: 'layout-overview',
    rowId: 'left-overview-tabs',
    side: 'left',
    widget: { id: 'w-capacity-overview', type: 'capacity-monitor', title: '区域容量态势' },
  },
  {
    layoutId: 'layout-overview',
    rowId: 'right-overview-tabs',
    side: 'right',
    widget: { id: 'w-node-pulse-overview', type: 'node-pulse', title: '重点节点脉冲' },
  },
  {
    layoutId: 'layout-analysis',
    rowId: 'left-analysis-tabs',
    side: 'left',
    widget: { id: 'w-capacity-analysis', type: 'capacity-monitor', title: '区域容量态势' },
  },
  {
    layoutId: 'layout-analysis',
    rowId: 'right-analysis-tabs',
    side: 'right',
    widget: { id: 'w-node-pulse-analysis', type: 'node-pulse', title: '重点节点脉冲' },
  },
]

function cloneConfig(config: CockpitConfig): CockpitConfig {
  return JSON.parse(JSON.stringify(config)) as CockpitConfig
}

function addInteractiveWidgets(source: CockpitConfig): CockpitConfig {
  const config = cloneConfig(source)
  for (const target of interactiveWidgetTargets) {
    const layout = config.layouts.find(item => item.id === target.layoutId)
    const row = layout?.[target.side].rows.find(item => item.id === target.rowId)
    if (!row || row.mode !== 'tabs')
      continue
    if (!row.widgets.some(widget => widget.type === target.widget.type))
      row.widgets.push({ ...target.widget })
  }
  return prepareCockpitConfig(config)
}

function migrateInteractiveWidgets(config: CockpitConfig): CockpitConfig {
  if (typeof localStorage === 'undefined')
    return addInteractiveWidgets(config)
  if (localStorage.getItem(INTERACTIVE_WIDGET_MIGRATION_KEY) === '1')
    return config

  const migrated = addInteractiveWidgets(config)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
  localStorage.setItem(INTERACTIVE_WIDGET_MIGRATION_KEY, '1')
  return migrated
}

export function loadStandaloneState(): { config: CockpitConfig, warning: string } {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { schemaVersion?: unknown }
        if (parsed.schemaVersion === COCKPIT_SCHEMA_VERSION)
          return { config: migrateInteractiveWidgets(prepareCockpitConfig(parsed)), warning: '' }
        throw new Error('配置版本不匹配')
      }
    }
  }
  catch {
    // 保留原存档以便排错；仅显式保存或恢复默认时覆盖，不静默销毁用户配置。
    return { config: addInteractiveWidgets(defaultConfig), warning: '本地配置无法读取，已使用默认布局。可重新保存或恢复默认配置。' }
  }
  return { config: addInteractiveWidgets(defaultConfig), warning: '' }
}

export function loadStandaloneConfig(): CockpitConfig {
  return loadStandaloneState().config
}

export function resetStandaloneConfig(): CockpitConfig {
  return saveStandaloneConfig(addInteractiveWidgets(defaultConfig))
}

export function saveStandaloneConfig(config: CockpitConfig): CockpitConfig {
  const normalized = prepareCockpitConfig(config)
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}
