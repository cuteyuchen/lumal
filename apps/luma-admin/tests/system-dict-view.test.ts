import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminPermissionCodes } from '../src/mock/permission'
import { resetMockDictionaries } from '../src/mock/system'
import { permissionStore } from '../src/services/permission'
import DictView from '../src/views/system/DictView.vue'

const sampleType = {
  code: 'status',
  description: '后台通用状态',
  id: 'dict-type-1',
  name: '通用状态',
  status: 'enabled',
}

const sampleItem = {
  color: '#16a34a',
  id: 'dict-item-1',
  label: '启用',
  order: 1,
  status: 'enabled',
  typeCode: 'status',
  value: 'enabled',
}

const ButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('button', attrs, slots.default?.())
  },
})

const PageStub = defineComponent({
  name: 'LumaPage',
  setup(_, { slots }) {
    return () => h('section', { class: 'page-stub' }, slots.default?.())
  },
})

const TableStub = defineComponent({
  name: 'LumaSchemaTable',
  props: {
    columns: Array,
    rows: Array,
  },
  setup(props, { slots }) {
    return () => {
      const firstField = (props.columns?.[0] as { field?: string } | undefined)?.field
      const row = firstField === 'name' ? sampleType : sampleItem
      return h('div', { 'class': 'table-stub', 'data-table': firstField }, slots.actions?.({ index: 0, row }))
    }
  },
})

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: Boolean,
    title: String,
  },
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', { 'class': 'dialog-stub', 'data-title': props.title }, slots.default?.())
      : null
  },
})

const FormStub = defineComponent({
  name: 'LumaSchemaForm',
  props: {
    schemas: Array,
  },
  setup() {
    return () => h('form', { class: 'form-stub' })
  },
})

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

function mountDictView() {
  return mount(DictView, {
    global: {
      directives: {
        authority: createAuthorityDirective(permissionStore),
      },
      stubs: {
        ElButton: ButtonStub,
        ElDialog: DialogStub,
        LumaPage: PageStub,
        LumaSchemaForm: FormStub,
        LumaSchemaTable: TableStub,
      },
    },
  })
}

describe('system dictionary view', () => {
  beforeEach(() => {
    permissionStore.clear()
    resetMockDictionaries()
  })

  afterEach(() => {
    permissionStore.clear()
    resetMockDictionaries()
  })

  it('使用左右双表展示字典类型和字典项', async () => {
    permissionStore.setPermissions(resolveDictionaryPermissions())
    const wrapper = mountDictView()
    await flushPromises()

    const tables = wrapper.findAllComponents(TableStub)
    expect(tables).toHaveLength(2)
    expect((tables[0].props('columns') as { field: string }[]).map(column => column.field)).toEqual([
      'name',
      'code',
      'status',
    ])
    expect((tables[1].props('columns') as { field: string }[]).map(column => column.field)).toEqual([
      'label',
      'value',
      'color',
      'order',
      'status',
    ])
  })

  it('使用 v-authority 控制字典类型和字典项操作', () => {
    permissionStore.setPermissions([adminPermissionCodes.systemDictList])
    const wrapper = mountDictView()

    expect(wrapper.find('[data-action="create-dictionary-type"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="create-dictionary-item"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-dictionary-type"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-dictionary-type"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-dictionary-item"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-dictionary-item"]').attributes('style')).toContain('display: none')
  })

  it('提供字典类型和字典项编辑表单', async () => {
    permissionStore.setPermissions(resolveDictionaryPermissions())
    const wrapper = mountDictView()

    await wrapper.find('[data-action="create-dictionary-type"]').trigger('click')
    await nextTick()
    let form = wrapper.findComponent(FormStub)
    expect((form.props('schemas') as { field: string }[]).map(schema => schema.field)).toEqual([
      'name',
      'code',
      'status',
      'description',
    ])

    await wrapper.find('[data-action="create-dictionary-item"]').trigger('click')
    await nextTick()
    form = wrapper.findAllComponents(FormStub).at(-1)!
    expect((form.props('schemas') as { field: string }[]).map(schema => schema.field)).toEqual([
      'label',
      'value',
      'color',
      'order',
      'status',
    ])
  })
})

function resolveDictionaryPermissions(): string[] {
  return [
    adminPermissionCodes.systemDictList,
    adminPermissionCodes.systemDictCreate,
    adminPermissionCodes.systemDictUpdate,
    adminPermissionCodes.systemDictDelete,
  ]
}
