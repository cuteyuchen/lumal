# Core API

`@luma/core` 提供后台项目的基础设施和 Luma 原生组件。

## 应用启动

```ts
import { createLumaAdmin } from '@luma/core'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import '@luma/core/theme-chalk/index.scss'
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
  icons: {
    localSvg: [],
  },
  components: {},
  setup: ({ app }) => {
    // 应用级扩展
  },
}).mount('#app')
```

`createLumaAdmin` 当前负责创建 Vue app、注册本地图标、安装调用方传入的 router/pinia/Element Plus 插件、注册全局组件并执行应用级 setup。Element Plus、Pinia 和 Vue Router 都由应用侧传入，`@luma/core` 不做默认安装。

安装顺序固定为：本地图标注册 -> `router` -> `pinia` -> `elementPlus` -> `components` -> `setup`。

## 组件

从 `@luma/core/components` 导入：

- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- `LumaPage`
- `LumaPagination`
- `LumaIcon`
- `LumaIconPicker`
- `LumaIconPickerDialog`

### Schema Form

```vue
<script setup lang="ts">
import type { SchemaFormItem, SchemaFormModel } from '@luma/core/components'
import { LumaSchemaForm } from '@luma/core/components'
import { shallowRef } from 'vue'

const model = shallowRef<SchemaFormModel>({})

const schemas: SchemaFormItem[] = [
  { field: 'name', label: '名称', component: 'input' },
  {
    field: 'status',
    label: '状态',
    component: 'select',
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
]
</script>

<template>
  <LumaSchemaForm v-model="model" :schemas="schemas" show-actions />
</template>
```

### CRUD Table

```vue
<script setup lang="ts">
import { LumaCrudTable } from '@luma/core/components'

const columns = [
  { field: 'name', label: '名称' },
  { field: 'status', label: '状态' },
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
