# @lumal/vben-compat

## 什么时候用

已有 Vben 风格表单/Grid schema 需要逐步迁移到 Lumal 时使用。新页面直接使用 Lumal 原生 schema，不为了 API 名称相似而引入迁移层。

它是常用写法的适配器，不是完整 Vben Admin 或 VXE 引擎。渲染组件来自 `@lumal/core/components`，按 Core UI 要求接入 Element Plus 和样式。

## 最小迁移

```vue
<script setup lang="ts">
import { LumalCrudTable, LumalSchemaForm } from '@lumal/core/components'
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat'
import { onMounted } from 'vue'

/***********************旧表单适配*********************/
const [, formApi] = useVbenForm({
  schemas: [
    { component: 'Input', fieldName: 'keyword', label: '关键词' },
  ],
})

/***********************旧表格适配*********************/
const [, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [{ field: 'name', title: '名称' }],
    proxyConfig: {
      ajax: {
        query: async () => ({ items: [{ id: 1, name: '项目' }], total: 1 }),
      },
    },
  },
})

/***********************数据加载*********************/
onMounted(() => gridApi.reload())
</script>

<template>
  <LumalSchemaForm v-bind="formApi.schemaFormProps.value" />
  <LumalCrudTable v-bind="gridApi.crudTableProps.value" />
</template>
```

返回值是 `[register, api]`，不是组件构造器。上例不调用 register；需要 `getFormInstance/getGridInstance` 时再用 `useTemplateRef` 和注册函数绑定真实实例。模板里对象属性上的 computed 使用 `.value`，不要照搬其他 Vben 版本的解构方式。

## 支持范围

- Form：`fieldName/field` 转 `field`，Input/Select/日期/数字/开关/树选择/上传等常用控件转换，placeholder/options/required 和静态隐藏。
- Grid：列、查询 schema、分页、`proxyConfig.ajax.query`、结果字段映射、toolbar/actions 与部分 table 配置。
- `formApi.schemaFormProps` 绑定 `LumalSchemaForm`；`gridApi.crudTableProps` 绑定 `LumalCrudTable`。
- `gridApi.reload/search/reset` 返回 `Promise<boolean>`；等待它再判断刷新结果，失败时通过 `getError/clearError/onError` 处理。
- proxy 非标准结果通过 `proxyConfig.props` 或应用 adapter 明确转换；不要假设任意嵌套结果都能识别。

## 不要承诺的能力

完整 Vben 校验/布局/插槽协议、动态函数式 `ifShow/dynamicDisabled`、VXE 原生渲染/高级编辑/虚拟滚动并未完整支持。遇到不支持项先列出差异，再决定改成原生 schema 或在明确范围内扩展适配，不能静默忽略。

迁移顺序：保留业务请求和数据模型，先替换渲染/适配层，核对查询分页与失败状态，再逐页改成原生 Lumal API。

仓库核对位置：`packages/vben-compat/src/types.ts`、`form/adapter.ts`、`grid/adapter.ts`、`docs/migration-from-vben.md`；可构建示例在 `apps/vben-compat-demo`。
