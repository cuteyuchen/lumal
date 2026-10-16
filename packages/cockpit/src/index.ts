/***********************@lumal/cockpit 公共入口*********************/
// 汇总类型、注册表、消息、配置、composables 与运行时。
// 注意：Designer 不在此导出，只读驾驶舱应从 @lumal/cockpit/runtime 消费，
// 需要编辑能力时再单独从 @lumal/cockpit/designer 引入，避免同步加载 Designer。

// 引入基础样式，确保库构建产出 dist/cockpit.css（应用通过 @lumal/cockpit/style.css 消费）
import './style/index.scss'
import './style/designer-polish.scss'

/***********************composables*********************/
export {
  computeCanvasScale,
  DEFAULT_COCKPIT_AUTO_REFRESH_INTERVAL_MS,
  useCanvasScale,
  useCockpit,
  useCockpitAutoRefresh,
  useCockpitContext,
  useCockpitRefresh,
} from './composables'

export type {
  CanvasScaleResult,
  UseCockpitAutoRefreshOptions,
  UseCockpitAutoRefreshReturn,
  UseCockpitOptions,
  UseCockpitReturn,
} from './composables'
/***********************配置*********************/
export {
  COCKPIT_SCHEMA_VERSION,
  createCockpitId,
  createDefaultCockpitConfig,
  createGridCell,
  createGridColumn,
  createGridRow,
  createLayout,
  createRegion,
  createWidgetInstance,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_REGION_WIDTH,
  DEFAULT_ROW_HEIGHT,
  equalizeRegionColumns,
  migrateCockpitConfig,
  needsMigration,
  normalizeCockpitConfig,
  prepareCockpitConfig,
  validateCockpitConfig,
} from './config'

export type {
  CockpitMigration,
  CockpitValidationResult,
} from './config'
/***********************消息总线*********************/
export { createCockpitMessageBus } from './messaging/createCockpitMessageBus'
export { COCKPIT_REFRESH_TOPIC } from './messaging/topics'

export type {
  CockpitRefreshPayload,
} from './messaging/topics'
export type {
  CockpitMessage,
  CockpitMessageBus,
  CockpitMessageBusOptions,
  CockpitMessageHandler,
  CockpitMessageSubscribeOptions,
} from './messaging/types'
/***********************注册表*********************/
export { createCockpitRegistry } from './registry/createCockpitRegistry'

export type {
  CockpitComponentLoader,
  CockpitRegistry,
  CockpitWidgetDefinition,
} from './registry/types'
/***********************运行时*********************/
export {
  LumalCockpit,
  LumalCockpitCard,
  useCockpitRuntimeEnv,
} from './runtime'

export type {
  CockpitCardComponent,
  CockpitCardProps,
  CockpitCardTab,
  CockpitRuntimeEnv,
} from './runtime'
/***********************类型*********************/
export type {
  CockpitBaseContext,
  CockpitCenterContext,
  CockpitConfig,
  CockpitConfigIssue,
  CockpitConfigIssueLevel,
  CockpitDesignerSavePayload,
  CockpitGridCellConfig,
  CockpitGridColumnConfig,
  CockpitGridRowConfig,
  CockpitGridRowMode,
  CockpitLayoutConfig,
  CockpitNodeKind,
  CockpitNodeSelectPayload,
  CockpitRegionConfig,
  CockpitRenderMode,
  CockpitSide,
  CockpitThemeMode,
  CockpitViewportMode,
  CockpitWidgetContext,
  CockpitWidgetInstance,
} from './types'
