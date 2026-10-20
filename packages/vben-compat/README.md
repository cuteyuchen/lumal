# @lumal/vben-compat

启动阶段仅转换 Vben 菜单时，从 `@lumal/vben-compat/v5/router` 导入
`adaptVbenMenus/adaptVbenRouteMeta`。该子入口不加载 UI，Form/Grid 留在业务路由懒加载。

轻量迁移层，不是 Vben/VXE 完整运行时。Vben 5 基准为官方 v5.7.0，
commit `63a38dce49ba109f61607994e21ba921d8e970e9`。

```ts
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5'
import '@lumal/vben-compat/style.css'

const [Form, formApi] = useVbenForm({
  schema: [{ component: 'Input', fieldName: 'name', label: '名称', rules: 'required' }],
})
```

`/v5` 返回组件与 API，Grid 的 formOptions 在顶层。根入口和 `/legacy`
继续返回原 Lumal 的 `[register, api]`，不改变已有消费者语义。

支持常见控件、校验、动态字段、值 API、查询分页排序、列与选择、toolbar 和常用插槽。
未知配置明确报错。Grid 由 Core SchemaTable 承载，不安装 VXE；高级编辑、
虚拟滚动、任意 renderer、嵌套表单路径和完整 Tailwind 布局不支持。
Vue 为 peer；UI 消费者还须安装 Core 的 Element Plus peer 并导入其样式。
配置通过 hook / setState 更新，不接受 schema/gridOptions 组件 props；模型泛型、
校验转换和错误传播的差异须按迁移矩阵逐项核对。

完整矩阵、迁移样例、测试证据和限制见仓库 `docs/migration-from-vben.md`。
