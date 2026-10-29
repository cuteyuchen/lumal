import { mount } from '@vue/test-utils'
import { describe, expect, it, onTestFinished } from 'vitest'
import { createDefaultPreferences, LumalThemeSettingsPanel } from '../src/theme'
import { elementPlusStubs } from './helpers/element-plus-stubs'

function mountPanel(props: Partial<InstanceType<typeof LumalThemeSettingsPanel>['$props']> = {}) {
  const wrapper = mount(LumalThemeSettingsPanel, {
    global: {
      stubs: elementPlusStubs,
    },
    props: {
      preferences: createDefaultPreferences(),
      ...props,
    },
  })

  return wrapper
}

describe('lumal theme settings panel', () => {
  it('设置内容使用 Element Plus 滚动区域，页签和重置操作保留在区域外', async () => {
    const wrapper = mount(LumalThemeSettingsPanel, {
      global: {
        stubs: {
          ...elementPlusStubs,
          ElScrollbar: false,
        },
      },
      props: { preferences: createDefaultPreferences() },
    })
    onTestFinished(() => wrapper.unmount())

    const scrollArea = wrapper.get('.lumal-theme-settings__scroll.el-scrollbar')
    const scrollView = scrollArea.get('.el-scrollbar__view.lumal-theme-settings__scroll-view')
    expect(scrollArea.find('.el-scrollbar__wrap--hidden-default').exists()).toBe(true)
    expect(scrollView.findAll('[role="tabpanel"]')).toHaveLength(3)
    expect(scrollArea.find('[role="tablist"]').exists()).toBe(false)
    expect(scrollArea.find('.lumal-theme-settings__reset').exists()).toBe(false)

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    const activeTab = wrapper.get('[role="tab"][aria-selected="true"]')
    expect(activeTab.text()).toBe('布局')
    expect(scrollView.get(`[aria-labelledby="${activeTab.attributes('id')}"]`).isVisible()).toBe(true)
  })

  it('切换外观模式会更新 preferences 并抛出 change', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.lumal-theme-settings__tab')[0]?.trigger('click')
    const darkButton = wrapper.findAll('.lumal-theme-settings__mode-card')
      .find(button => button.text() === '深色')

    await darkButton?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.mode).toBe('dark')
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('选择预设主题色会写入 colorPrimary', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.lumal-theme-settings__tab')[0]?.trigger('click')
    const colorButton = wrapper.find('.lumal-theme-settings__color-card')

    await colorButton.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].theme.colorPrimary).toBe('#1677ff')
  })

  it('关闭标签页开关会同步禁用缓存和持久化开关', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.lumal-theme-settings__tab')[1]?.trigger('click')
    const findRow = (label: string) => wrapper.findAll('.lumal-theme-settings__row').find(row => row.text().includes(label))
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
    await wrapper.findAll('.lumal-theme-settings__tab')[1]?.trigger('click')
    const styleButtons = wrapper.findAll('.lumal-theme-settings__tab-style button')
    const plain = styleButtons.find(b => b.text().includes('朴素'))
    await plain?.trigger('click')

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].tabbar.styleType).toBe('plain')
  })

  it('顶部导航保留侧栏偏好入口但禁用当前无效的折叠设置', async () => {
    const wrapper = mount(LumalThemeSettingsPanel, {
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences({ app: { layout: 'top-nav' } }),
      },
    })

    await wrapper.findAll('.lumal-theme-settings__tab')[1]?.trigger('click')

    const findRow = (label: string) => wrapper.findAll('.lumal-theme-settings__row').find(row => row.text().includes(label))
    const showSidebar = findRow('显示侧边栏')?.find('input.el-switch')
    const autoActivateChild = findRow('自动进入首个子菜单')?.find('input.el-switch')
    const collapse = findRow('折叠菜单')?.find('input.el-switch')

    expect((showSidebar?.element as HTMLInputElement).disabled).toBe(false)
    expect((autoActivateChild?.element as HTMLInputElement).disabled).toBe(true)
    expect((collapse?.element as HTMLInputElement).disabled).toBe(true)
  })

  it('混合导航可以开启自动进入首个子菜单', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.lumal-theme-settings__tab')[1]?.trigger('click')
    const row = wrapper.findAll('.lumal-theme-settings__row')
      .find(item => item.text().includes('自动进入首个子菜单'))
    const input = row?.find('input.el-switch')

    expect((input?.element as HTMLInputElement).disabled).toBe(false)
    await input?.setValue(true)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates?.at(-1)?.[0].sidebar.autoActivateChild).toBe(true)
  })

  it('showLayout 为 false 时不渲染布局模式切换', () => {
    const wrapper = mount(LumalThemeSettingsPanel, {
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences(),
        showLayout: false,
      },
    })

    expect(wrapper.text()).not.toContain('布局模式')
    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['外观', '通用'])
    expect(wrapper.find('[aria-label="显示侧边栏"]').exists()).toBe(false)
  })

  it('提供三页签和四种可选择的动画预览', async () => {
    const wrapper = mountPanel()

    expect(wrapper.findAll('.lumal-theme-settings__tab').map(tab => tab.text())).toEqual(['外观', '布局', '通用'])
    expect(wrapper.findAll('.lumal-theme-settings__transition-card')).toHaveLength(4)

    await wrapper.findAll('.lumal-theme-settings__tab')[1]?.trigger('click')
    expect(wrapper.findAll('.lumal-theme-settings__layout-card')).toHaveLength(3)

    await wrapper.find('.lumal-theme-settings__transition-card.is-zoom-fade').trigger('click')
    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-1)?.[0].transition.name).toBe('zoom-fade')
  })

  it('会按消费方 defaults 重置偏好并抛出 reset', async () => {
    const wrapper = mount(LumalThemeSettingsPanel, {
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

    await wrapper.find('.lumal-theme-settings__reset').trigger('click')

    const reset = wrapper.emitted('reset') as [ReturnType<typeof createDefaultPreferences>][]
    expect(reset[0]?.[0]).toMatchObject({
      app: { layout: 'mixed-nav' },
      theme: { mode: 'dark' },
    })
  })

  it('通用设置会更新动态标题、搜索快捷键和面包屑开关', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('.lumal-theme-settings__tab')[2]?.trigger('click')
    const findRow = (label: string) => wrapper.findAll('.lumal-theme-settings__row').find(row => row.text().includes(label))

    await findRow('动态页面标题')?.find('input.el-switch').setValue(false)
    await findRow('全局搜索')?.find('input.el-switch').setValue(false)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-2)?.[0].app.dynamicTitle).toBe(false)
    expect(updates.at(-1)?.[0].header.globalSearch).toBe(false)
    expect((findRow('搜索快捷键')?.find('input.el-switch').element as HTMLInputElement).disabled).toBe(true)

    await findRow('显示面包屑')?.find('input.el-switch').setValue(false)
    expect(updates.at(-1)?.[0].breadcrumb.enable).toBe(false)
    expect((findRow('显示首页')?.find('input.el-switch').element as HTMLInputElement).disabled).toBe(true)
  })

  it('外观设置会更新受限的全局字号', async () => {
    const wrapper = mountPanel()
    const fontRow = wrapper.findAll('.lumal-theme-settings__row').find(row => row.text().includes('全局字号'))
    const input = fontRow?.find('input.el-input-number')

    expect(input?.attributes('min')).toBe('12')
    expect(input?.attributes('max')).toBe('20')
    await input?.setValue(18)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-1)?.[0].theme.fontSize).toBe(18)
  })

  it('字号和宽度仅保留数字输入，侧栏默认 200 且修改会更新偏好', async () => {
    const wrapper = mount(LumalThemeSettingsPanel, {
      global: {
        stubs: {
          ...elementPlusStubs,
          // 共用替身未渲染 step，此处补齐以验证数字输入的公开属性。
          ElInputNumber: {
            extends: elementPlusStubs.ElInputNumber,
            template: '<input class="el-input-number" :disabled="disabled" :max="max" :min="min" :step="step" type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))">',
          },
        },
      },
      props: { preferences: createDefaultPreferences() },
    })

    expect(wrapper.find('input[type="range"], .el-slider').exists()).toBe(false)
    const fontInput = wrapper.get('input.el-input-number[aria-label="全局字号"]')
    expect(fontInput.attributes()).toMatchObject({ max: '20', min: '12', step: '1', type: 'number' })
    await fontInput.setValue(18)

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    const headerInput = wrapper.get('input.el-input-number[aria-label="菜单最大宽度"]')
    const sidebarInput = wrapper.get('input.el-input-number[aria-label="侧边栏宽度"]')
    expect(headerInput.attributes()).toMatchObject({ max: '1440', min: '480', step: '40', type: 'number' })
    expect(sidebarInput.attributes()).toMatchObject({ max: '320', min: '200', step: '8', type: 'number' })
    expect((sidebarInput.element as HTMLInputElement).value).toBe('200')

    await headerInput.setValue(1280)
    await sidebarInput.setValue(232)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates[0]?.[0].theme.fontSize).toBe(18)
    expect(updates[1]?.[0].header.menuMaxWidth).toBe(1280)
    expect(updates[2]?.[0]).toMatchObject({
      header: { menuMaxWidth: 1280 },
      sidebar: { width: 232 },
      theme: { fontSize: 18 },
    })
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toEqual(updates.at(-1)?.[0])
  })

  it('隐藏主题模式时仍可修改其他外观项，重置遵循消费方默认模式', async () => {
    const wrapper = mountPanel({
      defaults: { theme: { mode: 'light' } },
      preferences: createDefaultPreferences({ theme: { mode: 'dark' } }),
      visibility: { theme: { mode: false } },
    })

    expect(wrapper.findAll('.lumal-theme-settings__mode-card')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('主题模式')
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('外观')
    expect(wrapper.emitted('update:preferences')).toBeUndefined()

    await wrapper.get('button[aria-label="深绿色"]').trigger('click')
    await wrapper.get('button[aria-label="圆角比例 1"]').trigger('click')
    await wrapper.get('input.el-input-number[aria-label="全局字号"]').setValue(18)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-1)?.[0].theme).toMatchObject({
      colorPrimary: '#0f766e',
      fontSize: 18,
      mode: 'dark',
      radiusScale: 1,
    })

    await wrapper.get('.lumal-theme-settings__reset').trigger('click')
    const resets = wrapper.emitted('reset') as [ReturnType<typeof createDefaultPreferences>][]
    expect(resets.at(-1)?.[0].theme.mode).toBe('light')
    expect(wrapper.findAll('.lumal-theme-settings__mode-card')).toHaveLength(0)
  })

  it('隐藏整个主题组会移除外观页签，初始和重置后均回退布局', async () => {
    const wrapper = mountPanel({ visibility: { theme: false } })

    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['布局', '通用'])
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('布局')
    expect(wrapper.findAll('.lumal-theme-settings__color-card')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('内置主题')

    await wrapper.get('.lumal-theme-settings__reset').trigger('click')
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('布局')
  })

  it('隐藏顶栏整组会同时移除通用搜索和布局菜单项', () => {
    const wrapper = mountPanel({ visibility: { header: false } })

    expect(wrapper.find('[aria-label="全局搜索"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="菜单最大宽度"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('菜单位置')
    expect(wrapper.find('[aria-label="搜索快捷键"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
  })

  it('仅保留顶栏全局搜索时不会因跨组字段留下空布局页签', () => {
    const wrapper = mountPanel({
      visibility: {
        app: { layout: false },
        header: { menuAlign: false, menuMaxWidth: false },
        sidebar: false,
        tabbar: false,
      },
    })

    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['外观', '通用'])
    expect(wrapper.find('[aria-label="全局搜索"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="菜单最大宽度"]').exists()).toBe(false)
    expect(wrapper.findAll('.lumal-theme-settings__layout-card')).toHaveLength(0)
  })

  it('全部偏好组隐藏时只显示空状态，不渲染页签或重置操作', () => {
    const wrapper = mountPanel({
      visibility: {
        app: false,
        breadcrumb: false,
        header: false,
        shortcutKeys: false,
        sidebar: false,
        tabbar: false,
        theme: false,
        transition: false,
      },
    })

    expect(wrapper.get('[role="status"]').text()).toBe('暂无可配置项')
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
    expect(wrapper.find('.el-scrollbar').exists()).toBe(false)
    expect(wrapper.find('.lumal-theme-settings__reset').exists()).toBe(false)
    expect(wrapper.emitted('update:preferences')).toBeUndefined()
  })

  it('showReset 为 false 时隐藏恢复默认按钮，但保留偏好设置', () => {
    const wrapper = mountPanel({ showReset: false })

    expect(wrapper.find('.lumal-theme-settings__reset').exists()).toBe(false)
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
    expect(wrapper.findAll('.lumal-theme-settings__mode-card')).toHaveLength(3)
  })

  it('运行时隐藏当前页签后自动回退到现有可见页签', async () => {
    const wrapper = mountPanel()
    await wrapper.setProps({ visibility: { theme: false } })

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('布局')
    await wrapper.get('[role="tab"]:last-child').trigger('click')
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('通用')

    await wrapper.setProps({
      visibility: {
        app: { dynamicTitle: false },
        breadcrumb: false,
        header: { globalSearch: false },
        shortcutKeys: false,
        theme: false,
        transition: false,
      },
    })

    expect(wrapper.findAll('[role="tab"]').map(tab => tab.text())).toEqual(['布局'])
    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('布局')
    expect(wrapper.get('[role="tab"]').attributes('tabindex')).toBe('0')
  })

  it('分类键盘导航支持方向键和首尾跳转，仅当前页签可由 Tab 进入', async () => {
    const wrapper = mountPanel()
    const expectSelectedTab = (label: string) => {
      const tabs = wrapper.findAll('[role="tab"]')
      expect(wrapper.findAll('[role="tab"][aria-selected="true"]')).toHaveLength(1)
      expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe(label)
      expect(wrapper.findAll('[role="tab"][tabindex="0"]')).toHaveLength(1)
      expect(wrapper.get('[role="tab"][tabindex="0"]').text()).toBe(label)
      expect(wrapper.findAll('[role="tab"][tabindex="-1"]')).toHaveLength(tabs.length - 1)
    }

    expectSelectedTab('外观')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
    expectSelectedTab('布局')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'ArrowLeft' })
    expectSelectedTab('外观')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'ArrowLeft' })
    expectSelectedTab('通用')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'ArrowRight' })
    expectSelectedTab('外观')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'End' })
    expectSelectedTab('通用')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'Home' })
    expectSelectedTab('外观')

    await wrapper.setProps({ visibility: { theme: false } })
    expectSelectedTab('布局')
    await wrapper.get('[role="tab"][aria-selected="true"]').trigger('keydown', { key: 'ArrowLeft' })
    expectSelectedTab('通用')
  })

  it('恢复隐藏页签后键盘导航会将焦点移至选中的布局按钮', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const wrapper = mount(LumalThemeSettingsPanel, {
      attachTo: container,
      global: { stubs: elementPlusStubs },
      props: {
        preferences: createDefaultPreferences(),
        visibility: { theme: false },
      },
    })
    onTestFinished(() => {
      wrapper.unmount()
      container.remove()
    })

    await wrapper.setProps({ visibility: {} })
    const appearanceButton = wrapper.get('[role="tab"][aria-selected="true"]')
    const layoutButton = wrapper.findAll('[role="tab"]').find(tab => tab.text() === '布局')!

    expect(appearanceButton.text()).toBe('外观')
    await appearanceButton.trigger('keydown', { key: 'ArrowRight' })

    expect(layoutButton.attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(layoutButton.element)
  })

  it('刷新按钮开关会更新 showRefresh 且支持单独隐藏', async () => {
    const wrapper = mountPanel()
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    const input = wrapper.get('input.el-switch[aria-label="显示刷新按钮"]')

    expect((input.element as HTMLInputElement).checked).toBe(true)
    await input.setValue(false)

    const updates = wrapper.emitted('update:preferences') as [ReturnType<typeof createDefaultPreferences>][]
    expect(updates.at(-1)?.[0].tabbar.showRefresh).toBe(false)
    expect(wrapper.emitted('change')?.at(-1)?.[0]).toEqual(updates.at(-1)?.[0])

    await wrapper.setProps({ visibility: { tabbar: { showRefresh: false } } })
    expect(wrapper.find('[aria-label="显示刷新按钮"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="显示标签图标"]').exists()).toBe(true)
  })
})
