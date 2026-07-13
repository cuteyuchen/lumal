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
    await wrapper.findAll('.luma-theme-settings__tab')[0]?.trigger('click')
    const darkButton = wrapper.findAll('.luma-theme-settings__mode-card')
      .find(button => button.text() === '深色')

    await darkButton?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.mode).toBe('dark')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('选择预设主题色会写入 colorPrimary', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.luma-theme-settings__tab')[0]?.trigger('click')
    const colorButton = wrapper.find('.luma-theme-settings__color-card')

    await colorButton.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.colorPrimary).toBe('#1677ff')
  })

  it('关闭标签页开关会同步禁用缓存和持久化开关', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')
    const findRow = (label: string) => wrapper.findAll('.luma-theme-settings__row').find(row => row.text().includes(label))
    const enableInput = findRow('启用标签栏')?.find('input.el-switch')
    await enableInput?.setValue(false)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].tabbar.enable).toBe(false)

    const cacheInput = findRow('页面缓存')?.find('input.el-switch')
    expect((cacheInput?.element as HTMLInputElement).disabled).toBe(true)

    const persistInput = findRow('持久化标签')?.find('input.el-switch')
    expect((persistInput?.element as HTMLInputElement).disabled).toBe(true)
  })

  it('切换标签风格会写入 styleType 且发出 change', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')
    const styleButtons = wrapper.findAll('.luma-theme-settings__tab-style button')
    const plain = styleButtons.find(b => b.text().includes('朴素'))
    await plain?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].tabbar.styleType).toBe('plain')
  })

  it('顶部导航保留侧栏偏好入口但禁用当前无效的折叠设置', async () => {
    const wrapper = mount(LumaThemeSettingsPanel, {
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences({ app: { layout: 'top-nav' } }),
      },
    })

    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')

    const findRow = (label: string) => wrapper.findAll('.luma-theme-settings__row').find(row => row.text().includes(label))
    const showSidebar = findRow('显示侧边栏')?.find('input.el-switch')
    const collapse = findRow('折叠菜单')?.find('input.el-switch')

    expect((showSidebar?.element as HTMLInputElement).disabled).toBe(false)
    expect((collapse?.element as HTMLInputElement).disabled).toBe(true)
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

    expect(wrapper.findAll('.luma-theme-settings__tab').map(tab => tab.text())).toEqual(['外观', '布局', '通用'])
    expect(wrapper.findAll('.luma-theme-settings__transition-card')).toHaveLength(4)

    await wrapper.findAll('.luma-theme-settings__tab')[1]?.trigger('click')
    expect(wrapper.findAll('.luma-theme-settings__layout-card')).toHaveLength(3)

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
