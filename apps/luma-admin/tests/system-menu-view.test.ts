import { createAuthorityDirective } from '@luma/core/directives'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminPermissionCodes } from '../src/api/permissions'
import { permissionStore } from '../src/services/permission'
import { login, logout } from '../src/services/session'
import MenuView from '../src/views/system/MenuView.vue'

const sampleMenu = {
  component: 'system/user',
  hidden: false,
  icon: 'app:user',
  id: 'menu-user',
  order: 1,
  parentId: 'menu-system',
  path: 'user',
  permissions: [adminPermissionCodes.systemUserList],
  title: '用户管理',
  type: 'menu',
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
    return () => h('section', { class: 'page-stub' }, [
      slots.actions?.(),
      slots.default?.(),
    ])
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
    return () => h('div', { class: 'table-stub' }, slots.actions?.({ index: 0, row: sampleMenu }))
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
    mode: String,
    schemas: Array,
  },
  setup() {
    return () => h('form', { class: 'form-stub' })
  },
})

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 25))
  await nextTick()
}

function mountMenuView() {
  return mount(MenuView, {
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

describe('system menu view', () => {
  beforeEach(async () => {
    await login('admin')
    permissionStore.clear()
  })

  afterEach(async () => {
    permissionStore.clear()
    await logout()
  })

  it('使用 SchemaTable 树表展示菜单字段', async () => {
    permissionStore.setPermissions(resolveMenuPermissions())
    const wrapper = mountMenuView()
    await flushPromises()

    const table = wrapper.findComponent(TableStub)
    const columns = table.props('columns') as { field: string }[]
    const tableProps = table.props('tableProps') as Record<string, unknown>

    expect(columns.map(column => column.field)).toEqual([
      'title',
      'type',
      'path',
      'component',
      'externalLink',
      'icon',
      'badge',
      'permissions',
      'order',
      'hidden',
    ])
    expect(tableProps).toMatchObject({
      defaultExpandAll: true,
      treeProps: { children: 'children' },
    })
    expect((table.props('rows') as unknown[]).length).toBeGreaterThan(0)
  })

  it('使用 v-authority 控制菜单新增、编辑和删除按钮', () => {
    permissionStore.setPermissions([adminPermissionCodes.systemMenuList])
    const wrapper = mountMenuView()

    expect(wrapper.find('[data-action="create-menu"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="create-menu-child"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="edit-menu"]').attributes('style')).toContain('display: none')
    expect(wrapper.find('[data-action="delete-menu"]').attributes('style')).toContain('display: none')
  })

  it('打开新增弹窗并提供完整菜单表单字段', async () => {
    permissionStore.setPermissions(resolveMenuPermissions())
    const wrapper = mountMenuView()

    await wrapper.find('[data-action="create-menu"]').trigger('click')
    await nextTick()

    expect(wrapper.find('.dialog-stub').attributes('data-title')).toBe('新增菜单')
    const form = wrapper.findComponent(FormStub)
    const schemas = form.props('schemas') as { field: string }[]
    expect(schemas.map(schema => schema.field)).toEqual([
      'type',
      'title',
      'parentId',
      'name',
      'path',
      'component',
      'redirect',
      'externalLink',
      'icon',
      'activeMenu',
      'badge',
      'badgeType',
      'badgeTone',
      'permissions',
      'order',
      'hidden',
      'hideInBreadcrumb',
    ])

    expect((schemas.find(schema => schema.field === 'type') as { options?: Array<{ value: string }> }).options?.map(option => option.value)).toEqual([
      'directory',
      'menu',
      'button',
      'embedded',
      'external',
    ])
  })

  it('根据菜单类型只展示对应字段', async () => {
    permissionStore.setPermissions(resolveMenuPermissions())
    const wrapper = mountMenuView()

    await wrapper.find('[data-action="create-menu"]').trigger('click')
    await nextTick()

    const schemas = wrapper.findComponent(FormStub).props('schemas') as Array<{
      field: string
      hidden?: boolean | ((context: { model: Record<string, unknown> }) => boolean)
    }>

    expect(resolveVisibleFields(schemas, 'directory')).toEqual([
      'type',
      'title',
      'parentId',
      'name',
      'path',
      'redirect',
      'icon',
      'activeMenu',
      'badge',
      'badgeType',
      'badgeTone',
      'permissions',
      'order',
      'hidden',
      'hideInBreadcrumb',
    ])
    expect(resolveVisibleFields(schemas, 'menu')).toEqual([
      'type',
      'title',
      'parentId',
      'name',
      'path',
      'component',
      'icon',
      'activeMenu',
      'badge',
      'badgeType',
      'badgeTone',
      'permissions',
      'order',
      'hidden',
      'hideInBreadcrumb',
    ])
    expect(resolveVisibleFields(schemas, 'button')).toEqual([
      'type',
      'title',
      'parentId',
      'permissions',
      'order',
    ])
    expect(resolveVisibleFields(schemas, 'embedded')).toEqual([
      'type',
      'title',
      'parentId',
      'name',
      'path',
      'externalLink',
      'icon',
      'activeMenu',
      'badge',
      'badgeType',
      'badgeTone',
      'permissions',
      'order',
      'hidden',
      'hideInBreadcrumb',
    ])
    expect(resolveVisibleFields(schemas, 'external')).toEqual([
      'type',
      'title',
      'parentId',
      'name',
      'path',
      'externalLink',
      'icon',
      'activeMenu',
      'badge',
      'badgeType',
      'badgeTone',
      'permissions',
      'order',
      'hidden',
      'hideInBreadcrumb',
    ])
  })
})

function resolveVisibleFields(
  schemas: Array<{
    field: string
    hidden?: boolean | ((context: { model: Record<string, unknown> }) => boolean)
  }>,
  type: string,
): string[] {
  return schemas
    .filter(schema => typeof schema.hidden === 'function'
      ? !schema.hidden({ model: { type } })
      : schema.hidden !== true)
    .map(schema => schema.field)
}

function resolveMenuPermissions(): string[] {
  return [
    adminPermissionCodes.systemMenuList,
    adminPermissionCodes.systemMenuCreate,
    adminPermissionCodes.systemMenuUpdate,
    adminPermissionCodes.systemMenuDelete,
  ]
}
