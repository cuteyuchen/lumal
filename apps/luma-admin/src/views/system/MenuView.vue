<script setup lang="ts">
import type {
  SchemaFormItem,
  SchemaFormMode,
  SchemaFormModel,
  SchemaFormOption,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import type { SaveSystemMenuInput, SystemMenuRecord } from '../../api/system'
import { LumaPage, LumaSchemaForm, LumaSchemaTable } from '@luma/core/components'
import { ElAlert, ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, shallowRef } from 'vue'
import { adminPermissionCodes } from '../../api/permissions'
import {
  createSystemMenu,
  deleteSystemMenu,
  fetchSystemMenus,
  updateSystemMenu,
} from '../../api/system'

/***********************页面状态*********************/
const menus = shallowRef<SystemMenuRecord[]>([])
const loading = shallowRef(false)
const dialogVisible = shallowRef(false)
const formMode = shallowRef<SchemaFormMode>('create')
const editingMenu = shallowRef<SystemMenuRecord>()
const formModel = shallowRef<SchemaFormModel>({})
const saving = shallowRef(false)
const operationError = shallowRef('')

const tableRows = computed(() => menus.value as unknown as SchemaTableRow[])
const dialogTitle = computed(() => formMode.value === 'edit' ? '编辑菜单' : '新增菜单')

/***********************表格与表单配置*********************/
const menuTypeOptions: SchemaFormOption[] = [
  { label: '目录', value: 'directory' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
  { label: '内嵌', value: 'embedded' },
  { label: '外链', value: 'external' },
]

const badgeTypeOptions: SchemaFormOption[] = [
  { label: '文字', value: 'text' },
  { label: '圆点', value: 'dot' },
]

const badgeToneOptions: SchemaFormOption[] = [
  { label: '主色', value: 'primary' },
  { label: '成功', value: 'success' },
  { label: '警告', value: 'warning' },
  { label: '危险', value: 'danger' },
  { label: '信息', value: 'info' },
]

const columns: SchemaTableColumn[] = [
  { field: 'title', label: '标题', width: 180 },
  { field: 'type', label: '类型', options: menuTypeOptions, width: 90 },
  { field: 'path', label: '路径', width: 150 },
  { field: 'component', label: '组件', width: 160 },
  { field: 'externalLink', label: '页面地址', width: 180 },
  { field: 'icon', label: '图标', width: 130 },
  { field: 'badge', label: '徽标', width: 90 },
  {
    field: 'permissions',
    formatter: value => Array.isArray(value) ? value.join(', ') : '',
    label: '权限码',
    width: 220,
  },
  { field: 'order', label: '排序', width: 80 },
  {
    field: 'hidden',
    label: '隐藏',
    options: [
      { label: '是', value: true },
      { label: '否', value: false },
    ],
    width: 80,
  },
]

function flattenParentOptions(items: SystemMenuRecord[], depth = 0): SchemaFormOption[] {
  return items.flatMap((menu) => {
    const current = menu.type === 'directory' || menu.type === 'menu'
      ? [{ label: `${'　'.repeat(depth)}${menu.title}`, value: menu.id }]
      : []
    const children = menu.children ? flattenParentOptions(menu.children, depth + 1) : []

    return [...current, ...children]
  })
}

const parentOptions = computed<SchemaFormOption[]>(() => [
  { label: '根目录', value: '' },
  ...flattenParentOptions(menus.value),
])

const formSchemas = computed<SchemaFormItem[]>(() => [
  {
    component: 'radio',
    field: 'type',
    label: '节点类型',
    options: menuTypeOptions,
    required: true,
    span: 24,
  },
  {
    component: 'input',
    field: 'title',
    label: '菜单名称',
    required: true,
    span: 12,
  },
  {
    component: 'select',
    disabled: ({ mode }) => mode === 'edit',
    field: 'parentId',
    label: '上级菜单',
    options: parentOptions.value,
    span: 12,
  },
  {
    component: 'input',
    field: 'name',
    hidden: ({ model }) => model.type === 'button',
    label: '路由名称',
    placeholder: '例如 AuditIndex',
    span: 12,
  },
  {
    component: 'input',
    field: 'path',
    hidden: ({ model }) => model.type === 'button',
    label: '路径',
    placeholder: '根节点使用 /path，子节点使用 path',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'component',
    hidden: ({ model }) => model.type !== 'menu',
    label: '组件',
    placeholder: '例如 system/user',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'redirect',
    hidden: ({ model }) => model.type !== 'directory',
    label: '重定向',
    placeholder: '例如 /system/user',
    span: 12,
  },
  {
    component: 'input',
    field: 'externalLink',
    hidden: ({ model }) => model.type !== 'embedded' && model.type !== 'external',
    label: '页面地址',
    placeholder: '请输入完整的 http(s) 地址',
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'icon',
    hidden: ({ model }) => model.type === 'button',
    label: '图标',
    placeholder: '例如 app:user',
    span: 12,
  },
  {
    component: 'input',
    field: 'activeMenu',
    hidden: ({ model }) => model.type === 'button',
    label: '激活菜单',
    placeholder: '例如 /system/user',
    span: 12,
  },
  {
    component: 'input',
    field: 'badge',
    hidden: ({ model }) => model.type === 'button',
    label: '菜单徽标',
    placeholder: '例如 NEW 或 3',
    span: 8,
  },
  {
    component: 'select',
    field: 'badgeType',
    hidden: ({ model }) => model.type === 'button',
    label: '徽标类型',
    options: badgeTypeOptions,
    span: 8,
  },
  {
    component: 'select',
    field: 'badgeTone',
    hidden: ({ model }) => model.type === 'button',
    label: '徽标色调',
    options: badgeToneOptions,
    span: 8,
  },
  {
    component: 'input',
    field: 'permissions',
    label: '权限码',
    placeholder: '多个权限码使用英文逗号分隔',
    span: 12,
  },
  {
    component: 'number',
    field: 'order',
    label: '排序',
    span: 12,
  },
  {
    component: 'switch',
    field: 'hidden',
    hidden: ({ model }) => model.type === 'button',
    label: '菜单隐藏',
    span: 12,
  },
  {
    component: 'switch',
    field: 'hideInBreadcrumb',
    hidden: ({ model }) => model.type === 'button',
    label: '面包屑隐藏',
    span: 12,
  },
])

const tableProps = {
  defaultExpandAll: true,
  treeProps: {
    children: 'children',
  },
}

/***********************数据加载*********************/
async function loadMenus(): Promise<void> {
  loading.value = true

  try {
    menus.value = await fetchSystemMenus()
  }
  finally {
    loading.value = false
  }
}

function toMenuRecord(row: SchemaTableRow): SystemMenuRecord {
  return row as unknown as SystemMenuRecord
}

function toMenuInput(model: SchemaFormModel): SaveSystemMenuInput {
  return {
    activeMenu: model.activeMenu,
    badge: model.badge,
    badgeTone: model.badgeTone,
    badgeType: model.badgeType,
    component: model.component,
    externalLink: model.externalLink,
    externalTarget: model.type === 'embedded' ? '_self' : model.type === 'external' ? '_blank' : undefined,
    hidden: model.hidden,
    hideInBreadcrumb: model.hideInBreadcrumb,
    icon: model.icon,
    name: model.name,
    order: model.order,
    parentId: model.parentId,
    path: model.path,
    permissions: model.permissions,
    redirect: model.redirect,
    title: model.title,
    type: model.type,
  }
}

/***********************弹窗操作*********************/
function openCreate(parentId = ''): void {
  formMode.value = 'create'
  editingMenu.value = undefined
  formModel.value = {
    badgeTone: 'primary',
    badgeType: 'text',
    hidden: false,
    hideInBreadcrumb: false,
    order: 0,
    parentId,
    type: parentId ? 'menu' : 'directory',
  }
  operationError.value = ''
  dialogVisible.value = true
}

function openEdit(row: SchemaTableRow): void {
  const menu = toMenuRecord(row)
  formMode.value = 'edit'
  editingMenu.value = menu
  formModel.value = {
    ...menu,
    permissions: menu.permissions.join(', '),
  }
  operationError.value = ''
  dialogVisible.value = true
}

async function handleSubmit(model: SchemaFormModel): Promise<void> {
  saving.value = true
  operationError.value = ''

  try {
    if (formMode.value === 'edit' && editingMenu.value) {
      await updateSystemMenu(editingMenu.value.id, toMenuInput(model))
    }
    else {
      await createSystemMenu(toMenuInput(model))
    }

    dialogVisible.value = false
    await loadMenus()
    ElMessage.success('菜单已保存，将在下次登录时加载')
  }
  catch (error) {
    operationError.value = error instanceof Error ? error.message : '菜单保存失败'
  }
  finally {
    saving.value = false
  }
}

async function removeMenuRow(row: SchemaTableRow): Promise<void> {
  const menu = toMenuRecord(row)

  try {
    await ElMessageBox.confirm(`确定删除“${menu.title}”及其子节点吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  }
  catch {
    return
  }

  try {
    await deleteSystemMenu(menu.id)
    await loadMenus()
    ElMessage.success('菜单已删除，将在下次登录时生效')
  }
  catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '菜单删除失败')
  }
}

function canAddChild(type: unknown): boolean {
  return type === 'directory' || type === 'menu'
}

onMounted(() => {
  void loadMenus()
})
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="菜单管理"
      description="维护目录、菜单、按钮、内嵌和外链节点；保存结果会在下一次登录时直接驱动动态路由。"
      :loading="loading"
    >
      <template #actions>
        <ElButton
          v-authority="adminPermissionCodes.systemMenuCreate"
          type="primary"
          native-type="button"
          data-action="create-menu"
          @click="openCreate()"
        >
          新增根节点
        </ElButton>
      </template>

      <LumaSchemaTable
        :columns="columns"
        :rows="tableRows"
        :table-props="tableProps"
        row-key="id"
        action-width="300"
      >
        <template #actions="{ row }">
          <ElButton
            v-if="canAddChild(row.type)"
            v-authority="adminPermissionCodes.systemMenuCreate"
            native-type="button"
            data-action="create-menu-child"
            @click="openCreate(String(row.id))"
          >
            新增子项
          </ElButton>
          <ElButton
            v-authority="adminPermissionCodes.systemMenuUpdate"
            native-type="button"
            data-action="edit-menu"
            @click="openEdit(row)"
          >
            编辑
          </ElButton>
          <ElButton
            v-authority="adminPermissionCodes.systemMenuDelete"
            type="danger"
            native-type="button"
            data-action="delete-menu"
            @click="removeMenuRow(row)"
          >
            删除
          </ElButton>
        </template>
      </LumaSchemaTable>
    </LumaPage>

    <ElDialog v-model="dialogVisible" append-to-body class="luma-admin-dialog" :title="dialogTitle" width="720px">
      <ElAlert
        v-if="operationError"
        class="luma-admin-page__operation-error"
        :title="operationError"
        type="error"
        show-icon
        :closable="false"
      />
      <LumaSchemaForm
        v-model="formModel"
        :mode="formMode"
        :schemas="formSchemas"
        :submit-loading="saving"
        show-actions
        submit-text="保存"
        @submit="handleSubmit"
      />
    </ElDialog>
  </main>
</template>
