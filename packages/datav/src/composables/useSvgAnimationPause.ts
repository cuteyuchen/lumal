import type { Ref } from 'vue'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { useAnimationPause } from './useAnimationPause'
import { useReducedMotion } from './useReducedMotion'

export function useSvgAnimationPause(
  root: Readonly<Ref<HTMLElement | null>>,
  svg?: Readonly<Ref<SVGSVGElement | null>>,
  disabled: () => boolean = () => false,
) {
  const viewportPaused = useAnimationPause(root)
  const reducedMotion = useReducedMotion()
  const hoverPaused = shallowRef(false)
  const focusPaused = shallowRef(false)
  const paused = computed(() => viewportPaused.value || reducedMotion.value || hoverPaused.value || focusPaused.value || disabled())
  let syncScheduled = false

  function getSvgElements(): SVGSVGElement[] {
    return svg ? (svg.value ? [svg.value] : []) : [...root.value?.querySelectorAll('svg') ?? []]
  }

  async function sync(): Promise<void> {
    if (syncScheduled)
      return
    // 挂载和模板引用的 post watch 会在同一轮触发，共用一次 DOM 同步。
    syncScheduled = true
    await nextTick()
    syncScheduled = false
    for (const element of getSvgElements()) {
      if (paused.value)
        element.pauseAnimations?.()
      else
        element.unpauseAnimations?.()
    }
  }

  function restart(): void {
    for (const element of getSvgElements())
      element.setCurrentTime?.(0)
    void sync()
  }

  watch([paused, svg ?? root], () => void sync(), { flush: 'post' })
  onMounted(() => void sync())

  return {
    onFocusIn: () => { focusPaused.value = true },
    onFocusOut: (event: FocusEvent) => { focusPaused.value = Boolean(event.relatedTarget && root.value?.contains(event.relatedTarget as Node)) },
    onMouseEnter: () => { hoverPaused.value = true },
    onMouseLeave: () => { hoverPaused.value = false },
    paused,
    restart,
  }
}
