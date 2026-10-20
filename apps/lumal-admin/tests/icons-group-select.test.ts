import { registerStaticLocalSvgIcons } from '@lumal/icons'
import { LumalIconPicker, LumalIconPickerDialog } from '@lumal/icons-vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import AppIconGroupSelect from '../src/components/app/AppIconGroupSelect.vue'
import { localIcons, registerAdminIcons } from '../src/icons'

enableAutoUnmount(afterEach)

beforeAll(() => {
  registerAdminIcons()
  registerStaticLocalSvgIcons(localIcons)
})

const Host = defineComponent({
  components: { LumalIconPicker, LumalIconPickerDialog, AppIconGroupSelect },
  props: { dialog: Boolean },
  template: `
    <LumalIconPickerDialog v-if="dialog" :visible="true" model-value="app:user">
      <template #group-select="slotProps">
        <AppIconGroupSelect v-bind="slotProps" />
      </template>
    </LumalIconPickerDialog>
    <LumalIconPicker v-else>
      <template #group-select="slotProps">
        <AppIconGroupSelect v-bind="slotProps" />
      </template>
    </LumalIconPicker>
  `,
})

describe('admin icon group select interaction', () => {
  it.each(['inline', 'dialog'] as const)('%s 中鼠标选择分组后自动收起，再次选择当前分组也正常收起', async (mode) => {
    // 使用真实控件和原生 click 默认行为，避免原生 select 替身掩盖重复打开的问题。
    const wrapper = mount(Host, {
      attachTo: document.body,
      props: { dialog: mode === 'dialog' },
    })
    await flushPromises()
    // 保留真实 Teleport，通过组件查询弹窗内容，覆盖实际焦点边界。
    const picker = wrapper.getComponent(LumalIconPicker)
    const groupSelect = picker.getComponent(AppIconGroupSelect)
    const combobox = groupSelect.get<HTMLInputElement>('[role="combobox"]')
    // jsdom 不完整模拟 label 的原生激活，额外防止复合控件重新落入 label。
    expect(combobox.element.closest('label')).toBeNull()

    for (let index = 0; index < 2; index += 1) {
      groupSelect.get<HTMLElement>('.el-select__wrapper').element.click()
      await flushPromises()
      expect(combobox.attributes('aria-expanded')).toBe('true')
      const option = groupSelect.findAll<HTMLElement>('.el-select-dropdown__item').find(option => option.text() === '应用 SVG')!
      option.element.click()
      await flushPromises()

      expect(combobox.attributes('aria-expanded')).toBe('false')
      expect(groupSelect.get('.el-select__selection').text()).toContain('应用 SVG')
      expect(picker.findAll('.lumal-icon-picker__item')).toHaveLength(localIcons.length)
      expect(document.activeElement).toBe(combobox.element)
      if (mode === 'dialog')
        expect(wrapper.getComponent(LumalIconPickerDialog).emitted('update:modelValue')).toBeUndefined()
    }
  })

  it.each(['inline', 'dialog'] as const)('%s 中键盘选择与 Escape 可收起分组列表，且不提前确认图标', async (mode) => {
    const wrapper = mount(Host, {
      attachTo: document.body,
      props: { dialog: mode === 'dialog' },
    })
    await flushPromises()
    const picker = wrapper.getComponent(LumalIconPicker)
    const groupSelect = picker.getComponent(AppIconGroupSelect)
    const combobox = groupSelect.get<HTMLInputElement>('[role="combobox"]')
    combobox.element.focus()
    await combobox.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    await flushPromises()
    expect(combobox.attributes('aria-expanded')).toBe('true')

    // 从首项向下选择“应用 SVG”，验证真实控件的键盘选择和筛选回写。
    await combobox.trigger('keydown', { key: 'Home', code: 'Home' })
    await combobox.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    await combobox.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    await combobox.trigger('keydown', { key: 'Enter', code: 'Enter' })
    await flushPromises()
    expect(combobox.attributes('aria-expanded')).toBe('false')
    expect(groupSelect.get('.el-select__selection').text()).toContain('应用 SVG')
    expect(picker.findAll('.lumal-icon-picker__item')).toHaveLength(localIcons.length)

    await combobox.trigger('keydown', { key: 'ArrowDown', code: 'ArrowDown' })
    await flushPromises()
    expect(combobox.attributes('aria-expanded')).toBe('true')
    await combobox.trigger('keydown', { key: 'Escape', code: 'Escape' })
    await flushPromises()
    expect(combobox.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(combobox.element)
    if (mode === 'dialog') {
      const dialog = wrapper.getComponent(LumalIconPickerDialog)
      expect(picker.element.closest('[role="dialog"]')?.isConnected).toBe(true)
      expect(dialog.emitted('update:modelValue')).toBeUndefined()
      expect(dialog.emitted('update:visible')).toBeUndefined()
    }
  })
})
