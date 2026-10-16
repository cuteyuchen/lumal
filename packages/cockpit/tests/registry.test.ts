import { describe, expect, it } from 'vitest'
import { computed, defineComponent, isProxy } from 'vue'
import { createCockpitRegistry } from '../src/registry/createCockpitRegistry'

const Stub = defineComponent({ name: 'Stub', setup: () => () => null })

describe('createCockpitRegistry', () => {
  it('注册并解析模块', () => {
    const registry = createCockpitRegistry()
    registry.registerWidget({ type: 'summary', label: '摘要', component: Stub })
    expect(registry.resolveWidget('summary')?.label).toBe('摘要')
    expect(registry.resolveWidget('missing')).toBeUndefined()
  })

  it('拒绝空 type 和重复 type', () => {
    const registry = createCockpitRegistry()
    expect(() => registry.registerWidget({ type: ' ', label: '空', component: Stub })).toThrow(/不能为空/)
    registry.registerWidget({ type: 'same', label: 'A', component: Stub })
    expect(() => registry.registerWidget({ type: 'same', label: 'B', component: Stub })).toThrow(/已注册/)
  })

  it('列表返回独立数组并保持插入顺序', () => {
    const registry = createCockpitRegistry()
    registry.registerWidgets([{ type: 'a', label: 'A', component: Stub }, { type: 'b', label: 'B', component: Stub }])
    const listed = registry.listWidgets()
    expect(listed.map(item => item.type)).toEqual(['a', 'b'])
    expect(listed).not.toBe(registry.listWidgets())
  })

  it('已求值的视图与组件库会随动态注册、卸载更新，组件不被代理', () => {
    const registry = createCockpitRegistry()
    const resolved = computed(() => registry.resolveWidget('late'))
    const list = computed(() => registry.listWidgets())
    expect(resolved.value).toBeUndefined()
    expect(list.value).toHaveLength(0)
    registry.registerWidget({ type: 'late', label: '稍后注册', component: Stub })
    expect(resolved.value?.component).toBe(Stub)
    expect(isProxy(resolved.value?.component)).toBe(false)
    expect(list.value).toHaveLength(1)
    registry.unregisterWidget('late')
    expect(resolved.value).toBeUndefined()
    expect(list.value).toHaveLength(0)
  })
})
