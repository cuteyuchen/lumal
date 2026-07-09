import type { PermissionCheckMode, PermissionRequirement, PermissionStore, PermissionStoreOptions } from './types'
import { hasPermission, hasRole } from './helpers'

/***********************权限状态*********************/
export function createPermissionStore(options: PermissionStoreOptions = {}): PermissionStore {
  let permissions = [...(options.permissions ?? [])]
  let roles = [...(options.roles ?? [])]

  return {
    get permissions() {
      return [...permissions]
    },
    get roles() {
      return [...roles]
    },
    clear() {
      permissions = []
      roles = []
    },
    hasPermission(required?: PermissionRequirement, mode?: PermissionCheckMode) {
      return hasPermission(permissions, required, mode)
    },
    hasRole(required?: PermissionRequirement, mode?: PermissionCheckMode) {
      return hasRole(roles, required, mode)
    },
    setPermissions(nextPermissions: string[]) {
      permissions = [...nextPermissions]
    },
    setRoles(nextRoles: string[]) {
      roles = [...nextRoles]
    },
  }
}
