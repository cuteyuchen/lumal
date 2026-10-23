import type { MaybeRefOrGetter, Ref } from 'vue'
import { computeViewportScale, useViewportScale } from '@lumal/viewport'
import { shallowRef, watch } from 'vue'

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
  const { scale, scaledWidth, scaledHeight, offsetX, offsetY } = computeViewportScale(containerWidth, containerHeight, baseWidth, baseHeight)
  return { scale, scaledWidth, scaledHeight, offsetX, offsetY }
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
  containerRef: Readonly<Ref<HTMLElement | null>>,
  options: UseCanvasScaleOptions,
) {
  const viewport = useViewportScale({
    target: containerRef,
    designWidth: options.baseWidth,
    designHeight: options.baseHeight,
    enabled: options.enabled,
  })
  // 保留既有 Canvas 返回字段，不暴露容器实现细节。
  const result = shallowRef<CanvasScaleResult>(computeCanvasScale(0, 0, options.baseWidth(), options.baseHeight()))
  watch(viewport.result, () => {
    const { scale, scaledWidth, scaledHeight, offsetX, offsetY } = viewport.result.value
    result.value = { scale, scaledWidth, scaledHeight, offsetX, offsetY }
  }, { immediate: true, flush: 'sync' })
  return { result, ready: viewport.ready, measure: viewport.measure }
}
