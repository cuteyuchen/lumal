# @lumal/icons-vue

`@lumal/icons` 的 Vue 3 组件与响应式适配层。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/icons-vue` |
| 本地路径 | `packages/icons-vue` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/icons-vue |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/icons-vue` |

## 安装

```bash
pnpm add @lumal/icons @lumal/icons-vue vue @iconify/vue
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/icons-vue` | `LumalIcon`、选择器、`useIconRegistry` |
| `@lumal/icons-vue/style.css` | 组件样式 |

## 基础用法

```vue
<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import '@lumal/icons-vue/style.css'
</script>

<template>
  <LumalIcon name="lumal:settings" color="#1677ff" :size="20" />
</template>
```

## 与 createLumalAdmin 联用

在 `createLumalAdmin({ icons: { localSvg: [...] } })` 中注册本地 SVG 后，可在菜单 `icon` 字段与 `LumalIcon` 中直接使用对应 `key`。

## 导出组件

- `LumalIcon`
- `LumalIconPicker`
- `LumalIconPickerDialog`
- `useIconRegistry`

SVG 改色、合成、Data URI 等纯 TS 能力在 [@lumal/icons](./icons)，本包不重复实现。

## Peer

- `vue`
- `@iconify/vue`
