import type { MaybeRefOrGetter } from 'vue'
import type { ViewportScaleMode } from './scale'
import type { UseElementSizeOptions } from './useElementSize'
import { computed, shallowRef, toValue, watch } from 'vue'
import { computeViewportScale } from './scale'
import { useElementSize } from './useElementSize'

export interface UseViewportScaleOptions extends UseElementSizeOptions {
  designWidth?: MaybeRefOrGetter<number>
  designHeight?: MaybeRefOrGetter<number>
  mode?: MaybeRefOrGetter<ViewportScaleMode>
  minScale?: MaybeRefOrGetter<number | undefined>
  maxScale?: MaybeRefOrGetter<number | undefined>
}

/** scale/size 是响应式的；数字布局在 computed 内读取 scale，而不是一次性读取窗口宽度。 */
export function useViewportScale(options: UseViewportScaleOptions = {}) {
  const { size, measure } = useElementSize(options)
  const width = () => toValue(options.designWidth) ?? 1920
  const height = () => toValue(options.designHeight) ?? 1080
  const mode = () => toValue(options.mode) ?? 'contain'
  const result = shallowRef(computeViewportScale(0, 0, width(), height(), mode()))
  const ready = shallowRef(false)
  watch([size, width, height, mode, () => toValue(options.minScale), () => toValue(options.maxScale)], () => {
    result.value = computeViewportScale(size.value.width, size.value.height, width(), height(), mode(), {
      minScale: toValue(options.minScale),
      maxScale: toValue(options.maxScale),
    })
    ready.value = size.value.width > 0 && size.value.height > 0
  }, { immediate: true, flush: 'sync' })
  const scale = computed(() => result.value.scale)
  return { result, ready, scale, size, measure }
}
