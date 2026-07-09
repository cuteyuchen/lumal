import type { PermissionGuardOptions, PermissionRouteLike, PermissionRouterLike, PermissionStore } from './types'

/***********************路由守卫*********************/
function canAccessRoute(
  route: PermissionRouteLike,
  store: PermissionStore,
  options: PermissionGuardOptions,
): boolean {
  const meta = route.meta ?? {}
  const permissions = meta.permissions ?? meta.permission
  const roles = meta.roles ?? meta.role

  return store.hasPermission(permissions, options.mode)
    && store.hasRole(roles, options.roleMode)
}

export function setupPermissionGuard(
  router: PermissionRouterLike,
  store: PermissionStore,
  options: PermissionGuardOptions = {},
): void {
  router.beforeEach((to) => {
    if (canAccessRoute(to, store, options)) {
      return true
    }

    return options.noAccessRedirect ?? false
  })
}
