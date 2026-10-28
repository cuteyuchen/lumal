# @lumal/core

后台核心包：应用安装器、布局、路由菜单、权限、请求、主题与基础组件。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/core` |
| 本地路径 | `packages/core` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/core |
| npm 地址 | `https://www.npmjs.com/package/@lumal/core` |
| 详细 API | [Core API](/reference/core-api) |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/core@0.0.6-beta @lumal/icons@0.0.6-beta @lumal/icons-vue@0.0.6-beta vue@^3.5 vue-router@^4.5 element-plus@^2.11 @iconify/vue@^5
```

Pinia 按需安装。只使用 minimal / request 等纯服务入口时无需 UI peer，详见 [安装与包地址](/guide/essentials/installation)。

本地 monorepo：

```json
{ "dependencies": { "@lumal/core": "workspace:*" } }
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/core` | `createLumalAdmin` 等根导出 |
| `@lumal/core/minimal` | 无默认 UI 注册表的轻启动入口 |
| `@lumal/core/components` | Schema 表单/表格、Page、CRUD 等 |
| `@lumal/core/layout` | `LumalLayout`、侧栏、标签、Header 等 |
| `@lumal/core/router` | 菜单路由运行时 |
| `@lumal/core/permission` | 权限 Store / 上下文 |
| `@lumal/core/request` | `createRequestClient` |
| `@lumal/core/theme` | 偏好 Store、主题应用 |
| `@lumal/core/dictionary` | 字典上下文 |
| `@lumal/core/auth` | 认证相关导出 |
| `@lumal/core/composables` | 组合式 API |
| `@lumal/core/directives` | 权限指令等 |
| `@lumal/core/utils` | 工具 |
| `@lumal/core/style.css` | 运行时 CSS |
| `@lumal/core/theme-chalk/index.scss` | 主题 SCSS 变量与样式 |

## 默认 UI 启动

下例显式使用 Pinia，另需安装 `pinia@^3.0.3`；框架不会自动创建或安装 Pinia。

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
  router,
  pinia: createPinia(),
  elementPlus: {
    plugin: ElementPlus,
    options: { locale: zhCn },
  },
  dictionary: {
    fetcher: async () => ({ items: [] }),
  },
  icons: {
    localSvg: [],
  },
  components: true,
  setup: ({ app }) => {
    // 应用级扩展
  },
})

await framework.mount('#app')
```

### `createLumalAdmin` 要点

- `preset`：`admin-default` | `minimal`；**不**内部创建 Pinia
- `elementPlus`：支持 Plugin 或 `{ plugin, options }`
- `components`：`true` / `false` / 组件名数组 / 组件映射
- `mount()` 异步：等待 `setup` 与 `router.isReady()`
- 安装顺序：本地图标 → 字典 → pinia → router → elementPlus → components

### 轻启动

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
await createLumalAdmin({ rootComponent: App }).mount('#app')
```

轻入口默认不安装字典，只接受显式组件映射，不静态加载 Element Plus、Sortable 或图表引擎。根入口的 `preset: 'minimal'` 只关闭默认组件注册，不是隔离体积的入口。纯服务子入口也不需要 Element Plus；使用 UI 组件仍需对应 peer 与样式。

## 组件（`@lumal/core/components`）

- `LumalSchemaForm` / `LumalSchemaTable` / `LumalCrudTable`
- `LumalPage` / `LumalPageLayout` / `LumalPagination` / `LumalInfoTable`
- `LumalIcon` / `LumalIconPicker` / `LumalIconPickerDialog`（也可从 `@lumal/icons-vue` 引入）

### Schema 表单示例

```vue
<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@lumal/core/components'
import { LumalSchemaForm } from '@lumal/core/components'
import { shallowRef } from 'vue'

const model = shallowRef<SchemaFormModel<{ name: string, status: string }>>({})
const schemas: SchemaFormItem[] = [
  { field: 'name', label: '名称', component: 'input', rules: [{ required: true, message: '必填' }] },
  { field: 'status', label: '状态', dictionary: 'status' },
]
</script>

<template>
  <LumalSchemaForm v-model="model" :schemas="schemas" show-actions />
</template>
```

内置控件：`input`、`textarea`、`select`、`number`、`switch`、`date`、`datetime`、`daterange`、`radio`、`checkbox`、`tree-select`、`upload`、`hidden`。

## 布局

```vue
<script setup lang="ts">
import { LumalLayout, LumalRouterView } from '@lumal/core/layout'
</script>

<template>
  <LumalLayout
    title="My Admin"
    :menus="menus"
    :preferences="preferences"
    route-driven
    tab-storage-key="my-admin:tabs"
  >
    <LumalRouterView />
  </LumalLayout>
</template>
```

布局支持侧栏 / 顶栏 / 混合导航、标签固定与淘汰策略、全局搜索、面包屑、移动抽屉等。字段与偏好细节见 [Core API](/reference/core-api)。

未发布源码新增 `LumalLayout/LumalTabs` 的可选 `responsive`（默认 true）。
显式整页 vw 时设置 false，使导航与标签拖拽不因页面缩放切换为移动交互；
必须同时接入 CSS 断点策略，它不是独立适配开关。
Header 默认使用主题高度，侧栏等设计尺寸使用 `--lumal-viewport-unit`（默认1px）。

## 路由与菜单

```ts
import { createMenuRouteRuntime } from '@lumal/core/router'

const runtime = createMenuRouteRuntime({
  router,
  staticMenus,
  loadRemoteMenus: () => api.fetchMenus(),
  componentResolver: (name) => viewModules[name],
  hasPermission: codes => permissionStore.hasPermission(codes),
})
```

标准菜单语义字段：`path`、`name`、`component`、`children`、`meta.title`、`meta.authority`、`meta.activeMenu`、`meta.badge`。非标准结构在应用层映射，勿写入 core。

## 请求

```ts
import { createRequestClient } from '@lumal/core/request'

const client = createRequestClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  getToken: () => session.accessToken,
  getCacheScope: () => currentTenantId,
  authRefresh: { refresh: () => auth.refresh() },
})
```

支持统一错误、接口适配、Token 刷新单飞与安全重放。分页标准形态：`{ items, total }`。

缓存默认关闭，非 GET 缓存必须显式给出 key。退出或切换上下文时调用 `client.clearCache()`；Authorization 或 `getCacheScope()` 变化也会自动失效。完整缓存与标签视图生命周期契约见 [Core API](/reference/core-api)。

## 主题与偏好

```ts
import { createPreferencesStore, applyThemePreferences } from '@lumal/core/theme'

const store = createPreferencesStore({
  storage: localStorage,
  storageKey: 'app:preferences',
  defaults: { theme: { mode: 'system', colorPrimary: '#1677ff' } },
})

store.patch({ theme: { mode: 'dark' } })
```

未发布源码支持通过 `createPreferencesStore({ runtime: { document, cssLength, ... } })`
或 `applyThemePreferences` 的 environment 传入 `cssLength: (pixels:number) => string`，
显式格式化主题中的字号、间距、圆角、阴影和布局尺寸，默认仍为 px。
`resolveThemeTokens` 的第二参数和 `applyThemeToElement` 的第三参数同样接受格式化器。
不增加 Viewport 依赖；整页/局部策略与原生页面缩放接线见 [屏幕适配](/reference/screen-viewport-guide)。

## 与示例对齐

参考 `apps/lumal-admin/src/main.ts` 的完整接入：Element Plus 暗色 CSS 变量、本地 SVG 图标、权限 Store、字典 fetcher 与 SCSS 入口。

## 边界

- Element Plus / vue-router / pinia 为 **peer**，由应用安装
- 不默认引入 i18n、VXE、ECharts
- 业务状态码与字段映射留在应用层
