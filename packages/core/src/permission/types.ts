import type { Directive } from 'vue'

export type PermissionRequirement = string | string[] | null | undefined

export type PermissionCheckMode = 'every' | 'some'

export interface PermissionStoreOptions {
  permissions?: string[]
  roles?: string[]
}

export interface PermissionStore {
  readonly permissions: string[]
  readonly roles: string[]
  clear: () => void
  hasPermission: (required?: PermissionRequirement, mode?: PermissionCheckMode) => boolean
  hasRole: (required?: PermissionRequirement, mode?: PermissionCheckMode) => boolean
  setPermissions: (permissions: string[]) => void
  setRoles: (roles: string[]) => void
}

export interface PermissionDirectiveOptions {
  mode?: PermissionCheckMode
}

export type PermissionDirective = Directive<HTMLElement, PermissionRequirement>

export interface PermissionRouteMeta {
  permission?: PermissionRequirement
  permissions?: PermissionRequirement
  role?: PermissionRequirement
  roles?: PermissionRequirement
  requireLogin?: boolean
  [key: string]: unknown
}

export interface PermissionRouteLike {
  meta?: PermissionRouteMeta
  path?: string
  fullPath?: string
  name?: string | symbol | null
}

/**
 * 守卫返回：true 放行，字符串或位置对象为跳转目标，false 拦截。
 */
export type PermissionGuardResult
  = | boolean
    | string
    | { path: string, query?: Record<string, string>, replace?: boolean }

export interface PermissionRouterLike {
  beforeEach: (
    guard: (to: PermissionRouteLike) => PermissionGuardResult | Promise<PermissionGuardResult>,
  ) => unknown
}

export interface PermissionGuardOptions {
  /** 权限匹配模式，默认 some。 */
  mode?: PermissionCheckMode
  /** 角色匹配模式，默认 some。 */
  roleMode?: PermissionCheckMode
  /** 无权限时的跳转目标。 */
  noAccessRedirect?: string
  /** 免登录白名单路径。 */
  whiteList?: string[]
  /** 登录页路径，默认 `/login`；命中时始终放行。 */
  loginPath?: string
  /** 是否已登录；提供后开启登录守卫。 */
  isAuthenticated?: () => boolean
  /** 未登录跳转登录页时携带的原始路径参数名，默认 `redirect`。 */
  redirectQueryKey?: string
  /** 未显式声明 requireLogin 时是否默认需要登录，默认 false。 */
  requireLoginByDefault?: boolean
}
