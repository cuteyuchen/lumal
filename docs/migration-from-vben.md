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

## 当前未支持

- Vben 表单的完整校验规则映射。
- 动态函数式 `ifShow`、`dynamicDisabled` 等高级运行时能力。
- Vben 表单布局、栅格和复杂插槽协议。
- `useVbenVxeGrid` 尚未实现。

## 迁移原则

优先迁移到 Luma 原生 schema；兼容层只覆盖高频写法。遇到高级 Vben 能力时，应先判断是否真的需要保留，再决定是否在兼容层补子集能力。
