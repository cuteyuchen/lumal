/***********************@luma/cockpit 公共入口*********************/
// 汇总类型、注册表、消息、配置、composables 与运行时。
// 注意：Designer 不在此导出，只读驾驶舱应从 @luma/cockpit/runtime 消费，
// 需要编辑能力时再单独从 @luma/cockpit/designer 引入，避免同步加载 Designer。

// 引入基础样式，确保库构建产出 dist/cockpit.css（应用通过 @luma/cockpit/style.css 消费）
import './style/index.scss'

/***********************composables*********************/
export {
  computeCanvasScale,
  useCanvasScale,
  useCockpit,
  useCockpitContext,
} from './composables'

export type {
  CanvasScaleResult,
  UseCockpitOptions,
  UseCockpitReturn,
} from './composables'
/***********************配置*********************/
export {
  COCKPIT_SCHEMA_VERSION,
  createCategory,
  createCockpitId,
  createColumn,
  createContainer,
  createDefaultCockpitConfig,
  createEmptyRegion,
  createPage,
  createWidgetInstance,
  DEFAULT_WEIGHT,
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

export type {
  CockpitMessage,
  CockpitMessageBus,
  CockpitMessageHandler,
  CockpitMessageSubscribeOptions,
} from './messaging/types'
/***********************注册表*********************/
export { createCockpitRegistry } from './registry/createCockpitRegistry'

export type {
  CockpitCenterDefinition,
  CockpitComponentLoader,
  CockpitRegistry,
  CockpitWidgetDefinition,
} from './registry/types'
/***********************运行时*********************/
export {
  LumaCockpit,
  useCockpitRuntimeEnv,
} from './runtime'

export type { CockpitRuntimeEnv } from './runtime'
/***********************类型*********************/
export type {
  CockpitBaseContext,
  CockpitCategoryConfig,
  CockpitCenterContext,
  CockpitCenterInstance,
  CockpitColumnConfig,
  CockpitCombinedDirection,
  CockpitConfig,
  CockpitConfigIssue,
  CockpitConfigIssueLevel,
  CockpitContainerConfig,
  CockpitContainerMode,
  CockpitDesignerSavePayload,
  CockpitPageConfig,
  CockpitRegionConfig,
  CockpitRenderMode,
  CockpitWidgetContext,
  CockpitWidgetInstance,
} from './types'
