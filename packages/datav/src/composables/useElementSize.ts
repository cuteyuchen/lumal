import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'

export interface ElementSize {
  height: number
  width: number
}

export function useElementSize(element: Readonly<Ref<HTMLElement | null>>) {
  const size = shallowRef<ElementSize>({ height: 0, width: 0 })
  let frame: number | undefined
  let observer: ResizeObserver | undefined

  function cancelMeasure(): void {
    if (frame === undefined)
      return
    if (typeof cancelAnimationFrame === 'function')
      cancelAnimationFrame(frame)
    else
      clearTimeout(frame)
    frame = undefined
  }

  function commitMeasure(): void {
    frame = undefined
    const target = element.value
    if (!target)
      return
    const width = target.clientWidth
    const height = target.clientHeight
    if (width !== size.value.width || height !== size.value.height)
      size.value = { height, width }
  }

  function measure(): void {
    cancelMeasure()
    if (typeof requestAnimationFrame === 'function')
      frame = requestAnimationFrame(commitMeasure)
    else
      frame = setTimeout(commitMeasure, 16) as unknown as number
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

  watch(element, observe)

  onMounted(() => {
    observe(element.value)
    if (typeof window !== 'undefined' && typeof ResizeObserver === 'undefined')
      window.addEventListener('resize', measure)
  })

  onBeforeUnmount(() => {
    cancelMeasure()
    observer?.disconnect()
    if (typeof window !== 'undefined')
      window.removeEventListener('resize', measure)
  })

  return size
}
