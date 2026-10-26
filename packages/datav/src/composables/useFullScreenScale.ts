import type { Ref } from 'vue'
import { computeViewportScale, useViewportScale } from '@lumal/viewport'

/***********************全屏容器缩放*********************/

export interface FullScreenScaleResult {
  /** 容器实际尺寸（px） */
  containerWidth: number
  containerHeight: number
  /** 等比缩放系数（取宽高较小值） */
  scale: number
  /** 缩放后画布实际占用宽度（px） */
  scaledWidth: number
  scaledHeight: number
  /** 居中偏移量（px） */
  offsetX: number
  offsetY: number
}

/**
 * 纯函数：根据容器尺寸与设计稿尺寸计算等比缩放结果。
 * 取宽、高缩放比的较小值以保持比例并完整可见，剩余空间居中。可独立单测。
 */
export function computeFullScreenScale(
  containerWidth: number,
  containerHeight: number,
  designWidth: number,
  designHeight: number,
): FullScreenScaleResult {
  return computeViewportScale(containerWidth, containerHeight, designWidth, designHeight)
}

export interface UseFullScreenScaleOptions {
  designWidth: () => number
  designHeight: () => number
}

/**
 * 监听容器尺寸，实时计算等比缩放结果。
 * 使用 requestAnimationFrame 节流 ResizeObserver 回调，避免频繁重排。
 */
export function useFullScreenScale(
  containerRef: Readonly<Ref<HTMLElement | null>>,
  options: UseFullScreenScaleOptions,
) {
  const { result, ready, measure } = useViewportScale({
    target: containerRef,
    designWidth: options.designWidth,
    designHeight: options.designHeight,
  })
  return { result, ready, measure }
}
