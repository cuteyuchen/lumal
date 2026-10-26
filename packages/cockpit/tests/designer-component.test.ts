import type { CockpitConfig, CockpitDesignerSavePayload } from '../src/types'
import { mount } from '@vue/test-utils'
import ElementPlus, { ElMessageBox } from 'element-plus'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { useCockpitContext } from '../src/composables/useCockpitContext'
import LumalCockpitDesigner from '../src/designer/LumalCockpitDesigner.vue'
import { createCockpitRegistry } from '../src/registry/createCockpitRegistry'

const observedMessages = new Map<string, unknown>()

const StubWidget = defineComponent({
  name: 'DesignerStubWidget',
  setup() {
    const context = useCockpitContext()
    observedMessages.set(context.instanceId, context.messages)
    return () => h('div', {
      'class': 'designer-stub-widget',
      'data-instance': context.instanceId,
      'data-layout': context.layoutId,
    })
  },
})

const CenterProbe = defineComponent({
  name: 'DesignerCenterProbe',
  setup() {
    const context = useCockpitContext()
    observedMessages.set(context.instanceId, context.messages)
    return () => h('div', {
      'class': 'designer-center-probe',
      'data-instance': context.instanceId,
      'data-layout': context.layoutId,
      'data-mode': context.mode,
    })
  },
})

function config(): CockpitConfig {
  return {
    schemaVersion: 3,
    id: 'designer-cockpit',
    title: '配置测试',
    activeLayoutId: 'layout-a',
    layouts: [{
      id: 'layout-a',
      title: '布局 A',
      left: {
        width: 320,
        columns: [{ id: 'left-column', width: 320 }],
        rows: [{ id: 'left-row', height: 100, mode: 'grid', cells: [{ id: 'left-cell' }], widgets: [] }],
      },
      right: {
        width: 320,
        columns: [{ id: 'right-column', width: 320 }],
        rows: [{ id: 'right-row', height: 100, mode: 'grid', cells: [{ id: 'right-cell' }], widgets: [] }],
      },
    }],
  }
}

function registry() {
  const value = createCockpitRegistry()
  value.registerWidget({ type: 'stub', label: '示例模块', component: StubWidget })
  value.registerWidget({ type: 'stub-b', label: '示例模块 B', component: StubWidget })
  return value
}

function mountDesigner(current = config(), slots: Record<string, unknown> = {}) {
  observedMessages.clear()
  return mount(LumalCockpitDesigner, {
    props: { config: current, registry: registry() },
    slots,
    global: { plugins: [ElementPlus] },
  })
}

describe('lumalCockpitDesigner', () => {
  it('左右区域直接展示行列与区域宽设置，不再依赖悬浮工具层', () => {
    const current = config()
    current.layouts[0].right.rows[0].cells[0].widget = { id: 'right-widget', type: 'stub', title: '右侧模块' }
    const wrapper = mountDesigner(current)

    expect(wrapper.find('.lumal-cockpit-designer__center-preview').exists()).toBe(false)
    expect(wrapper.findAll('[data-role="region-tools"]')).toHaveLength(2)
    expect(wrapper.findAll('[data-role="row-tools"]')).toHaveLength(2)

    const rightRegion = wrapper.get('[data-side="right"]')
    const regionHead = rightRegion.get('[data-role="region-tools"]')
    expect(regionHead.classes()).toContain('lumal-cockpit-designer__region-head')
    expect(regionHead.attributes('aria-label')).toBe('右侧区域布局设置')
    expect(regionHead.findAll('.lumal-cockpit-designer__region-width-field')).toHaveLength(1)
    expect(regionHead.findAll('.lumal-cockpit-designer__column-field')).toHaveLength(0)
    expect(rightRegion.get('[data-role="row-tools"]').classes()).toContain('lumal-cockpit-designer__grid-row-head')
    expect(rightRegion.get('[data-role="remove-widget"]').attributes('aria-label')).toBe('移除模块 右侧模块')
  })

  it('设计区按列数均分渲染网格', () => {
    const current = config()
    current.layouts[0].left.width = 600
    current.layouts[0].left.columns = [
      { id: 'left-a', width: 300 },
      { id: 'left-b', width: 300 },
    ]
    current.layouts[0].left.rows[0].cells = [{ id: 'left-a-cell' }, { id: 'left-b-cell' }]
    const wrapper = mountDesigner(current)
    const style = wrapper.get('[data-side="left"] .lumal-cockpit-designer__grid-cells').attributes('style')
    expect(style).toContain('minmax(0, 1fr) minmax(0, 1fr)')
  })

  it('合并行使用单一 Tab Card 并只预览激活模块', async () => {
    const current = config()
    current.layouts[0].right.rows[0] = {
      id: 'right-tabs',
      height: 100,
      mode: 'tabs',
      cells: [],
      widgets: [
        { id: 'right-a', type: 'stub', title: '甲' },
        { id: 'right-b', type: 'stub-b', title: '乙' },
      ],
      activeWidgetId: 'right-a',
    }
    const wrapper = mountDesigner(current)
    const rightRegion = wrapper.get('[data-side="right"]')
    expect(rightRegion.findAll('.lumal-cockpit-designer__tab-card')).toHaveLength(1)
    expect(rightRegion.findAll('.lumal-cockpit-designer__tab-item')).toHaveLength(2)
    expect(rightRegion.findAll('.lumal-cockpit-designer__tab-preview .designer-stub-widget')).toHaveLength(1)
    expect(rightRegion.get('.lumal-cockpit-designer__tab-preview .designer-stub-widget').attributes('data-instance')).toBe('right-a')

    await rightRegion.findAll('[role="tab"]')[1].trigger('click')
    await nextTick()
    expect(rightRegion.get('.lumal-cockpit-designer__tab-preview .designer-stub-widget').attributes('data-instance')).toBe('right-b')
  })

  it('不再渲染中心预览，已放置模块仍拿到 design 消息总线', () => {
    const current = config()
    current.layouts[0].left.rows[0].cells[0].widget = { id: 'left-widget', type: 'stub' }
    const wrapper = mountDesigner(current, {
      'center-preview': () => h(CenterProbe),
    })

    expect(wrapper.find('.designer-center-probe').exists()).toBe(false)
    expect(wrapper.find('.lumal-cockpit-designer__center-preview').exists()).toBe(false)
    expect(observedMessages.get('left-widget')).toBeDefined()
    expect(observedMessages.get('library-preview:stub')).not.toBe(observedMessages.get('left-widget'))
  })

  it('键盘选择库模块后可连续放入空槽', async () => {
    const wrapper = mountDesigner()
    await wrapper.get('.lumal-cockpit-designer__library-select').trigger('click')
    const emptyTargets = wrapper.findAll('.lumal-cockpit-designer__empty-cell')
    await emptyTargets[0].trigger('click')
    await nextTick()
    expect(wrapper.get('[data-side="left"] [data-role="placed-widget"]').exists()).toBe(true)
    expect(wrapper.get('.lumal-cockpit-designer__placement-status').text()).toContain('可连续放入多个槽位')
  })

  it('键盘移动已放置模块后清除移动状态', async () => {
    const current = config()
    current.layouts[0].left.rows[0].cells[0].widget = { id: 'left-widget', type: 'stub', title: '左侧模块' }
    const wrapper = mountDesigner(current)
    await wrapper.get('[data-side="left"] [data-role="select-move-source"]').trigger('click')
    await wrapper.get('[data-side="right"] .lumal-cockpit-designer__empty-cell').trigger('click')
    await nextTick()

    expect(wrapper.get('[data-side="right"] .designer-stub-widget').attributes('data-instance')).toBe('left-widget')
    expect(wrapper.get('[data-side="left"] .lumal-cockpit-designer__empty-cell').exists()).toBe(true)
    expect(wrapper.get('.lumal-cockpit-designer__placement-status').text()).not.toContain('正在移动')
  })

  it('键盘移动到占用槽时确认替换', async () => {
    const current = config()
    current.layouts[0].left.rows[0].cells[0].widget = { id: 'left-widget', type: 'stub', title: '左侧模块' }
    current.layouts[0].right.rows[0].cells[0].widget = { id: 'right-widget', type: 'stub-b', title: '右侧模块' }
    const confirm = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm')
    const wrapper = mountDesigner(current)

    await wrapper.get('[data-side="left"] [data-role="select-move-source"]').trigger('click')
    await wrapper.get('[data-side="right"] [data-role="keyboard-target"]').trigger('click')
    await nextTick()

    expect(confirm).toHaveBeenCalledOnce()
    expect(wrapper.get('[data-side="right"] .designer-stub-widget').attributes('data-instance')).toBe('left-widget')
    expect(wrapper.get('[data-side="left"] .lumal-cockpit-designer__empty-cell').exists()).toBe(true)
    confirm.mockRestore()
  })

  it('保存时同时输出完整配置和当前布局', async () => {
    const wrapper = mountDesigner()
    await wrapper.get('.lumal-cockpit-designer__save').trigger('click')

    const payload = wrapper.emitted('save')?.[0]?.[0] as CockpitDesignerSavePayload
    expect(payload.config.schemaVersion).toBe(3)
    expect(payload.layout.id).toBe('layout-a')
    expect(payload.layout).toBe(payload.config.layouts[0])
  })

  it('名称输入接收即时值，保留输入中的空格，保存前提交且不修改源配置', async () => {
    const current = config()
    const wrapper = mountDesigner(current)
    const input = wrapper.get<HTMLInputElement>('input[aria-label="当前布局名称"]')
    input.element.value = '新的布局 '
    await input.trigger('input')
    await nextTick()
    expect(input.element.value).toBe('新的布局 ')
    expect(current.layouts[0].title).toBe('布局 A')
    await wrapper.get('.lumal-cockpit-designer__save').trigger('click')
    const payload = wrapper.emitted('save')?.[0]?.[0] as CockpitDesignerSavePayload
    expect(payload.layout.title).toBe('新的布局')
    expect(current.layouts[0].title).toBe('布局 A')
    wrapper.unmount()
  })
})
