import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminPermissionCodes } from '../src/mock/permission'
import { resetMockSystemOrganizations } from '../src/mock/system'
import { permissionStore } from '../src/services/permission'
import OrganizationView from '../src/views/system/OrganizationView.vue'

const sampleOrganization = {
  code: 'platform-rd',
  email: 'rd@luma.dev',
  id: 'organization-2',
  leader: '陈屿',
  name: '平台研发中心',
  order: 1,
  parentId: 'organization-1',
  phone: '010-80000002',
  status: 'enabled',
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
    return () => h('section', [slots.actions?.(), slots.default?.()])
  },
})

const TableStub = defineComponent({
  name: 'LumaSchemaTable',
  props: {
    columns: Array,
    rows: Array,
    tableProps: Object,
  },
  setup(_, { slots }) {
    return () => h('div', slots.actions?.({ row: sampleOrganization }))
  },
})

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: { modelValue: Boolean, title: String },
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', { 'class': 'dialog-stub', 'data-title': props.title }, slots.default?.())
      : null
  },
})

const FormStub = defineComponent({
  name: 'LumaSchemaForm',
  props: { schemas: Array },
  setup() {
    return () => h('form')
  },
})

function mountOrganizationView() {
  return mount(OrganizationView, {
    global: {
      directives: { authority: createAuthorityDirective(permissionStore) },
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

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

describe('system organization view', () => {
  beforeEach(() => {
    permissionStore.clear()
    resetMockSystemOrganizations()
  })

  afterEach(() => {
    permissionStore.clear()
    resetMockSystemOrganizations()
  })

  it('使用树表展示机构及上下级关系字段', async () => {
    permissionStore.setPermissions(resolveOrganizationPermissions())
    const wrapper = mountOrganizationView()
    await flushPromises()

    const table = wrapper.findComponent(TableStub)
    expect((table.props('columns') as { field: string }[]).map(column => column.field)).toEqual([
      'name',
      'code',
      'leader',
      'phone',
      'email',
      'status',
      'order',
    ])
    expect(table.props('tableProps')).toMatchObject({
      defaultExpandAll: true,
      treeProps: { children: 'children' },
    })
    expect((table.props('rows') as unknown[]).length).toBeGreaterThan(0)
  })

  it('使用 v-authority 控制机构操作', () => {
    permissionStore.setPermissions([adminPermissionCodes.systemOrganizationList])
    const wrapper = mountOrganizationView()

    expect(wrapper.find('[data-action="create-organization"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="create-organization-child"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-organization"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-organization"]').attributes('style')).toContain('display: none')
  })

  it('提供完整机构维护表单', async () => {
    permissionStore.setPermissions(resolveOrganizationPermissions())
    const wrapper = mountOrganizationView()

    await wrapper.find('[data-action="create-organization"]').trigger('click')
    await nextTick()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('新增机构')
    expect((wrapper.findComponent(FormStub).props('schemas') as { field: string }[]).map(schema => schema.field)).toEqual([
      'parentId',
      'name',
      'code',
      'leader',
      'phone',
      'email',
      'order',
      'status',
    ])
  })
})

function resolveOrganizationPermissions(): string[] {
  return [
    adminPermissionCodes.systemOrganizationList,
    adminPermissionCodes.systemOrganizationCreate,
    adminPermissionCodes.systemOrganizationUpdate,
    adminPermissionCodes.systemOrganizationDelete,
  ]
}
