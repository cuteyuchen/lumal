# 图标系统

Lumal 图标系统拆为两个包：

- `@lumal/icons`：框架无关的纯 TypeScript 图标内核，提供注册表、SVG 改色、渐变、合成、校验、Data URI 和 Vite 静态 SVG 插件。
- `@lumal/icons-vue`：Vue 3 组件与响应式适配层，提供 `LumalIcon`、图标选择器和 `useIconRegistry`。

## 安装

以下命令显式安装 `0.0.3-beta`；两个图标包保持同版，不依赖 npm 的 `latest` 标签。

只使用纯 TypeScript 能力：

```bash
pnpm add @lumal/icons@0.0.3-beta
```

Vue 项目同时安装适配层：

```bash
pnpm add @lumal/icons@0.0.3-beta @lumal/icons-vue@0.0.3-beta vue @iconify/vue
```

## 注册图标

```ts
import {
  createIconifyIconDefinitions,
  registerIcons,
} from '@lumal/icons'

registerIcons([
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="..."/></svg>',
  },
])

registerIcons(createIconifyIconDefinitions('mdi', [
  'home',
  'account',
]))
```

源 SVG 应保持单色并使用 `currentColor`。注册表使用普通 `Map` 保存数据，框架适配器可以通过 `subscribeIconRegistry()` 订阅变更。

`IconDefinition<TComponent = unknown>` 把组件实现视为不透明载荷，因此纯 TypeScript 包不依赖 Vue、React 或其他 UI 框架。Vue 组件图标可以这样注册：

```ts
import { createComponentIconDefinitions, registerIcons } from '@lumal/icons'
import { Edit } from '@element-plus/icons-vue'

registerIcons(createComponentIconDefinitions('element-plus', {
  Edit,
}))
```

## Vue 渲染

```vue
<script setup lang="ts">
import { LumalIcon } from '@lumal/icons-vue'
import '@lumal/icons-vue/style.css'
</script>

<template>
  <LumalIcon name="app:dashboard" color="#1677ff" :size="24" />
</template>
```

`LumalIcon` 只负责 Vue 渲染。SVG 改色和渐变仍调用 `@lumal/icons` 的纯 TypeScript 实现，不在 Vue 包内复制算法。

## Vue 响应式注册表

```ts
import { useIconRegistry } from '@lumal/icons-vue'

const { icons, groups, resolve } = useIconRegistry()
```

该 composable 把 `@lumal/icons` 的订阅接口转换为 Vue `computed`，运行时注册新图标或分组后会自动更新。

## 图标分组

```ts
import { registerIconGroups } from '@lumal/icons'

registerIconGroups([
  { key: 'app', label: '应用图标', order: 1 },
])
```

## SVG 改色与渐变

```ts
import {
  applySvgGradient,
  getGradientIconDataUri,
  recolorSvgString,
} from '@lumal/icons'

const blueSvg = recolorSvgString(svgText, '#1677ff')
const gradientSvg = applySvgGradient(svgText, {
  from: '#1677ff',
  to: '#0f766e',
})
const uri = getGradientIconDataUri('app:dashboard', {
  from: '#1677ff',
  to: '#0f766e',
})
```

## Data URI、校验与合成

```ts
import {
  composeSvgIcons,
  getIconDataUri,
  validateMonochromeSvg,
} from '@lumal/icons'

const uri = getIconDataUri('app:dashboard', '#1677ff')
const validation = validateMonochromeSvg(svgText)
const composed = composeSvgIcons([backgroundSvg, foregroundSvg])
```

运行时最多缓存 256 个 Data URI。校验会拒绝脚本、事件属性、外部 HTTP 资源和固定 `fill/stroke` 颜色。

SVG 仅用于项目内可信静态资源。注册和 `LumalIcon` 渲染不会自动净化输入；`validateMonochromeSvg` 是有限的单色格式检查，不是完整 sanitizer，不能据此信任用户上传、远程接口或其他不可信 SVG。不可信来源应先在应用信任边界使用专门的净化方案，或转换为不执行脚本的图片资源。

## 图标选择器

```vue
<script setup lang="ts">
import { LumalIconPicker, LumalIconPickerDialog } from '@lumal/icons-vue'
import { shallowRef } from 'vue'

const value = shallowRef('app:dashboard')
const dialogVisible = shallowRef(false)
</script>

<template>
  <LumalIconPicker v-model="value" group="app" show-labels />
  <LumalIconPickerDialog v-model="value" v-model:visible="dialogVisible" />
</template>
```

选择器支持搜索、分组、分页、选中态和键盘焦点；弹窗确认后才更新外部模型。

## Vite 静态 SVG 插件

`@lumal/icons/vite` 暴露 `createStaticLocalSvgIconsPlugin`，用于构建期收集静态 SVG。该入口同样不依赖 Vue。
