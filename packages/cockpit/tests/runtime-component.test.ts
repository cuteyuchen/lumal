import type { CockpitConfig } from '../src/types'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { useCockpitContext } from '../src/composables/useCockpitContext'
import { createCockpitRegistry } from '../src/registry/createCockpitRegistry'
import LumaCockpit from '../src/runtime/LumaCockpit.vue'

/***********************测试用 Stub 组件*********************/
const StubWidget = defineComponent({
  name: 'StubWidget',
  setup() {
    const ctx = useCockpitContext()
    return () => h('div', { 'class': 'stub-widget', 'data-instance': ctx.instanceId }, ctx.instanceId)
  },
})

const StubCenter = defineComponent({
  name: 'StubCenter',
  setup() {
    const ctx = useCockpitContext()
    return () => h('div', { class: 'stub-center' }, ctx.instanceId)
  },
})

function createRegistry() {
  const registry = createCockpitRegistry()
  registry.registerWidget({ type: 'stub', label: 'Stub', component: StubWidget })
  registry.registerCenter({ type: 'stub-center', label: 'Center', component: StubCenter })
  return registry
}

function baseConfig(overrides: Partial<CockpitConfig> = {}): CockpitConfig {
  return {
    schemaVersion: 1,
    id: 'ck',
    title: '测试驾驶舱',
    categories: [{
      id: 'cat-1',
      label: '分类一',
      visible: true,
      activePageId: 'page-1',
      pages: [{
        id: 'page-1',
        title: '页面一',
        center: { id: 'center-1', type: 'stub-center' },
        left: { columns: [] },
        right: { columns: [] },
      }],
    }],
    ...overrides,
  }
}

describe('lumaCockpit 运行时', () => {
  it('渲染标题与分类导航', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: baseConfig(), registry: createRegistry() },
    })
    expect(wrapper.text()).toContain('测试驾驶舱')
    expect(wrapper.find('[aria-label="分类导航"]').exists()).toBe(true)
    expect(wrapper.find('.stub-center').exists()).toBe(true)
  })

  it('single 模式渲染单个可见模块', () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'single',
        widgets: [{ id: 'w1', type: 'stub', visible: true }],
      }],
    }]
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    expect(wrapper.findAll('.stub-widget')).toHaveLength(1)
  })

  it('combined 模式同时渲染多个模块', () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'combined',
        direction: 'horizontal',
        widgets: [
          { id: 'w1', type: 'stub', visible: true },
          { id: 'w2', type: 'stub', visible: true },
        ],
      }],
    }]
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    expect(wrapper.findAll('.stub-widget')).toHaveLength(2)
  })

  it('同 type 多实例使用不同 instanceId', () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'combined',
        widgets: [
          { id: 'inst-a', type: 'stub', visible: true },
          { id: 'inst-b', type: 'stub', visible: true },
        ],
      }],
    }]
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    const instances = wrapper.findAll('.stub-widget').map(w => w.attributes('data-instance'))
    expect(instances).toEqual(['inst-a', 'inst-b'])
  })

  it('tabs 模式仅展示激活面板并可切换', async () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'tabs',
        activeWidgetId: 'w1',
        widgets: [
          { id: 'w1', type: 'stub', title: 'Tab1', visible: true },
          { id: 'w2', type: 'stub', title: 'Tab2', visible: true },
        ],
      }],
    }]
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    await tabs[1].trigger('click')
    expect(wrapper.findAll('[role="tab"]')[1].attributes('aria-selected')).toBe('true')
  })

  it('缺失模块 type 渲染降级占位', () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'single',
        widgets: [{ id: 'w1', type: 'unknown-type', visible: true }],
      }],
    }]
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    expect(wrapper.text()).toContain('未注册模块')
  })

  it('切换分类回退到该分类首个页面', async () => {
    const config = baseConfig({
      categories: [
        {
          id: 'cat-1',
          label: '分类一',
          visible: true,
          activePageId: 'p1',
          pages: [{ id: 'p1', title: '页面A', left: { columns: [] }, right: { columns: [] } }],
        },
        {
          id: 'cat-2',
          label: '分类二',
          visible: true,
          activePageId: 'p2',
          pages: [{ id: 'p2', title: '页面B', left: { columns: [] }, right: { columns: [] } }],
        },
      ],
    })
    const wrapper = mount(LumaCockpit, { props: { config, registry: createRegistry() } })
    const categoryButtons = wrapper.findAll('[aria-label="分类导航"] button')
    await categoryButtons[1].trigger('click')
    expect(wrapper.text()).toContain('页面B')
  })

  it('配置为空展示空驾驶舱状态', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: baseConfig({ categories: [] }), registry: createRegistry() },
    })
    expect(wrapper.text()).toContain('空驾驶舱')
  })

  it('输出已解析主题属性', () => {
    const wrapper = mount(LumaCockpit, {
      props: { config: baseConfig(), registry: createRegistry(), themeMode: 'light' },
    })
    expect(wrapper.attributes('data-cockpit-theme')).toBe('light')
  })

  it('design 模式点击节点时发出稳定 node-select 事件', async () => {
    const config = baseConfig()
    config.categories[0].pages[0].left.columns = [{
      id: 'col',
      width: 1,
      containers: [{
        id: 'ct',
        height: 1,
        mode: 'single',
        widgets: [{ id: 'w1', type: 'stub', visible: true }],
      }],
    }]
    const wrapper = mount(LumaCockpit, {
      props: { config, registry: createRegistry(), renderMode: 'design' },
    })

    await wrapper.find('.stub-widget').trigger('click')

    expect(wrapper.emitted('nodeSelect')?.[0]).toEqual([{ kind: 'widget', id: 'w1', side: 'left' }])
  })
})
