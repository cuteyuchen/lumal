import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminPermissionCodes } from '../src/mock/permission'
import { permissionStore } from '../src/services/permission'
import UserView from '../src/views/system/UserView.vue'

const sampleUser = {
  createdAt: '2026-01-15',
  id: 'user-1',
  nickname: '超级管理员',
  phone: '13800138001',
  role: 'admin',
  status: 'enabled',
  username: 'admin',
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
    dataSource: Object,
    formSchemas: Array,
    query: Object,
    table: Object,
  },
  setup(_, { expose, slots }) {
    const openCreate = vi.fn()
    const openEdit = vi.fn()
    const openView = vi.fn()
    const removeRow = vi.fn().mockResolvedValue(undefined)

    expose({ openEdit, openView, removeRow })

    return () => h('section', { class: 'crud-table-stub' }, [
      slots['create-action']?.({ openCreate }),
      slots['row-actions']?.({ index: 0, row: sampleUser }),
    ])
  },
})

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

function mountUserView() {
  return mount(UserView, {
    global: {
      directives: {
        authority: createAuthorityDirective(permissionStore),
      },
      stubs: {
        ElButton: ButtonStub,
        LumaCrudTable: CrudTableStub,
      },
    },
  })
}

describe('system user view', () => {
  beforeEach(() => {
    permissionStore.clear()
  })

  it('配置用户字段、查询条件和标准 dataSource', async () => {
    permissionStore.setPermissions(resolveUserPermissions())
    const wrapper = mountUserView()
    await flushPromises()

    const crudTable = wrapper.findComponent(CrudTableStub)
    const table = crudTable.props('table') as { columns: { field: string }[], showColumnSettings: boolean }
    const query = crudTable.props('query') as { schemas: { field: string }[] }
    const formSchemas = crudTable.props('formSchemas') as { field: string }[]
    const dataSource = crudTable.props('dataSource') as Record<string, unknown>

    expect(table.columns.map(column => column.field)).toEqual([
      'username',
      'nickname',
      'role',
      'status',
      'phone',
      'createdAt',
    ])
    expect(query.schemas.map(schema => schema.field)).toEqual(['keyword', 'role', 'status'])
    expect(table.showColumnSettings).toBe(true)
    expect(formSchemas.map(schema => schema.field)).toEqual(['username', 'nickname', 'role', 'status', 'phone'])
    expect(Object.keys(dataSource).sort()).toEqual(['create', 'fetch', 'remove', 'update'])
  })

  it('使用 v-authority 隐藏没有权限的新增、编辑和删除按钮', () => {
    permissionStore.setPermissions([adminPermissionCodes.systemUserList])
    const wrapper = mountUserView()

    expect(wrapper.find('[data-action="view-user"]').attributes('style')).toBeUndefined()
    expect(wrapper.find('[data-action="create-user"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-user"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-user"]').attributes('style')).toContain('display: none')
  })

  it('拥有系统用户操作权限时显示对应按钮', () => {
    permissionStore.setPermissions(resolveUserPermissions())
    const wrapper = mountUserView()

    expect(wrapper.find('[data-action="create-user"]').attributes('style')).toBeUndefined()
    expect(wrapper.find('[data-action="edit-user"]').attributes('style')).toBeUndefined()
    expect(wrapper.find('[data-action="delete-user"]').attributes('style')).toBeUndefined()
  })
})

function resolveUserPermissions(): string[] {
  return [
    adminPermissionCodes.systemUserList,
    adminPermissionCodes.systemUserCreate,
    adminPermissionCodes.systemUserUpdate,
    adminPermissionCodes.systemUserDelete,
  ]
}
