import type {
  PermissionGuardOptions,
  PermissionGuardResult,
  PermissionRouteLike,
  PermissionRouterLike,
  PermissionStore,
} from './types'

/***********************路由访问判断*********************/
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

/***********************登录判断*********************/
function shouldRequireLogin(
  route: PermissionRouteLike,
  requireLoginByDefault: boolean,
): boolean {
  const explicit = route.meta?.requireLogin

  if (explicit === false) {
    return false
  }

  if (explicit === true) {
    return true
  }

  return requireLoginByDefault
}

function redirectToLogin(
  route: PermissionRouteLike,
  loginPath: string,
  redirectQueryKey: string,
): PermissionGuardResult {
  const fullPath = route.fullPath ?? route.path

  return {
    path: loginPath,
    query: fullPath ? { [redirectQueryKey]: fullPath } : undefined,
  }
}

/***********************路由守卫*********************/
export function setupPermissionGuard(
  router: PermissionRouterLike,
  store: PermissionStore,
  options: PermissionGuardOptions = {},
): void {
  const whiteList = new Set(options.whiteList ?? [])
  const loginPath = options.loginPath ?? '/login'
  const redirectQueryKey = options.redirectQueryKey ?? 'redirect'
  const requireLoginByDefault = options.requireLoginByDefault ?? false

  router.beforeEach((to) => {
    // 登录页与白名单始终放行
    if (to.path === loginPath || (to.path && whiteList.has(to.path))) {
      return true
    }

    // 仅在提供 isAuthenticated 时开启登录守卫
    if (options.isAuthenticated && shouldRequireLogin(to, requireLoginByDefault)) {
      if (!options.isAuthenticated()) {
        return redirectToLogin(to, loginPath, redirectQueryKey)
      }
    }

    if (canAccessRoute(to, store, options)) {
      return true
    }

    return options.noAccessRedirect ?? false
  })
}
