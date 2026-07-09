import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumaPagination } from '../src/components/pagination'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('luma pagination', () => {
  it('会使用 Element Plus 分页组件，点击下一页会更新页码并触发 change', async () => {
    const wrapper = mount(LumaPagination, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        page: 2,
        pageSize: 10,
        total: 35,
      },
    })

    expect(wrapper.findComponent({ name: 'ElPagination' }).exists()).toBe(true)

    await wrapper.find('[data-action="next"]').trigger('click')

    expect(wrapper.emitted('update:page')?.[0]).toEqual([3])
    expect(wrapper.emitted('change')?.[0]).toEqual([
      {
        page: 3,
        pageSize: 10,
      },
    ])
  })

  it('修改每页条数会重置到第一页', async () => {
    const wrapper = mount(LumaPagination, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        page: 3,
        pageSize: 10,
        pageSizes: [10, 20],
        total: 35,
      },
    })

    await wrapper.find('select[name="pageSize"]').setValue('20')

    expect(wrapper.emitted('update:page')?.[0]).toEqual([1])
    expect(wrapper.emitted('update:pageSize')?.[0]).toEqual([20])
    expect(wrapper.emitted('change')?.[0]).toEqual([
      {
        page: 1,
        pageSize: 20,
      },
    ])
  })
})
