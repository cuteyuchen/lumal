import type { PermissionStore } from '@lumal/core/permission'
import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@lumal/core/permission'
import { watchEffect } from 'vue'

/** Vben 5 使用交集判断，空条件不授权；不复用原生空条件放行语义。 */
export function useAccess(store: PermissionStore = usePermissionStore()) {
  return {
    hasAccessByCodes: (codes: string[]) => codes.length > 0 && store.hasPermission(codes, 'some'),
    hasAccessByRoles: (roles: string[]) => roles.length > 0 && store.hasRole(roles, 'some'),
  }
}

export function createVbenAccessDirective(
  store: PermissionStore,
  accessMode: 'backend' | 'frontend' = 'frontend',
): Directive<HTMLElement, string | string[]> {
  const cleanups = new WeakMap<HTMLElement, () => void>()
  function bind(element: HTMLElement, binding: DirectiveBinding<string | string[]>): void {
    cleanups.get(element)?.()
    const display = element.style.display
    const stop = watchEffect(() => {
      const value = binding.value
      const codes = Array.isArray(value) ? value : [value]
      if (binding.arg && !['role', 'code'].includes(binding.arg))
        throw new Error('[lumal/v5] v-access 仅支持 code/role')
      const access = useAccess(store)
      const allowed = value == null || (accessMode === 'frontend' && binding.arg === 'role'
        ? access.hasAccessByRoles(codes)
        : access.hasAccessByCodes(codes))
      element.style.display = allowed ? display : 'none'
    })
    cleanups.set(element, () => {
      stop()
      element.style.display = display
    })
  }
  return {
    mounted: bind,
    updated: bind,
    unmounted(element) {
      cleanups.get(element)?.()
      cleanups.delete(element)
    },
  }
}
