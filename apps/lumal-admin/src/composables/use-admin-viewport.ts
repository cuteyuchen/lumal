import type { MaybeRefOrGetter } from 'vue'
import { onScopeDispose, toValue, watch } from 'vue'
import { viewportDesign } from '../../viewport.config'

/** 根单位覆盖 Header、侧栏及 Teleport 到 body 的 UI，离开应用时恢复宿主原值。 */
export function useAdminViewport(enabled: MaybeRefOrGetter<boolean>): void {
  if (typeof document === 'undefined')
    return
  const element = document.documentElement
  const previousMode = element.getAttribute('data-admin-viewport')
  const previousUnit = element.style.getPropertyValue('--lumal-viewport-unit')
  const previousPriority = element.style.getPropertyPriority('--lumal-viewport-unit')
  watch(() => toValue(enabled), (active) => {
    element.dataset.adminViewport = active ? 'vw' : 'responsive'
    element.style.setProperty('--lumal-viewport-unit', active ? `${100 / viewportDesign.designWidth}vw` : '1px')
  }, { immediate: true, flush: 'sync' })
  onScopeDispose(() => {
    if (previousMode === null)
      element.removeAttribute('data-admin-viewport')
    else
      element.setAttribute('data-admin-viewport', previousMode)
    if (previousUnit)
      element.style.setProperty('--lumal-viewport-unit', previousUnit, previousPriority)
    else
      element.style.removeProperty('--lumal-viewport-unit')
  })
}
