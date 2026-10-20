# @lumal/icons-vue

`@lumal/icons` 的 Vue 3 组件与响应式适配层。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/icons-vue` |
| 本地路径 | `packages/icons-vue` |
| 在线文档 | https://lumal-docs-yu-chens-projects-3f7e3071.vercel.app/packages/icons-vue |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/icons-vue` |

## 安装

```bash
pnpm add @lumal/icons@0.0.3-beta @lumal/icons-vue@0.0.3-beta vue @iconify/vue
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

可直接传入三种 source 的 `IconDefinition`。SVG 通过 HTML 渲染，只接受可信静态资源，注册和渲染不自动净化；单色格式检查不是完整 sanitizer。弹窗通过 Teleport 挂载到 body，约束 Tab、支持 Escape，并在关闭/卸载时恢复原焦点。

## Peer

- `vue`
- `@iconify/vue`
