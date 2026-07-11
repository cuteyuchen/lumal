# Core API

`@luma/core` 提供后台项目的基础设施和 Luma 原生组件。

## 应用启动

```ts
import { createLumaAdmin } from '@luma/core'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
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

const framework = createLumaAdmin({
  preset: 'admin-default',
  rootComponent: App,
  rootProps: {},
  router,
  pinia: createPinia(),
  elementPlus: {
    plugin: ElementPlus,
    options: {
      locale: zhCn,
    },
  },
  dictionary: {
    fetcher: async dictionary => ({
      items: [],
    }),
  },
  icons: {
    localSvg: [],
  },
  components: ['LumaLayout', 'LumaRouterView'],
  setup: ({ app }) => {
    // 应用级扩展
  },
})

await framework.mount('#app')
```

`createLumaAdmin` 负责创建 Vue app、注册本地图标、安装字典上下文、接入调用方传入的 router/pinia/Element Plus、选择性注册全局组件，并在挂载前执行应用级 setup。

关键行为：

- `preset` 支持 `admin-default` 和 `minimal`；两者都不内部创建 Pinia。
- `elementPlus` 兼容旧 Plugin 写法和 `{ plugin, options }` 写法。
- `components` 支持 `true`、`false`、组件名数组和组件映射。
- `mount()` 为异步方法，会等待 `setup()` 和 `router.isReady()`。
- 返回值暴露 `app`、`router`、`pinia`、`permissionStore`、`use()` 和 `mount()`。

安装顺序固定为：本地图标注册 -> 字典上下文 -> `router` -> `pinia` -> `elementPlus` -> `components`；挂载阶段再执行 `setup` -> `router.isReady` -> Vue mount。

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

### Page 与 Page Layout

- `LumaPage` 支持 `fill`、`noPadding` 和 `contentClass`，用于普通卡片页或填充式滚动页面。
- `LumaPageLayout` 使用查询、工具栏、内容、分页四区结构；`fill` 控制高度填充，`contentScrollable` 控制内容区滚动，`surface` 控制分区表面样式。

### Schema Form

```vue
<script setup lang="ts">
import type { SchemaFormItem, SchemaFormMode, SchemaFormModel } from '@luma/core/components'
import { LumaSchemaForm } from '@luma/core/components'
import { shallowRef } from 'vue'

interface ProjectForm {
  enabled: boolean
  name: string
  score: number
  status: string
}

const model = shallowRef<SchemaFormModel<ProjectForm>>({})
const mode = shallowRef<SchemaFormMode>('edit')

const schemas: SchemaFormItem<ProjectForm>[] = [
  {
    field: 'name',
    label: '名称',
    component: 'input',
    editDisabled: true,
    prepend: '项目',
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
    formatter: value => `${String(value ?? 0)} 分`,
    suffix: '分',
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

`LumaSchemaForm` 支持 `create`、`edit`、`view` 三种模式。`view` 模式使用文本语义展示格式化结果，不再渲染一组禁用输入框。

内置控件包括：`input`、`textarea`、`select`、`number`、`switch`、`date`、`datetime`、`daterange`、`radio`、`checkbox`、`tree-select`、`upload`、`hidden`。

字段配置推荐使用：

- `field`：模型字段名。
- `label`：表单标签。
- `component`：内置控件类型。
- `dictionary`：从字典上下文加载 options。
- `options`：数组或 `Ref` options。
- `rules`：Element Plus 表单校验规则。
- `span` / `columns` / `labelWidth`：控制布局。
- `hidden` / `disabled` / `readonly`：支持布尔值或 `(context) => boolean`。
- `editDisabled`：仅编辑模式禁用。
- `authority` / `readonlyAuthority`：结合 `canAccess` 控制隐藏或只读权限。
- `formatter`：查看模式格式化。
- `prepend` / `append` / `prefix` / `suffix`：复合输入内容。
- `componentProps`：按 `component` 精确映射到对应 Element Plus props。
- `componentProps`、`options`、`required`、`rules`、`hidden`、`disabled`、`readonly` 均可使用 `(context) => value` 动态解析；上下文包含当前字段、值、模型和 `setFieldValue`。
- `description` / `help`：在控件下方显示持续可见的说明与帮助信息。
- `onChange`：字段变化回调，不需要从外部重复监听整个模型。

字段插槽命名规则：

- `field-${field}`：完全接管该字段渲染。
- `prefix-${field}`：字段控件前置内容。
- `suffix-${field}`：字段控件后置内容。

表单级能力包括 `loading`、`compact`、`gutter`、`showReset`、`submitOnEnter`、`scrollToFirstError`、`actionLayout` 和 `actionPosition`。公开控制器提供 `setFieldValue`、`clearValidate`、`scrollToField` 与 `getFieldComponent`。

### Schema Table

```vue
<script setup lang="ts">
import type { SchemaTableColumn, SchemaTablePaginationChangePayload } from '@luma/core/components'
import { LumaSchemaTable } from '@luma/core/components'
import { shallowRef } from 'vue'

const page = shallowRef(1)
const pageSize = shallowRef(10)

interface ProjectRow {
  id: number
  name: string
  status: string
}

const columns: SchemaTableColumn<ProjectRow>[] = [
  {
    field: 'name',
    label: '名称',
    componentProps: {
      minWidth: 160,
    },
  },
  { field: 'status', label: '状态', dictionary: 'status' },
]

const rows: ProjectRow[] = [
  { id: 1, name: 'Luma', status: 'enabled' },
]

function handleSelectionChange(rows: ProjectRow[], rowKeys: Array<string | number>) {
  console.log(rows, rowKeys)
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
    show-column-settings
    pagination
    :total="36"
    :table-props="{ border: true, stripe: true }"
    @selection-change="handleSelectionChange"
    @page-change="handlePageChange"
  >
    <template #table-name="{ value }">
      <strong>{{ value }}</strong>
    </template>

    <template #actions="{ row }">
      <button type="button">
        {{ row.name }}
      </button>
    </template>
  </LumaSchemaTable>
</template>
```

`LumaSchemaTable` 支持：

- `selection`：渲染选择列，并通过 `selection-change(rows, rowKeys)` 同时返回选中行和主键。
- `showIndex`：渲染序号列。
- `showColumnSettings`：显示可键盘操作的列设置。
- `columnSettings`：配置列设置显示、拖动排序和 `storageKey` 持久化；至少保留一个可配置列，固定列不会被无效隐藏。
- `defaultExpandAll` / `treeProps`：树表配置，同时兼容旧 `tableProps` 写法。
- `autoResize`：使用 `ResizeObserver` 自动执行表格布局。
- `scaleColumnWidth`：关闭时忽略配置宽度并使用流式列宽；不依赖全局 viewport 转换。
- `columnResizable`：控制 Element Plus 列宽拖动。
- `loading`：表格加载状态。
- `pagination` / `total` / `pageSizes`：内部分页，配合 `v-model:page` 和 `v-model:page-size`。
- `hidden` / `authority`：控制列隐藏和权限；函数形式按行决定单元格显示。
- `componentProps`：透传给底层 `ElTableColumn`。
- `tableProps`：透传给底层 `ElTable`。
- `rowClassName` / `cellClassName` / `headerCellClassName`：行、单元格和表头 class。
- `actions` 插槽：追加操作列。
- `table-${field}` 插槽：接管指定字段；移动端操作列自动切换为“更多”入口。
- 字典项包含 `color` 时渲染“颜色点 + 文本”标签；颜色不作为唯一状态信息。
- 转发 `sortChange`、`filterChange`、`rowClick`、`currentChange`、`expandChange`、`selectionChange` 和 `pageChange`。
- `error` / `retry` 提供独立错误恢复状态；公开方法可获取可见列、列顺序和导出数据，并可恢复默认列设置。

复杂表格或自定义渲染可以复用公开 helper：

```ts
import { resolveSchemaTableCellDisplay } from '@luma/core/components'
```

该 helper 统一处理 formatter、空值、数组和字典回显；内部渲染组件不作为公共 API 导出。

### CRUD Table

```vue
<script setup lang="ts">
import type { CrudDataSource, CrudTableColumn } from '@luma/core/components'
import { LumaCrudTable } from '@luma/core/components'

const querySchemas = [
  { component: 'input', field: 'keyword', label: '关键词' },
  { dictionary: 'status', field: 'status', label: '状态' },
]

const columns: CrudTableColumn[] = [
  { field: 'name', label: '名称', required: true },
  { field: 'status', label: '状态', dictionary: 'status' },
  {
    field: 'remark',
    label: '备注',
    component: 'textarea',
    showInTable: false,
  },
]

const dataSource: CrudDataSource = {
  create: async (model) => {
    await saveProject(model)
  },
  fetch: async () => {
    return {
      items: [
        { id: 1, name: 'Luma', status: 'enabled' },
      ],
      total: 1,
    }
  },
}
</script>

<template>
  <LumaCrudTable
    title="项目列表"
    :data-source="dataSource"
    :query="{
      columns: 3,
      collapsible: true,
      schemas: querySchemas,
    }"
    :table="{
      columns,
      rowKey: 'id',
      selection: true,
      showColumnSettings: true,
    }"
    :toolbar="{ export: true }"
  />
</template>
```

`LumaCrudTable` 支持两种模式：

- 受控模式：传入 `rows` / `total`，由应用侧管理数据。
- 数据源模式：传入 `dataSource`，组件内部调用 `fetch`、维护 `rows` / `total` / `loading` / `error`。

标准数据源响应固定为：

```ts
interface CrudFetchResult<Row> {
  items: Row[]
  total: number
}
```

非标准响应不自动猜测字段，必须显式提供 `parseResponse`：

```ts
const dataSource: CrudDataSource = {
  fetch: params => request('/api/projects', { params }),
  parseResponse: response => ({
    items: response.records,
    total: response.count,
  }),
}
```

`dataSource` 可选动作包括 `create`、`update`、`remove`、`removeMany`。未显式配置 `formSchemas` 时，CRUD 会从 `columns` 自动派生新增、查看、编辑表单：列上的 `dictionary` / `dictType` 会自动生成表单 options，同时继续负责表格值翻译和颜色标签。`showInForm: false` 与 `showInTable: false` 分别控制字段是否进入派生表单或表格；显式 `formSchemas` 会整体覆盖自动派生结果。

Form、Table 和 CRUD 的字典规则保持一致：只需提供 `dictionary`（推荐）或 `dictType`，组件会从字典上下文加载选项；存在字典键时字典结果优先，手工 `options` 仅在未指定字典键时使用。

配置 `selection` 后会提供批量删除入口。删除确认通过 `actions.confirmRemove` 集中配置，可传函数、文案配置或 `false`（跳过确认）。

编辑器通过 `editor` 配置，`type` 支持 `dialog` 和 `drawer`，默认使用 `dialog`；同时支持宽度、表单列数、标签宽度、Loading、禁用态和关闭确认。工具栏支持标题、新增、批量删除、刷新、字典化 CSV 导出和全屏。

CRUD 会转发 `query-{field}`、`table-{field}`、`form-{field}`、`table-title`、`toolbar-actions`、`toolbar-tools`、`row-actions` 和 `footer` 插槽。查询配置可启用 `submitOnChange` 与 `submitDebounce`。

推荐使用六个配置对象组织复杂页面：

- `query`：schemas、列数、折叠、label width 和查询文案。
- `table`：columns、rowKey、selection、列设置、自动 resize 和操作列宽度。
- `toolbar`：新增、批量删除、刷新、导出及对应文案。
- `actions`：查看、编辑、删除的行级显示函数、文案和删除确认策略。
- `dialog`：标题、宽度、提交文案和脏表单关闭确认。
- `pagination`：开关和 page sizes。

旧的 `querySchemas`、`columns`、`rowKey`、`selection`、`pageSizes` 等扁平 props 在首个稳定版本前继续兼容；新配置与旧 props 同时存在时，新配置优先。

组件会触发 `export` 和 `operation-error` 事件。`export` 返回当前查询模型和已选择行；列表或写操作失败时保留可恢复状态，列表错误区提供重试入口，弹窗保存失败不会自动关闭。

公开方法包括：

- `reload`、`isLoading`
- `openCreate`、`openView`、`openEdit`
- `removeRow`、`removeSelectedRows`
- `getSelectedRows`、`getSelectedRowKeys`、`clearSelection`
- `getQueryForm`、`getDialogForm`、`getTable`、`getCrudElement`
- `toggleQuery`

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

layout 只负责后台壳层结构和交互，不请求业务数据。`LumaLayout` 接收完整 `menus` 与 `preferences`，并根据 `preferences.app.layout` 自动决定菜单显示位置：

- `sidebar-nav`：完整菜单树显示在侧栏。
- `top-nav`：完整菜单树显示在顶栏。
- `mixed-nav`：顶栏显示一级菜单，侧栏自动显示当前一级菜单的子菜单。

应用层不需要创建或传入 `topMenus`，也不需要自行计算顶栏激活项和侧栏菜单。点击 mixed-nav 一级菜单时，Layout 会自动解析首个可导航子项并通过 `menu-select` 输出最终路径。

启用 `route-driven` 后，Layout 还会从当前 Vue Router 路由创建访问标签，并支持：

- `route-tab-filter` / `route-tab-resolver`：过滤并解析路由标签。
- `fixed-tabs`：注入不可关闭的固定标签。
- `tab-max-count`：限制标签数量并优先保留固定标签。
- `tab-fallback-path`：关闭当前或全部可关闭标签后的回退地址。
- `getTabs()` / `resetTabs()`：读取和重置路由驱动标签。

路由驱动模式仍会触发现有 `tab-change`、`tab-remove`、`tab-refresh` 和批量关闭事件，便于应用补充埋点或刷新视图；路由切换和标签集合由 Layout 维护。

## Router

从 `@luma/core/router` 导入：

- `normalizeMenuNodes`
- `createRouteRecords`
- `createRouteRegistry`
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

菜单节点可通过 `meta.externalTarget` 指定外链打开策略：`_blank` 表示新窗口，`_self` 表示由应用在当前后台壳中承载。`createRouteRegistry` 负责记录动态注册的具名路由，并提供 `reset()` 在登出或会话失效时统一移除：

```ts
const registry = createRouteRegistry(router)

registry.register(createRouteRecords(normalizeMenuNodes(menuNodes)))
registry.reset()
```

## Permission

从 `@luma/core/permission` 导入：

- `createPermissionStore`
- `hasPermission`
- `hasRole`
- `createPermissionDirective`
- `setupPermissionGuard`

权限能力只处理通用权限判断，不绑定具体业务接口。

## Auth

从 `@luma/core/auth` 导入：

- `createAuthSession`
- `parseAuthSession`

标准会话固定为 `{ accessToken, refreshToken?, expiresAt? }`。字段异常由应用 adapter 映射，会话实例负责持久化与一次清除访问、刷新凭据：

```ts
const session = createAuthSession({ storage: localStorage })
const data = parseAuthSession(rawResponse, {
  fieldNames: {
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    expiresAt: 'expire_time',
  },
})

session.setSession(data)
```

## Request

从 `@luma/core/request` 导入：

- `createRequestClient`
- `createStandardResponseParser`
- `parsePageResult`
- `RequestError`

```ts
import { createRequestClient } from '@luma/core/request'

const request = createRequestClient({
  baseURL: '/api',
  getToken: () => session.getToken() || undefined,
  authRefresh: {
    refresh: async () => {
      session.setSession(await refreshSession(session.getRefreshToken()))
    },
  },
  onResponse: createStandardResponseParser(),
  onSessionExpired: () => session.handleSessionExpired(),
})
```

HTTP 401 或 parser 产生的 `kind: 'session'` 会进入认证刷新。并发请求共享同一个刷新 Promise；GET 默认允许最多重放一次，POST/PUT/PATCH/DELETE 必须逐请求显式设置 `retryOnAuthRefresh: true`。`RequestError.kind` 可用于统一区分 `network`、`http`、`business`、`session`、`duplicate` 与 `cancelled`，业务字段和状态码仍由应用 adapter 决定。

## Theme

从 `@luma/core/theme` 导入：

- `createThemeStore`
- `createPreferencesStore`
- `applyThemeToElement`
- `resolveThemeTokens`
- `defaultThemeState`

主题运行时支持明暗模式、主题色和紧凑布局，不包含多语言偏好。

偏好持久化示例：

```ts
import { createPreferencesStore } from '@luma/core/theme'

const preferences = createPreferencesStore({
  storage: localStorage,
  storageKey: 'admin:preferences',
  defaults: {
    app: { layout: 'mixed-nav' },
  },
})

preferences.patch({ theme: { mode: 'dark' } })
preferences.reset()
preferences.exportCurrent()
preferences.dispose()
```

Store 会清理损坏缓存、补齐新增默认字段，并只在主题模式为 `system` 时监听系统主题变化。

## 可选生态包

下列能力不进入 `@luma/core` 默认依赖：

- `@luma/icons`：响应式图标 registry、选择器、单色 SVG 校验/合成和 data URI 缓存，详见 `docs/icons.md`。
- `@luma/charts`：`LumaChart` 与 `LumaChartPanel`；面板支持查询、表格替代视图、导出、错误恢复和无障碍摘要。
- `@luma/vben-compat`：Vben 高频表单/Grid 写法到 Luma Schema/CRUD 的迁移适配，详见 `docs/migration-from-vben.md`。
- `@luma/vite`：组件 resolver、工作区 source/dist alias 和可选 Devtools 接线。

```ts
import {
  createLumaAliases,
  createLumaComponentResolver,
  resolveLumaDevtoolsPlugin,
} from '@luma/vite'

const aliases = createLumaAliases({
  workspaceRoot: process.cwd(),
  target: 'source',
})

const resolver = createLumaComponentResolver({ importStyle: true })
const devtools = resolveLumaDevtoolsPlugin({
  enabled: import.meta.env.DEV,
  factory: () => installedDevtoolsPlugin(),
})
```

`@luma/vite` 不安装自动导入或 Devtools 实现，也不提供 1920px 到 viewport 的全局转换。
