import type { LumaLayoutMode } from '../../theme/types'
import type { LumaLayoutMenuItem } from '../types'

/***********************菜单命中判断*********************/
/**
 * 判断菜单项（含子级）是否覆盖指定路径。
 */
export function includesMenuPath(item: LumaLayoutMenuItem, path: string): boolean {
  if (item.hidden) {
    return false
  }

  if (item.path === path) {
    return true
  }

  return item.children?.some(child => includesMenuPath(child, path)) ?? false
}

export function findMenuItemByPath(
  menus: LumaLayoutMenuItem[],
  path: string,
): LumaLayoutMenuItem | undefined {
  for (const item of menus) {
    if (item.hidden) {
      continue
    }

    if (item.path === path) {
      return item
    }

    const matched = findMenuItemByPath(item.children ?? [], path)
    if (matched) {
      return matched
    }
  }

  return undefined
}

export function findMenuTrailByPath(
  menus: LumaLayoutMenuItem[],
  path: string,
): LumaLayoutMenuItem[] {
  for (const item of menus) {
    if (item.hidden) {
      continue
    }

    if (item.path === path) {
      return [item]
    }

    const childTrail = findMenuTrailByPath(item.children ?? [], path)
    if (childTrail.length > 0) {
      return [item, ...childTrail]
    }
  }

  return []
}

/**
 * 解析菜单项的导航目标：有子级时下钻到首个可导航子项。
 */
export function resolveNavigationTarget(item?: LumaLayoutMenuItem): string {
  if (!item) {
    return ''
  }

  const children = item.children?.filter(child => !child.hidden) ?? []

  if (children.length === 0) {
    return item.path
  }

  return resolveNavigationTarget(children[0])
}

/**
 * 在菜单树中解析与当前路径匹配的顶层菜单路径，用于 mixed-nav 高亮顶部项。
 */
export function resolveActiveTopMenuPath(menus: LumaLayoutMenuItem[], path: string): string {
  const matched = menus.find(item => includesMenuPath(item, path))
  return matched?.path ?? ''
}

/***********************布局拆分*********************/
export interface SplitMenusByLayoutOptions {
  menus: LumaLayoutMenuItem[]
  layout: LumaLayoutMode
  activeTopMenuPath?: string
}

export interface SplitMenusByLayoutResult {
  topMenus: LumaLayoutMenuItem[]
  sidebarMenus: LumaLayoutMenuItem[]
}

/**
 * 按布局模式把完整菜单树拆分为顶部菜单与侧栏菜单：
 * - sidebar-nav：全树进侧栏，无顶部；
 * - top-nav：全树进顶部，无侧栏；
 * - mixed-nav：顶部为顶层项，侧栏为当前激活顶层项的子级。
 */
export function splitMenusByLayout(options: SplitMenusByLayoutOptions): SplitMenusByLayoutResult {
  const { activeTopMenuPath = '', layout } = options
  const menus = options.menus.filter(item => !item.hidden)

  if (layout === 'sidebar-nav') {
    return { sidebarMenus: menus, topMenus: [] }
  }

  if (layout === 'top-nav') {
    return { sidebarMenus: [], topMenus: menus }
  }

  const matchedTop = menus.find(item => item.path === activeTopMenuPath)
    ?? menus.find(item => includesMenuPath(item, activeTopMenuPath))

  return {
    sidebarMenus: matchedTop?.children?.filter(item => !item.hidden) ?? [],
    topMenus: menus,
  }
}
