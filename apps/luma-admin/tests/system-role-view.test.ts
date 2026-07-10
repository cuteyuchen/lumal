import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import {
  createSystemRole,
  fetchSystemRolePermissions,
} from '../src/api/system'
import { adminPermissionCodes } from '../src/mock/permission'
import { resetMockSystemRoles } from '../src/mock/system'
import { permissionStore } from '../src/services/permission'
import RoleView from '../src/views/system/RoleView.vue'

const sampleRole = {
  builtIn: false,
  code: 'auditor',
  description: '只读审计角色',
  id: 'role-4',
  name: '审计员',
  status: 'enabled',
}

const ButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('button', attrs, slots.default?.())
  },
})

const CrudTableStub = defineComponent({
  name: 'LumaCrudTable',
  props: {
    columns: Array,
    dataSource: Object,
    formSchemas: Array,
    querySchemas: Array,
  },
  setup(_, { expose, slots }) {
    expose({
      openEdit: vi.fn(),
      openView: vi.fn(),
      removeRow: vi.fn().mockResolvedValue(undefined),
    })

    return () => h('section', { class: 'crud-table-stub' }, [
      slots['create-action']?.({ openCreate: vi.fn() }),
      slots['row-actions']?.({ index: 0, row: sampleRole }),
    ])
  },
})

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: Boolean,
    title: String,
  },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', { 'class': 'dialog-stub', 'data-title': props.title }, [
          slots.default?.(),
          slots.footer?.(),
        ])
      : null
  },
})

const TreeStub = defineComponent({
  name: 'ElTree',
  props: {
    data: Array,
  },
  setup(_, { expose }) {
    expose({
      getCheckedKeys: () => [adminPermissionCodes.dashboardView],
      getHalfCheckedKeys: () => [],
      setCheckedKeys: vi.fn(),
    })
    return () => h('div', { class: 'tree-stub' })
  },
})

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function mountRoleView() {
  return mount(RoleView, {
    global: {
      directives: {
        authority: createAuthorityDirective(permissionStore),
      },
      stubs: {
        ElButton: ButtonStub,
        ElDialog: DialogStub,
        ElTree: TreeStub,
        LumaCrudTable: CrudTableStub,
      },
    },
  })
}

describe('system role view', () => {
  beforeEach(async () => {
    permissionStore.clear()
    resetMockSystemRoles()
    await createSystemRole({
      code: 'auditor',
      description: '只读审计角色',
      name: '审计员',
      status: 'enabled',
    })
  })

  afterEach(() => {
    permissionStore.clear()
    resetMockSystemRoles()
  })

  it('配置角色字段、查询条件和 CRUD dataSource', () => {
    permissionStore.setPermissions(resolveRolePermissions())
    const wrapper = mountRoleView()
    const crudTable = wrapper.findComponent(CrudTableStub)
    const columns = crudTable.props('columns') as { field: string }[]
    const querySchemas = crudTable.props('querySchemas') as { field: string }[]
    const formSchemas = crudTable.props('formSchemas') as { field: string }[]
    const dataSource = crudTable.props('dataSource') as Record<string, unknown>

    expect(columns.map(column => column.field)).toEqual(['name', 'code', 'status', 'description'])
    expect(querySchemas.map(schema => schema.field)).toEqual(['keyword', 'status'])
    expect(formSchemas.map(schema => schema.field)).toEqual(['name', 'code', 'status', 'description'])
    expect(Object.keys(dataSource).sort()).toEqual(['create', 'fetch', 'remove', 'update'])
  })

  it('使用 v-authority 控制角色操作按钮', () => {
    permissionStore.setPermissions([adminPermissionCodes.systemRoleList])
    const wrapper = mountRoleView()

    expect(wrapper.find('[data-action="view-role"]').attributes('style')).toBeUndefined()
    expect(wrapper.find('[data-action="create-role"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-role"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="authorize-role"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-role"]').attributes('style')).toContain('display: none')
  })

  it('打开权限树并保存角色授权关系', async () => {
    permissionStore.setPermissions(resolveRolePermissions())
    const wrapper = mountRoleView()

    await wrapper.find('[data-action="authorize-role"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('角色授权：审计员')
    expect(wrapper.findComponent(TreeStub).props('data')).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: '系统管理' }),
    ]))

    await wrapper.find('[data-action="save-role-permissions"]').trigger('click')
    await flushPromises()

    await expect(fetchSystemRolePermissions('auditor')).resolves.toEqual([
      adminPermissionCodes.dashboardView,
    ])
  })
})

function resolveRolePermissions(): string[] {
  return [
    adminPermissionCodes.systemRoleList,
    adminPermissionCodes.systemRoleCreate,
    adminPermissionCodes.systemRoleUpdate,
    adminPermissionCodes.systemRoleDelete,
    adminPermissionCodes.systemRoleAuthorize,
  ]
}
