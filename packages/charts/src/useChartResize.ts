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
 * 优先使用 ResizeObserver 观察容器元素，回退到 window resize 事件。
 */
export function useChartResize(
  chartRef: Ref<ChartResizeTarget | null | undefined>,
  containerRef?: Ref<HTMLElement | null | undefined>,
  options: UseChartResizeOptions = {},
): void {
  if (options.enabled === false) {
    return
  }

  let observer: ResizeObserver | undefined

  function triggerResize(): void {
    chartRef.value?.resize()
  }

  function observe(element: HTMLElement | null | undefined): void {
    observer?.disconnect()

    if (element && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => triggerResize())
      observer.observe(element)
    }
  }

  onMounted(() => {
    if (containerRef) {
      observe(containerRef.value)
      watch(containerRef, element => observe(element))
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', triggerResize)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', triggerResize)
    }
  })
}
