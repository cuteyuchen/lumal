import type { App } from 'vue'
import type { PermissionDirective, PermissionDirectiveOptions, PermissionStore } from '../permission/types'
import { createPermissionDirective } from '../permission/directive'

/***********************权限指令*********************/
/**
 * 创建权限指令（`v-authority`）：无权限时隐藏元素。
 * 复用 permission 模块实现，语义上以 authority 为名，与菜单 authority 字段对齐。
 */
export function createAuthorityDirective(
  store: PermissionStore,
  options: PermissionDirectiveOptions = {},
): PermissionDirective {
  return createPermissionDirective(store, options)
}

/**
 * 一次性注册权限指令，默认注册 `v-authority`，并附带 `v-permission` 兼容别名。
 */
export function registerAuthorityDirectives(
  app: App,
  store: PermissionStore,
  options: PermissionDirectiveOptions = {},
): void {
  const directive = createAuthorityDirective(store, options)
  app.directive('authority', directive)
  app.directive('permission', directive)
}

export { createPermissionDirective }
export type { PermissionDirective, PermissionDirectiveOptions } from '../permission/types'
