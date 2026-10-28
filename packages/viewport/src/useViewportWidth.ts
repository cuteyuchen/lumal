import type { MaybeRefOrGetter } from 'vue'
import type { ViewportConfig } from './units'
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, readonly, shallowRef, toValue } from 'vue'
import { getViewportConfig, getViewportWidth, viewportLength, viewportPixels } from './units'

// 所有实例共享一份窗口监听；容器测量仍由 useElementSize 独立负责。
const width = shallowRef(0)
let users = 0
let frame: number | undefined
function measure() {
  width.value = getViewportWidth()
}
function schedule() {
  if (frame === undefined) {
    frame = window.requestAnimationFrame(() => {
      frame = undefined
      measure()
    })
  }
}

export function useViewportWidth(config: MaybeRefOrGetter<ViewportConfig> = getViewportConfig()) {
  if (typeof window !== 'undefined' && users === 0)
    measure()
  let active = false
  function start() {
    if (active || typeof window === 'undefined')
      return
    active = true
    if (users++ === 0)
      window.addEventListener('resize', schedule, { passive: true })
    measure()
  }
  function stop() {
    if (!active)
      return
    active = false
    if (--users === 0) {
      window.removeEventListener('resize', schedule)
      if (frame !== undefined)
        window.cancelAnimationFrame(frame)
      frame = undefined
    }
  }
  onMounted(start)
  onActivated(start)
  onDeactivated(stop)
  onBeforeUnmount(stop)
  const ratio = computed(() => viewportPixels(1, width.value, toValue(config)))
  return {
    width: readonly(width),
    ratio,
    pixels: (pixels: number) => viewportPixels(pixels, width.value, toValue(config)),
    length: (pixels: number) => viewportLength(pixels, toValue(config)),
    measure,
  }
}
