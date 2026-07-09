import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { LumaPage } from '../src/components/page'

describe('luma page', () => {
  it('会渲染标题、描述、操作区和默认内容', () => {
    const wrapper = mount(LumaPage, {
      props: {
        title: '项目管理',
        description: '管理项目基础信息',
      },
      slots: {
        actions: '<button type="button">新增</button>',
        default: '<div class="page-body">页面内容</div>',
      },
    })

    expect(wrapper.find('.luma-page__title').text()).toBe('项目管理')
    expect(wrapper.find('.luma-page__description').text()).toBe('管理项目基础信息')
    expect(wrapper.find('.luma-page__actions').text()).toBe('新增')
    expect(wrapper.find('.page-body').text()).toBe('页面内容')
  })

  it('loading 为 true 时会显示加载层', () => {
    const wrapper = mount(LumaPage, {
      props: {
        loading: true,
      },
    })

    expect(wrapper.find('.luma-page__loading').exists()).toBe(true)
  })
})
