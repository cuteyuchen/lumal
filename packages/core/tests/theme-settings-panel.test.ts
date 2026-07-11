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
    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')
    const darkButton = wrapper.findAll('.luma-theme-settings__mode-card')
      .find(button => button.text() === '深色')

    await darkButton?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.mode).toBe('dark')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('选择预设主题色会写入 colorPrimary', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')
    const colorButton = wrapper.find('.luma-theme-settings__color-card')

    await colorButton.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.colorPrimary).toBe('#1677ff')
  })

  it('关闭标签页开关会同步禁用缓存开关', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.luma-theme-settings__tab')[2]?.trigger('click')
    const switches = wrapper.findAll('.el-switch')
    // DOM 中通用页的三个动画开关在前，布局页标签栏开关位于第六项。
    await switches[5]?.setValue(false)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].tabbar.enable).toBe(false)

    const cacheSwitch = wrapper.findAll('.el-switch')[6]
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

  it('提供三页签和四种可选择的动画预览', async () => {
    const wrapper = mountPanel()

    expect(wrapper.findAll('.luma-theme-settings__tab').map(tab => tab.text())).toEqual(['通用', '主题', '布局'])
    expect(wrapper.findAll('.luma-theme-settings__transition-card')).toHaveLength(4)

    await wrapper.find('.luma-theme-settings__transition-card.is-zoom-fade').trigger('click')
    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-1)?.[0].transition.name).toBe('zoom-fade')
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
