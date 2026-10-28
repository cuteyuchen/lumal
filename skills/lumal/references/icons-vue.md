# @lumal/icons-vue

## 什么时候用

Vue 页面需要显示 Lumal 图标、图标选择器/弹窗，或响应图标注册表变化时使用。SVG 处理与资源注册使用 [图标内核](icons.md)，不要在组件里重新实现。

## 接入

peer 为 Vue 3.5+ 和 `@iconify/vue` 5。导入 `@lumal/icons-vue/style.css`；不需要为了显示图标引入 `@lumal/core`。

```vue
<script setup lang="ts">
import { LumalIcon, LumalIconPicker } from '@lumal/icons-vue'
import { shallowRef } from 'vue'
import '@lumal/icons-vue/style.css'

/***********************图标选择*********************/
const iconName = shallowRef('lumal:settings')
</script>

<template>
  <LumalIcon :name="iconName" :size="20" />
  <LumalIconPicker v-model="iconName" />
</template>
```

## 选择 API

- `LumalIcon`：接受注册名称，或 `icon` 传入直接 IconDefinition。可控制 size/color；不要把任意字符串都当作已注册图标。
- 数字 size 是设计 px，内部按项目配置输出普通 vw；未开启时输出 px；
  宿主提供单位后参与适配，不新增Viewport依赖。字符串size原样保留，固定像素传 `size="20px"`。
- `LumalIconPicker`：表单内选择，绑定模型，复用内置分组和查询。
- `LumalIconPickerDialog`：弹窗选择，具体 model/事件按当前声明核对；它 Teleport 到 body，主题不能只依赖局部祖先选择器。
- `useIconRegistry()`：在 setup/effect scope 内调用，得到响应式 `icons/groups` 和 `resolve`，不需要手动订阅注册表。

## UI 框架适配

- 图标内核不依赖 Vue/Element Plus；Vue 图标包也不强制引入 Element Plus 或其图标集。
- `LumalIconPicker` 默认使用原生分组控件；它与 `LumalIconPickerDialog` 均提供 `group-select` 插槽，参数为 `{ modelValue, groups, setGroup }`，类型 `LumalIconPickerGroupSelectSlotProps` 从 Vue 包导出。
- 仅在消费应用已使用 Vue + Element Plus 时，插槽内接入 `ElSelect` / `ElOption`，通过 `@update:model-value="setGroup"` 更新分组；弹窗中设置 `:teleported="false"`，让下拉层留在焦点边界内。
- Element Plus 图标只在消费应用接入，不新增来源类型。少量组件可使用 `createComponentIconDefinitions`；Admin 将官方全部图标预生成为可信 SVG，并注册到 `element-plus` 分组，避免完整组件集进入运行时。升级依赖后执行 `pnpm --filter lumal-admin icons:generate`，不要把生成资源放入通用包。
- Admin 在所有图标选择入口复用 `AppIconGroupSelect`，图标仍通过 `LumalIcon` 渲染。
- 预生成资源仅在打开选择器或实际菜单使用 `element-plus:` 图标时加载；菜单初始化可等待资源准备，加载失败不能阻断业务导航。

## 可选状态形变

以下为当前仓库源码能力，使用已发布包前先核对声明文件：

```vue
<LumalIcon :name="iconName" morph morph-spring="smooth" :size="20" />
```

- `morph` 默认 `false`；`morphSpring` 默认 `'smooth'`，类型 `LumalIconMorphSpring` 从 `@lumal/icons-vue` 导出，另有 `'snappy'`、`'bouncy'`。
- 保留组件实例，不用 `:key="iconName"`。首次直接显示，后续形状变化才播放，改色/尺寸不会重播，连续操作从中间形状转向最新目标。
- 仅可信、有效 `viewBox` 的单色本地 SVG 可形变，支持注册名称、直接定义及 SVG 字符串。Iconify、Vue 组件、渐变和不能保真转换的 SVG 静态回退，不将这些来源转换为另一种注册类型。
- Vue 包依赖固定 `morphicons@2.0.0`，复用 `@lumal/icons/morph` 通用转换，再按需导入官方 Vue 绑定；不要在业务入口静态导入 Morphicons。SSR、加载期间及失败时保留静态 SVG，减少动画、关闭和卸载时清理实例。
- 形变不限定 Vue：原生 DOM 用 `@lumal/icons/morph` 的 `createIconMorph`，其他官方框架绑定可复用 `prepareIconMorph` 数据，详见 [图标内核](icons.md)。非 Vue 消费者安装 Morphicons 可选 peer，静态根入口仍无强制运行时依赖。
- 遵守系统 `prefers-reduced-motion`，不新增全局动画设置。SVG 改色/Data URI/选择器保持原协议。
- Admin 的懒加载“形变动画”示例覆盖主题、侧栏、内容最大化及表格全屏。主题图标通过应用内部 `waitForAdminThemeTransition` 等页面快照释放，业务状态不等待；全屏图标跟随真实 `fullscreenchange`，不能靠点击时翻转布尔值。

## 重要契约

- `useIconRegistry` 的订阅随 scope 释放；不要在没有清理机制的模块顶层反复调用。
- SVG 通过 HTML 渲染，只能使用可信静态资源。格式检查和注册不会自动过滤脚本或外部引用。
- 选择弹窗已处理焦点约束、Escape 和焦点恢复，扩展时保留这些行为。
- 图标按钮本身仍需可访问名称，不能只靠图标外观表达操作。

仓库核对位置：`packages/icons-vue/src/index.ts`、`components` 和 `composables/useIconRegistry.ts`。
