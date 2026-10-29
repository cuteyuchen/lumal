# @lumal/icons-vue

`@lumal/icons` 的 Vue 3 组件与响应式适配层，提供 `LumalIcon`、`LumalIconPicker`、`LumalIconPickerDialog` 和 `useIconRegistry`。

本文 API 基线为候选 `0.1.0-beta.0`，尚未发布；两个图标包保持同版，当前使用精确 tarball 验证。

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

## 未发布：数值尺寸协作

`LumalIcon` 的数字 `size` 通过 `viewportLength` 输出普通 vw（未开启时为 px），
默认仍等效 Npx，不依赖 `@lumal/viewport`。宿主显式提供单位时，与文字、Header 和侧栏一起适配。
字符串 `size="20px"`、`size="1em"` 等保持原样；需要固定像素时传字符串。
整页模式由应用管理根单位，局部画布与 Teleport 的边界见 `docs/screen-viewport-guide.md`。

## 选择器布局

`LumalIconPicker` 的 `pageSize` 默认 48；启用 `showLabels` 时格子会加宽，名称完整换行显示。搜索和原生分组控件高度一致，默认 32px，可跟随 `--el-component-size` 调整，不引入 Element Plus 运行时。

`LumalIconPickerDialog` 每页 48 个图标，桌面为 8 列，小屏幕为 6 或 4 列，完整页面不会出现不足一行的尾行；末页按实际剩余数量展示。Admin 图标库默认每页 72 个，可切换到 96 个。

弹窗高度随视口限制固定，搜索、分组切换或末页图标变少不会改变外框高度；头尾固定，中间内容独立滚动，并预留滚动条宽度。

## 分组控件适配

`LumalIconPicker` 默认使用原生分组下拉框，不强制依赖 Element Plus。`LumalIconPicker` 与 `LumalIconPickerDialog` 都提供 `group-select` 插槽，接收 `{ modelValue, groups, setGroup }`；类型 `LumalIconPickerGroupSelectSlotProps` 从本包导出。

Vue + Element Plus 应用可在该插槽内使用 `ElSelect` / `ElOption`，将 `modelValue` 作为当前值，并在更新时调用 `setGroup`。弹窗中的下拉层应设置 `:teleported="false"`，避免离开弹窗的焦点边界。Element Plus 组件、样式及 `@element-plus/icons-vue` 图标集由应用自行引入，不进入两个图标包的依赖。

分组插槽外层不使用原生 `label` 包裹，避免内联选项层选择后再次激活控件；自定义分组控件应保留 `aria-label` 等可访问名称。

Admin 已接入 Element Plus 分组控件，并将官方图标集预生成为应用侧可信 SVG，按需注册到 `element-plus` 分组。所有图标仍通过 `LumalIcon` 渲染，完整 Vue 组件图标集不进入运行时。

Admin 的 Iconify 分组预置 16 个离线示例图标，包含 15 个 Lucide 常用图标及原有徽标，支持中文搜索；数据与许可留在应用侧，不引入整套图标集依赖或远程请求。

## 状态形变

当前源码在同一个 `LumalIcon` 中提供可选形变；已发布版本请以安装包的声明文件为准。

```vue
<LumalIcon :name="iconName" morph morph-spring="smooth" :size="20" />
```

- `morph?: boolean` 默认 `false`。
- `morphSpring?: LumalIconMorphSpring` 默认 `'smooth'`；从本包导出该类型，可选 `'smooth' | 'snappy' | 'bouncy'`。
- 首次直接显示，后续形状变化才播放。保留实例，不使用 `:key="iconName"`；连续切换从中间形状继续，改色或缩放不重播。
- 支持带有效 `viewBox` 的可信单色 SVG（注册名称、直接定义、SVG 字符串）。组件、Iconify、渐变及无法保真转换的 SVG 保持静态渲染。
- 复用 `@lumal/icons/morph` 的通用转换，再按需加载 `morphicons@2.0.0` 官方 Vue 绑定；填充归一化就绪前、SSR 和加载失败时均保留原始静态 SVG。静态消费者不加载引擎，ESM/CJS 均可消费。
- 遵守系统减少动画设置，关闭、卸载和失败时清理动画。保留尺寸、颜色继承和标题；图标按钮仍需提供 `aria-label`。

形变不限定 Vue：非 Vue 项目可使用 `@lumal/icons/morph` 的 `createIconMorph` DOM 控制器或 `prepareIconMorph` 转换数据，并安装其可选 Morphicons peer。Vue 包已将 Morphicons 作为依赖，内核静态入口仍无强制运行时依赖。SVG/Data URI 输出和选择器不受影响。

Admin 图标示例新增懒加载的“形变动画”标签，并在主题、侧栏、内容最大化和表格全屏入口使用状态形变。完整边界见仓库 `docs/icons.md`。

`LumalIcon` 接受注册名或直接 `IconDefinition`（component / iconify / local-svg）。SVG 使用 HTML 渲染，仅接受可信静态资源；注册和渲染不自动净化，单色格式校验不是完整 sanitizer。图标选择弹窗通过 Teleport 挂载到 body，约束 Tab、支持 Escape，并在关闭/卸载时恢复焦点。
