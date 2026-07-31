import type { CockpitRefreshPayload } from '../messaging/topics'
import type { CockpitMessage } from '../messaging/types'
import { onBeforeUnmount } from 'vue'
import { COCKPIT_REFRESH_TOPIC } from '../messaging/topics'
import { useCockpitContext } from './useCockpitContext'

/***********************模块刷新订阅*********************/

/**
 * 订阅全局 `cockpit:refresh`，在 handler 中重新请求接口。
 * 必须在 LumalCockpit 模块树内调用。
 */
export function useCockpitRefresh(handler: (message: CockpitMessage<CockpitRefreshPayload>) => void): void {
  const context = useCockpitContext()
  const unsubscribe = context.messages.subscribe<CockpitRefreshPayload>(
    COCKPIT_REFRESH_TOPIC,
    handler,
    { targetId: context.instanceId },
  )
  onBeforeUnmount(unsubscribe)
}
