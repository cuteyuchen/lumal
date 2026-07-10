import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createDefaultPreferences, LumaThemeSettingsPanel } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

function mountPanel() {
  const wrapper = mount(LumaThemeSettingsPanel, {
    global: {
      stubs: elementPlusStubs,
    },
    props: {
      preferences: createDefaultPreferences(),
    },
  })

  return wrapper
}

describe('luma theme settings panel', () => {
  it('切换外观模式会更新 preferences 并抛出 change', async () => {
    const wrapper = mountPanel()
    const darkButton = wrapper.findAll('.luma-theme-settings__mode')
      .find(button => button.text() === '深色')

    await darkButton?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.mode).toBe('dark')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('选择预设主题色会写入 colorPrimary', async () => {
    const wrapper = mountPanel()
    const colorButton = wrapper.find('.luma-theme-settings__color')

    await colorButton.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.colorPrimary).toBe('#1677ff')
  })

  it('关闭标签页开关会同步禁用缓存开关', async () => {
    const wrapper = mountPanel()
    const switches = wrapper.findAll('.el-switch')
    // 顺序：开启标签页、标签页缓存、页面动画
    await switches[0]?.setValue(false)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].tabbar.enable).toBe(false)

    const cacheSwitch = wrapper.findAll('.el-switch')[1]
    expect((cacheSwitch?.element as HTMLInputElement).disabled).toBe(true)
  })

  it('showLayout 为 false 时不渲染布局模式切换', () => {
    const wrapper = mount(LumaThemeSettingsPanel, {
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences(),
        showLayout: false,
      },
    })

    expect(wrapper.text()).not.toContain('布局模式')
  })

  it('会按消费方 defaults 重置偏好并抛出 reset', async () => {
    const wrapper = mount(LumaThemeSettingsPanel, {
      global: { stubs: elementPlusStubs },
      props: {
        defaults: {
          app: { layout: 'mixed-nav' },
          theme: { mode: 'dark' },
        },
        preferences: createDefaultPreferences({
          app: { layout: 'top-nav' },
          theme: { mode: 'light' },
        }),
      },
    })

    await wrapper.find('.luma-theme-settings__reset').trigger('click')

    const reset = wrapper.emitted('reset') as [ReturnType<typeof createDefaultPreferences>][]
    expect(reset[0]?.[0]).toMatchObject({
      app: { layout: 'mixed-nav' },
      theme: { mode: 'dark' },
    })
  })
})
