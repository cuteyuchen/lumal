# @lumal/icons-vue

`@lumal/icons` 的 Vue 3 组件与响应式适配层，提供 `LumalIcon`、`LumalIconPicker`、`LumalIconPickerDialog` 和 `useIconRegistry`。

```vue
<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import '@lumal/icons-vue/style.css'
</script>

<template>
  <LumalIcon name="lumal:settings" color="#1677ff" :size="20" />
</template>
```

SVG 改色、渐变、合成、Data URI 和注册表等纯 TypeScript 能力由 `@lumal/icons` 提供。

`LumalIcon` 接受注册名或直接 `IconDefinition`（component / iconify / local-svg）。SVG 使用 HTML 渲染，仅接受可信静态资源；注册和渲染不自动净化，单色格式校验不是完整 sanitizer。图标选择弹窗通过 Teleport 挂载到 body，约束 Tab、支持 Escape，并在关闭/卸载时恢复焦点。
