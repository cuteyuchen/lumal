import type { IconDefinition, IconGroupDefinition, IconKey } from '@luma/icons'
import type { ComputedRef } from 'vue'
import {
  getRegisteredIconDefinitions,
  getRegisteredIconGroups,
  resolveIconDefinition,
  subscribeIconRegistry,
} from '@luma/icons'
import { computed, onScopeDispose, shallowRef } from 'vue'

export interface UseIconRegistryReturn {
  groups: ComputedRef<IconGroupDefinition[]>
  icons: ComputedRef<IconDefinition[]>
  resolve: (key: IconKey) => IconDefinition | undefined
}

/***********************Vue 响应式适配*********************/
export function useIconRegistry(): UseIconRegistryReturn {
  const version = shallowRef(0)
  const unsubscribe = subscribeIconRegistry(() => {
    version.value += 1
  })

  onScopeDispose(unsubscribe)

  const icons = computed(() => {
    void version.value
    return getRegisteredIconDefinitions()
  })
  const groups = computed(() => {
    void version.value
    return getRegisteredIconGroups()
  })

  function resolve(key: IconKey): IconDefinition | undefined {
    void version.value
    return resolveIconDefinition(key)
  }

  return {
    groups,
    icons,
    resolve,
  }
}
