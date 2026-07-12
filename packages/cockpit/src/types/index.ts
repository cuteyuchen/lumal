import type { CockpitMessageBus } from '../messaging/types'

/***********************公开配置模型*********************/

export interface CockpitCenterInstance {
  id: string
  type: string
}

export interface CockpitWidgetInstance {
  id: string
  type: string
  title?: string
  visible?: boolean
}

export type CockpitContainerMode = 'single' | 'combined' | 'tabs'
export type CockpitCombinedDirection = 'horizontal' | 'vertical'

export interface CockpitContainerConfig {
  id: string
  /** 正数高度权重，运行时按同级归一化，不存储像素 */
  height: number
  mode: CockpitContainerMode
  /** 仅 combined 模式使用 */
  direction?: CockpitCombinedDirection
  /** 仅 tabs 模式使用；不存在时回退到第一个可见模块 */
  activeWidgetId?: string
  widgets: CockpitWidgetInstance[]
}

export interface CockpitColumnConfig {
  id: string
  /** 正数宽度权重，运行时按同级归一化 */
  width: number
  /** 可选高度权重 */
  height?: number
  containers: CockpitContainerConfig[]
}

export interface CockpitRegionConfig {
  /** 1920 基准画布像素；空区域为 0，非空区域默认 420 */
  width?: number
  columns: CockpitColumnConfig[]
}

export interface CockpitPageConfig {
  id: string
  title: string
  order?: number
  center?: CockpitCenterInstance
  left: CockpitRegionConfig
  right: CockpitRegionConfig
}

export interface CockpitCategoryConfig {
  id: string
  label: string
  icon?: string
  order?: number
  visible?: boolean
  activePageId?: string
  pages: CockpitPageConfig[]
}

export interface CockpitConfig {
  schemaVersion: number
  id: string
  title: string
  activeCategoryId?: string
  categories: CockpitCategoryConfig[]
}

/***********************组件运行时协议*********************/

export type CockpitThemeMode = 'light' | 'dark'
export type CockpitRenderMode = 'runtime' | 'design'

export type CockpitNodeKind = 'region' | 'column' | 'container' | 'widget' | 'center'

export interface CockpitNodeSelectPayload {
  kind: CockpitNodeKind
  id: string
  side?: 'left' | 'right'
}

export interface CockpitBaseContext {
  cockpitId: string
  categoryId: string
  pageId: string
  instanceId: string
  mode: CockpitRenderMode
  messages: CockpitMessageBus
}

export type CockpitCenterContext = CockpitBaseContext
export type CockpitWidgetContext = CockpitBaseContext

/***********************Designer 事件负载*********************/

export interface CockpitDesignerSavePayload {
  config: CockpitConfig
}

/***********************配置校验问题*********************/

export type CockpitConfigIssueLevel = 'error' | 'warning'

export interface CockpitConfigIssue {
  level: CockpitConfigIssueLevel
  message: string
  /** 关联到具体结构节点的 id 路径，用于在 Designer 中定位 */
  path?: string[]
}
