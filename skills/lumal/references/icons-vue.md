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
- `LumalIconPicker`：表单内选择，绑定模型，复用内置分组和查询。
- `LumalIconPickerDialog`：弹窗选择，具体 model/事件按当前声明核对；它 Teleport 到 body，主题不能只依赖局部祖先选择器。
- `useIconRegistry()`：在 setup/effect scope 内调用，得到响应式 `icons/groups` 和 `resolve`，不需要手动订阅注册表。

## 重要契约

- `useIconRegistry` 的订阅随 scope 释放；不要在没有清理机制的模块顶层反复调用。
- SVG 通过 HTML 渲染，只能使用可信静态资源。格式检查和注册不会自动过滤脚本或外部引用。
- 选择弹窗已处理焦点约束、Escape 和焦点恢复，扩展时保留这些行为。
- 图标按钮本身仍需可访问名称，不能只靠图标外观表达操作。

仓库核对位置：`packages/icons-vue/src/index.ts`、`components` 和 `composables/useIconRegistry.ts`。
