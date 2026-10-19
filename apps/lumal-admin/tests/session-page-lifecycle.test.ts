import { RequestError } from '@lumal/core/request'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as system from '../src/api/system'
import DictionaryItemView from '../src/views/system/DictionaryItemView.vue'
import DictionaryTypeView from '../src/views/system/DictionaryTypeView.vue'
import MenuView from '../src/views/system/MenuView.vue'
import { elementPlusStubs } from './helpers/element-plus-stubs'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

const views = [
  { component: MenuView, load: 'fetchSystemMenus' as const, title: '菜单' },
  { component: DictionaryTypeView, load: 'fetchDictionaryTypes' as const, title: '字典分类' },
  { component: DictionaryItemView, load: 'fetchDictionaryTypes' as const, title: '字典项' },
]

describe('session page loading lifecycle', () => {
  it.each(views)('$title 初始化取消不产生未处理拒绝，真正失败仍可见', async ({ component, load }) => {
    const fetcher = vi.spyOn(system, load)
    for (const cancelled of [true, false]) {
      fetcher.mockRejectedValueOnce(new RequestError('加载测试失败', { kind: cancelled ? 'cancelled' : 'network' }))
      const wrapper = mount(component, {
        global: {
          directives: { authority: () => {} },
          stubs: {
            ...elementPlusStubs,
            LumalIconPicker: true,
            LumalSchemaForm: true,
            LumalSchemaTable: true,
            LumalPage: { template: '<section><slot name="actions" /><slot /></section>' },
          },
        },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'LumalSchemaTable' }).props('error')).toBe(cancelled ? '' : '加载测试失败')
      wrapper.unmount()
    }
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
