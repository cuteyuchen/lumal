import { addIcon } from '@iconify/vue'
import { registerIcons } from '@lumal/icons'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { LumalIcon, LumalIconPicker, LumalIconPickerDialog } from '../src'

describe('lumalIcon', () => {
  it('真实 Teleport 弹窗约束焦点，关闭和卸载都恢复原触发点', async () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(LumalIconPickerDialog, {
      attachTo: document.body,
      props: { visible: true, modelValue: 'app:component' },
    })
    try {
      await flushPromises()
      const dialog = document.body.querySelector<HTMLElement>('[role="dialog"]')!
      expect(wrapper.element.contains(dialog)).toBe(false)
      expect(document.activeElement).toBe(dialog)
      const elements = [...dialog.querySelectorAll<HTMLElement>('button, input, select')]
        .filter(element => !element.matches(':disabled'))
      const first = elements[0]!
      const last = elements[elements.length - 1]!
      last.focus()
      last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }))
      expect(document.activeElement).toBe(first)
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }))
      expect(document.activeElement).toBe(last)
      trigger.focus()
      expect(document.activeElement).toBe(dialog)
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await flushPromises()
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()
      expect(document.activeElement).toBe(trigger)
      await wrapper.setProps({ visible: false })
      await wrapper.setProps({ visible: true })
      await flushPromises()
    }
    finally {
      wrapper.unmount()
      expect(document.activeElement).toBe(trigger)
      trigger.remove()
    }
  })

  it('直接定义按 source 渲染 SVG、组件和 Iconify，不会误把定义当组件', async () => {
    const svg = mount(LumalIcon, {
      props: { icon: { key: 'direct:svg', source: 'local-svg', svgText: '<svg><path d="M0 0h2v2z"/></svg>' } },
    })
    expect(svg.find('svg path').exists()).toBe(true)
    svg.unmount()
    const component = mount(LumalIcon, {
      props: {
        icon: {
          key: 'direct:component',
          source: 'component',
          component: defineComponent({ setup: () => () => h('svg', { 'data-direct': 'component' }) }),
        },
      },
    })
    expect(component.find('[data-direct="component"]').exists()).toBe(true)
    component.unmount()
    addIcon('test:icon', { body: '<path data-iconify="direct" d="M0 0h2v2z"/>', width: 16, height: 16 })
    const iconify = mount(LumalIcon, {
      props: { icon: { key: 'direct:iconify', source: 'iconify', icon: 'test:icon' } },
    })
    await nextTick()
    expect(iconify.find('[data-iconify="direct"]').exists()).toBe(true)
    iconify.unmount()
  })

  it('可以渲染已注册的 SVG 图标', () => {
    registerIcons([
      {
        key: 'app:component',
        label: '组件图标',
        source: 'local-svg',
        svgText: '<svg viewBox="0 0 16 16"><path fill="currentColor" d="M1 1h14v14H1z"/></svg>',
      },
    ])

    const wrapper = mount(LumalIcon, {
      props: {
        name: 'app:component',
        color: '#1677ff',
        size: 20,
      },
    })

    expect(wrapper.classes()).toContain('lumal-icon')
    expect(wrapper.html()).toContain('#1677ff')
    expect(wrapper.attributes('style')).toContain('--lumal-icon-size: 20px')
  })

  it('注册表变化后选择器可以搜索、分页并选择图标', async () => {
    const wrapper = mount(LumalIconPicker, {
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
    const wrapper = mount(LumalIconPickerDialog, {
      global: { stubs: { Teleport: true } },
      props: {
        'modelValue': 'app:component',
        'visible': true,
        'onUpdate:modelValue': onUpdate,
      },
    })

    await nextTick()
    await wrapper.get('[aria-label="响应式图标二"]').trigger('click')
    expect(onUpdate).not.toHaveBeenCalled()

    await wrapper.get('.lumal-icon-picker-dialog__footer .is-primary').trigger('click')
    expect(onUpdate).toHaveBeenCalledWith('reactive-test:second')
    expect(wrapper.emitted('confirm')).toEqual([['reactive-test:second']])
    wrapper.unmount()
  })
})
