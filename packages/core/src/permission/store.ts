import type { PermissionCheckMode, PermissionRequirement, PermissionStore, PermissionStoreOptions } from './types'
import { shallowRef } from 'vue'
import { hasPermission, hasRole } from './helpers'

/***********************权限状态*********************/
export function createPermissionStore(options: PermissionStoreOptions = {}): PermissionStore {
  const permissions = shallowRef([...(options.permissions ?? [])])
  const roles = shallowRef([...(options.roles ?? [])])

  return {
    get permissions() {
      return [...permissions.value]
    },
    get roles() {
      return [...roles.value]
    },
    clear() {
      permissions.value = []
      roles.value = []
    },
    hasPermission(required?: PermissionRequirement, mode?: PermissionCheckMode) {
      return hasPermission(permissions.value, required, mode)
    },
    hasRole(required?: PermissionRequirement, mode?: PermissionCheckMode) {
      return hasRole(roles.value, required, mode)
    },
    setPermissions(nextPermissions: string[]) {
      permissions.value = [...nextPermissions]
    },
    setRoles(nextRoles: string[]) {
      roles.value = [...nextRoles]
    },
  }
}
