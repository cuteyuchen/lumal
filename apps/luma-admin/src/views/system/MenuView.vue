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
import { ElButton, ElDialog, ElMessage, ElMessageBox } from 'element-plus'
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
  { field: 'icon', label: '图标', width: 130 },
  { field: 'permission', label: '权限码', width: 190 },
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
    field: 'icon',
    hidden: ({ model }) => model.type === 'button',
    label: '图标',
    placeholder: '例如 app:user',
    span: 12,
  },
  {
    component: 'input',
    field: 'permission',
    label: '权限码',
    placeholder: '例如 system:user:list',
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
    hidden: model.hidden,
    icon: model.icon,
    order: model.order,
    parentId: model.parentId,
    path: model.path,
    permission: model.permission,
    title: model.title,
    type: model.type,
  }
}

/***********************弹窗操作*********************/
function openCreate(parentId = ''): void {
  formMode.value = 'create'
  editingMenu.value = undefined
  formModel.value = {
    hidden: false,
    order: 0,
    parentId,
    type: parentId ? 'menu' : 'directory',
  }
  dialogVisible.value = true
}

function openEdit(row: SchemaTableRow): void {
  const menu = toMenuRecord(row)
  formMode.value = 'edit'
  editingMenu.value = menu
  formModel.value = { ...menu }
  dialogVisible.value = true
}

async function handleSubmit(model: SchemaFormModel): Promise<void> {
  if (formMode.value === 'edit' && editingMenu.value) {
    await updateSystemMenu(editingMenu.value.id, toMenuInput(model))
  }
  else {
    await createSystemMenu(toMenuInput(model))
  }

  dialogVisible.value = false
  await loadMenus()
  ElMessage.warning('菜单数据已更新，请重新登录或刷新权限后生效')
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

  await deleteSystemMenu(menu.id)
  await loadMenus()
  ElMessage.warning('菜单数据已删除，请重新登录或刷新权限后生效')
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
      description="维护目录、菜单和按钮权限节点；当前路由仍使用静态配置，变更会在动态菜单阶段接入。"
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

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <LumaSchemaForm
        v-model="formModel"
        :mode="formMode"
        :schemas="formSchemas"
        show-actions
        submit-text="保存"
        @submit="handleSubmit"
      />
    </ElDialog>
  </main>
</template>
