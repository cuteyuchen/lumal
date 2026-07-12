import { describe, expect, it, vi } from 'vitest'
import { createCockpitMessageBus } from '../src/messaging/createCockpitMessageBus'

describe('createCockpitMessageBus', () => {
  it('广播投递给所有订阅者', () => {
    const bus = createCockpitMessageBus()
    const a = vi.fn()
    const b = vi.fn()
    bus.subscribe('topic', a)
    bus.subscribe('topic', b, { targetId: 'inst-1' })
    bus.publish({ topic: 'topic', sourceId: 's', payload: 1 })
    expect(a).toHaveBeenCalledTimes(1)
    // 声明了 targetId 的订阅者仍接收广播
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('定向投递仅命中匹配 targetId 的订阅者', () => {
    const bus = createCockpitMessageBus()
    const target = vi.fn()
    const other = vi.fn()
    const broadcastOnly = vi.fn()
    bus.subscribe('t', target, { targetId: 'inst-1' })
    bus.subscribe('t', other, { targetId: 'inst-2' })
    bus.subscribe('t', broadcastOnly)
    bus.publish({ topic: 't', sourceId: 's', targetId: 'inst-1' })
    expect(target).toHaveBeenCalledTimes(1)
    expect(other).not.toHaveBeenCalled()
    // 未声明 targetId 的订阅者不接收定向消息
    expect(broadcastOnly).not.toHaveBeenCalled()
  })

  it('取消订阅后不再接收', () => {
    const bus = createCockpitMessageBus()
    const handler = vi.fn()
    const off = bus.subscribe('t', handler)
    off()
    bus.publish({ topic: 't', sourceId: 's' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('单个订阅异常不中断其他订阅者', () => {
    const bus = createCockpitMessageBus()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const good = vi.fn()
    bus.subscribe('t', () => {
      throw new Error('boom')
    })
    bus.subscribe('t', good)
    bus.publish({ topic: 't', sourceId: 's' })
    expect(good).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('clearInstance 清理该实例的订阅', () => {
    const bus = createCockpitMessageBus()
    const handler = vi.fn()
    bus.subscribe('t', handler, { targetId: 'inst-1' })
    bus.clearInstance('inst-1')
    bus.publish({ topic: 't', sourceId: 's' })
    expect(handler).not.toHaveBeenCalled()
  })
})
