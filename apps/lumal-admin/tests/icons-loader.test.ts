import { resolveIconDefinition } from '@lumal/icons'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppIconGroupSelect from '../src/components/app/AppIconGroupSelect.vue'
import * as adminIcons from '../src/icons'
import { elementPlusStubs } from './helpers/element-plus-stubs'

enableAutoUnmount(afterEach)
afterEach(() => vi.restoreAllMocks())

describe('admin icon resource loading', () => {
  it('基础注册不加载 Element Plus 图标，并发请求复用一次资源加载', async () => {
    adminIcons.registerAdminIcons()
    expect(resolveIconDefinition('element-plus:Edit')).toBeUndefined()
    expect(resolveIconDefinition('component:brand')?.source).toBe('component')

    const first = adminIcons.registerAdminElementPlusIcons()
    const second = adminIcons.registerAdminElementPlusIcons()
    expect(first).toBe(second)
    await first
    expect(resolveIconDefinition('element-plus:Edit')).toMatchObject({
      group: 'element-plus',
      source: 'local-svg',
      svgText: expect.stringContaining('<svg'),
    })
    expect(adminIcons.registerAdminElementPlusIcons()).toBe(first)
  })

  it('分组控件提示资源加载失败，并保留已有分组操作', async () => {
    vi.spyOn(adminIcons, 'registerAdminElementPlusIcons').mockRejectedValueOnce(new Error('offline'))
    const setGroup = vi.fn()
    const wrapper = mount(AppIconGroupSelect, {
      props: { modelValue: '', groups: [{ key: 'lumal', label: 'Lumal 内置' }], setGroup },
      global: { stubs: elementPlusStubs },
    })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('加载失败')
    await wrapper.get('[aria-label="图标分组"]').setValue('lumal')
    expect(setGroup).toHaveBeenCalledWith('lumal')
  })
})
