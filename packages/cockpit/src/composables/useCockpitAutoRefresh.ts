import type { MaybeRefOrGetter, Ref } from 'vue'
import type { CockpitRefreshPayload } from '../messaging/topics'
import type { CockpitMessageBus } from '../messaging/types'
import { onBeforeUnmount, ref, toValue, watch } from 'vue'
import { COCKPIT_REFRESH_TOPIC } from '../messaging/topics'

/***********************全局自动刷新*********************/

export const DEFAULT_COCKPIT_AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export interface UseCockpitAutoRefreshOptions {
  messages: CockpitMessageBus
  /** 发布方 sourceId，通常为 cockpitId。 */
  sourceId: MaybeRefOrGetter<string>
  /** 刷新间隔，默认 5 分钟。 */
  intervalMs?: MaybeRefOrGetter<number>
  /** 受控开关；不传则内部维护。 */
  enabled?: Ref<boolean>
  /** 非受控时的初始开关状态。 */
  defaultEnabled?: boolean
}

export interface UseCockpitAutoRefreshReturn {
  enabled: Ref<boolean>
  /** 立即广播一次刷新（不依赖开关）。 */
  refreshNow: (reason?: CockpitRefreshPayload['reason']) => void
}

/**
 * 按间隔向消息总线广播 `cockpit:refresh`。
 * 关闭时停止定时器；卸载时清理。
 */
export function useCockpitAutoRefresh(options: UseCockpitAutoRefreshOptions): UseCockpitAutoRefreshReturn {
  const enabled = options.enabled ?? ref(options.defaultEnabled ?? false)
  let timer: ReturnType<typeof setInterval> | undefined

  function refreshNow(reason: CockpitRefreshPayload['reason'] = 'manual'): void {
    const payload: CockpitRefreshPayload = { reason, at: Date.now() }
    options.messages.publish({
      topic: COCKPIT_REFRESH_TOPIC,
      sourceId: toValue(options.sourceId),
      payload,
    })
  }

  function clearTimer(): void {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  function startTimer(): void {
    clearTimer()
    const intervalMs = Math.max(1000, toValue(options.intervalMs) ?? DEFAULT_COCKPIT_AUTO_REFRESH_INTERVAL_MS)
    timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden)
        return
      refreshNow('interval')
    }, intervalMs)
  }

  function handleVisibilityChange(): void {
    if (!document.hidden && enabled.value)
      refreshNow('interval')
  }

  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', handleVisibilityChange)

  watch(enabled, (value) => {
    if (value)
      startTimer()
    else
      clearTimer()
  }, { immediate: true })

  watch(() => toValue(options.intervalMs), () => {
    if (enabled.value)
      startTimer()
  })

  onBeforeUnmount(() => {
    clearTimer()
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { enabled, refreshNow }
}
