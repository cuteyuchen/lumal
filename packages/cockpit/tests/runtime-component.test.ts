import type { CockpitConfig } from '../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useCockpitContext } from '../src/composables/useCockpitContext'
import { createCockpitRegistry } from '../src/registry/createCockpitRegistry'
import LumaCockpit from '../src/runtime/LumaCockpit.vue'

const StubWidget = defineComponent({
  name: 'StubWidget',
  setup() {
    const context = useCockpitContext()
    return () => h('div', { class: 'stub-widget', 'data-layout': context.layoutId, 'data-instance': context.instanceId }, context.instanceId)
  },
})

function registry() {
  const value = createCockpitRegistry()
  value.registerWidget({ type: 'stub', label: 'Stub', component: StubWidget })
  return value
}

function config(): CockpitConfig {
  return {
    schemaVersion: 3,
    id: 'cockpit',
    title: '测试驾驶舱',
    activeLayoutId: 'layout-a',
    layouts: [
      {
        id: 'layout-a', title: '布局 A',
        left: { columns: [{ id: 'left-col', width: 320 }], rows: [{ id: 'left-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'left-cell', widget: { id: 'left-widget', type: 'stub' } }] }] },
        right: { columns: [{ id: 'right-col', width: 320 }], rows: [{ id: 'right-row', height: 100, mode: 'tabs', cells: [], activeWidgetId: 'right-a', widgets: [{ id: 'right-a', type: 'stub', title: '甲' }, { id: 'right-b', type: 'stub', title: '乙' }] }] },
      },
      {
        id: 'layout-b', title: '布局 B',
        left: { columns: [{ id: 'left-b-col', width: 320 }], rows: [{ id: 'left-b-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'left-b-cell', widget: { id: 'left-b-widget', type: 'stub' } }] }] },
        right: { columns: [{ id: 'right-b-col', width: 320 }], rows: [{ id: 'right-b-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'right-b-cell' }] }] },
      },
    ],
  }
}

describe('LumaCockpit v3 运行时', () => {
  it('渲染当前布局、模块和消费应用提供的中心插槽', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: config(), registry: registry() },
      slots: { center: ({ context }: { context: { layoutId: string } }) => h('div', { class: 'stub-center' }, context.layoutId) },
    })
    expect(wrapper.text()).toContain('测试驾驶舱')
    expect(wrapper.find('.stub-center').text()).toBe('layout-a')
    expect(wrapper.find('.stub-widget').attributes('data-layout')).toBe('layout-a')
    expect(wrapper.find('[aria-label="页面选择"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="分类导航"]').exists()).toBe(false)
  })

  it('由 activeLayoutId 控制当前布局', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry(), activeLayoutId: 'layout-b' } })
    expect(wrapper.find('.stub-widget').attributes('data-instance')).toBe('left-b-widget')
    await wrapper.setProps({ activeLayoutId: 'layout-a' })
    expect(wrapper.find('.stub-widget').attributes('data-instance')).toBe('left-widget')
  })

  it('Tab 行只显示激活模块且可切换', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry() } })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    // Tab 面板使用 v-show 保留非激活模块状态，左侧模块加两个 Tab 模块共三实例。
    expect(wrapper.findAll('.stub-widget')).toHaveLength(3)
    await tabs[1].trigger('click')
    expect(tabs[1].attributes('aria-selected')).toBe('true')
  })

  it('design 模式点击模块发出 v3 节点事件', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry(), renderMode: 'design' } })
    await wrapper.find('.stub-widget').trigger('click')
    expect(wrapper.emitted('nodeSelect')?.[0]).toEqual([{ kind: 'widget', id: 'left-widget', side: 'left' }])
  })

  it('中心内容先渲染为底层，左右区域随后作为覆盖层', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: config(), registry: registry() },
      slots: { center: () => h('div', { class: 'stub-center' }) },
    })
    const bodyChildren = wrapper.find('.luma-cockpit-canvas__body').element.children
    expect(bodyChildren[0].classList.contains('luma-cockpit-canvas__center')).toBe(true)
    expect(bodyChildren[1].classList.contains('luma-cockpit-canvas__left')).toBe(true)
    expect(bodyChildren[2].classList.contains('luma-cockpit-canvas__right')).toBe(true)
  })

  it('支持由消费方选择 vwvh 适配模式', () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry(), viewportMode: 'vwvh' } })
    expect(wrapper.attributes('data-viewport-mode')).toBe('vwvh')
    expect(wrapper.find('.luma-cockpit-canvas').attributes('data-viewport-mode')).toBe('vwvh')
    expect(wrapper.find('.luma-cockpit-canvas__stage').attributes('style')).toContain('100vw')
    expect(wrapper.find('.luma-cockpit-region').attributes('style')).toContain('--luma-cockpit-x-unit')
  })
})
