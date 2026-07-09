export type MenuNodeId = string

export type LumaRouteAuthority = string | string[]

export interface LumaRouteMeta {
  title?: string
  icon?: string
  order?: number
  hideInMenu?: boolean
  hideChildrenInMenu?: boolean
  activeMenu?: string
  keepAlive?: boolean
  affixTab?: boolean
  authority?: LumaRouteAuthority
  roles?: LumaRouteAuthority
  [key: string]: unknown
}

export interface LumaMenuRecord {
  path: string
  children?: LumaMenuRecord[]
  component?: string
  meta?: LumaRouteMeta
  name?: string
  redirect?: string
}

export interface MenuNode {
  id: MenuNodeId
  path: string
  title: string
  children?: MenuNode[]
  component?: string
  icon?: string
  keepAlive?: boolean
  meta?: Record<string, unknown>
  name?: string
  order?: number
  parentId?: MenuNodeId
  permissions?: string[]
  redirect?: string
  roles?: string[]
  visible?: boolean
}

export interface NormalizedMenuNode extends Omit<MenuNode, 'children' | 'parentId'> {
  authority: string[]
  children: NormalizedMenuNode[]
  meta: Record<string, unknown>
  name: string
  permissions: string[]
  redirect?: string
  roles: string[]
  keepAlive?: boolean
  visible: boolean
}

export type RouteComponentResolver = (component: string) => unknown

export interface CreateRouteRecordsOptions {
  componentResolver?: RouteComponentResolver
}

export interface LumaRouteRecord {
  path: string
  children?: LumaRouteRecord[]
  component?: unknown
  redirect?: string
  meta: {
    authority?: string[]
    permissions: string[]
    roles: string[]
    title: string
    [key: string]: unknown
  }
  name: string
}

export interface SidebarMenuItem {
  path: string
  title: string
  children: SidebarMenuItem[]
  icon?: string
}

export interface CreateSidebarMenusOptions {
  hasPermission?: (permissions: string[]) => boolean
  hasRole?: (roles: string[]) => boolean
}

export interface FindAccessibleMenuOptions {
  hasPermission?: (permissions: string[]) => boolean
  hasRole?: (roles: string[]) => boolean
}
