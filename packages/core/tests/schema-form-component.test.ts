import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { LumaSchemaForm } from '../src/components/schema-form'
import { createDictionaryStore, dictionaryContextKey } from '../src/dictionary'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('luma schema form', () => {
  it('会使用 Element Plus 表单组件渲染可见字段，并在输入后回写模型且保留隐藏字段', async () => {
    const wrapper = mount(LumaSchemaForm, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        modelValue: {
          id: '1001',
          name: '旧名称',
        },
        schemas: [
          {
            field: 'id',
            label: 'ID',
            component: 'hidden',
          },
          {
            field: 'name',
            label: '名称',
            component: 'input',
          },
          {
            field: 'status',
            label: '状态',
            component: 'select',
            options: [
              { label: '启用', value: 'enabled' },
              { label: '停用', value: 'disabled' },
            ],
          },
        ],
      },
    })

    expect(wrapper.findComponent({ name: 'ElForm' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElInput' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElSelect' }).exists()).toBe(true)
    expect(wrapper.find('[data-field="id"]').exists()).toBe(false)
    expect(wrapper.find('[data-field="name"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="status"]').exists()).toBe(true)

    await wrapper.find('input[name="name"]').setValue('新名称')
    await wrapper.find('select[name="status"]').setValue('enabled')
    await nextTick()

    const updateEvents = wrapper.emitted('update:modelValue')
    expect(updateEvents?.at(-1)?.[0]).toEqual({
      id: '1001',
      name: '新名称',
      status: 'enabled',
    })
  })

  it('会使用 dictionary 字段加载 select options 并回写 value', async () => {
    const store = createDictionaryStore({
      fetcher: async () => ({
        items: [
          { label: '启用', value: 'enabled' },
          { label: '停用', value: 'disabled' },
        ],
      }),
    })

    const wrapper = mount(LumaSchemaForm, {
      global: {
        provide: {
          [dictionaryContextKey as symbol]: {
            store,
          },
        },
        stubs: elementPlusStubs,
      },
      props: {
        modelValue: {
          status: 'disabled',
        },
        schemas: [
          {
            field: 'status',
            label: '状态',
            dictionary: 'status',
          },
        ],
      },
    })

    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.findComponent({ name: 'ElSelect' }).exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'ElOption' }).map(item => item.props('label'))).toEqual(['启用', '停用'])

    await wrapper.find('select[name="status"]').setValue('enabled')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual({
      status: 'enabled',
    })
  })
})
