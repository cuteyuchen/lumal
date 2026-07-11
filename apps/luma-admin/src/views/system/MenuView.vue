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
import {
  createSystemMenu,
  deleteSystemMenu,
  fetchSystemMenus,
  updateSystemMenu,
} from '../../api/system'
import { adminPermissionCodes } from '../../mock/permission'

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
]

const columns: SchemaTableColumn[] = [
  { field: 'title', label: '标题', width: 180 },
  { field: 'type', label: '类型', options: menuTypeOptions, width: 90 },
  { field: 'path', label: '路径', width: 150 },
  { field: 'component', label: '组件', width: 160 },
  { field: 'externalLink', label: '外链', width: 180 },
  { field: 'icon', label: '图标', width: 130 },
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
    const current = menu.type === 'button'
      ? []
      : [{ label: `${'　'.repeat(depth)}${menu.title}`, value: menu.id }]
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
    component: 'select',
    disabled: ({ mode }) => mode === 'edit',
    field: 'parentId',
    label: '父级节点',
    options: parentOptions.value,
    span: 12,
  },
  {
    component: 'select',
    field: 'type',
    label: '节点类型',
    options: menuTypeOptions,
    required: true,
    span: 12,
  },
  {
    component: 'input',
    field: 'title',
    label: '标题',
    required: true,
    span: 12,
  },
  {
    component: 'number',
    field: 'order',
    label: '排序',
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
    span: 12,
  },
  {
    component: 'input',
    field: 'component',
    hidden: ({ model }) => model.type !== 'menu',
    label: '组件',
    placeholder: '例如 system/user',
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
    hidden: ({ model }) => model.type !== 'menu',
    label: '外链地址',
    placeholder: '填写后可不配置组件',
    span: 12,
  },
  {
    component: 'select',
    defaultValue: '_blank',
    field: 'externalTarget',
    hidden: ({ model }) => model.type !== 'menu' || !model.externalLink,
    label: '打开方式',
    options: [
      { label: '新窗口', value: '_blank' },
      { label: '站内 iframe', value: '_self' },
    ],
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
    field: 'permissions',
    label: '权限码',
    placeholder: '多个权限码使用英文逗号分隔',
    span: 12,
  },
  {
    component: 'switch',
    field: 'hidden',
    hidden: ({ model }) => model.type === 'button',
    label: '菜单隐藏',
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
    component: model.component,
    externalLink: model.externalLink,
    externalTarget: model.externalTarget,
    hidden: model.hidden,
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
    externalTarget: '_blank',
    hidden: false,
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
      description="维护目录、菜单、外链和按钮权限节点；保存结果会在下一次登录时直接驱动动态路由。"
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
        action-width="270"
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
