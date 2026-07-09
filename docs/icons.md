# 图标系统

`@luma/icons` 是独立图标包，可单独构建和发布。它不依赖 `@luma/core`。

## 安装

```bash
pnpm add @luma/icons vue
```

如果使用 Iconify 图标，需要应用侧安装 `@iconify/vue`。

## 基础用法

```vue
<script setup lang="ts">
import { LumaIcon } from '@luma/icons'
import '@luma/icons/style.css'
</script>

<template>
  <LumaIcon name="app:dashboard" color="#1677ff" :size="24" />
</template>
```

## 注册本地 SVG

```ts
import { registerIcons } from '@luma/icons'

registerIcons([
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>',
  },
])
```

源 SVG 建议保持单色，并使用 `currentColor`。颜色、渐变和 data URI 由运行时 helper 处理。

## 图标分组

```ts
import { registerIconGroups } from '@luma/icons'

registerIconGroups([
  { key: 'app', label: '应用图标', order: 1 },
])
```

## data URI

```ts
import { getIconDataUri } from '@luma/icons'

const uri = getIconDataUri('app:dashboard', '#1677ff')
```

## 渐变

```ts
import { getGradientIconDataUri } from '@luma/icons'

const uri = getGradientIconDataUri('app:dashboard', {
  from: '#1677ff',
  to: '#0f766e',
  direction: 'horizontal',
})
```

## 图标选择器

```vue
<script setup lang="ts">
import { LumaIconPicker } from '@luma/icons'
import { shallowRef } from 'vue'

const value = shallowRef('app:dashboard')
</script>

<template>
  <LumaIconPicker v-model="value" />
</template>
```

## Vite 静态 SVG 插件

`@luma/icons/vite` 暴露 `createStaticLocalSvgIconsPlugin`，用于构建期收集静态 SVG。具体业务图标仍应由应用侧决定，不写进图标包。
