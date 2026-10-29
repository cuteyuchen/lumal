# @lumal/icons-vue

`@lumal/icons` 的 Vue 3 组件与响应式适配层。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/icons-vue` |
| 本地路径 | `packages/icons-vue` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/icons-vue |
| npm 地址 | `https://www.npmjs.com/package/@lumal/icons-vue` |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/icons@0.1.0-beta @lumal/icons-vue@0.1.0-beta vue@^3.5 @iconify/vue@^5
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

数字 `size` 是设计 px，内部按消费项目配置输出普通 vw（未开启时为 px），
默认视觉仍为 Npx；宿主提供单位后参与适配，不强制依赖 Viewport。
字符串尺寸原样保留，需要固定像素可用 `size="20px"`。
整页根单位、局部画布与 Teleport 边界见 [屏幕适配](/reference/screen-viewport-guide)。

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

- `vue`：`^3.5.0`
- `@iconify/vue`：`^5.0.0`
