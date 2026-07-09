# Luma

Luma 是面向中小型后台项目的轻量 Vue Admin 框架。底层能力以 `@luma/*` 包提供，用这些包创建出来的后台管理平台叫 `luma-admin`。

Luma 不是 Vben Admin 的完整 fork，也不是 Element Plus 的替代 UI 库。它基于 Vue 3、TypeScript、Vite、Element Plus 和 SCSS，保留后台项目常用的布局、权限、请求、主题、图标、Schema 表单、Schema 表格和 CRUD 表格能力，同时提供一层 Vben 常用写法兼容 API。

## 包

- `@luma/icons`：独立图标系统，提供图标注册、Iconify/本地 SVG 适配、data URI、图标组件和图标选择器。
- `@luma/core`：后台核心能力，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。
- `@luma/vben-compat`：Vben 常用写法兼容层，当前支持 `useVbenForm` 和 `useVbenVxeGrid` 的常用子集。

## 安装

```bash
pnpm add @luma/core @luma/icons element-plus vue
```

如果需要迁移 Vben 常用写法：

```bash
pnpm add @luma/vben-compat
```

## 原生写法

```ts
import { createLumaAdmin } from '@luma/core'
import '@luma/core/theme-chalk/index.scss'
import '@luma/icons/style.css'
import App from './App.vue'

createLumaAdmin({
  rootComponent: App,
}).mount('#app')
```

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
  />
</template>
```

## Vben 兼容写法

```ts
import { useVbenForm, useVbenVxeGrid } from '@luma/vben-compat'

const [, formApi] = useVbenForm({
  schemas: [
    { fieldName: 'keyword', label: '关键词', component: 'Input' },
  ],
})

const [, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '名称' },
    ],
  },
})
```

兼容层只用于降低迁移成本。新页面优先使用 Luma 原生 API；旧项目迁移时再使用 `@luma/vben-compat`。

## 示例应用

- `apps/luma-admin`：Luma 原生写法示例。
- `apps/vben-compat-demo`：Vben 兼容写法示例。

```bash
corepack pnpm admin:build
corepack pnpm compat:build
```

## 不做什么

- 不默认引入多语言运行时。
- 不把 Vben 兼容 API 放进 `@luma/core`。
- 不让 `@luma/core` 默认依赖 VXE。
- 不在包源码里放业务接口、业务路由、业务 store。
- 不承诺完整复刻 Vben 的所有高级插件和边缘场景。

## 文档

- [架构说明](docs/architecture.md)
- [图标系统](docs/icons.md)
- [Core API](docs/core-api.md)
- [Vben 兼容 API](docs/vben-compat-api.md)
- [从 Vben 迁移](docs/migration-from-vben.md)
- [发布检查清单](docs/release-checklist.md)
