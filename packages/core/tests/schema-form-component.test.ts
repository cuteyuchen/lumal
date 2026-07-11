import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h, nextTick } from 'vue'
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
            formatter: value => `格式化：${String(value)}`,
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

  it('会渲染增强控件、透传校验规则并暴露表单方法', async () => {
    const wrapper = mount(LumaSchemaForm, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        columns: 2,
        labelWidth: '96px',
        modelValue: {
          enabled: false,
          tags: ['a'],
        },
        schemas: [
          {
            component: 'number',
            componentProps: {
              min: 1,
            },
            field: 'sort',
            label: '排序',
            rules: [{ required: true, message: '请输入排序' }],
          },
          {
            component: 'switch',
            field: 'enabled',
            label: '启用',
          },
          {
            component: 'radio',
            field: 'level',
            label: '级别',
            options: [
              { label: '高', value: 'high' },
              { label: '低', value: 'low' },
            ],
          },
          {
            component: 'checkbox',
            field: 'tags',
            label: '标签',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
          },
          {
            component: 'date',
            field: 'startDate',
            label: '开始时间',
          },
          {
            component: 'tree-select',
            componentProps: {
              data: [{ label: '根节点', value: 'root' }],
            },
            field: 'parentId',
            label: '上级',
          },
        ],
      },
    })

    expect(wrapper.findComponent({ name: 'ElInputNumber' }).props('min')).toBe(1)
    expect(wrapper.findComponent({ name: 'ElSwitch' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElRadioGroup' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElCheckboxGroup' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElDatePicker' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElTreeSelect' }).props('data')).toEqual([{ label: '根节点', value: 'root' }])
    expect(wrapper.find('[data-columns="2"]').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ElForm' }).props('labelWidth')).toBe('96px')
    expect(wrapper.findComponent({ name: 'ElFormItem' }).props('rules')).toEqual([{ required: true, message: '请输入排序' }])

    await wrapper.find('input[name="sort"]').setValue('3')
    await wrapper.find('input[name="enabled"]').setValue('true')
    await wrapper.find('select[name="level"]').setValue('high')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({
      enabled: true,
      level: 'high',
      sort: 3,
    })

    const exposed = wrapper.vm as unknown as {
      getValues: () => Record<string, unknown>
      setMode: (mode: string) => void
      setValues: (model: Record<string, unknown>) => void
      validate: () => Promise<boolean>
    }

    expect(await exposed.validate()).toBe(true)
    exposed.setValues({ name: 'Luma' })
    await nextTick()
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toMatchObject({
      name: 'Luma',
      tags: ['a'],
    })
    expect(exposed.getValues()).toEqual(expect.objectContaining({
      name: 'Luma',
      tags: ['a'],
    }))
    exposed.setMode('view')
  })

  it('会在 view 模式阻止提交并支持字段插槽扩展', async () => {
    const wrapper = mount(LumaSchemaForm, {
      global: {
        stubs: elementPlusStubs,
      },
      props: {
        mode: 'view',
        modelValue: {
          name: 'Luma',
          status: 'enabled',
        },
        schemas: [
          {
            field: 'name',
            formatter: value => `格式化：${String(value)}`,
            label: '名称',
          },
          {
            field: 'status',
            label: '状态',
          },
        ],
        showActions: true,
      },
      slots: {
        'field-status': ({ value }) => h('strong', { class: 'custom-field' }, String(value)),
        'prefix-name': () => h('span', { class: 'field-prefix' }, '前缀'),
        'suffix-name': () => h('span', { class: 'field-suffix' }, '后缀'),
      },
    })

    expect(wrapper.find('.luma-schema-form__actions').exists()).toBe(false)
    expect(wrapper.find('input[name="name"]').exists()).toBe(false)
    expect(wrapper.find('.luma-schema-form__readonly-value').text()).toBe('格式化：Luma')
    expect(wrapper.find('.field-prefix').text()).toBe('前缀')
    expect(wrapper.find('.field-suffix').text()).toBe('后缀')
    expect(wrapper.find('.custom-field').text()).toBe('enabled')

    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('多选 Select 会保留数组模型用于编辑回显', () => {
    const wrapper = mount(LumaSchemaForm, {
      global: { stubs: elementPlusStubs },
      props: {
        modelValue: { roles: ['admin', 'operator'] },
        schemas: [{
          component: 'select',
          componentProps: { multiple: true },
          field: 'roles',
          label: '角色',
          options: [
            { label: '管理员', value: 'admin' },
            { label: '操作员', value: 'operator' },
          ],
        }],
      },
    })

    expect(wrapper.findComponent({ name: 'ElSelect' }).props('modelValue')).toEqual(['admin', 'operator'])
  })

  it('编辑模式支持 editDisabled、复合输入文本和 Ref options', async () => {
    const { ref } = await import('vue')
    const options = ref([{ label: '启用', value: 'enabled' }])
    const wrapper = mount(LumaSchemaForm, {
      global: { stubs: elementPlusStubs },
      props: {
        mode: 'edit',
        modelValue: { code: 'LUMA', status: 'enabled' },
        schemas: [
          {
            append: '.com',
            editDisabled: true,
            field: 'code',
            label: '编码',
            prepend: 'https://',
          },
          {
            component: 'select',
            field: 'status',
            label: '状态',
            options,
          },
        ],
      },
    })

    expect(wrapper.find('input[name="code"]').attributes('disabled')).toBeDefined()
    const codeInput = wrapper.findAllComponents({ name: 'ElInput' })[0]
    expect(codeInput?.vm.$slots.prepend?.()[0]?.children).toBe('https://')
    expect(codeInput?.vm.$slots.append?.()[0]?.children).toBe('.com')
    expect(wrapper.findAllComponents({ name: 'ElOption' })).toHaveLength(1)
  })
})
