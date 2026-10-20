import type { ResolvedThemeMode } from '@lumal/core/theme'
import type { MaybeRefOrGetter } from 'vue'
import { computed, shallowRef, toValue, watch } from 'vue'
import { waitForAdminThemeTransition } from '../services/theme-transition'

/** 图标状态晚于整页主题过渡提交，业务主题本身仍立即更新。 */
export function useAdminThemeIcon(mode: MaybeRefOrGetter<ResolvedThemeMode>) {
  /***********************显示状态*********************/
  const displayedMode = shallowRef(toValue(mode))

  /***********************主题过渡同步*********************/
  watch(() => toValue(mode), async (value, _previous, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    await waitForAdminThemeTransition()
    if (!cancelled)
      displayedMode.value = value
  })

  return computed(() => displayedMode.value === 'dark' ? 'lumal:sun' : 'lumal:moon')
}
