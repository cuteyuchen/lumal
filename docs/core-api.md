# Core API

`@lumal/core` 提供后台项目的基础设施和 Lumal 原生组件。

## 应用启动

```ts
import { createLumalAdmin } from '@lumal/core'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
import '@lumal/icons-vue/style.css'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

const framework = createLumalAdmin({
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
  components: ['LumalLayout', 'LumalRouterView'],
  setup: ({ app }) => {
    // 应用级扩展
  },
})

await framework.mount('#app')
```

`createLumalAdmin` 负责创建 Vue app、注册本地图标、安装字典上下文、接入调用方传入的 router/pinia/Element Plus、选择性注册全局组件，并在挂载前执行应用级 setup。

关键行为：

- `preset` 支持 `admin-default` 和 `minimal`；两者都不内部创建 Pinia，`minimal` 默认不注册组件。
- `elementPlus` 兼容旧 Plugin 写法和 `{ plugin, options }` 写法。
- `components` 支持 `true`、`false`、组件名数组和组件映射。
- `mount()` 为异步方法，会等待 `setup()` 和 `router.isReady()`。
- 返回值暴露 `app`、`router`、`pinia`、`permissionStore`、`use()` 和 `mount()`。

安装顺序固定为：本地图标注册 -> 字典上下文 -> `pinia` -> `router` -> `elementPlus` -> `components`；挂载阶段再执行 `setup` -> `router.isReady` -> Vue mount。

### 真正轻量的启动入口

根入口保留开箱即用的默认组件表；只设置根入口的 `preset: 'minimal'` 或 `components: false` 不能消除这份静态依赖。需要隔离 UI 时使用 `@lumal/core/minimal`：

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
import App from './App.vue'

await createLumalAdmin({
  rootComponent: App,
  // components: { MyComponent }，只接受显式组件映射，不引用默认组件表。
}).mount('#app')
```

该入口默认不安装字典，不静态加载 Element Plus、Sortable 或图表引擎。字典、router、pinia、Element Plus 仍可显式传入；使用 UI 组件时需要安装对应 peer 并引入其样式。纯服务消费者可以只导入 `@lumal/core/request` 等子入口，无需安装 Element Plus。

## 组件

从 `@lumal/core/components` 导入：

- `LumalSchemaForm`
- `LumalSchemaTable`
- `LumalCrudTable`
- `LumalPage`
- `LumalPageLayout`
- `LumalPagination`
- `LumalInfoTable`
- `LumalIcon`
- `LumalIconPicker`
- `LumalIconPickerDialog`

### Page 与 Page Layout

- `LumalPage` 支持 `fill`、`noPadding` 和 `contentClass`，用于普通卡片页或填充式滚动页面。
- `LumalPageLayout` 使用查询、工具栏、内容、分页四区结构；`fill` 控制高度填充，`contentScrollable` 控制内容区滚动，`surface` 控制分区表面样式。

### Schema Form

```vue
<script setup lang="ts">
import type { SchemaFormItem, SchemaFormMode, SchemaFormModel } from '@lumal/core/components'
import { LumalSchemaForm } from '@lumal/core/components'
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
  <LumalSchemaForm
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
  </LumalSchemaForm>
</template>
```

`LumalSchemaForm` 支持 `create`、`edit`、`view` 三种模式。`view` 模式使用文本语义展示格式化结果，不再渲染一组禁用输入框。

内置控件包括：`input`、`textarea`、`select`、`number`、`switch`、`date`、`datetime`、`daterange`、`radio`、`checkbox`、`tree-select`、`upload`、`hidden`。

字段配置推荐使用：

- `field`：模型字段名。
- `label`：表单标签。
- `component`：内置控件类型。
- `dictionary`：从字典上下文加载 options。
- `options`：数组或 `Ref` options。
- `rules`：Element Plus 表单校验规则。
- `span` / `columns` / `labelWidth`：控制布局；未传 `labelWidth` 时默认使用 `auto`，同一表单共享统一标签区宽度，保证等宽栅格中的输入区对齐。
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

字段 `visible` 支持布尔值或模型函数，只控制显示并保留模型与校验；
`hidden` 则不渲染字段。`submitDisabled` 仅禁用提交，不禁用字段。
表单通过 `novalidate` 将提交校验统一交给 Element Plus，保留输入必填语义，
避免浏览器原生弹窗拦截 schema 校验与错误反馈。

### Schema Table

```vue
<script setup lang="ts">
import type { SchemaTableColumn, SchemaTablePaginationChangePayload } from '@lumal/core/components'
import { LumalSchemaTable } from '@lumal/core/components'
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
  { id: 1, name: 'Lumal', status: 'enabled' },
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
  <LumalSchemaTable
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
  </LumalSchemaTable>
</template>
```

`LumalSchemaTable` 支持：

- `selection`：渲染选择列，并通过 `selection-change(rows, rowKeys)` 同时返回选中行和主键。
- `showIndex`：保留旧的页内序号列。
- `columns: [{ type: 'index', label: '序号' }]`：不绑定业务 `field`，开启分页时使用跨页序号，
  支持列设置与当前页/选中行导出；不参与字典加载或 CRUD 自动表单。
  CRUD 会透传当前分页，不能把序号写入业务行。普通列依然要求真实模型字段。
  `SchemaTableColumn` 和 `CrudTableColumn<T>` 为判别联合类型，扩展列使用交叉类型而非 interface extends。
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
import { resolveSchemaTableCellDisplay } from '@lumal/core/components'
```

该 helper 统一处理 formatter、空值、数组和字典回显；内部渲染组件不作为公共 API 导出。

### CRUD Table

```vue
<script setup lang="ts">
import type { CrudDataSource, CrudTableColumn } from '@lumal/core/components'
import { LumalCrudTable } from '@lumal/core/components'

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
        { id: 1, name: 'Lumal', status: 'enabled' },
      ],
      total: 1,
    }
  },
}
</script>

<template>
  <LumalCrudTable
    title="项目列表"
    :data-source="dataSource"
    :query="{
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

`LumalCrudTable` 支持两种模式：

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

查询区未传 `query.columns` 时会按实际容器宽度自动使用 1～4 列：小于 640px 为 1 列、640px 起为 2 列、960px 起为 3 列、1280px 起为 4 列。显式传入 `query.columns` 时以配置值为准，适合需要固定密度的业务页面。

`LumalCrudTable` 只负责组合查询表单、表格、分页和增删改查，不包含 `LumalPage` 页面壳。需要页面 header、description 或 loading 遮罩时，由消费方自行包裹 `LumalPage`。

传入 `title` 时会在业务操作组左侧显示表格标题，不传则不渲染标题；也可通过 `table-title` 插槽自定义标题。新增、批量删除、导出、`toolbar-actions` 与 `actions` 插槽属于业务操作组，可通过 `toolbar.actionsPosition: 'left' | 'right'` 设置位置，默认在右侧；筛选区显隐、刷新、全屏、`toolbar-tools` 插槽和列设置始终位于右侧工具组。筛选、刷新、全屏与列设置使用图标按钮，并保留 `aria-label` 和 `title` 供键盘及辅助技术识别。查询配置可用 `defaultVisible` 设置筛选区初始显隐，工具栏可用 `queryToggle: false` 关闭显隐按钮。

CRUD 会转发 `query-{field}`、`table-{field}`、`form-{field}`、`table-title`、`toolbar-actions`、`toolbar-tools`、`row-actions` 和 `footer` 插槽。查询配置可启用 `submitOnChange` 与 `submitDebounce`。

推荐使用六个配置对象组织复杂页面：

- `query`：schemas、列数、折叠、label width 和查询文案。
- `table`：columns、rowKey、selection、列设置、自动 resize 和操作列宽度。
- `toolbar`：业务操作位置、新增、批量删除、刷新、导出及对应文案。
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

从 `@lumal/core/dictionary` 导入：

- `installDictionary`
- `useDictionary`
- `useDictionaryMap`
- `getDictionaryLabel`
- `normalizeDictionaryOptions`
- `createDictionaryFetcherWithFallback`
- `createDictionaryStore`

`setDictionary`、`removeDictionary` 和 `clearDictionary` 都会使对应的在途加载失效。旧 Promise 仍向原调用方返回结果或错误，但不能回填、覆盖新请求或修改新请求的 loading/error。切换账号或租户时应清理当前字典 Store。

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
createLumalAdmin({
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

从 `@lumal/core/layout` 导入：

- `LumalLayout`
- `LumalHeader`
- `LumalSidebar`
- `LumalTabs`
- `LumalContent`
- `LumalRouterView`
- `LumalBreadcrumb`
- `LumalGlobalSearch`

layout 只负责后台壳层结构和交互，不请求业务数据。`LumalLayout` 接收完整 `menus` 与 `preferences`，并根据 `preferences.app.layout` 自动决定菜单显示位置：

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

### 视图缓存与标签生命周期

`LumalLayout` 的默认 slot 提供 `{ tabs }`，`tabs-change` 输出完整标签集合。用它生成 `LumalRouterView.cacheKeys`，标签关闭时对应实例会销毁；刷新时只替换该标签版本的 key：

```vue
<LumalLayout v-slot="{ tabs }" route-driven :preferences="preferences">
  <LumalRouterView
    cache
    :cache-max="20"
    :view-key="viewKey"
    :cache-keys="tabs.map(tab => `${tab.path}:${versions[tab.path] ?? 0}`)"
  />
</LumalLayout>
```

`viewKey` 应使用相同的 `path:version` 规则。只增加当前标签的版本，不增加全局版本；移除已关闭标签的版本记录。`route.meta.keepAlive === false` 禁止缓存该路由。缓存默认最多 20 项，`cacheMax <= 0` 或非有限数值也回退为 20；未传 `cacheKeys` 时仅按容量淘汰。

`LumalRouterView` 由内部页面容器承接路由过渡动画，业务路由组件可以包含多个根节点，无需为 `Transition` 额外添加根元素。关闭缓存或设置 `meta.keepAlive=false` 时同样适用。

`progress` / `loading` 反映真实路由导航的等待、完成、取消和错误，不再固定显示 520ms。缓存失活不等于卸载，业务轮询需在 `onDeactivated` 暂停、`onActivated` 恢复。

标签快照保存在浏览器 `sessionStorage`；每次标签变更写入，卸载不再写回。退出应清理对应 key，跨用户切换应重建壳层或使用用户作用域 key。新窗口默认采用 `router.resolve(path).href`，保留路由器的 history/base 语义。

## Router

从 `@lumal/core/router` 导入：

- `normalizeMenuNodes`
- `createRouteRecords`
- `createRouteRegistry`
- `createMenuRouteRuntime`
- `createSidebarMenus`
- `findFirstAccessibleMenu`

这些函数用于把后端菜单节点转换为路由记录和侧边栏菜单。

`createSidebarMenus` 支持通过回调过滤权限和角色，适合与 `createPermissionStore` 组合：

```ts
import { createPermissionStore } from '@lumal/core/permission'
import { createSidebarMenus, normalizeMenuNodes } from '@lumal/core/router'

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

静态菜单和后端菜单并存时，使用 `createMenuRouteRuntime` 统一完成校验、排序、组件解析和路由注册：

```ts
const menuRuntime = createMenuRouteRuntime({
  router,
  staticMenus,
  loadRemoteMenus: () => request.get('/menus'),
  componentResolver: component => views[component],
  hasPermission: permissions => permissionStore.hasPermission(permissions, 'every'),
  hasRole: roles => permissionStore.hasRole(roles, 'every'),
})

await menuRuntime.loadRemote()
menuRuntime.resetRemote() // 登出时仅移除远程路由
menuRuntime.dispose() // 应用释放时移除该运行时注册的全部路由
```

静态菜单可传组件、懒加载器或字符串；远程菜单只接受由 resolver 白名单解析的组件字符串。重复的完整路径或路由名称、空路径、叶子缺组件都会在注册前报错，不会留下部分路由。`reload()` 使用单飞请求并在失败时保留上一份可用远程菜单。运行时传入的 Router 必须提供 `getRoutes()`，用于在注册前检查与应用既有路由的 path 冲突；旧 `createRouteRegistry` 仍兼容不含该方法的最小 Router 适配器。

## Permission

从 `@lumal/core/permission` 导入：

- `createPermissionStore`
- `hasPermission`
- `hasRole`
- `createPermissionDirective`
- `setupPermissionGuard`
- `LumalAccessControl`
- `providePermissionStore`
- `usePermissionStore`

权限能力只处理通用权限判断，不绑定具体业务接口。`LumalAccessControl` 同时声明权限和角色时使用 AND，权限与角色各自通过 `mode` / `role-mode` 选择 `some` 或 `every`；拒绝时可渲染 `fallback` slot。`setupPermissionGuard` 对嵌套路由的每级匹配记录分别执行上述模式，并在父子级之间使用 AND，父级约束不能被子级覆盖。向 `createLumalAdmin` 传入 `permissionStore` 后会自动注入，组合式 API 和组件可直接消费。

## Auth

从 `@lumal/core/auth` 导入：

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

从 `@lumal/core/request` 导入：

- `createRequestClient`
- `createStandardResponseParser`
- `parsePageResult`
- `RequestError`

```ts
import { createRequestClient } from '@lumal/core/request'

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

上述 `refreshSession` 是应用自行实现的接口，不是 Core 导出。刷新接口应使用独立的公共客户端，
避免自身 401 再次进入刷新。生产接线还需携带会话 AbortSignal，并在刷新结果写入前确认
未取消、原始刷新凭据仍属于当前会话；旧用户的失败不能清理新用户的权限和路由。
完整示例位于脚手架 `templates/base/src/services/session-runtime.ts` 与
`templates/modes/http/src/services/data-source.ts`，其应用服务不是 Core 公共协议。

### 可选缓存与失效

缓存默认关闭。`cache: { enabled: true }` 默认只缓存 GET；非 GET 必须显式提供能区分请求体的 `cache.key`，框架不自动序列化所有 body 类型。

```ts
const client = createRequestClient({
  getToken: () => session.getToken() || undefined,
  getCacheScope: () => currentTenantId,
})
await client.get('/profile', { cache: { enabled: true, scope: 'profile-view' } })
client.clearCache() // 退出或切换上下文时调用，旧在途请求不能重新回填。
```

每次请求先解析 `baseURL` 和 `query`、注入 Token 与 requestId，再等待 `onRequest`，之后检查缓存与重复提交。hook 可以改写 `context.url`、修改或整体替换 `context.init`；返回后的 URL、method、headers、body 和 signal 是实际 fetch 的依据，不会再次拼接 baseURL/query。相对 URL 由 fetch 所在运行环境解析，绝对 URL 可以直接指定另一目标。

```ts
const client = createRequestClient({
  baseURL: '/api',
  onRequest(context) {
    // 此时 URL 已包含 query；改写结果直接用于发送与缓存/去重判断。
    context.url = `/gateway${context.url}`
    const headers = new Headers(context.init.headers)
    headers.set('X-Tenant', 'tenant-a')
    context.init.headers = headers
  },
})
await client.get('/users', { query: { page: 1 } }) // 实际请求 /gateway/api/users?page=1
```

缓存始终包含 hook 最终的 method/URL，即使显式使用同一 `cache.key`，不同目标也不会串缓存。默认仅最终 GET 可以缓存，非 GET 仍需自定义 key 区分请求体。重复提交按最终 method/URL、字符串请求体、认证身份与作用域判断；请求失败或重放完成后释放占用。

Authorization 或 `getCacheScope()` 变化会清空本客户端缓存。请求级 `scope` 可区分同一身份下的数据用途。Token 不写入缓存 key；不同客户端共享缓存存储时也保持隔离。`clearCache()` 仅删除本客户端写入的条目，不清除共享存储中的其他数据；会话最终过期也会触发清理。命中缓存仍遵守 hook 最终的 AbortSignal。

`clearCache()` 也会解绑当前共享刷新任务，新会话不会继续等待旧刷新，旧任务完成时不会移除
新任务。但它不自动取消在途网络请求，也不能阻止应用自己的刷新回调写入旧 Token；
`getCacheScope()` 变化或 `clearCache()` 后，旧401/旧刷新失败会以
`code: 'STALE_SESSION', kind: 'cancelled'` 拒绝，不触发新身份的退出或响应错误通知。
共享刷新任务按会话作用域隔离。scope 应为不含Token的会话代次/租户标识，不能重复使用旧会话标识。
成功旧响应仍可返回给原调用方，但不能回填缓存；应用仍须校验身份后写Store。
取消、身份检查和业务 Store 清理由应用负责。HTTP 模板已包含这层会话隔离。

网络错误、响应错误和会话回调报告实际发送的 URL。认证重放从原始已解析 URL 再执行 hook，避免重复叠加路径，并复用原 requestId；hook 改成写请求后仍需 `retryOnAuthRefresh: true`，改成外部 Authorization 则不自动刷新/重放。requestId 仅用于追踪，不参与缓存身份。

## Theme

从 `@lumal/core/theme` 导入：

- `createThemeStore`
- `createPreferencesStore`
- `applyThemeToElement`
- `resolveThemeTokens`
- `defaultThemeState`

主题运行时支持明暗模式、主题色和紧凑布局，不包含多语言偏好。

偏好持久化示例：

```ts
import { createPreferencesStore } from '@lumal/core/theme'

const preferences = createPreferencesStore({
  storage: localStorage,
  storageKey: 'admin:preferences',
  defaults: {
    app: { layout: 'mixed-nav' },
  },
})

preferences.patch({
  app: { dynamicTitle: true },
  breadcrumb: { enable: true, showHome: true },
  header: { globalSearch: true },
  shortcutKeys: { globalSearch: true },
  theme: { fontSize: 16, mode: 'dark' },
})
preferences.reset()
preferences.exportCurrent()
preferences.dispose()
```

Store 会清理损坏缓存、补齐新增默认字段，并只在主题模式为 `system` 时监听系统主题变化。全局字号限制为 12-20px，会同步 Lumal 和 Element Plus 的字号变量。

## 可选生态包

相关独立包：

- `@lumal/icons`：框架无关的图标 registry、单色 SVG 校验/合成、改色、渐变和 Data URI 缓存。
- `@lumal/icons-vue`：`LumalIcon`、选择器和 Vue 响应式注册表适配，详见 `docs/icons.md`。
- `@lumal/charts`：`LumalChart` 与 `LumalChartPanel`；面板支持查询、表格替代视图、导出、错误恢复和无障碍摘要。
- `@lumal/vben-compat`：Vben 高频表单/Grid 写法到 Lumal Schema/CRUD 的迁移适配，详见 `docs/migration-from-vben.md`。
- `@lumal/vite`：组件 resolver、工作区 source/dist alias 和可选 Devtools 接线。

```ts
import {
  createLumalAliases,
  createLumalComponentResolver,
  resolveLumalDevtoolsPlugin,
} from '@lumal/vite'

const aliases = createLumalAliases({
  workspaceRoot: process.cwd(),
  target: 'source',
})

const resolver = createLumalComponentResolver({ importStyle: true })
const devtools = resolveLumalDevtoolsPlugin({
  enabled: import.meta.env.DEV,
  factory: () => installedDevtoolsPlugin(),
})
```

`@lumal/vite` 不安装自动导入或 Devtools 实现，也不提供 1920px 到 viewport 的全局转换。
