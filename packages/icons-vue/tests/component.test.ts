import { registerIcons } from '@luma/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { LumaIcon, LumaIconPicker, LumaIconPickerDialog } from '../src'

describe('lumaIcon', () => {
  it('可以渲染已注册的 SVG 图标', () => {
    registerIcons([
      {
        key: 'app:component',
        label: '组件图标',
        source: 'local-svg',
        svgText: '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M1 1h14v14H1z"/></svg>',
      },
    ])

    const wrapper = mount(LumaIcon, {
      props: {
        name: 'app:component',
        color: '#1677ff',
        size: 20,
      },
    })

    expect(wrapper.classes()).toContain('luma-icon')
    expect(wrapper.html()).toContain('#1677ff')
    expect(wrapper.attributes('style')).toContain('--luma-icon-size: 20px')
  })

  it('注册表变化后选择器可以搜索、分页并选择图标', async () => {
    const wrapper = mount(LumaIconPicker, {
      props: {
        pageSize: 1,
        showLabels: true,
      },
    })

    registerIcons([
      {
        group: 'reactive-test',
        key: 'reactive-test:first',
        label: '响应式图标一',
        source: 'local-svg',
        svgText: '<svg><path fill="currentColor" /></svg>',
      },
      {
        group: 'reactive-test',
        key: 'reactive-test:second',
        label: '响应式图标二',
        source: 'local-svg',
        svgText: '<svg><circle fill="currentColor" /></svg>',
      },
    ])
    await nextTick()

    const search = wrapper.get('input[type="search"]')
    await search.setValue('响应式图标二')
    expect(wrapper.text()).toContain('共 1 个图标')

    await wrapper.get('[role="option"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['reactive-test:second'])
    expect(wrapper.emitted('select')?.at(-1)?.[0]).toMatchObject({ key: 'reactive-test:second' })
  })

  it('弹窗仅在确认后更新外部图标值', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(LumaIconPickerDialog, {
      props: {
        'modelValue': 'app:component',
        'visible': true,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await nextTick()
    await wrapper.get('[aria-label="响应式图标二"]').trigger('click')
    expect(onUpdate).not.toHaveBeenCalled()

    await wrapper.get('.luma-icon-picker-dialog__footer .is-primary').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith('reactive-test:second')
    expect(wrapper.emitted('confirm')).toEqual([['reactive-test:second']])
  })
})
