import type { Ref } from 'vue'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'
import { useAnimationPause } from './useAnimationPause'
import { useReducedMotion } from './useReducedMotion'

export function useSvgAnimationPause(
  root: Readonly<Ref<HTMLElement | null>>,
  svg: Readonly<Ref<SVGSVGElement | null>>,
) {
  const viewportPaused = useAnimationPause(root)
  const reducedMotion = useReducedMotion()
  const hoverPaused = shallowRef(false)
  const focusPaused = shallowRef(false)
  const paused = computed(() => viewportPaused.value || reducedMotion.value || hoverPaused.value || focusPaused.value)

  async function sync(): Promise<void> {
    await nextTick()
    if (paused.value)
      svg.value?.pauseAnimations?.()
    else
      svg.value?.unpauseAnimations?.()
  }

  watch([paused, svg], () => void sync())
  onMounted(() => void sync())

  return {
    onFocusIn: () => { focusPaused.value = true },
    onFocusOut: () => { focusPaused.value = false },
    onMouseEnter: () => { hoverPaused.value = true },
    onMouseLeave: () => { hoverPaused.value = false },
    paused,
  }
}
