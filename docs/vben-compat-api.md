# Vben 兼容 API

`@luma/vben-compat` 用于降低 Vben Admin 常用写法迁移成本。它依赖 `@luma/core`，但 `@luma/core` 不依赖它。

## 安装

```bash
pnpm add @luma/vben-compat @luma/core
```

## `useVbenForm`

```ts
import { useVbenForm } from '@luma/vben-compat'

const [, formApi] = useVbenForm({
  schemas: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '关键词',
      required: true,
    },
  ],
  submitText: '查询',
})
```

返回值是 `[register, formApi]`。`formApi.schemaFormProps` 可直接绑定给 `LumaSchemaForm`。

当前支持：

- `fieldName` / `field`
- `Input`
- `Input.Password`
- `Input.TextArea`
- `Textarea`
- `Select`
- `Hidden`
- `componentProps.placeholder`
- `componentProps.options`
- `required` / `rules[].required`
- `show: false` / `ifShow: false` / `hidden: true`

## `useVbenVxeGrid`

```ts
import { useVbenVxeGrid } from '@luma/vben-compat'

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
    proxyConfig: {
      ajax: {
        query: params => ({
          items: [],
          total: 0,
        }),
      },
    },
  },
})
```

返回值是 `[register, gridApi]`。`gridApi.crudTableProps` 可直接绑定给 `LumaCrudTable`。

当前支持：

- `gridOptions.columns`
- `field`
- `title` / `label`
- `width`
- `align`
- `formatter`
- `hidden`
- `visible: false`
- `formOptions.schemas`
- `pagerConfig.pageSize`
- `pagerConfig.pageSizes`
- `proxyConfig.ajax.query`
- `proxyConfig.props.result`
- `proxyConfig.props.items`
- `proxyConfig.props.list`
- `proxyConfig.props.total`

`type: 'checkbox'`、`type: 'radio'`、`type: 'seq'` 这类 VXE 专有辅助列会被跳过。

## 不支持

- Vben 完整表单校验规则映射。
- 函数式 `ifShow`、`dynamicDisabled` 等高级运行时能力。
- Vben 表单布局、栅格和复杂插槽协议。
- VXE 原生渲染。
- VXE 高级编辑、虚拟滚动、导出、复杂 toolbar 和插槽协议。

如果需要 VXE 原生能力，后续应新增独立适配层，不能让 `@luma/core` 依赖 VXE。
