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
  externalLink?: string
  topMenu?: boolean
  [key: string]: unknown
}

export interface LumaMenuRecord {
  path: string
  children?: LumaMenuRecord[]
  component?: string
  meta?: LumaRouteMeta
  name?: string
  redirect?: string
  externalLink?: string
}

/**
 * 非标准菜单记录：字段名由后端决定，需要通过 fieldNames 显式映射到标准字段。
 */
export type LumaMenuInputRecord = LumaMenuRecord | Record<string, unknown>

/**
 * 标准字段 -> 源字段名的映射，用于适配非标准后端菜单结构。
 * 未配置的字段回退到标准字段位置（顶层或 meta）。
 */
export interface MenuRecordFieldNames {
  path?: string
  name?: string
  component?: string
  redirect?: string
  children?: string
  title?: string
  icon?: string
  order?: string
  authority?: string
  roles?: string
  hideInMenu?: string
  keepAlive?: string
  externalLink?: string
}

export interface NormalizeMenuRecordsOptions {
  fieldNames?: MenuRecordFieldNames
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
  externalLink?: string
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
  externalLink?: string
}

export type RouteComponentResolver = (component: string) => unknown

/**
 * glob 组件 resolver 选项：把标准 component 字符串解析为 import.meta.glob 收集到的组件模块。
 */
export interface GlobComponentResolverOptions {
  /** import.meta.glob 收集的模块表，key 为相对路径，value 为动态导入函数。 */
  modules: Record<string, () => Promise<unknown>>
  /** 视图目录前缀，默认 `../views`，与候选路径拼接。 */
  viewsPrefix?: string
  /** 未命中任何候选路径时的兜底组件。 */
  fallback?: () => Promise<unknown>
}

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
    externalLink?: string
    [key: string]: unknown
  }
  name: string
}

export interface SidebarMenuItem {
  path: string
  title: string
  children: SidebarMenuItem[]
  icon?: string
  externalLink?: string
}

export interface CreateSidebarMenusOptions {
  hasPermission?: (permissions: string[]) => boolean
  hasRole?: (roles: string[]) => boolean
}

/**
 * 顶部菜单生成选项：在侧边菜单可访问过滤的基础上，仅保留标记为顶部菜单（meta.topMenu）的一级项。
 */
export type CreateTopMenusOptions = CreateSidebarMenusOptions

export interface FindAccessibleMenuOptions {
  hasPermission?: (permissions: string[]) => boolean
  hasRole?: (roles: string[]) => boolean
}

/**
 * vue-router 的最小子集，避免在类型层强依赖 vue-router 具体版本。
 */
export interface RouteRegistryRouterLike {
  addRoute: (route: LumaRouteRecord) => (() => void) | unknown
  hasRoute: (name: string) => boolean
  removeRoute: (name: string) => void
}

/**
 * 动态路由注册器：负责注册后端下发的动态路由并支持整体重置。
 */
export interface RouteRegistry {
  register: (routes: LumaRouteRecord[]) => void
  reset: () => void
  readonly names: readonly string[]
}
