# @lumal/core

后台核心包：应用安装器、布局、路由菜单、权限、请求、主题与基础组件。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/core` |
| 本地路径 | `packages/core` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/core |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/core` |
| 详细 API | [Core API](/reference/core-api) |

## 安装

```bash
pnpm add @lumal/core @lumal/icons @lumal/icons-vue vue vue-router pinia element-plus
```

本地 monorepo：

```json
{ "dependencies": { "@lumal/core": "workspace:*" } }
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/core` | `createLumalAdmin` 等根导出 |
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

## 最小启动

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
- 安装顺序：本地图标 → 字典 → router → pinia → elementPlus → components

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
  getAccessToken: () => session.accessToken,
  refresh: () => auth.refresh(),
})
```

支持统一错误、接口适配、Token 刷新单飞与安全重放。分页标准形态：`{ items, total }`。

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

## 与示例对齐

参考 `apps/lumal-admin/src/main.ts` 的完整接入：Element Plus 暗色 CSS 变量、本地 SVG 图标、权限 Store、字典 fetcher 与 SCSS 入口。

## 边界

- Element Plus / vue-router / pinia 为 **peer**，由应用安装
- 不默认引入 i18n、VXE、ECharts
- 业务状态码与字段映射留在应用层
