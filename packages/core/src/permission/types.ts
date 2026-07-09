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
}

export interface PermissionRouteLike {
  meta?: PermissionRouteMeta
}

export interface PermissionRouterLike {
  beforeEach: (
    guard: (to: PermissionRouteLike) => boolean | Promise<boolean | string> | string,
  ) => unknown
}

export interface PermissionGuardOptions {
  mode?: PermissionCheckMode
  noAccessRedirect?: string
  roleMode?: PermissionCheckMode
}
