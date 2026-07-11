import type { RouteLocationNormalizedLoaded } from 'vue-router'

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
}

export type LumaLayoutRouteTabFilter = (route: RouteLocationNormalizedLoaded) => boolean

export type LumaLayoutRouteTabResolver = (
  route: RouteLocationNormalizedLoaded,
) => LumaLayoutTabItem | undefined
