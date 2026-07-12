import type {
  CockpitCategoryConfig,
  CockpitColumnConfig,
  CockpitConfig,
  CockpitContainerConfig,
  CockpitContainerMode,
  CockpitPageConfig,
  CockpitRegionConfig,
  CockpitWidgetInstance,
} from '../types'

/***********************常量*********************/

/** 当前配置 schema 版本 */
export const COCKPIT_SCHEMA_VERSION = 2

/** 安全默认权重 */
export const DEFAULT_WEIGHT = 1

/** 1920 基准画布下，非空左右区域默认宽度 */
export const DEFAULT_REGION_WIDTH = 420

/** Designer 与标准化共同采用的左右区域宽度边界 */
export const MIN_REGION_WIDTH = 240
export const MAX_REGION_WIDTH = 720

/** 1920 基准画布下保留给中央区域的最小宽度 */
export const MIN_CENTER_WIDTH = 480

/***********************ID 生成*********************/

let idCounter = 0

/**
 * 生成在整个驾驶舱内足够唯一的 id。
 * 结合前缀、时间戳、自增计数与随机段，避免同一 tick 内碰撞。
 */
export function createCockpitId(prefix = 'ck'): string {
  idCounter += 1
  const time = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${time}-${idCounter.toString(36)}-${rand}`
}

/***********************工厂函数*********************/

export function createWidgetInstance(type: string, title?: string): CockpitWidgetInstance {
  return {
    id: createCockpitId('widget'),
    type,
    title,
    visible: true,
  }
}

export function createContainer(mode: CockpitContainerMode = 'single'): CockpitContainerConfig {
  return {
    id: createCockpitId('container'),
    height: DEFAULT_WEIGHT,
    mode,
    widgets: [],
  }
}

export function createColumn(): CockpitColumnConfig {
  return {
    id: createCockpitId('column'),
    width: DEFAULT_WEIGHT,
    containers: [],
  }
}

export function createEmptyRegion(): CockpitRegionConfig {
  return { width: 0, columns: [] }
}

export function createPage(title = '新页面'): CockpitPageConfig {
  return {
    id: createCockpitId('page'),
    title,
    left: createEmptyRegion(),
    right: createEmptyRegion(),
  }
}

export function createCategory(label = '新分类'): CockpitCategoryConfig {
  const page = createPage('页面 1')
  return {
    id: createCockpitId('category'),
    label,
    visible: true,
    activePageId: page.id,
    pages: [page],
  }
}

/**
 * 创建一个可安全渲染的空驾驶舱配置。
 * 名称保持中性，不包含任何行业术语。
 */
export function createDefaultCockpitConfig(id = createCockpitId('cockpit')): CockpitConfig {
  const category = createCategory('分类 1')
  return {
    schemaVersion: COCKPIT_SCHEMA_VERSION,
    id,
    title: '驾驶舱',
    activeCategoryId: category.id,
    categories: [category],
  }
}
