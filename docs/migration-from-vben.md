# 从 Vben 迁移

Luma 的 Vben 兼容层用于降低迁移成本，不追求完整复刻 Vben Admin。兼容 API 放在 `@luma/vben-compat`，不会进入 `@luma/core`。

## 当前已支持

### `useVbenForm`

当前支持常见表单 schema 转换到 `LumaSchemaForm`：

- `fieldName` / `field` 转为 `field`。
- `Input`、`Input.Password` 转为 `input`。
- `Input.TextArea`、`Textarea` 转为 `textarea`。
- `Select` 转为 `select`。
- `Hidden` 转为 `hidden`。
- `componentProps.placeholder` 转为 `placeholder`。
- `componentProps.options` 转为 `options`。
- `required` 或 `rules[].required` 转为 `required`。
- `show: false`、`ifShow: false`、`hidden: true` 转为隐藏字段。

`useVbenForm` 返回 `[register, formApi]`，其中 `formApi` 提供：

- `schemaFormProps`：可直接绑定给 `LumaSchemaForm` 的 props。
- `getFieldsValue()`：获取当前模型。
- `setFieldsValue(values)`：合并设置模型。
- `resetFields()`：恢复初始模型和 schema 默认值。
- `getLumaSchemas()`：获取转换后的 Luma schema。
- `getFormInstance()`：获取通过 `register` 绑定的表单实例。

### `useVbenVxeGrid`

当前支持常见 grid 配置转换到 `LumaCrudTable`：

- `gridOptions.columns` 转为 Luma 表格 columns。
- `field` 转为 `field`。
- `title` / `label` 转为 `label`。
- `width`、`align`、`formatter` 透传。
- `hidden: true` 或 `visible: false` 转为隐藏列。
- `type: 'checkbox'`、`type: 'radio'`、`type: 'seq'` 这类 VXE 专有辅助列初版会跳过。
- `gridOptions.formOptions.schemas` 复用 `useVbenForm` 的 schema 适配规则。
- `gridOptions.pagerConfig.pageSize` / `pageSizes` 转为分页配置。
- `gridOptions.proxyConfig.ajax.query` 用于加载列表数据。
- `proxyConfig.props.result`、`items` / `list`、`total` 可用于适配嵌套接口结果。

`useVbenVxeGrid` 返回 `[register, gridApi]`，其中 `gridApi` 提供：

- `crudTableProps`：可直接绑定给 `LumaCrudTable` 的 props。
- `getLumaColumns()`：获取转换后的 Luma columns。
- `getRows()` / `setRows(rows, total)`：读取或设置表格数据。
- `getTotal()`：读取总数。
- `getQueryModel()` / `setQueryModel(model)`：读取或设置查询模型。
- `search(payload)` / `reload()` / `reset()`：触发查询、刷新和重置。
- `handleSearch(payload)` / `handleReset(payload)` / `handlePageChange(payload)`：用于绑定 LumaCrudTable 事件。
- `getGridInstance()`：获取通过 `register` 绑定的表格实例。

## 最小迁移示例

旧页面可以先保留 Vben 风格 schema，再把兼容层产出的 props 绑定到 Luma 原生组件：

```vue
<script setup lang="ts">
import { LumaCrudTable, LumaSchemaForm } from '@luma/core/components'
import { useVbenForm, useVbenVxeGrid } from '@luma/vben-compat'

const [, formApi] = useVbenForm({
  schemas: [
    { component: 'Input', fieldName: 'keyword', label: '关键词' },
  ],
})

const [, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '名称' },
    ],
    formOptions: {
      schemas: [
        { component: 'Input', fieldName: 'keyword', label: '关键词' },
      ],
    },
  },
})
</script>

<template>
  <LumaSchemaForm v-bind="formApi.schemaFormProps.value" />
  <LumaCrudTable v-bind="gridApi.crudTableProps.value" />
</template>
```

完整可构建示例见 `apps/vben-compat-demo`，验证命令：

```bash
pnpm compat:build
```

## 当前未支持

- Vben 表单的完整校验规则映射。
- 动态函数式 `ifShow`、`dynamicDisabled` 等高级运行时能力。
- Vben 表单布局、栅格和复杂插槽协议。
- VXE 原生渲染、高级编辑、虚拟滚动、导出、复杂 toolbar 和插槽协议。

## 迁移原则

优先迁移到 Luma 原生 schema；兼容层只覆盖高频写法。遇到高级 Vben 能力时，应先判断是否真的需要保留，再决定是否在兼容层补子集能力。
