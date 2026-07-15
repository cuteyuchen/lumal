import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useReducedMotion } from './useReducedMotion'

export interface PausableAutoplayOptions {
  element: Ref<HTMLElement | null>
  enabled: ComputedRef<boolean>
  interval: ComputedRef<number>
  tick: () => void
}

export function usePausableAutoplay(options: PausableAutoplayOptions) {
  const hoverPaused = shallowRef(false)
  const focusPaused = shallowRef(false)
  const intersecting = shallowRef(true)
  const pageVisible = shallowRef(true)
  const reducedMotion = useReducedMotion()
  let observer: IntersectionObserver | undefined
  let timer: ReturnType<typeof setInterval> | undefined

  const running = computed(() => options.enabled.value
    && !hoverPaused.value
    && !focusPaused.value
    && intersecting.value
    && pageVisible.value
    && !reducedMotion.value)

  function clear(): void {
    if (timer !== undefined)
      clearInterval(timer)
    timer = undefined
  }

  function schedule(): void {
    clear()
    if (!running.value || typeof window === 'undefined')
      return
    timer = setInterval(options.tick, Math.max(250, options.interval.value))
  }

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

  watch([running, options.interval], schedule)
  watch(options.element, observe)

  onMounted(() => {
    syncVisibility()
    document.addEventListener('visibilitychange', syncVisibility)
    observe(options.element.value)
    schedule()
  })

  onBeforeUnmount(() => {
    clear()
    observer?.disconnect()
    document.removeEventListener('visibilitychange', syncVisibility)
  })

  return {
    onFocusIn: () => { focusPaused.value = true },
    onFocusOut: () => { focusPaused.value = false },
    onMouseEnter: () => { hoverPaused.value = true },
    onMouseLeave: () => { hoverPaused.value = false },
    running,
  }
}
