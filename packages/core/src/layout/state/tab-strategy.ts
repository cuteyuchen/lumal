import type { LumaLayoutTabItem } from '../types'

export interface AppendTabOptions {
  /** 最大标签数，0 表示不限制。 */
  maxCount?: number
}

/***********************分组工具*********************/
/** 固定标签始终排在左侧，且不会被批量关闭或最大数量淘汰。 */
export function sortTabsByPinned(tabs: LumaLayoutTabItem[]): LumaLayoutTabItem[] {
  return [...tabs].sort((a, b) => {
    const ap = a.pinned === true ? 1 : 0
    const bp = b.pinned === true ? 1 : 0
    return bp - ap
  })
}

/***********************追加与裁剪*********************/
/**
 * 追加标签页并按策略裁剪：
 * - 已存在同路径则不重复添加；
 * - 超过 maxCount 时，从最早的可关闭非固定标签开始移除（保留固定标签和当前活动标签）。
 */
export function appendTab(
  tabs: LumaLayoutTabItem[],
  tab: LumaLayoutTabItem,
  options: AppendTabOptions = {},
): LumaLayoutTabItem[] {
  const exists = tabs.some(item => item.path === tab.path)
  const nextTabs = exists ? [...tabs] : [...tabs, tab]
  const maxCount = options.maxCount ?? 0

  if (maxCount <= 0 || nextTabs.length <= maxCount) {
    return nextTabs
  }

  const result = [...nextTabs]

  while (result.length > maxCount) {
    // 优先淘汰最早的、可关闭的、非固定的、非当前活动标签。
    const removableIndex = result.findIndex(
      item => item.closable !== false && item.pinned !== true && item.path !== tab.path,
    )

    if (removableIndex === -1) {
      // 保护固定标签和当前活动标签：允许暂时超限。
      break
    }

    result.splice(removableIndex, 1)
  }

  return result
}

/**
 * 降低最大标签数时淘汰最早的普通标签，保护固定标签和当前活动标签；
 * 受保护标签数量超过限制时允许暂时超限。
 */
export function clampTabCount(
  tabs: LumaLayoutTabItem[],
  maxCount: number,
  activePath: string,
): LumaLayoutTabItem[] {
  if (maxCount <= 0 || tabs.length <= maxCount) {
    return [...tabs]
  }

  const result = [...tabs]

  while (result.length > maxCount) {
    const removableIndex = result.findIndex(
      item => item.closable !== false && item.pinned !== true && item.path !== activePath,
    )

    if (removableIndex === -1) {
      break
    }

    result.splice(removableIndex, 1)
  }

  return result
}

/***********************单页与批量关闭*********************/
/** 关闭指定标签，返回新标签列表；不可关闭或固定的标签会被忽略。 */
export function closeTab(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  return tabs.filter(
    item => !(item.path === path && item.closable !== false && item.pinned !== true),
  )
}

export function closeTabsLeft(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  const index = tabs.findIndex(tab => tab.path === path)
  if (index <= 0) {
    return [...tabs]
  }

  return tabs.filter(
    (tab, currentIndex) => currentIndex >= index || tab.closable === false || tab.pinned === true,
  )
}

export function closeTabsRight(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  const index = tabs.findIndex(tab => tab.path === path)
  if (index === -1 || index >= tabs.length - 1) {
    return [...tabs]
  }

  return tabs.filter(
    (tab, currentIndex) => currentIndex <= index || tab.closable === false || tab.pinned === true,
  )
}

export function closeOtherTabs(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  return tabs.filter(tab => tab.path === path || tab.closable === false || tab.pinned === true)
}

export function closeAllTabs(tabs: LumaLayoutTabItem[]): LumaLayoutTabItem[] {
  // 至少保留固定标签；没有固定标签时保留首个标签。
  const pinned = tabs.filter(tab => tab.closable === false || tab.pinned === true)
  if (pinned.length > 0) {
    return pinned
  }
  return tabs.length > 0 ? [tabs[0]!] : []
}

/***********************固定/取消固定*********************/
/**
 * 固定标签：将指定标签置为 pinned=true 并移到左侧固定组。
 * 路由声明 closable=false 的标签原本就不可关闭，等价于永久固定。
 */
export function pinTab(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  let found = false
  const next = tabs.map(tab => {
    if (tab.path === path) {
      found = true
      return { ...tab, pinned: true }
    }
    return tab
  })

  return found ? sortTabsByPinned(next) : next
}

/**
 * 取消固定：仅当标签是用户可取消固定的（非路由声明 closable=false）时才取消。
 */
export function unpinTab(tabs: LumaLayoutTabItem[], path: string): LumaLayoutTabItem[] {
  let found = false
  const next = tabs.map(tab => {
    if (tab.path === path && tab.closable !== false) {
      found = true
      return { ...tab, pinned: false }
    }
    return tab
  })

  // 取消固定后保持顺序，不重新排序，避免视觉跳动。
  return found ? next : next
}

/** 标签是否为路由声明的永久固定标签（不可取消固定）。 */
export function isPermanentlyPinned(tab: LumaLayoutTabItem): boolean {
  return tab.closable === false
}

/** 标签是否可被用户取消固定。 */
export function canUnpinTab(tab: LumaLayoutTabItem): boolean {
  return tab.pinned === true && tab.closable !== false
}

/** 标签是否可被用户固定（非永久固定且当前未固定）。 */
export function canPinTab(tab: LumaLayoutTabItem): boolean {
  return tab.pinned !== true && tab.closable !== false
}

/***********************访问历史*********************/
const MAX_VISIT_HISTORY = 50

export interface VisitHistoryOptions {
  /** 历史最大条数，默认 50。 */
  maxCount?: number
}

/** 记录一条访问历史，去重（最新路径置顶），最多保留 maxCount 条（默认 50）。 */
export function pushVisitHistory(
  history: string[],
  path: string,
  options: VisitHistoryOptions = {},
): string[] {
  if (!path) {
    return [...history]
  }

  const maxCount = options.maxCount ?? MAX_VISIT_HISTORY
  const next = [path, ...history.filter(item => item !== path)]

  return next.slice(0, Math.max(1, maxCount))
}

/**
 * 选择关闭活动标签后应跳转的标签：
 * - 开启访问历史时，返回最近访问且仍存在的标签；
 * - 否则优先进入右侧标签，再回退左侧。
 */
export function resolveNextActivePath(
  tabs: LumaLayoutTabItem[],
  closedPath: string,
  history: string[] = [],
  options: { useHistory?: boolean } = {},
): string {
  if (tabs.length === 0) {
    return ''
  }

  if (options.useHistory && history.length > 0) {
    const tabPaths = new Set(tabs.map(tab => tab.path))
    for (const visited of history) {
      if (visited === closedPath) {
        continue
      }
      if (tabPaths.has(visited)) {
        return visited
      }
    }
  }

  const closedIndex = tabs.findIndex(tab => tab.path === closedPath)
  // closeTab 已执行后传入的 tabs 不再包含 closedPath，使用近似策略：
  // 取剩余列表中靠近原位置的右侧标签，再回退到左侧，最后兜底首个标签。
  const fallbackIndex = closedIndex === -1 ? 0 : closedIndex
  return tabs[fallbackIndex]?.path ?? tabs[0]?.path ?? ''
}

/***********************拖拽排序*********************/
/**
 * 在固定组和普通组内重排标签。固定与普通标签不能跨组拖动：
 * - 若 fromPinned 且 !toPinned，或 !fromPinned 且 toPinned，则不移动（跨组拒绝）。
 * 同组内按目标位置插入。
 */
export function reorderTab(
  tabs: LumaLayoutTabItem[],
  fromPath: string,
  toPath: string,
): LumaLayoutTabItem[] {
  const fromIndex = tabs.findIndex(tab => tab.path === fromPath)
  const toIndex = tabs.findIndex(tab => tab.path === toPath)

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return [...tabs]
  }

  const fromPinned = tabs[fromIndex]!.pinned === true
  const toPinned = tabs[toIndex]!.pinned === true

  if (fromPinned !== toPinned) {
    return [...tabs]
  }

  const next = [...tabs]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) {
    return next
  }
  next.splice(toIndex, 0, moved)
  return next
}

/***********************标签缓存 keepAlive 名单*********************/
/** 仅当开启缓存时返回需要缓存的路径集合。 */
export function resolveCachedTabPaths(
  tabs: LumaLayoutTabItem[],
  options: { enable?: boolean } = {},
): string[] {
  if (options.enable === false) {
    return []
  }

  return tabs.map(tab => tab.path)
}
