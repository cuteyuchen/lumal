import type {
  CockpitMessage,
  CockpitMessageBus,
  CockpitMessageBusOptions,
  CockpitMessageHandler,
  CockpitMessageSubscribeOptions,
} from './types'

/***********************消息总线实现*********************/

interface Subscription {
  handler: CockpitMessageHandler
  /** 订阅者自身实例标识，用于定向投递与 clearInstance 清理 */
  targetId?: string
}

/**
 * 创建通用消息总线。
 *
 * 投递规则：
 * - publish 未设置 targetId 时为广播，投递给该 topic 全部订阅者。
 * - publish 设置 targetId 时仅投递给声明了相同 targetId 的订阅者。
 * - 订阅者声明 targetId 不会挡掉广播，只是额外获得接收定向消息的能力。
 *
 * 隔离与清理：
 * - 单个订阅 handler 抛错被捕获，不影响其他订阅者。
 * - clearInstance 移除声明了该 instanceId 的全部订阅。
 * - 包不解析、不记录、不序列化业务 payload。
 */
export function createCockpitMessageBus(options: CockpitMessageBusOptions = {}): CockpitMessageBus {
  const topics = new Map<string, Set<Subscription>>()

  function reportError(error: unknown, topic: string): void {
    const fallback = (failure: unknown): void => {
      console.error(`[cockpit] 消息订阅处理器异常（topic: ${topic}）`, failure)
    }
    try {
      if (options.onError)
        void Promise.resolve(options.onError(error, topic)).catch(fallback)
      else
        fallback(error)
    }
    catch (failure) {
      fallback(failure)
    }
  }

  function publish<T = unknown>(message: CockpitMessage<T>): void {
    const subscriptions = topics.get(message.topic)
    if (!subscriptions || subscriptions.size === 0)
      return

    // 快照，避免 handler 内订阅/退订影响本次迭代
    const snapshot = [...subscriptions]
    for (const subscription of snapshot) {
      const isBroadcast = message.targetId === undefined
      const isDirectedToSubscriber = subscription.targetId !== undefined
        && subscription.targetId === message.targetId
      if (!isBroadcast && !isDirectedToSubscriber)
        continue

      try {
        const result = subscription.handler(message as CockpitMessage)
        if (result)
          void Promise.resolve(result).catch(error => reportError(error, message.topic))
      }
      catch (error) {
        reportError(error, message.topic)
      }
    }
  }

  function subscribe<T = unknown>(
    topic: string,
    handler: CockpitMessageHandler<T>,
    options?: CockpitMessageSubscribeOptions,
  ): () => void {
    let subscriptions = topics.get(topic)
    if (!subscriptions) {
      subscriptions = new Set()
      topics.set(topic, subscriptions)
    }

    const subscription: Subscription = {
      handler: handler as CockpitMessageHandler,
      targetId: options?.targetId,
    }
    subscriptions.add(subscription)

    return function unsubscribe(): void {
      const current = topics.get(topic)
      if (!current)
        return
      current.delete(subscription)
      if (current.size === 0)
        topics.delete(topic)
    }
  }

  function clearInstance(instanceId: string): void {
    for (const [topic, subscriptions] of topics) {
      for (const subscription of [...subscriptions]) {
        if (subscription.targetId === instanceId)
          subscriptions.delete(subscription)
      }
      if (subscriptions.size === 0)
        topics.delete(topic)
    }
  }

  return {
    publish,
    subscribe,
    clearInstance,
  }
}
