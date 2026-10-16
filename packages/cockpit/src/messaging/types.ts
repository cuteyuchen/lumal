/***********************通用消息总线类型*********************/

/**
 * 通用消息结构。topic、payload 与业务语义由应用定义，
 * 包不解析、不记录、不序列化 payload。
 */
export interface CockpitMessage<T = unknown> {
  topic: string
  sourceId: string
  /** 未设置时为广播；设置后仅目标实例处理 */
  targetId?: string
  payload?: T
}

export type CockpitMessageHandler<T = unknown> = (message: CockpitMessage<T>) => void | Promise<void>

export interface CockpitMessageBusOptions {
  /** 错误观察入口，不传递业务 payload。默认输出到 console.error。 */
  onError?: (error: unknown, topic: string) => void | Promise<void>
}

export interface CockpitMessageSubscribeOptions {
  /** 仅接收发往该实例（或广播）的消息 */
  targetId?: string
}

export interface CockpitMessageBus {
  publish: <T = unknown>(message: CockpitMessage<T>) => void
  subscribe: <T = unknown>(
    topic: string,
    handler: CockpitMessageHandler<T>,
    options?: CockpitMessageSubscribeOptions,
  ) => () => void
  /** 清理某实例的所有订阅，用于组件卸载 */
  clearInstance: (instanceId: string) => void
}
