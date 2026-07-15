import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

export function useAnimationPause(animationRef: Readonly<Ref<HTMLElement | null>>) {
  const intersecting = shallowRef(true)
  const pageVisible = shallowRef(true)
  let observer: IntersectionObserver | undefined

  const animationPaused = computed(() => !intersecting.value || !pageVisible.value)

  function syncVisibility(): void {
    pageVisible.value = typeof document === 'undefined' || !document.hidden
  }

  function observe(element: HTMLElement | null): void {
    observer?.disconnect()
    if (!element || typeof IntersectionObserver === 'undefined')
      return
    observer = new IntersectionObserver(([entry]) => {
      intersecting.value = entry?.isIntersecting ?? true
    })
    observer.observe(element)
  }

  watch(animationRef, observe)
  onMounted(() => {
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    observe(animationRef.value)
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    document.removeEventListener('visibilitychange', syncVisibility)
  })

  return animationPaused
}
