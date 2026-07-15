import type { ComputedRef, Ref } from 'vue'
import { computed, onBeforeUnmount, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { useAnimationPause } from './useAnimationPause'
import { useReducedMotion } from './useReducedMotion'

interface DataVScrollAnimationOptions {
  advanceBy: ComputedRef<number>
  element: Readonly<Ref<HTMLElement | null>>
  enabled: ComputedRef<boolean>
  hoverPause: ComputedRef<boolean>
  rowCount: ComputedRef<number>
  total: ComputedRef<number>
  waitTime: ComputedRef<number>
}

export function useDataVScrollAnimation(options: DataVScrollAnimationOptions) {
  const renderOffset = shallowRef(0)
  const animationIndex = shallowRef(0)
  const collapsing = shallowRef(false)
  const hovered = shallowRef(false)
  const focused = shallowRef(false)
  const mounted = shallowRef(false)
  const viewportPaused = useAnimationPause(options.element)
  const reducedMotion = useReducedMotion()
  const paused = computed(() =>
    viewportPaused.value
    || reducedMotion.value
    || focused.value
    || (options.hoverPause.value && hovered.value),
  )

  let stageTimer: ReturnType<typeof setTimeout> | undefined

  function clearStageTimer(): void {
    if (stageTimer !== undefined)
      clearTimeout(stageTimer)
    stageTimer = undefined
  }

  function normalizeOffset(value: number): number {
    const total = options.total.value
    if (total <= 0)
      return 0
    const rounded = Math.max(0, Math.floor(value))
    return rounded % total
  }

  function canAnimate(): boolean {
    return mounted.value
      && options.enabled.value
      && !paused.value
      && options.total.value > options.rowCount.value
  }

  function beginWindow(): void {
    stageTimer = undefined
    if (!canAnimate())
      return
    renderOffset.value = normalizeOffset(animationIndex.value)
    collapsing.value = false
    stageTimer = setTimeout(collapseWindow, 300)
  }

  function collapseWindow(): void {
    stageTimer = undefined
    if (!canAnimate())
      return
    collapsing.value = true
    animationIndex.value = normalizeOffset(animationIndex.value + Math.max(1, options.advanceBy.value))
    stageTimer = setTimeout(beginWindow, Math.max(0, options.waitTime.value - 300))
  }

  function schedule(): void {
    clearStageTimer()
    if (!canAnimate())
      return
    stageTimer = setTimeout(beginWindow, Math.max(0, options.waitTime.value))
  }

  function reset(index = 0): void {
    clearStageTimer()
    animationIndex.value = normalizeOffset(index)
    renderOffset.value = animationIndex.value
    collapsing.value = false
    schedule()
  }

  function onMouseEnter(): void {
    hovered.value = true
  }

  function onMouseLeave(): void {
    hovered.value = false
  }

  function onFocusIn(): void {
    focused.value = true
  }

  function onFocusOut(event: FocusEvent): void {
    if (!options.element.value?.contains(event.relatedTarget as Node | null))
      focused.value = false
  }

  watch(
    [paused, options.enabled, options.rowCount, options.total, options.waitTime, options.advanceBy],
    () => schedule(),
  )

  onMounted(() => {
    mounted.value = true
    schedule()
  })

  onBeforeUnmount(() => {
    mounted.value = false
    clearStageTimer()
  })

  onUnmounted(clearStageTimer)

  return {
    collapsing,
    onFocusIn,
    onFocusOut,
    onMouseEnter,
    onMouseLeave,
    paused,
    renderOffset,
    reset,
  }
}
