# Core API

`@luma/core` 提供后台项目的基础设施和 Luma 原生组件。

## 应用启动

```ts
import { createLumaAdmin } from '@luma/core'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons/style.css'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

createLumaAdmin({
  rootComponent: App,
  rootProps: {},
  router,
  pinia: createPinia(),
  elementPlus: ElementPlus,
  dictionary: {
    fetcher: async dictionary => ({
      items: [],
    }),
  },
  icons: {
    localSvg: [],
  },
  components: {},
  setup: ({ app }) => {
    // 应用级扩展
  },
}).mount('#app')
```

`createLumaAdmin` 当前负责创建 Vue app、注册本地图标、安装字典上下文、安装调用方传入的 router/pinia/Element Plus 插件、注册全局组件并执行应用级 setup。Element Plus、Pinia 和 Vue Router 都由应用侧传入，`@luma/core` 不做默认安装。

安装顺序固定为：本地图标注册 -> 字典上下文 -> `router` -> `pinia` -> `elementPlus` -> `components` -> `setup`。

## 组件

从 `@luma/core/components` 导入：

- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- `LumaPage`
- `LumaPageLayout`
- `LumaPagination`
- `LumaInfoTable`
- `LumaIcon`
- `LumaIconPicker`
- `LumaIconPickerDialog`

### Schema Form

```vue
<script setup lang="ts">
import type { SchemaFormItem, SchemaFormMode, SchemaFormModel } from '@luma/core/components'
import { LumaSchemaForm } from '@luma/core/components'
import { shallowRef } from 'vue'

const model = shallowRef<SchemaFormModel>({})
const mode = shallowRef<SchemaFormMode>('edit')

const schemas: SchemaFormItem[] = [
  {
    field: 'name',
    label: '名称',
    component: 'input',
    rules: [{ required: true, message: '请输入名称' }],
  },
  {
    field: 'status',
    label: '状态',
    dictionary: 'status',
  },
  {
    field: 'enabled',
    label: '启用',
    component: 'switch',
  },
  {
    field: 'score',
    label: '评分',
    component: 'number',
    componentProps: {
      min: 0,
      max: 100,
    },
  },
]
</script>

<template>
  <LumaSchemaForm
    v-model="model"
    :columns="2"
    label-width="92px"
    :mode="mode"
    :schemas="schemas"
    show-actions
  >
    <template #prefix-name>
      <span>前缀</span>
    </template>

    <template #suffix-name>
      <span>后缀</span>
    </template>
  </LumaSchemaForm>
</template>
```

`LumaSchemaForm` 当前支持 `create`、`edit`、`view` 三种模式。`view` 模式会把字段置为只读并隐藏操作区。

内置控件包括：`input`、`textarea`、`select`、`number`、`switch`、`date`、`datetime`、`daterange`、`radio`、`checkbox`、`tree-select`、`upload`、`hidden`。

字段配置推荐使用：

- `field`：模型字段名。
- `label`：表单标签。
- `component`：内置控件类型。
- `dictionary`：从字典上下文加载 options。
- `options`：静态 options。
- `rules`：Element Plus 表单校验规则。
- `span` / `columns` / `labelWidth`：控制布局。
- `hidden` / `disabled` / `readonly`：支持布尔值或 `(context) => boolean`。
- `authority`：结合 `canAccess` 控制字段权限。
- `componentProps`：透传给底层 Element Plus 控件。

字段插槽命名规则：

- `field-${field}`：完全接管该字段渲染。
- `prefix-${field}`：字段控件前置内容。
- `suffix-${field}`：字段控件后置内容。

### Schema Table

```vue
<script setup lang="ts">
import type { SchemaTableColumn, SchemaTablePaginationChangePayload, SchemaTableRow } from '@luma/core/components'
import { LumaSchemaTable } from '@luma/core/components'
import { shallowRef } from 'vue'

const page = shallowRef(1)
const pageSize = shallowRef(10)

const columns: SchemaTableColumn[] = [
  {
    field: 'name',
    label: '名称',
    componentProps: {
      minWidth: 160,
    },
  },
  { field: 'status', label: '状态', dictionary: 'status' },
]

const rows: SchemaTableRow[] = [
  { id: 1, name: 'Luma', status: 'enabled' },
]

function handleSelectionChange(rows: SchemaTableRow[]) {
  console.log(rows)
}

function handlePageChange(payload: SchemaTablePaginationChangePayload) {
  page.value = payload.page
  pageSize.value = payload.pageSize
}
</script>

<template>
  <LumaSchemaTable
    v-model:page="page"
    v-model:page-size="pageSize"
    :columns="columns"
    :rows="rows"
    row-key="id"
    selection
    show-index
    pagination
    :total="36"
    :table-props="{ border: true, stripe: true }"
    @selection-change="handleSelectionChange"
    @page-change="handlePageChange"
  >
    <template #actions="{ row }">
      <button type="button">
        {{ row.name }}
      </button>
    </template>
  </LumaSchemaTable>
</template>
```

`LumaSchemaTable` 支持：

- `selection`：渲染选择列，并通过 `selection-change` 返回选中行。
- `showIndex`：渲染序号列。
- `loading`：表格加载状态。
- `pagination` / `total` / `pageSizes`：内部分页，配合 `v-model:page` 和 `v-model:page-size`。
- `hidden` / `authority`：控制列隐藏和权限。
- `componentProps`：透传给底层 `ElTableColumn`。
- `tableProps`：透传给底层 `ElTable`。
- `rowClassName` / `cellClassName` / `headerCellClassName`：行、单元格和表头 class。
- `actions` 插槽：追加操作列。

### CRUD Table

```vue
<script setup lang="ts">
import { LumaCrudTable } from '@luma/core/components'

const columns = [
  { field: 'name', label: '名称' },
  { field: 'status', label: '状态', dictionary: 'status' },
]

const rows = [
  { id: 1, name: 'Luma', status: 'enabled' },
]
</script>

<template>
  <LumaCrudTable
    title="项目列表"
    row-key="id"
    :columns="columns"
    :rows="rows"
    :total="1"
  />
</template>
```

### Dictionary

从 `@luma/core/dictionary` 导入：

- `installDictionary`
- `useDictionary`
- `useDictionaryMap`
- `getDictionaryLabel`
- `normalizeDictionaryOptions`
- `createDictionaryFetcherWithFallback`

推荐字段名是 `dictionary`，用于 Schema Form 的下拉 options 生成，以及 Schema Table / CRUD Table 的值回显：

```ts
const schemas = [
  { field: 'status', label: '状态', dictionary: 'status' },
]

const columns = [
  { field: 'status', label: '状态', dictionary: 'status' },
]
```

标准响应结构固定为：

```ts
interface DictionaryResponse {
  items: DictionaryOption[]
}
```

默认解析器只读取 `{ items: [...] }`，不会自动兼容 `data`、`result`、`list` 等非标准响应。非标准接口需要显式传入 `fieldNames` 或 `parseResponse`：

```ts
createLumaAdmin({
  rootComponent: App,
  dictionary: {
    fieldNames: {
      items: 'records',
      label: 'name',
      value: 'code',
    },
    fetcher: dictionary => fetch(`/api/dictionaries/${dictionary}`).then(res => res.json()),
  },
})
```

## Layout

从 `@luma/core/layout` 导入：

- `LumaLayout`
- `LumaHeader`
- `LumaSidebar`
- `LumaTabs`
- `LumaContent`
- `LumaRouterView`

layout 只负责后台壳层结构和交互，不请求业务数据。

## Router

从 `@luma/core/router` 导入：

- `normalizeMenuNodes`
- `createRouteRecords`
- `createSidebarMenus`
- `findFirstAccessibleMenu`

这些函数用于把后端菜单节点转换为路由记录和侧边栏菜单。

`createSidebarMenus` 支持通过回调过滤权限和角色，适合与 `createPermissionStore` 组合：

```ts
import { createPermissionStore } from '@luma/core/permission'
import { createSidebarMenus, normalizeMenuNodes } from '@luma/core/router'

const permissionStore = createPermissionStore({
  permissions: ['dashboard:view'],
  roles: ['admin'],
})

const menus = createSidebarMenus(normalizeMenuNodes(menuNodes), {
  hasPermission: permissions => permissionStore.hasPermission(permissions, 'every'),
  hasRole: roles => permissionStore.hasRole(roles, 'every'),
})
```

## Permission

从 `@luma/core/permission` 导入：

- `createPermissionStore`
- `hasPermission`
- `hasRole`
- `createPermissionDirective`
- `setupPermissionGuard`

权限能力只处理通用权限判断，不绑定具体业务接口。

## Request

从 `@luma/core/request` 导入：

- `createRequestClient`
- `RequestError`

```ts
import { createRequestClient } from '@luma/core/request'

const request = createRequestClient({
  baseURL: '/api',
  getToken: () => localStorage.getItem('token') ?? undefined,
  onResponse: ({ data }) => data,
  onSessionExpired: () => {
    localStorage.removeItem('token')
  },
})
```

请求 token、响应解析和会话过期通过回调接入，业务错误码由应用侧决定。

## Theme

从 `@luma/core/theme` 导入：

- `createThemeStore`
- `applyThemeToElement`
- `resolveThemeTokens`
- `defaultThemeState`

主题运行时支持明暗模式、主题色和紧凑布局，不包含多语言偏好。
