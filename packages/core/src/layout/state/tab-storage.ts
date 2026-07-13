import type { LumaLayoutTabItem } from '../types'

/***********************快照结构*********************/
export const TAB_SNAPSHOT_VERSION = 1
export const DEFAULT_MAX_VISIT_HISTORY = 50

export interface TabSnapshot {
  v: number
  tabs: Array<Pick<LumaLayoutTabItem, 'closable' | 'icon' | 'path' | 'pinned' | 'title'>>
  history: string[]
}

export interface TabSnapshotStorage {
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

export interface RestoreContext {
  /** 路由声明的永久固定标签（closable=false）。 */
  fixedTabs: LumaLayoutTabItem[]
  /** 当前路由路径，始终会被合并入恢复结果。 */
  currentPath: string
  /** 当前路由生成的标签补充信息。 */
  currentTab?: LumaLayoutTabItem
  /** 过滤无效或隐藏路由的判断函数。 */
  isValidPath?: (path: string) => boolean
  /** 刷新标题和图标的解析器。 */
  resolveTab?: (path: string) => Partial<LumaLayoutTabItem> | undefined
}

export interface PersistContext {
  tabs: LumaLayoutTabItem[]
  history: string[]
  maxHistory?: number
}

/***********************序列化/反序列化*********************/
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSerializableTab(value: unknown): value is TabSnapshot['tabs'][number] {
  if (!isRecord(value)) {
    return false
  }
  return typeof value.path === 'string' && typeof value.title === 'string'
}

export function serializeTabSnapshot(context: PersistContext): TabSnapshot {
  const maxHistory = Math.max(1, context.maxHistory ?? DEFAULT_MAX_VISIT_HISTORY)
  const history = context.history.slice(0, maxHistory)

  return {
    v: TAB_SNAPSHOT_VERSION,
    tabs: context.tabs.map(tab => ({
      closable: tab.closable,
      icon: tab.icon,
      path: tab.path,
      pinned: tab.pinned === true,
      title: tab.title,
    })),
    history,
  }
}

/**
 * 尝试从存储读取并解析标签快照。
 * 存储损坏或版本不符时返回 undefined，调用方应回退为固定页签加当前页。
 */
export function deserializeTabSnapshot(raw: string | null): TabSnapshot | undefined {
  if (!raw) {
    return undefined
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  }
  catch {
    return undefined
  }

  if (!isRecord(parsed) || parsed.v !== TAB_SNAPSHOT_VERSION || !Array.isArray(parsed.tabs)) {
    return undefined
  }

  if (!Array.isArray(parsed.history) || !parsed.history.every(item => typeof item === 'string')) {
    return undefined
  }

  const tabs = parsed.tabs.filter(isSerializableTab)
  return {
    v: TAB_SNAPSHOT_VERSION,
    tabs,
    history: parsed.history as string[],
  }
}

/***********************存储读写*********************/
export function writeTabSnapshot(
  storage: TabSnapshotStorage,
  storageKey: string,
  snapshot: TabSnapshot,
): boolean {
  try {
    storage.setItem(storageKey, JSON.stringify(snapshot))
    return true
  }
  catch {
    return false
  }
}

export function readTabSnapshot(
  storage: TabSnapshotStorage,
  storageKey: string,
): TabSnapshot | undefined {
  let raw: string | null = null
  try {
    raw = storage.getItem(storageKey)
  }
  catch {
    return undefined
  }

  const snapshot = deserializeTabSnapshot(raw)
  if (!raw) {
    return undefined
  }

  // 存在但损坏时清除。
  if (!snapshot) {
    try {
      storage.removeItem(storageKey)
    }
    catch {
      // ignore
    }
    return undefined
  }

  return snapshot
}

export function clearTabSnapshot(storage: TabSnapshotStorage, storageKey: string): void {
  try {
    storage.removeItem(storageKey)
  }
  catch {
    // ignore
  }
}

/***********************恢复合并*********************/
/**
 * 恢复时合并路由固定页签、过滤无效或隐藏路由、刷新标题和图标，
 * 并始终补入当前路由。存储损坏或不可用时退化为固定页签加当前页。
 */
export function restoreTabsFromSnapshot(
  snapshot: TabSnapshot | undefined,
  context: RestoreContext,
): { tabs: LumaLayoutTabItem[], history: string[] } {
  const fixedTabs = context.fixedTabs.map(tab => ({ ...tab, pinned: true, closable: false }))
  const fixedPaths = new Set(fixedTabs.map(tab => tab.path))
  const isValid = context.isValidPath ?? (() => true)

  const fromSnapshot: LumaLayoutTabItem[] = []

  if (snapshot) {
    for (const item of snapshot.tabs) {
      if (!item.path || !isValid(item.path)) {
        continue
      }
      if (fixedPaths.has(item.path)) {
        continue // 固定标签以路由声明为准
      }
      const refreshed = context.resolveTab?.(item.path) ?? {}
      fromSnapshot.push({
        closable: item.closable !== false,
        icon: item.icon,
        path: item.path,
        pinned: item.pinned === true,
        title: item.title,
        ...refreshed,
      })
    }
  }

  let tabs: LumaLayoutTabItem[] = [...fixedTabs, ...fromSnapshot]

  // 始终补入当前路由。
  if (context.currentPath) {
    const refreshed = context.resolveTab?.(context.currentPath) ?? {}
    const currentEntry: LumaLayoutTabItem = {
      closable: true,
      icon: refreshed.icon,
      path: context.currentPath,
      pinned: false,
      title: refreshed.title ?? context.currentTab?.title ?? context.currentPath,
      ...(context.currentTab ?? {}),
      ...refreshed,
    }
    if (!fixedPaths.has(context.currentPath)) {
      const exists = tabs.some(tab => tab.path === context.currentPath)
      if (!exists) {
        tabs = [...tabs, currentEntry]
      }
    }
  }

  // 按固定状态排序：固定组在左侧。
  tabs = [...tabs].sort((a, b) => {
    const ap = a.pinned === true ? 1 : 0
    const bp = b.pinned === true ? 1 : 0
    return bp - ap
  })

  const history = snapshot?.history ?? []
  return { tabs, history }
}
