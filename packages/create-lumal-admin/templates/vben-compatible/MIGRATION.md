# Vben 5 Element Plus 迁移基准

基准 v5.7.0，commit `63a38dce49ba109f61607994e21ba921d8e970e9`。
本项目不加载 VXE Table / vee-validate / Vben Store。

1. `#/adapter/form` 和 `#/adapter/vxe-table` 改为 `@lumal/vben-compat/v5`。
2. 保留 `[Form, formApi]`、单数 `schema`、`[Grid, gridApi]`、顶层 `formOptions`。
3. 业务 API 接到本项目 ApplicationService。query 仍接收
   `{ page: { currentPage, pageSize }, sort }` 和第二参数 formValues。
4. 默认结果为 `{ items, total }`，不同响应在 `proxyConfig.response` 明确配置。
5. Element Plus 控件属性沿用；Tailwind 布局需转成项目 CSS，
   `wrapperClass` 的基础 grid-cols-N 映射为原生响应式列数。
6. 原 Vben Drawer/Modal 改为 Element Plus Dialog 或 Lumal CRUD 编辑器。
7. `@vben/access` 的高频用法可改为本入口的 AccessControl / useAccess；
   路由数据先经 adaptVbenMenus，authority 按角色匹配。
8. `#toolbar-actions` 与 `#toolbar-tools` 用于具名工具栏插槽；当前不注入完整 VXE 工具栏上下文，
   命令通过已获得的 `gridApi` 调用。兼容页面位于独立 `modules/vben-migration`，不混入系统管理。

本模板 `migration/form` 对应 web-ele/demos/form/basic 与共享 rules/dynamic
场景；`migration/users` 对应共享 vxe-table/form 和 system/user 的
查询、分页、列配置、插槽操作、弹窗校验、增删改与按钮权限。
不是声称原始页面仅换 import 就可以完整运行。

不支持：任意自定义表单组件注册、VXE renderer、虚拟滚动、高级编辑、
表单嵌套路径、fieldMappingTime、Vben 全局偏好 Store/Drawer/Modal。
配置不在受支持类型内时会明确报错，不静默忽略。
Zod 校验器可由应用自行安装后传入 rules；兼容包不内置或导出 z。
Lumal Form 泛型约束模型字段，不是 Vben 的控件名称泛型；显式泛型需调整。
配置通过 hook/setState 更新，不接受 schema/gridOptions 组件 props。
Zod transform 需在应用提交边界处理；Grid 的命令式 query/reload 会向调用方传播错误。
