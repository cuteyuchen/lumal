import type { MaybeRefOrGetter } from 'vue'
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, shallowRef, toValue, watch } from 'vue'

export interface ElementSize {
  width: number
  height: number
}

export interface UseElementSizeOptions {
  /** 不传 target 时监听窗口；传入的空 ref 表示元素尚未挂载。 */
  target?: MaybeRefOrGetter<HTMLElement | null | undefined>
  enabled?: MaybeRefOrGetter<boolean>
}

/** 单实例只注册一份观察器；目标切换、禁用和卸载均清理待执行帧与监听。 */
export function useElementSize(options: UseElementSizeOptions = {}) {
  const size = shallowRef<ElementSize>({ width: 0, height: 0 })
  let observer: ResizeObserver | undefined
  let observed: HTMLElement | null | undefined
  let active = false
  let frame: number | undefined
  let listening = false
  let mounted = false
  let suspended = false
  let generation = 0

  const enabled = () => options.enabled === undefined || toValue(options.enabled)
  function cancelFrame() {
    if (frame !== undefined) {
      if (typeof cancelAnimationFrame === 'function')
        cancelAnimationFrame(frame)
      else
        clearTimeout(frame)
    }
    frame = undefined
  }

  function measure() {
    if (!mounted || suspended || !enabled())
      return
    const target = toValue(options.target)
    const next = options.target === undefined && typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : { width: target?.clientWidth ?? 0, height: target?.clientHeight ?? 0 }
    if (next.width !== size.value.width || next.height !== size.value.height)
      size.value = next
  }

  function schedule() {
    if (!active || frame !== undefined)
      return
    frame = typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(() => {
          frame = undefined
          measure()
        })
      : setTimeout(() => {
        frame = undefined
        measure()
      }, 16) as unknown as number
  }

  function stop() {
    generation++
    cancelFrame()
    observer?.disconnect()
    observer = undefined
    if (listening && typeof window !== 'undefined')
      window.removeEventListener('resize', schedule)
    listening = false
    active = false
    observed = undefined
  }

  function observe() {
    if (!mounted || suspended)
      return
    const target = toValue(options.target)
    if (active && observed === target && enabled()) {
      measure()
      return
    }
    stop()
    if (!enabled())
      return
    if (options.target !== undefined && !target)
      return
    active = true
    observed = target
    // 同步首测，在浏览器绘制前确定位置，不先显示错误比例的画布。
    measure()
    if (target && typeof ResizeObserver !== 'undefined') {
      const current = generation
      observer = new ResizeObserver(() => {
        // 已断开的观察器仍可能有排队回调，不允许影响新目标或新激活周期。
        if (current === generation)
          schedule()
      })
      observer.observe(target)
    }
    else if (typeof window !== 'undefined' && (options.target === undefined || typeof ResizeObserver === 'undefined')) {
      window.addEventListener('resize', schedule, { passive: true })
      listening = true
    }
  }

  watch([() => toValue(options.target), enabled], observe, { flush: 'post', immediate: true })
  onMounted(() => {
    mounted = true
    observe()
  })
  onActivated(() => {
    suspended = false
    observe()
  })
  onDeactivated(() => {
    suspended = true
    stop()
  })
  onBeforeUnmount(() => {
    mounted = false
    stop()
  })
  return { size, measure }
}
