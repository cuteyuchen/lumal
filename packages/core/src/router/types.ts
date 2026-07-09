export type MenuNodeId = string

export interface MenuNode {
  id: MenuNodeId
  path: string
  title: string
  children?: MenuNode[]
  component?: string
  icon?: string
  meta?: Record<string, unknown>
  name?: string
  order?: number
  parentId?: MenuNodeId
  permissions?: string[]
  roles?: string[]
  visible?: boolean
}

export interface NormalizedMenuNode extends Omit<MenuNode, 'children' | 'parentId'> {
  children: NormalizedMenuNode[]
  meta: Record<string, unknown>
  name: string
  permissions: string[]
  roles: string[]
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
  meta: {
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

export interface FindAccessibleMenuOptions {
  hasPermission?: (permissions: string[]) => boolean
  hasRole?: (roles: string[]) => boolean
}
