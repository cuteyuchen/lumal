import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { LumaTabStyle } from '../theme/types'

export interface LumaLayoutMenuItem {
  path: string
  title: string
  children?: LumaLayoutMenuItem[]
  externalLink?: string
  externalTarget?: '_blank' | '_self'
  hidden?: boolean
  icon?: string
}

export interface LumaLayoutTabItem {
  path: string
  title: string
  closable?: boolean
  icon?: string
  /** 是否固定到左侧固定组；用户取消固定可置为 false，路由声明 closable=false 的页签禁止取消固定。 */
  pinned?: boolean
}

export type LumaLayoutRouteTabFilter = (route: RouteLocationNormalizedLoaded) => boolean

export type LumaLayoutRouteTabResolver = (
  route: RouteLocationNormalizedLoaded,
) => LumaLayoutTabItem | undefined

export type { LumaTabStyle }
