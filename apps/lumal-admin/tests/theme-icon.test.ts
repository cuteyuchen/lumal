import type { ResolvedThemeMode } from '@lumal/core/theme'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, watch } from 'vue'
import { useAdminThemeIcon } from '../src/composables/use-admin-theme-icon'
import * as themeTransition from '../src/services/theme-transition'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

describe('admin theme icon', () => {
  function mountIcon() {
    return mount(defineComponent({
      props: { mode: { type: String, default: 'light' } },
      setup(props) {
        const icon = useAdminThemeIcon(() => props.mode as ResolvedThemeMode)
        return () => h('output', icon.value)
      },
    }))
  }

  it('首次不等待，主题业务状态变化后等待整页过渡完成才切换形状', async () => {
    let finish!: () => void
    const wait = vi.spyOn(themeTransition, 'waitForAdminThemeTransition')
      .mockReturnValue(new Promise<void>((resolve) => { finish = resolve }))
    const wrapper = mountIcon()
    expect(wrapper.text()).toBe('lumal:moon')
    expect(wait).not.toHaveBeenCalled()
    await wrapper.setProps({ mode: 'dark' })
    expect(wrapper.text()).toBe('lumal:moon')
    finish()
    await flushPromises()
    expect(wrapper.text()).toBe('lumal:sun')
  })

  it('丢弃过期等待，快速切换只提交最新目标', async () => {
    const pending: Array<() => void> = []
    vi.spyOn(themeTransition, 'waitForAdminThemeTransition')
      .mockImplementation(() => new Promise<void>((resolve) => { pending.push(resolve) }))
    const wrapper = mountIcon()
    await wrapper.setProps({ mode: 'dark' })
    await wrapper.setProps({ mode: 'light' })
    pending[1]!()
    await flushPromises()
    pending[0]!()
    await flushPromises()
    expect(wrapper.text()).toBe('lumal:moon')
  })

  it('卸载取消尚未结束的等待任务', async () => {
    let finish!: () => void
    vi.spyOn(themeTransition, 'waitForAdminThemeTransition')
      .mockReturnValue(new Promise<void>((resolve) => { finish = resolve }))
    let icon!: ReturnType<typeof useAdminThemeIcon>
    const wrapper = mount(defineComponent({
      props: { mode: { type: String, default: 'light' } },
      setup(props) {
        icon = useAdminThemeIcon(() => props.mode as ResolvedThemeMode)
        return () => h('output', icon.value)
      },
    }))
    const changed = vi.fn()
    const stop = watch(icon, changed)
    await wrapper.setProps({ mode: 'dark' })
    wrapper.unmount()
    finish()
    await flushPromises()
    expect(changed).not.toHaveBeenCalled()
    stop()
  })
})
