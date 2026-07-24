import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, watch } from 'vue'

/***********************图表尺寸自适应*********************/
export interface ChartResizeTarget {
  resize: () => void
}

export interface UseChartResizeOptions {
  /** 是否启用监听，默认 true。 */
  enabled?: boolean
}

/**
 * 监听容器尺寸变化并触发图表实例 resize。
 * 优先使用 ResizeObserver 观察容器元素；浏览器不支持或未提供容器时，
 * 回退到 window resize。隐藏 Tab、折叠区域和过渡中的 0×0 容器不会触发 resize。
 */
export function useChartResize(
  chartRef: Ref<ChartResizeTarget | null | undefined>,
  containerRef?: Ref<HTMLElement | null | undefined>,
  options: UseChartResizeOptions = {},
): void {
  if (options.enabled === false)
    return

  let observer: ResizeObserver | undefined
  let resizeFrame = 0
  let windowFallbackAttached = false

  function hasRenderableSize(): boolean {
    const element = containerRef?.value
    return !element || (element.clientWidth > 0 && element.clientHeight > 0)
  }

  function cancelResize(): void {
    if (!resizeFrame)
      return
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(resizeFrame)
    else
      clearTimeout(resizeFrame)
    resizeFrame = 0
  }

  function triggerResize(): void {
    if (!hasRenderableSize())
      return
    cancelResize()
    const run = (): void => {
      resizeFrame = 0
      if (hasRenderableSize())
        chartRef.value?.resize()
    }
    if (typeof requestAnimationFrame === 'function')
      resizeFrame = requestAnimationFrame(run)
    else
      resizeFrame = setTimeout(run, 16) as unknown as number
  }

  function observe(element: HTMLElement | null | undefined): void {
    observer?.disconnect()
    observer = undefined
    if (element && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(triggerResize)
      observer.observe(element)
    }
    triggerResize()
  }

  function attachWindowFallback(): void {
    if (windowFallbackAttached || typeof window === 'undefined')
      return
    window.addEventListener('resize', triggerResize, { passive: true })
    windowFallbackAttached = true
  }

  function detachWindowFallback(): void {
    if (!windowFallbackAttached || typeof window === 'undefined')
      return
    window.removeEventListener('resize', triggerResize)
    windowFallbackAttached = false
  }

  watch(chartRef, triggerResize, { flush: 'post' })

  onMounted(() => {
    if (containerRef && typeof ResizeObserver !== 'undefined') {
      observe(containerRef.value)
      watch(containerRef, observe)
    }
    else {
      attachWindowFallback()
      triggerResize()
    }
  })

  onBeforeUnmount(() => {
    cancelResize()
    observer?.disconnect()
    detachWindowFallback()
  })
}