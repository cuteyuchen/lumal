<script setup lang="ts">
import type { PermissionCheckMode, PermissionRequirement, PermissionStore } from './types'
import { computed, inject } from 'vue'
import { permissionStoreKey } from './context'

const props = defineProps<{
  mode?: PermissionCheckMode
  permission?: PermissionRequirement
  permissions?: PermissionRequirement
  role?: PermissionRequirement
  roleMode?: PermissionCheckMode
  roles?: PermissionRequirement
  store?: PermissionStore
}>()

const injectedStore = inject(permissionStoreKey, undefined)
const resolvedStore = computed(() => props.store ?? injectedStore)
const allowed = computed(() => {
  const store = resolvedStore.value
  if (!store) {
    return false
  }

  const permission = props.permission ?? props.permissions
  const role = props.role ?? props.roles
  return store.hasPermission(permission, props.mode)
    && store.hasRole(role, props.roleMode)
})
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback" />
</template>
