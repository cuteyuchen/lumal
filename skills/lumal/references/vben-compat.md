# @lumal/vben-compat

启动阶段仅适配菜单时使用 `@lumal/vben-compat/v5/router`，不经 `/v5`
汇总入口加载 Form/Grid；该纯数据入口不需要 Element Plus。

## 什么时候用

已有 Vben 风格表单/Grid schema 需要逐步迁移到 Lumal 时使用。新页面直接使用 Lumal 原生 schema，不为了 API 名称相似而引入迁移层。

它是常用写法的适配器，不是完整 Vben Admin 或 VXE 引擎。渲染组件来自 `@lumal/core/components`，按 Core UI 要求接入 Element Plus 和样式。

## 先选入口

以官方 Vben `v5.7.0`、SHA `63a38dce49ba109f61607994e21ba921d8e970e9` 为基准：

- 新增 `@lumal/vben-compat/v5` 返回 `[Form, api]` / `[Grid, api]`，使用单数 `schema` 和顶层 `formOptions`。
- 根及 `/legacy` 保留 `[register, api]` 与旧 Lumal `schemas`，不能用注册函数当组件。
- UI 还需 `@lumal/vben-compat/style.css`。无默认 VXE、Vben、Zod 或 Tailwind 依赖。

```ts
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5'
const [Form, formApi] = useVbenForm({
  schema: [{ component: 'Input', fieldName: 'name', label: '姓名', rules: 'required' }],
})
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: [{ component: 'Input', fieldName: 'keyword', label: '关键词' }] },
  gridOptions: {
    columns: [{ field: 'name', title: '名称' }],
    proxyConfig: {
      ajax: { query: async ({ page }, values) => ({ items: [], total: 0 }) },
    },
  },
})
```

上述返回组件可直接 `<Form />`、`<Grid />`。真实业务将 query 改接应用服务；
`page.currentPage/pageSize` 是 V5 对象结构，非标准返回值用 `proxyConfig.response` 映射。
Form 支持值/校验 API、dependencies.if/show/disabled/required/componentProps 与字段插槽；
Grid 支持分页/排序/查询/刷新/列设置、多选 facade、工具栏/列插槽和错误重试。
只支持安装包公开声明中的轻量子集，未知顶层或 VXE 配置报错；
维护仓库时再核对 `docs/migration-from-vben.md` 的完整矩阵。
配置通过 hook/setState 更新，不能当作返回组件的 schema/gridOptions props；
Lumal 的 Form 泛型约束模型字段，并非 Vben 的控件名称泛型。

## V5 行为边界

- `getValues/setValues/setFieldValue/resetForm/resetValidate` 是异步 API；`validate()` 返回 `{ valid, errors }`，不是裸布尔值。
- `dependencies.if` 不渲染字段；`show` 保留实例和值，隐藏字段仍可能参与校验。仅想禁用提交时用 `submitButtonOptions.disabled`，不是 `commonConfig.disabled`。
- `gridApi.reload()` 回到首页，`query()` 保留页码；二者失败均拒绝 Promise，调用方必须处理。不要照搬 legacy 的 `Promise<boolean>` 判断。
- `gridApi.grid` 是当前已加载行的多选/数据 facade，不是 VXE 实例；无跨页选择或任意原生方法。
- hook 在组件 setup 中创建；`formApi.isMounted` 和实例方法遵守挂载/卸载生命周期，不缓存成全局单例。Grid 在卸载后忽略旧加载结果，不能借此替代应用服务的会话隔离。
- 路由适配的 `authority→roles`、`activePath→activeMenu`、`link→externalLink` 在应用边界完成；iframe 必须显式提供本地白名单 `iframeComponent`，外链只接受 HTTP(S) 绝对地址。

真实迁移还需调整应用请求与权限注入、弹窗组件和自定义 renderer；不能笼统承诺“只改 import”。
字段校验不提供完整 VeeValidate 规则系统；Zod transform 的结果也不会自动替换提交值。

## Legacy 最小迁移

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

## Legacy 支持范围

- Form：`fieldName/field` 转 `field`，Input/Select/日期/数字/开关/树选择/上传等常用控件转换，placeholder/options/required 和静态隐藏。
- Grid：列、查询 schema、分页、`proxyConfig.ajax.query`、结果字段映射、toolbar/actions 与部分 table 配置。
- `formApi.schemaFormProps` 绑定 `LumalSchemaForm`；`gridApi.crudTableProps` 绑定 `LumalCrudTable`。
- `gridApi.reload/search/reset` 返回 `Promise<boolean>`；等待它再判断刷新结果，失败时通过 `getError/clearError/onError` 处理。
- proxy 非标准结果通过 `proxyConfig.props` 或应用 adapter 明确转换；不要假设任意嵌套结果都能识别。

## 不要承诺的能力

完整 Vben 校验/布局/插槽协议、旧式 `ifShow/dynamicDisabled`、VXE 原生渲染/高级编辑/
虚拟滚动并未完整支持。V5 动态逻辑使用 `dependencies`，不是旧版配置。
Zod 仅结构性支持 `safeParseAsync`，由应用按需安装。路由的 `meta.authority` 是角色，
需在边界用 `adaptVbenMenus` 转为 Core roles；请求、认证和偏好 Store 不提供假兼容。

迁移顺序：保留业务请求和数据模型，先替换渲染/适配层，核对查询分页与失败状态，再逐页改成原生 Lumal API。

仓库核对位置：`packages/vben-compat/src/v5`、legacy `form/grid`、包测试和迁移矩阵；
示例在 `apps/vben-compat-demo` 及脚手架 `vben-compatible` 层。
