import type { CockpitCardTab } from '../src/runtime/card'
import type { CockpitConfig, CockpitWidgetInstance } from '../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'
import { useCockpitContext } from '../src/composables/useCockpitContext'
import { createCockpitRegistry } from '../src/registry/createCockpitRegistry'
import LumaCockpit from '../src/runtime/LumaCockpit.vue'

const StubWidget = defineComponent({
  name: 'StubWidget',
  setup() {
    const context = useCockpitContext()
    return () => h('div', { 'class': 'stub-widget', 'data-layout': context.layoutId, 'data-instance': context.instanceId }, context.instanceId)
  },
})

function registry(label = 'Stub') {
  const value = createCockpitRegistry()
  value.registerWidget({ type: 'stub', label, component: StubWidget })
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
        id: 'layout-a',
        title: '布局 A',
        left: { columns: [{ id: 'left-col', width: 320 }], rows: [{ id: 'left-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'left-cell', widget: { id: 'left-widget', type: 'stub' } }] }] },
        right: { columns: [{ id: 'right-col', width: 320 }], rows: [{ id: 'right-row', height: 100, mode: 'tabs', cells: [], activeWidgetId: 'right-a', widgets: [{ id: 'right-a', type: 'stub', title: '甲' }, { id: 'right-b', type: 'stub', title: '乙' }] }] },
      },
      {
        id: 'layout-b',
        title: '布局 B',
        left: { columns: [{ id: 'left-b-col', width: 320 }], rows: [{ id: 'left-b-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'left-b-cell', widget: { id: 'left-b-widget', type: 'stub' } }] }] },
        right: { columns: [{ id: 'right-b-col', width: 320 }], rows: [{ id: 'right-b-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'right-b-cell' }] }] },
      },
    ],
  }
}

function titleFallbackConfig(): CockpitConfig {
  return {
    schemaVersion: 3,
    id: 'title-fallback-cockpit',
    title: '标题回退测试',
    activeLayoutId: 'layout-a',
    layouts: [{
      id: 'layout-a',
      title: '布局 A',
      left: {
        columns: [
          { id: 'left-a', width: 200 },
          { id: 'left-b', width: 200 },
          { id: 'left-c', width: 200 },
        ],
        rows: [{
          id: 'left-row',
          height: 100,
          mode: 'grid',
          widgets: [],
          cells: [
            { id: 'explicit-cell', widget: { id: 'explicit-widget', type: 'stub', title: '显式标题' } },
            { id: 'registry-cell', widget: { id: 'registry-widget', type: 'stub' } },
            { id: 'type-cell', widget: { id: 'type-widget', type: 'unknown-type' } },
          ],
        }],
      },
      right: {
        columns: [{ id: 'right-col', width: 320 }],
        rows: [{ id: 'right-row', height: 100, mode: 'grid', widgets: [], cells: [{ id: 'right-cell' }] }],
      },
    }],
  }
}

describe('lumaCockpit v3 运行时', () => {
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

  it('普通模块与合并行各自只有一个视觉 Card，合并行切换时保留所有模块实例', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry() } })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(wrapper.findAll('.luma-cockpit-card')).toHaveLength(2)
    expect(wrapper.get('[data-cockpit-node-id="left-widget"]').findAll('.luma-cockpit-card')).toHaveLength(1)
    const tabRow = wrapper.get('[data-cockpit-node-id="right-row"]')
    expect(tabRow.findAll('.luma-cockpit-card')).toHaveLength(1)
    expect(tabRow.findAll('.luma-cockpit-widget .luma-cockpit-card')).toHaveLength(0)
    expect(tabRow.findAll('.luma-cockpit-card__header')).toHaveLength(1)
    expect(tabs.map(tab => tab.text())).toEqual(['甲', '乙'])
    // Tab 首次激活时挂载，访问后使用 v-show 保留实例状态。
    expect(wrapper.findAll('.stub-widget')).toHaveLength(2)
    expect(tabRow.findAll('.luma-cockpit-container__tabpanel')).toHaveLength(1)
    await tabs[1].trigger('click')
    expect(tabs[1].attributes('aria-selected')).toBe('true')
    const panels = tabRow.findAll('.luma-cockpit-container__tabpanel')
    expect(panels).toHaveLength(2)
    expect((panels[0].element as HTMLElement).style.display).toBe('none')
    expect((panels[1].element as HTMLElement).style.display).toBe('')
    expect(wrapper.findAll('.stub-widget')).toHaveLength(3)
    await tabs[0].trigger('click')
    expect(wrapper.findAll('.stub-widget')).toHaveLength(3)
  })

  it('配置中的 activeWidgetId 更新后同步切换合并行', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry() } })
    const nextConfig = config()
    nextConfig.layouts[0].right.rows[0].activeWidgetId = 'right-b'

    await wrapper.setProps({ config: nextConfig })

    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map(tab => tab.attributes('aria-selected'))).toEqual(['false', 'true'])
  })

  it('同一网格槽替换模块实例时重建实例上下文', async () => {
    const wrapper = mount(LumaCockpit, { props: { config: config(), registry: registry() } })
    const nextConfig = config()
    nextConfig.layouts[0].left.rows[0].cells[0].widget = { id: 'left-widget-next', type: 'stub' }

    await wrapper.setProps({ config: nextConfig })

    const widget = wrapper.get('[data-instance-id="left-widget-next"] .stub-widget')
    expect(widget.attributes('data-instance')).toBe('left-widget-next')
  })

  it('模块标题按显式标题、注册表 label、type 依次回退', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: titleFallbackConfig(), registry: registry('注册标题') },
    })

    expect(wrapper.get('[data-instance-id="explicit-widget"] .luma-cockpit-card__title').text()).toBe('显式标题')
    expect(wrapper.get('[data-instance-id="registry-widget"] .luma-cockpit-card__title').text()).toBe('注册标题')
    expect(wrapper.get('[data-instance-id="type-widget"] .luma-cockpit-card__title').text()).toBe('unknown-type')
  })

  it('widget-title 插槽同时接管普通标题与合并行 Tab 标题', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: config(), registry: registry() },
      slots: {
        'widget-title': ({ widget, title }: { widget: CockpitWidgetInstance, title: string }) => h(
          'span',
          { 'class': 'custom-widget-title', 'data-widget-id': widget.id },
          `自定义:${title}`,
        ),
      },
    })

    expect(wrapper.get('[data-instance-id="left-widget"] .custom-widget-title').text()).toBe('自定义:Stub')
    expect(wrapper.findAll('[role="tab"] .custom-widget-title').map(title => title.text())).toEqual([
      '自定义:甲',
      '自定义:乙',
    ])
    expect(wrapper.findAll('.custom-widget-title')).toHaveLength(3)
  })

  it('允许自定义 cardComponent 完整替换默认 Card，并透传内容与 Tab 切换', async () => {
    const CustomCard = defineComponent({
      name: 'CustomCard',
      props: {
        title: String,
        tabs: { type: Array as () => CockpitCardTab[], default: () => [] },
        activeTabId: String,
      },
      emits: ['update:activeTabId'],
      setup(props, { emit, slots }) {
        return () => h('article', {
          'class': 'custom-cockpit-card',
          'data-active-tab-id': props.activeTabId,
        }, [
          h('header', { class: 'custom-cockpit-card__header' }, props.tabs.length
            ? props.tabs.map(tab => h('button', {
                class: 'custom-cockpit-card__tab',
                type: 'button',
                onClick: () => emit('update:activeTabId', tab.id),
              }, tab.title))
            : props.title),
          h('div', { class: 'custom-cockpit-card__body' }, slots.default?.({ activeTabId: props.activeTabId })),
        ])
      },
    })
    const wrapper = mount(LumaCockpit, {
      props: { config: config(), registry: registry(), cardComponent: markRaw(CustomCard) },
    })

    expect(wrapper.findAll('.luma-cockpit-card')).toHaveLength(0)
    expect(wrapper.findAll('.custom-cockpit-card')).toHaveLength(2)
    expect(wrapper.get('[data-instance-id="left-widget"] .stub-widget').exists()).toBe(true)
    expect(wrapper.findAll('.stub-widget')).toHaveLength(2)
    expect(wrapper.get('.custom-cockpit-card[data-active-tab-id="right-a"]').exists()).toBe(true)

    await wrapper.findAll('.custom-cockpit-card__tab')[1].trigger('click')
    expect(wrapper.get('.custom-cockpit-card[data-active-tab-id="right-b"]').exists()).toBe(true)
    expect(wrapper.findAll('.stub-widget')).toHaveLength(3)
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
    const stageStyle = wrapper.find('.luma-cockpit-canvas__stage').attributes('style')
    expect(stageStyle).toContain('100vw')
    expect(stageStyle).toContain('--luma-cockpit-x-unit')
    expect(stageStyle).toContain('--luma-cockpit-y-unit')
    expect(wrapper.find('.luma-cockpit-region').attributes('style')).toContain('--luma-cockpit-x-unit')
    expect(wrapper.find('.luma-cockpit-container__grid').attributes('style')).toContain('--luma-cockpit-x-unit')
  })
})
