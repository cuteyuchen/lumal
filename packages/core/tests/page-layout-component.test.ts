import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumaPageLayout } from '../src/components/page-layout'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('luma page layout', () => {
  it('会组合查询区、工具栏、内容区和分页区', () => {
    const wrapper = mount(LumaPageLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        searchText: '筛选',
        resetText: '清空',
      },
      slots: {
        default: '<section class="page-table">表格内容</section>',
        pagination: '<div class="page-pagination">分页</div>',
        query: '<form class="page-query">查询表单</form>',
        toolbar: '<button class="page-action" type="button">新增</button>',
      },
    })

    expect(wrapper.find('.luma-page-layout__query').exists()).toBe(true)
    expect(wrapper.find('.page-query').exists()).toBe(true)
    expect(wrapper.find('.luma-page-layout__toolbar').text()).toContain('新增')
    expect(wrapper.find('.page-table').text()).toBe('表格内容')
    expect(wrapper.find('.page-pagination').text()).toBe('分页')
    expect(wrapper.find('[data-action="search"]').text()).toBe('筛选')
    expect(wrapper.find('[data-action="reset"]').text()).toBe('清空')
  })

  it('查询和重置按钮会透传事件', async () => {
    const wrapper = mount(LumaPageLayout, {
      global: {
        stubs: elementPlusStubs,
      },
      slots: {
        query: '<form class="page-query">查询表单</form>',
      },
    })

    await wrapper.find('[data-action="search"]').trigger('click')
    await wrapper.find('[data-action="reset"]').trigger('click')

    expect(wrapper.emitted('search')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })
})
