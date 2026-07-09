import type { DirectiveBinding } from 'vue'
import type { PermissionDirective, PermissionDirectiveOptions, PermissionRequirement, PermissionStore } from './types'

/***********************权限指令*********************/
function updateElementVisible(
  element: HTMLElement,
  binding: DirectiveBinding<PermissionRequirement>,
  store: PermissionStore,
  options: PermissionDirectiveOptions,
): void {
  element.style.display = store.hasPermission(binding.value, options.mode) ? '' : 'none'
}

export function createPermissionDirective(
  store: PermissionStore,
  options: PermissionDirectiveOptions = {},
): PermissionDirective {
  return {
    mounted(element, binding) {
      updateElementVisible(element, binding, store, options)
    },
    updated(element, binding) {
      updateElementVisible(element, binding, store, options)
    },
  }
}
