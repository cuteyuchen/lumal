import { createAuthorityDirective } from '@lumal/core/directives'
import { registerIcons } from '@lumal/icons'
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
  name: 'LumalPage',
  setup(_, { slots }) {
    return () => h('section', { class: 'page-stub' }, [
      slots.actions?.(),
      slots.default?.(),
    ])
  },
})

const TableStub = defineComponent({
  name: 'LumalSchemaTable',
  props: {
    columns: Array,
    rows: Array,
    tableProps: Object,
  },
  setup(_, { slots }) {
    return () => h('div', { class: 'table-stub' }, [
      slots['table-icon']?.({ value: sampleMenu.icon }),
      slots.actions?.({ index: 0, row: sampleMenu }),
    ])
  },
})

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: Boolean,
    title: String,
    top: String,
    width: String,
  },
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', {
          'class': 'dialog-stub',
          'data-title': props.title,
          'data-top': props.top,
          'data-width': props.width,
        }, slots.default?.())
      : null
  },
})

const FormStub = defineComponent({
  name: 'LumalSchemaForm',
  props: {
    columns: Number,
    gutter: Number,
    labelWidth: [Number, String],
    mode: String,
    modelValue: Object,
    schemas: Array,
  },
  setup(props, { slots }) {
    return () => h('form', { class: 'form-stub' }, slots['field-icon']?.({ value: props.modelValue?.icon }))
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
        LumalPage: PageStub,
        LumalSchemaForm: FormStub,
        LumalSchemaTable: TableStub,
      },
    },
  })
}

describe('system menu view', () => {
  beforeEach(async () => {
    registerIcons([{
      key: 'app:user',
      label: '用户',
      source: 'local-svg',
      svgText: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>',
    }])
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

  it('菜单表格和编辑表单复用 Lumal 图标，选择与清空会回写菜单模型', async () => {
    permissionStore.setPermissions(resolveMenuPermissions())
    const wrapper = mountMenuView()
    await flushPromises()

    expect(wrapper.get('.lumal-menu-icon-value .lumal-icon').find('svg').exists()).toBe(true)
    await wrapper.get('[data-action="edit-menu"]').trigger('click')
    const picker = wrapper.get('details')
    expect(wrapper.get('summary').text()).toContain('app:user')
    picker.element.open = true
    await wrapper.get('input[type="search"]').setValue('浅色模式')
    await wrapper.get('[role="option"][aria-label="浅色模式"]').trigger('click')

    expect(wrapper.findComponent(FormStub).props('modelValue')).toMatchObject({ icon: 'lumal:sun' })
    expect(picker.element.open).toBe(false)
    expect(wrapper.get('summary .lumal-icon').find('svg').exists()).toBe(true)
    await wrapper.get('[aria-label="清空菜单图标"]').trigger('click')
    expect(wrapper.findComponent(FormStub).props('modelValue')).toMatchObject({ icon: '' })
    expect(wrapper.find('[aria-label="清空菜单图标"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('打开新增弹窗并提供完整菜单表单字段', async () => {
    permissionStore.setPermissions(resolveMenuPermissions())
    const wrapper = mountMenuView()

    await wrapper.find('[data-action="create-menu"]').trigger('click')
    await nextTick()

    const dialog = wrapper.find('.dialog-stub')
    expect(dialog.attributes('data-title')).toBe('新增菜单')
    expect(dialog.attributes('data-top')).toBe('6vh')
    expect(dialog.attributes('data-width')).toBe('960px')
    expect(dialog.classes()).toContain('lumal-menu-dialog')

    const form = wrapper.findComponent(FormStub)
    expect(form.props()).toMatchObject({
      columns: 2,
      gutter: 24,
      labelWidth: 96,
    })
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
