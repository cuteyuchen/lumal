import type { MaybeRefOrGetter, Ref } from 'vue'
import { onBeforeUnmount, ref, shallowRef, toValue, watch } from 'vue'

/***********************画布等比缩放*********************/

export interface CanvasScaleResult {
  scale: number
  /** 缩放后画布实际占用宽度（px） */
  scaledWidth: number
  scaledHeight: number
  /** 居中偏移量（px） */
  offsetX: number
  offsetY: number
}

/**
 * 纯函数：根据容器尺寸与基准画布尺寸计算等比缩放结果。
 * 取宽、高缩放比的较小值以保持比例并完整可见。可独立单测。
 */
export function computeCanvasScale(
  containerWidth: number,
  containerHeight: number,
  baseWidth: number,
  baseHeight: number,
): CanvasScaleResult {
  if (baseWidth <= 0 || baseHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return { scale: 1, scaledWidth: baseWidth, scaledHeight: baseHeight, offsetX: 0, offsetY: 0 }
  }
  const scale = Math.min(containerWidth / baseWidth, containerHeight / baseHeight)
  const scaledWidth = baseWidth * scale
  const scaledHeight = baseHeight * scale
  return {
    scale,
    scaledWidth,
    scaledHeight,
    offsetX: (containerWidth - scaledWidth) / 2,
    offsetY: (containerHeight - scaledHeight) / 2,
  }
}

export interface UseCanvasScaleOptions {
  baseWidth: () => number
  baseHeight: () => number
  enabled?: MaybeRefOrGetter<boolean>
}

/**
 * 监听容器尺寸，实时计算画布缩放。
 * 使用 requestAnimationFrame 节流 ResizeObserver 回调，避免频繁重排。
 */
export function useCanvasScale(
  containerRef: Ref<HTMLElement | null>,
  options: UseCanvasScaleOptions,
) {
  const result = shallowRef<CanvasScaleResult>({
    scale: 1,
    scaledWidth: options.baseWidth(),
    scaledHeight: options.baseHeight(),
    offsetX: 0,
    offsetY: 0,
  })
  const ready = ref(false)

  let observer: ResizeObserver | null = null
  let frame = 0

  function measure(): void {
    const el = containerRef.value
    if (!el)
      return
    result.value = computeCanvasScale(
      el.clientWidth,
      el.clientHeight,
      options.baseWidth(),
      options.baseHeight(),
    )
    ready.value = true
  }

  function scheduleMeasure(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      measure()
      return
    }
    if (frame)
      cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      frame = 0
      measure()
    })
  }

  function stopObserving(): void {
    observer?.disconnect()
    observer = null
  }

  function syncObservation(): void {
    stopObserving()
    if (options.enabled !== undefined && !toValue(options.enabled))
      return
    measure()
    if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
      observer = new ResizeObserver(scheduleMeasure)
      observer.observe(containerRef.value)
    }
  }

  watch(
    [containerRef, options.baseWidth, options.baseHeight, () => options.enabled === undefined || toValue(options.enabled)],
    syncObservation,
    { flush: 'post', immediate: true },
  )

  onBeforeUnmount(() => {
    if (frame && typeof cancelAnimationFrame !== 'undefined')
      cancelAnimationFrame(frame)
    stopObserving()
  })

  return { result, ready, measure }
}
