import { onBeforeUnmount, onMounted, shallowRef } from 'vue'

export function useReducedMotion() {
  const reducedMotion = shallowRef(false)
  let query: MediaQueryList | undefined

  function sync(event: MediaQueryList | MediaQueryListEvent): void {
    reducedMotion.value = event.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return
    query = window.matchMedia('(prefers-reduced-motion: reduce)')
    sync(query)
    query.addEventListener?.('change', sync)
  })

  onBeforeUnmount(() => query?.removeEventListener?.('change', sync))
  return reducedMotion
}
