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
import {
  COCKPIT_SCHEMA_VERSION,
  createCockpitId,
  DEFAULT_WEIGHT,
} from './defaults'

/***********************工具*********************/

const CONTAINER_MODES: CockpitContainerMode[] = ['single', 'combined', 'tabs']

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toSafeWeight(value: unknown, fallback = DEFAULT_WEIGHT): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num) || num <= 0)
    return fallback
  return num
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function toStringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

/***********************节点标准化*********************/

function normalizeWidget(raw: unknown): CockpitWidgetInstance | null {
  if (!isPlainObject(raw))
    return null
  const type = raw.type
  if (typeof type !== 'string' || type.trim() === '')
    return null
  return {
    id: toStringOr(raw.id, createCockpitId('widget')),
    type,
    title: typeof raw.title === 'string' ? raw.title : undefined,
    visible: raw.visible !== false,
  }
}

function normalizeContainer(raw: unknown): CockpitContainerConfig {
  const source = isPlainObject(raw) ? raw : {}
  const mode: CockpitContainerMode = CONTAINER_MODES.includes(source.mode as CockpitContainerMode)
    ? source.mode as CockpitContainerMode
    : 'single'

  const widgets = toArray(source.widgets)
    .map(normalizeWidget)
    .filter((widget): widget is CockpitWidgetInstance => widget !== null)

  const container: CockpitContainerConfig = {
    id: toStringOr(source.id, createCockpitId('container')),
    height: toSafeWeight(source.height),
    mode,
    widgets,
  }

  // single 模式仅保留第一个可见模块可见，其余强制不可见
  if (mode === 'single') {
    let seenVisible = false
    container.widgets = widgets.map((widget) => {
      const isVisible = widget.visible !== false
      if (isVisible && !seenVisible) {
        seenVisible = true
        return { ...widget, visible: true }
      }
      return { ...widget, visible: false }
    })
  }

  if (mode === 'combined') {
    container.direction = source.direction === 'vertical' ? 'vertical' : 'horizontal'
  }

  if (mode === 'tabs') {
    const visibleWidgets = widgets.filter(widget => widget.visible !== false)
    const requested = typeof source.activeWidgetId === 'string' ? source.activeWidgetId : undefined
    const exists = requested !== undefined && visibleWidgets.some(widget => widget.id === requested)
    container.activeWidgetId = exists ? requested : visibleWidgets[0]?.id
  }

  return container
}

function normalizeColumn(raw: unknown): CockpitColumnConfig {
  const source = isPlainObject(raw) ? raw : {}
  const column: CockpitColumnConfig = {
    id: toStringOr(source.id, createCockpitId('column')),
    width: toSafeWeight(source.width),
    containers: toArray(source.containers).map(normalizeContainer),
  }
  if (source.height !== undefined)
    column.height = toSafeWeight(source.height)
  return column
}

function normalizeRegion(raw: unknown): CockpitRegionConfig {
  const source = isPlainObject(raw) ? raw : {}
  return {
    columns: toArray(source.columns).map(normalizeColumn),
  }
}

function normalizePage(raw: unknown): CockpitPageConfig {
  const source = isPlainObject(raw) ? raw : {}
  const page: CockpitPageConfig = {
    id: toStringOr(source.id, createCockpitId('page')),
    title: toStringOr(source.title, '未命名页面'),
    left: normalizeRegion(source.left),
    right: normalizeRegion(source.right),
  }
  if (typeof source.order === 'number' && Number.isFinite(source.order))
    page.order = source.order
  if (isPlainObject(source.center) && typeof source.center.type === 'string' && source.center.type.trim() !== '') {
    page.center = {
      id: toStringOr(source.center.id, createCockpitId('center')),
      type: source.center.type,
    }
  }
  return page
}

function normalizeCategory(raw: unknown): CockpitCategoryConfig {
  const source = isPlainObject(raw) ? raw : {}
  const pages = toArray(source.pages).map(normalizePage)
  const category: CockpitCategoryConfig = {
    id: toStringOr(source.id, createCockpitId('category')),
    label: toStringOr(source.label, '未命名分类'),
    visible: source.visible !== false,
    pages,
  }
  if (typeof source.icon === 'string')
    category.icon = source.icon
  if (typeof source.order === 'number' && Number.isFinite(source.order))
    category.order = source.order

  const requestedPage = typeof source.activePageId === 'string' ? source.activePageId : undefined
  const pageExists = requestedPage !== undefined && pages.some(page => page.id === requestedPage)
  category.activePageId = pageExists ? requestedPage : pages[0]?.id
  return category
}

/***********************配置标准化入口*********************/

/**
 * 将任意来源的配置对象标准化为安全、可渲染、JSON 可序列化的 CockpitConfig。
 * 缺失字段补齐安全默认值，非法权重归一，activeId 失效时回退到第一个可用项。
 */
export function normalizeCockpitConfig(raw: unknown): CockpitConfig {
  const source = isPlainObject(raw) ? raw : {}
  const categories = toArray(source.categories).map(normalizeCategory)

  const schemaVersion = typeof source.schemaVersion === 'number' && Number.isFinite(source.schemaVersion)
    ? source.schemaVersion
    : COCKPIT_SCHEMA_VERSION

  const config: CockpitConfig = {
    schemaVersion,
    id: toStringOr(source.id, createCockpitId('cockpit')),
    title: toStringOr(source.title, '驾驶舱'),
    categories,
  }

  const visibleCategories = categories.filter(category => category.visible !== false)
  const requested = typeof source.activeCategoryId === 'string' ? source.activeCategoryId : undefined
  const exists = requested !== undefined && visibleCategories.some(category => category.id === requested)
  config.activeCategoryId = exists ? requested : (visibleCategories[0]?.id ?? categories[0]?.id)

  return config
}
