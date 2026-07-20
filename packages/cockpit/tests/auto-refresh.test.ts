import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useCockpitAutoRefresh } from '../src/composables/useCockpitAutoRefresh'
import { createCockpitMessageBus } from '../src/messaging/createCockpitMessageBus'
import { COCKPIT_REFRESH_TOPIC } from '../src/messaging/topics'

describe('useCockpitAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('关闭时不广播；开启后按间隔广播 cockpit:refresh', async () => {
    const messages = createCockpitMessageBus()
    const handler = vi.fn()
    messages.subscribe(COCKPIT_REFRESH_TOPIC, handler)

    const enabled = ref(false)
    let refreshNow!: () => void

    const Host = defineComponent({
      setup() {
        const api = useCockpitAutoRefresh({
          messages,
          sourceId: 'cockpit-1',
          intervalMs: 1000,
          enabled,
        })
        refreshNow = api.refreshNow
        return () => h('div')
      },
    })

    const wrapper = mount(Host)

    vi.advanceTimersByTime(3000)
    expect(handler).not.toHaveBeenCalled()

    enabled.value = true
    await nextTick()
    vi.advanceTimersByTime(1000)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0]?.[0]).toMatchObject({
      topic: COCKPIT_REFRESH_TOPIC,
      sourceId: 'cockpit-1',
      payload: { reason: 'interval' },
    })

    vi.advanceTimersByTime(2000)
    expect(handler).toHaveBeenCalledTimes(3)

    enabled.value = false
    await nextTick()
    vi.advanceTimersByTime(3000)
    expect(handler).toHaveBeenCalledTimes(3)

    refreshNow()
    expect(handler).toHaveBeenCalledTimes(4)
    expect(handler.mock.calls[3]?.[0].payload).toMatchObject({ reason: 'manual' })

    wrapper.unmount()
  })

  it('页面隐藏时跳过定时刷新，恢复可见时立即刷新一次', async () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const messages = createCockpitMessageBus()
    const handler = vi.fn()
    messages.subscribe(COCKPIT_REFRESH_TOPIC, handler)

    const Host = defineComponent({
      setup() {
        useCockpitAutoRefresh({
          messages,
          sourceId: 'cockpit-1',
          intervalMs: 1000,
          defaultEnabled: true,
        })
        return () => h('div')
      },
    })
    const wrapper = mount(Host)

    vi.advanceTimersByTime(1000)
    expect(handler).toHaveBeenCalledTimes(1)

    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(3000)
    expect(handler).toHaveBeenCalledTimes(1)

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls[1]?.[0].payload).toMatchObject({ reason: 'interval' })

    wrapper.unmount()
  })
})
