import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminPermissionCodes } from '../src/mock/permission'
import { resetMockDictionaries } from '../src/mock/system'
import { permissionStore } from '../src/services/permission'
import DictionaryItemView from '../src/views/system/DictionaryItemView.vue'
import DictionaryTypeView from '../src/views/system/DictionaryTypeView.vue'

const sampleType = { code: 'status', description: '通用状态', id: 'type-1', name: '状态', status: 'enabled' }
const sampleItem = { color: '#16a34a', id: 'item-1', label: '启用', order: 1, status: 'enabled', typeCode: 'status', value: 'enabled' }

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
    return () => h('section', [slots.actions?.(), slots.default?.()])
  },
})
const TableStub = defineComponent({
  name: 'LumaSchemaTable',
  props: { columns: Array },
  setup(props, { slots }) {
    return () => h('div', { class: 'table-stub' }, slots.actions?.({ row: (props.columns?.[0] as { field?: string })?.field === 'name' ? sampleType : sampleItem }))
  },
})
const DialogStub = defineComponent({
  name: 'ElDialog',
  props: { modelValue: Boolean },
  setup(props, { slots }) {
    return () => props.modelValue ? h('section', slots.default?.()) : null
  },
})
const FormStub = defineComponent({
  name: 'LumaSchemaForm',
  props: { schemas: Array },
  setup() {
    return () => h('form')
  },
})

function mountView(component: typeof DictionaryItemView | typeof DictionaryTypeView) {
  return mount(component, {
    global: {
      directives: { authority: createAuthorityDirective(permissionStore) },
      stubs: {
        ElButton: ButtonStub,
        ElDialog: DialogStub,
        ElOption: true,
        ElSelect: true,
        LumaPage: PageStub,
        LumaSchemaForm: FormStub,
        LumaSchemaTable: TableStub,
      },
    },
  })
}

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

describe('system dictionary views', () => {
  beforeEach(() => {
    permissionStore.setPermissions([
      adminPermissionCodes.systemDictList,
      adminPermissionCodes.systemDictCreate,
      adminPermissionCodes.systemDictUpdate,
      adminPermissionCodes.systemDictDelete,
    ])
    resetMockDictionaries()
  })

  afterEach(() => {
    permissionStore.clear()
    resetMockDictionaries()
  })

  it('将字典分类与字典项拆分为独立页面', async () => {
    const typeWrapper = mountView(DictionaryTypeView)
    const itemWrapper = mountView(DictionaryItemView)
    await flushPromises()

    expect((typeWrapper.findComponent(TableStub).props('columns') as { field: string }[]).map(item => item.field)).toEqual([
      'name',
      'code',
      'description',
      'status',
    ])
    expect((itemWrapper.findComponent(TableStub).props('columns') as { field: string }[]).map(item => item.field)).toEqual([
      'label',
      'value',
      'color',
      'order',
      'status',
    ])
  })

  it('两个页面分别提供对应编辑表单', async () => {
    const typeWrapper = mountView(DictionaryTypeView)
    await typeWrapper.find('[data-action="create-dictionary-type"]').trigger('click')
    expect((typeWrapper.findComponent(FormStub).props('schemas') as { field: string }[]).map(item => item.field)).toEqual([
      'name',
      'code',
      'status',
      'description',
    ])

    const itemWrapper = mountView(DictionaryItemView)
    await flushPromises()
    await itemWrapper.find('[data-action="create-dictionary-item"]').trigger('click')
    expect((itemWrapper.findComponent(FormStub).props('schemas') as { field: string }[]).map(item => item.field)).toEqual([
      'label',
      'value',
      'color',
      'order',
      'status',
    ])
  })
})
