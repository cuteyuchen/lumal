import type { CockpitMessageBus } from '../messaging/types'

/***********************公开配置模型*********************/

export type CockpitSide = 'left' | 'right'

export interface CockpitWidgetInstance {
  id: string
  type: string
  title?: string
}

export interface CockpitGridColumnConfig {
  id: string
  /** 1920 基准画布中的列宽像素。 */
  width: number
}

export interface CockpitGridCellConfig {
  id: string
  /** 未设置时渲染为空槽。 */
  widget?: CockpitWidgetInstance
}

export type CockpitGridRowMode = 'grid' | 'tabs'

export interface CockpitGridRowConfig {
  id: string
  /** 区域内的行高百分比，所有行标准化后恒为 100。 */
  height: number
  mode: CockpitGridRowMode
  /** grid 行按列顺序保存一个单元格。tabs 行为空数组。 */
  cells: CockpitGridCellConfig[]
  /** tabs 行保存同一整行可切换的模块。grid 行为空数组。 */
  widgets: CockpitWidgetInstance[]
  activeWidgetId?: string
}

export interface CockpitRegionConfig {
  columns: CockpitGridColumnConfig[]
  rows: CockpitGridRowConfig[]
}

export interface CockpitLayoutConfig {
  id: string
  title: string
  left: CockpitRegionConfig
  right: CockpitRegionConfig
}

export interface CockpitConfig {
  schemaVersion: number
  id: string
  title: string
  activeLayoutId?: string
  layouts: CockpitLayoutConfig[]
}

/***********************组件运行时协议*********************/

export type CockpitThemeMode = 'light' | 'dark'
export type CockpitRenderMode = 'runtime' | 'design'
// scale：画布内部按等比缩放并居中；vwvh：用视口单位铺满；
// external：画布不自缩放，铺满父容器，缩放交由外层容器（如 @luma/datav 的 LumaFullScreenContainer）承担。
export type CockpitViewportMode = 'scale' | 'vwvh' | 'external'

export type CockpitNodeKind = 'layout' | 'region' | 'column' | 'row' | 'cell' | 'widget'

export interface CockpitNodeSelectPayload {
  kind: CockpitNodeKind
  id: string
  side?: CockpitSide
}

export interface CockpitBaseContext {
  cockpitId: string
  layoutId: string
  instanceId: string
  mode: CockpitRenderMode
  messages: CockpitMessageBus
}

export type CockpitCenterContext = CockpitBaseContext
export type CockpitWidgetContext = CockpitBaseContext

/***********************Designer 事件负载*********************/

export interface CockpitDesignerSavePayload {
  config: CockpitConfig
  /** 本次保存时正在编辑的布局，便于消费方做局部持久化或即时反馈。 */
  layout: CockpitLayoutConfig
}

/***********************配置校验问题*********************/

export type CockpitConfigIssueLevel = 'error' | 'warning'

export interface CockpitConfigIssue {
  level: CockpitConfigIssueLevel
  message: string
  /** 关联到具体结构节点的 id 路径，用于在 Designer 中定位。 */
  path?: string[]
}
