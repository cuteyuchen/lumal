import type { PreparedIconMorph } from '@lumal/icons/morph'
import type { MaybeRefOrGetter } from 'vue'
import type { MorphRuntime } from '../runtime/morph'
import { prepareIconMorph } from '@lumal/icons/morph'
import { onMounted, shallowRef, toValue, watch } from 'vue'
import { loadMorphRuntime } from '../runtime/morph'

export function useIconMorph(svgText: MaybeRefOrGetter<string>, enabled: MaybeRefOrGetter<boolean>) {
  /***********************实例状态*********************/
  const mounted = shallowRef(false)
  const reducedMotion = shallowRef(false)
  const state = shallowRef<(PreparedIconMorph & { component: MorphRuntime['MorphIcon'] })>()
  let runtime: MorphRuntime | undefined

  /***********************系统动画偏好*********************/
  onMounted(() => {
    mounted.value = true
  })

  watch(
    [mounted, () => toValue(enabled)],
    ([isMounted, isEnabled], _previous, onCleanup) => {
      reducedMotion.value = false
      if (!isMounted || !isEnabled)
        return
      const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : undefined
      const syncMotion = () => {
        reducedMotion.value = media?.matches ?? false
      }
      syncMotion()
      if (typeof media?.addEventListener === 'function')
        media.addEventListener('change', syncMotion)
      else
        media?.addListener?.(syncMotion)
      onCleanup(() => {
        if (typeof media?.removeEventListener === 'function')
          media.removeEventListener('change', syncMotion)
        else
          media?.removeListener?.(syncMotion)
      })
    },
    { flush: 'sync' },
  )

  /***********************按需加载与目标切换*********************/
  watch(
    [mounted, reducedMotion, () => toValue(svgText), () => toValue(enabled)],
    async ([isMounted, reduced, text, isEnabled], _previous, onCleanup) => {
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      })
      if (!isMounted || reduced || !isEnabled || !text) {
        state.value = undefined
        return
      }
      try {
        const prepared = await prepareIconMorph(text)
        if (cancelled)
          return
        if (!prepared) {
          state.value = undefined
          return
        }
        runtime ??= await loadMorphRuntime()
        if (cancelled)
          return
        state.value = {
          ...prepared,
          // 仅颜色等外观变化时复用目标引用，不触发官方组件的形变 watcher。
          icon: state.value?.shape === prepared.shape ? state.value.icon : prepared.icon,
          component: runtime.MorphIcon,
        }
      }
      catch {
        if (!cancelled)
          state.value = undefined
      }
    },
    { immediate: true },
  )

  return {
    state,
    reset: () => {
      state.value = undefined
    },
  }
}
