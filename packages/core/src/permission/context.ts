import type { InjectionKey } from 'vue'
import type { PermissionStore } from './types'
import { inject, provide } from 'vue'

export const permissionStoreKey: InjectionKey<PermissionStore> = Symbol('luma-permission-store')

export function providePermissionStore(store: PermissionStore): PermissionStore {
  provide(permissionStoreKey, store)
  return store
}

export function usePermissionStore(): PermissionStore {
  const store = inject(permissionStoreKey, undefined)

  if (!store) {
    throw new Error('[Luma] PermissionStore 未注入，请先调用 providePermissionStore 或传入 createLumaAdmin.permissionStore。')
  }

  return store
}
