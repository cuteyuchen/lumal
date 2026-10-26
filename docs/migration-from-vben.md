# 从 Vben 迁移

Lumal 的兼容层用于逐页迁移，不是 Vben 或 VXE 运行时克隆。Core 不依赖兼容层。

## Vben 5 基准

本轮固定官方 `v5.7.0`，commit
`63a38dce49ba109f61607994e21ba921d8e970e9`。核对
`apps/web-ele/src/adapter/{form,vxe-table}.ts`、form-ui、vxe-table 插件、
router、access、auth、request、preferences 和 layout。不能将旧版 `schemas`
或 Lumal 原来的 `[register, api]` 当作 Vben 5 契约。

| 入口 | 返回值 | 版本策略 |
| --- | --- | --- |
| `@lumal/vben-compat` | `[register, api]` | 原 Lumal 行为不变 |
| `@lumal/vben-compat/legacy` | `[register, api]` | 根入口的显式别名 |
| `@lumal/vben-compat/v5` | `[Form, api]` / `[Grid, api]` | 新增、显式选择的 5.7.0 高频子集 |
| `@lumal/vben-compat/v5/router` | 纯数据路由适配函数 | 启动时转换菜单不加载 Form/Grid |

UI 需要 Vue、Element Plus、Core 样式及 `@lumal/vben-compat/style.css`。
不安装 VXE、Zod、VeeValidate、Tailwind 或 Vben 状态运行时。需要 Zod 时由应用安装，
兼容层通过结构性 `safeParseAsync` 调用它，不将其变为所有项目的依赖。

## V5 兼容矩阵

下表的“支持”仅限列出的契约；完整声明见 `src/v5/types.ts`。
未知顶层配置、未知控件和高级 VXE 配置运行时报错，避免静默忽略。

| Vben 原生用法 | Lumal `/v5` 用法与程度 | 业务改动 | 证据 / 未支持 |
| --- | --- | --- | --- |
| `const [Form, api] = useVbenForm({ schema })` | 相同组件结构，单数 schema | 基础页仅改 import | `v5-form.test.ts`；不支持 connectedComponent |
| Input/Select/DatePicker/InputNumber/Switch | Element Plus 原生控件映射 | 原生组件属性可保留 | 真实控件单测、消费者浏览器；ApiSelect/远程控件需应用组件重构 |
| InputPassword/InputTextarea/RadioGroup/CheckboxGroup/TreeSelect | 支持基础值和 options | 适配器命名需核对 | 原生 Schema 承载；不接受任意组件注册器 |
| `rules: 'required'/'selectRequired'` 或 Zod schema | required 与异步 safeParseAsync | 公司规则自行包装 | 必填、异步失败/恢复单测；无完整 VeeValidate 规则注册系统 |
| `getValues/setValues/setFieldValue/resetForm/resetValidate` | 支持异步值 API、过滤未知字段、默认值恢复 | 通常仅改 import | 字段泛型与渲染单测；仅平面字段，嵌套路径需映射 |
| `validate/validateAndSubmitForm/submitForm` | `{ valid, errors }`、单飞、加载与错误反馈 | 业务异常继续向上传播 | 校验、保存失败、卸载在途提交单测；无完整 touched/dirty 元状态 |
| `dependencies.if/show/disabled/required/componentProps` | if 移除渲染，show 保留值，动态禁用/必填/选项 | 支持子集可保留 | 单测、浏览器；triggerFields 声明保留，但派生会读取当前完整值 |
| `commonConfig/layout/wrapperClass` | 标签宽度、禁用、横/纵布局、基础 grid-cols-N | 复杂 CSS 需改写 | 仅 grid-cols-N 转列数，不运行 Tailwind；不支持完整栅格 class 协议 |
| 字段名插槽 | `#fieldName` 的 modelValue/update/values | 可保留常见双向绑定 | 插槽回写单测；插槽类型不提供完整 Vben 推断 |
| `const [Grid, api] = useVbenVxeGrid({gridOptions, formOptions})` | 相同结构，formOptions 在顶层 | 常用页改 import | `v5-grid.test.ts`；不是 VXE Grid 实例 |
| `ajax.query({page, sort}, formValues)` | page.currentPage/pageSize，远端分页排序 | 原请求通常保留 | 查询、分页、刷新单测；无 VXE 完整 proxy 上下文 |
| `proxyConfig.response.result/total` | 支持点路径映射 | 非标准协议显式配置 | 嵌套返回值测试；默认仅 `{items,total}` 或数组 |
| 列 field/title/width/fixed/sortable/formatter/slots.default | 原生 SchemaTable、seq/checkbox、列设置 | renderer 改为插槽 | 真表格交互单测；无全局 renderer、合并单元格、高级编辑、虚拟滚动 |
| `query/reload/setState/setGridOptions/setLoading/toggleSearchForm` | 支持；reload 回首页，query 保留页码 | 方法超出子集需改写 | API、错误保留旧行与重试单测 |
| `grid.getCheckboxRecords/setCheckboxRow/clearCheckboxRow/getTableData` | 支持当前已加载行的子集 | 其他 VXE 实例方法需重构 | 真实选择与卸载单测；无跨页保留、全量过滤数据或 VXE 私有实例 |
| toolbar-actions/tools、列插槽与常用 gridEvents | checkboxChange/sortChange/pageChange/proxyQuery/proxyQueryError | 按声明调整 payload | 单测与新增编辑删除弹窗浏览器验证；不承诺 VXE 全部事件 |
| `AccessControl/useAccess/v-access` | code/role 交集与空数组拒绝，响应权限更新 | 初始化 Core PermissionStore | `v5-access.test.ts`；后端仍必须鉴权 |
| route.meta.authority/activePath/link/iframeSrc | `adaptVbenRouteMeta/adaptVbenMenus` | 在应用路由边界调用 | authority 是角色，转换为 roles；activePath→activeMenu；iframe 需白名单应用组件 |
| hideInMenu/title/icon/affixTab/keepAlive/redirect | 元信息映射到 Core 动态菜单/布局 | 保留应用白名单 resolver | 路由测试与生成项目；不包含 Vben 布局和全局 preferences store |

### 支持等级

| 等级 | 当前范围 |
| --- | --- |
| 契约内完全兼容 | `[Form, formApi]` / `[Grid, gridApi]` 元组结构、单数 `schema`、顶层 `formOptions`，仅限上表已列出的调用 |
| 部分兼容 | 表单联动、Grid proxy/分页、列设置、权限及常用插槽；底层是 Lumal 组件和轻量 facade，不是 VXE 实例 |
| 需要适配 | 显式泛型、后端服务、renderer、复杂布局、自定义弹窗、Vben 状态运行时和事件 payload |
| 不支持 | VXE 高级编辑/虚拟滚动/全局 renderer、任意控件注册、完整 VeeValidate/Tailwind、嵌套路径和 fieldMappingTime |

`toolbar-actions` 和 `toolbar-tools` 均为具名插槽，当前不注入 VXE 的完整工具栏上下文；
应通过已获得的 `gridApi` 操作。迁移示例使用 `#toolbar-actions` 放置新增按钮，
通过真实业务服务完成查询、分页和弹窗 CRUD。不能把“插槽显示正常”等同于完整 VXE 插槽协议兼容。
系统管理与迁移页面分别位于生成项目的 `modules/system` / `modules/vben-migration`，
后者拥有自己的 `/migration` 父菜单；不向 Core 注入兼容层。

接口不是同名就等价：`grid` 是明确列出方法的轻量 facade；表单 schema
不支持 `fieldMappingTime`、任意嵌套路径、任意运行时规则名称。
国际化、富文本、图表及原生 VXE 页面保留原可选引擎或重构，不进入 Core。

泛型约束也有差异：Lumal 的 `useVbenForm<UserModel>` 约束模型字段，Vben 的首个
泛型用于控件类型；已有显式泛型需调整。配置通过 hook、`setState` 或
`setGridOptions` 更新，不支持将 `schema/gridOptions` 当作返回组件的 props；
此类用法明确报错。组件只透传 class/style、DOM 属性和事件，Grid 另支持 tableTitle。
Zod 结构性校验不应用 transform 结果，需转换的值在应用提交边界处理。
Grid 命令式 query/reload 失败会拒绝 Promise，这是有意保留的错误传播，
不同于参考实现仅 console.error 的处理；迁移调用方应接住异常或交给应用错误边界。

## V5 迁移步骤

1. 从 `vben-compatible` 预设创建项目，先接通应用服务契约，再迁移页面。
2. 将 `#/adapter/form` 和 `#/adapter/vxe-table` 的业务导入替换为
   `@lumal/vben-compat/v5`；保留 schema、顶层 formOptions 和分页参数结构。
3. 将自定义控件、VXE renderer、完整 Tailwind 布局和高级实例方法列为逐项适配，
   不用类型断言绕过未支持配置。
4. 在 HTTP adapter 映射后端 JSON。Vben RequestClient、认证 Store 和 preferences
   不是兼容层的一部分，须改接应用服务、Core request 与偏好 Store。
5. 使用 `adaptVbenMenus` 转换角色路由，菜单 component 仍从应用白名单解析；
   iframe 由应用提供安全组件，不将远端字符串变成任意 import。
6. 对每页运行类型检查、生产构建、真实控件交互和错误恢复测试。

## 原始场景对应

原始源码均来自上述 SHA，不复制 Vben 内部运行时：

| 原始场景 | 迁移样例 | 迁移等级 |
| --- | --- | --- |
| web-ele `views/demos/form/basic.vue`；playground `examples/form/{rules,dynamic}.vue` | 模板 `modules/vben-migration/components/VbenFormExample.vue`、Demo `V5FormExample.vue` | 基础 schema 仅改导入；Zod/动态字段支持声明子集，复杂布局轻微适配 |
| playground `examples/vxe-table/form.vue` | 模板 `VbenUsers.vue`、Demo `V5GridExample.vue` | query 分页/表单结构保留；列 renderer 改插槽 |
| playground `system/user/{list,modules/form}.vue` | 模板 `VbenUsers.vue` 的 Dialog CRUD | 业务服务接线和弹窗由应用重构；不声称 Vben Modal API 兼容 |
| playground `demos/access/button-control.vue` | 模板权限按钮、Demo `AccessControl` | 替换导入并注入权限 Store |

playground 的 UI adapter 不是 Element Plus，控件属性以 web-ele adapter 为准。
以上是代表性行为迁移，不是“整页仅改导入即可直接运行”的承诺。
生命周期、失败恢复、旧入口回归见包单测；完整生成项目生产浏览器与真实 HTTP
证据、环境和未验证范围见 [升级验收](./upgrade-verification.md)。

## Legacy 已支持

### `useVbenForm`

当前支持常见表单 schema 转换到 `LumalSchemaForm`：

- `fieldName` / `field` 转为 `field`。
- `Input`、`Input.Password` 转为 `input`。
- `Input.TextArea`、`Textarea` 转为 `textarea`。
- `Select` 转为 `select`。
- `InputNumber` 转为 `number`。
- `Switch` 转为 `switch`。
- `DatePicker` 按 `componentProps.type` 转为 `date`、`datetime` 或 `daterange`。
- `DatePicker.RangePicker` 转为 `daterange`。
- `RadioGroup`、`CheckboxGroup` 转为 `radio`、`checkbox`。
- `TreeSelect`、`Upload` 转为 `tree-select`、`upload`。
- `Hidden` 转为 `hidden`。
- `componentProps.placeholder` 转为 `placeholder`。
- `componentProps.options` 转为 `options`。
- `required` 或 `rules[].required` 转为 `required`。
- `show: false`、`ifShow: false`、`hidden: true` 转为隐藏字段。

`useVbenForm` 返回 `[register, formApi]`，其中 `formApi` 提供：

- `schemaFormProps`：可直接绑定给 `LumalSchemaForm` 的 props。
- `getFieldsValue()`：获取当前模型。
- `setFieldsValue(values)`：合并设置模型。
- `resetFields()`：恢复初始模型和 schema 默认值。
- `getLumalSchemas()`：获取转换后的 Lumal schema。
- `getFormInstance()`：获取通过 `register` 绑定的表单实例。

### `useVbenVxeGrid`

当前支持常见 grid 配置转换到 `LumalCrudTable`：

- `gridOptions.columns` 转为 Lumal 表格 columns。
- `field` 转为 `field`。
- `title` / `label` 转为 `label`。
- `width`、`align`、`formatter` 透传。
- `hidden: true` 或 `visible: false` 转为隐藏列。
- `type: 'checkbox'` 转为 Lumal selection；`type: 'radio'`、`type: 'seq'` 等未对应到 Lumal 公共模型的辅助列会跳过。
- `gridOptions.formOptions.schemas` 复用 `useVbenForm` 的 schema 适配规则。
- `gridOptions.pagerConfig.pageSize` / `pageSizes` 转为分页配置。
- `gridOptions.proxyConfig.ajax.query` 用于加载列表数据。
- `proxyConfig.props.result`、`items` / `list`、`total` 可用于适配嵌套接口结果。
- `toolbarConfig` 转为 CRUD toolbar，`actions` 转为行级操作，`tableConfig` 转为列设置和自动 resize 等表格配置。
- total 支持有限数字字符串归一化；其他公司异常字段仍应在应用 adapter 处理。

`useVbenVxeGrid` 返回 `[register, gridApi]`，其中 `gridApi` 提供：

- `crudTableProps`：可直接绑定给 `LumalCrudTable` 的 props。
- `getLumalColumns()`：获取转换后的 Lumal columns。
- `getRows()` / `setRows(rows, total)`：读取或设置表格数据。
- `getTotal()`：读取总数。
- `getQueryModel()` / `setQueryModel(model)`：读取或设置查询模型。
- `search(payload)` / `reload()` / `reset()`：触发查询、刷新和重置，并返回 `Promise<boolean>` 供调用方等待结果。
- `handleSearch(payload)` / `handleReset(payload)` / `handlePageChange(payload)`：用于绑定 LumalCrudTable 事件。
- `getGridInstance()`：获取通过 `register` 绑定的表格实例。
- `getError()` / `clearError()`：读取和清理最近一次加载错误；`gridOptions.onError` 可统一接收失败。

## 最小迁移示例

旧页面可以先保留 Vben 风格 schema，再把兼容层产出的 props 绑定到 Lumal 原生组件：

```vue
<script setup lang="ts">
import { LumalCrudTable, LumalSchemaForm } from '@lumal/core/components'
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat'

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
  <LumalSchemaForm v-bind="formApi.schemaFormProps.value" />
  <LumalCrudTable v-bind="gridApi.crudTableProps.value" />
</template>
```

完整可构建示例见 `apps/vben-compat-demo`，验证命令：

```bash
pnpm compat:build
```

## Legacy 未支持

- Vben 表单的完整校验规则映射。
- 动态函数式 `ifShow`、`dynamicDisabled` 等高级运行时能力。
- Vben 表单布局、栅格和复杂插槽协议。
- VXE 原生渲染、高级编辑、虚拟滚动和复杂 toolbar 插槽协议。

## 迁移原则

优先迁移到 Lumal 原生 schema；兼容层只覆盖高频写法。遇到高级 Vben 能力时，应先判断是否真的需要保留，再决定是否在兼容层补子集能力。
