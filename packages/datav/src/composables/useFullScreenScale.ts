import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

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
  if (designWidth <= 0 || designHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return {
      containerWidth: Math.max(0, containerWidth),
      containerHeight: Math.max(0, containerHeight),
      scale: 1,
      scaledWidth: designWidth,
      scaledHeight: designHeight,
      offsetX: 0,
      offsetY: 0,
    }
  }

  const scale = Math.min(containerWidth / designWidth, containerHeight / designHeight)
  const scaledWidth = designWidth * scale
  const scaledHeight = designHeight * scale
  return {
    containerWidth,
    containerHeight,
    scale,
    scaledWidth,
    scaledHeight,
    offsetX: (containerWidth - scaledWidth) / 2,
    offsetY: (containerHeight - scaledHeight) / 2,
  }
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
  const result = shallowRef<FullScreenScaleResult>({
    containerWidth: 0,
    containerHeight: 0,
    scale: 1,
    scaledWidth: options.designWidth(),
    scaledHeight: options.designHeight(),
    offsetX: 0,
    offsetY: 0,
  })
  const ready = shallowRef(false)

  let observer: ResizeObserver | undefined
  let frame: number | undefined

  function cancelFrame(): void {
    if (frame === undefined)
      return
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(frame)
    else
      clearTimeout(frame)
    frame = undefined
  }

  function commit(): void {
    frame = undefined
    const el = containerRef.value
    if (!el)
      return
    result.value = computeFullScreenScale(
      el.clientWidth,
      el.clientHeight,
      options.designWidth(),
      options.designHeight(),
    )
    ready.value = true
  }

  function measure(): void {
    cancelFrame()
    frame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(commit)
      : setTimeout(commit, 16) as unknown as number
  }

  function observe(target: HTMLElement | null): void {
    observer?.disconnect()
    observer = undefined
    if (target && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure)
      observer.observe(target)
    }
    measure()
  }

  watch(containerRef, observe)

  onMounted(() => {
    observe(containerRef.value)
    if (typeof window !== 'undefined' && typeof ResizeObserver === 'undefined')
      window.addEventListener('resize', measure)
  })

  onBeforeUnmount(() => {
    cancelFrame()
    observer?.disconnect()
    observer = undefined
    if (typeof window !== 'undefined')
      window.removeEventListener('resize', measure)
  })

  return { result, ready, measure }
}
