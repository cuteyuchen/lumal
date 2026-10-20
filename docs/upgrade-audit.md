# 下一阶段升级审计

审计日期：2026-10-20。Lumal 起点为 `4112ecc`，分支
`codex/lumal-admin-upgrade`。开始时工作区干净，fetch 后与 origin/master
一致；远端实际地址为 `cuteyuchen/luma`，未擅自修改 remote。

## 参考基准

Vben 官方最高稳定 5.x tag：`v5.7.0`，commit
`63a38dce49ba109f61607994e21ba921d8e970e9`。以下结论仅针对此版本。
已核对 `apps/web-ele/src/adapter/{form,vxe-table}.ts`、router、
`packages/@core/ui-kit/form-ui/src`、`packages/effects/plugins/src/vxe-table`、
access、request、auth store、preferences 和 basic layout。

Element Plus 的基础控件以 web-ele 为准；共享行为样例另参考 playground 的
`examples/form/{rules,dynamic}.vue`、`examples/vxe-table/form.vue`、
`system/user/{list,modules/form}.vue` 和 `demos/access/button-control.vue`。
playground 使用另一 UI 适配器，不能把其控件属性当作 Element Plus 属性。

## 起点能力矩阵

| 能力 | 起点状态 | 代码证据与差距 |
| --- | --- | --- |
| 轻启动与服务子入口 | 已实现 | core/src/minimal.ts、request、auth；不应改成根入口 |
| 原生 Schema Form / Table / CRUD | 已实现 | core/src/components；已有校验、联动、列配置、编辑器 |
| 动态菜单、权限、标签缓存、主题 | 已实现 | core/src/router、permission、layout、theme；缺少完整生成项目接线 |
| 文件上传、下载、字典缓存 | 已实现 | core/src/request、dictionary；不重复实现引擎 |
| 脚手架 Local 项目 | 部分实现 | create-lumal-admin/src/scaffold.ts 巨型字符串；仅单一模板 |
| 预设、交互、资源组合 | 缺失 | cli.ts 仅目录与 api-mode；无三预设资源 |
| HTTP 认证闭环 | 部分实现 | 只生成请求示例，原 session 仍使用本地登录 |
| 标准管理模块 | 部分实现 | apps/lumal-admin/src/views/system 存在，生成项目未继承 |
| Vben Form | 部分实现 | vben-compat/src/form；`schemas` 与 `[register, api]` 是旧 Lumal 契约 |
| Vben Grid | 部分实现 | vben-compat/src/grid；query 的 page 为数字，不是 Vben 5 分页对象 |
| Vben 5 原生组件返回结构 | 缺失 | 原 compat 根入口不能直接当 `<Form/>` / `<Grid/>` 使用 |
| 完整 VXE / Vben 运行时 | 不计划兼容 | 保持 Core 与兼容层单向依赖；虚拟表格、高级编辑需可选引擎 |
| i18n / 富文本 / 图表 / 驾驶舱 | 不默认安装 | 独立包或应用侧按需安装，不能进入 minimal / standard |

## 行为基准与验证

Vben 5 Form 使用单数 `schema`，返回 `[Form, formApi]`；
Grid 返回 `[Grid, gridApi]`，顶层 `formOptions`；
query 的第一个参数包含 `page.currentPage/pageSize`，第二个参数为表单值；
结果字段通过 `proxyConfig.response` 映射。路由 `meta.authority` 是角色。
旧根入口保留，新增 `/legacy` 别名与显式 `/v5`。

环境：Windows、Node 24.14.1、pnpm 10.33.0。
基线 `pnpm install --frozen-lockfile` 通过；修改前 `pnpm test` 共 805 项通过。
最终验收结果和实测性能另见升级验收报告；不得以此基线代替修改后的验证。

## 升级后能力矩阵

| 能力 | 本轮状态 | 实际代码与边界 |
| --- | --- | --- |
| 三预设与交互/非 TTY 创建 | 已实现 | create-lumal-admin/src/cli.ts、presets.ts；standard 为默认 |
| 文件模板组合与独立资源 | 已实现 | src/templates.ts、templates/base、modes、features、vben-compatible；不从 apps 复制 |
| 目录冲突与失败恢复 | 已实现 | src/create.ts；排他创建、祖先链接检查、只回滚本次拥有文件 |
| 独立消费者与 CI 浏览器准备 | 已实现 | scripts/check-create-lumal-admin-consumer.mjs、build-validation.yml；工作流静态测试约束 Chromium 必须先于消费者校验安装 |
| HTTP 认证与会话隔离 | 已实现 | templates/modes/http、base/src/services/session-runtime.ts；无隐式演示回退 |
| 深层路由与动态权限菜单 | 已实现 | base/src/router/index.ts；等待初始化、重匹配、退出重置，组件白名单 |
| 用户/角色授权/菜单/机构/字典/配置 | 已实现基础 CRUD | features/system；不等同于复制 Demo 全部组织树联动、批量工作流 |
| Schema 联动、CRUD、列配置 | 已实现 | features/examples 与 Core components；高级编辑留在可选引擎 |
| 标签缓存、刷新与会话清理 | 已实现 | base/src/App.vue；按路径/版本缓存，系统页实例固定模块身份 |
| 全局错误与业务失败恢复 | 已实现 | App 错误边界、SystemEntityView operation-error、V5 Grid alert/retry |
| 上传/下载/请求取消/重复提交 | 沿用已实现能力 | Core request 与 CRUD 导出；本轮不引入另一套传输引擎 |
| V5 Form 高频子集 | 已实现声明子集 | vben-compat/src/v5/form.ts、V5Form.vue；模型泛型、组件 props 有明确差异 |
| V5 Grid 高频子集 | 已实现声明子集 | src/v5/grid.ts、V5Grid.vue；原生 SchemaTable，不是 VXE 实例 |
| V5 路由与权限 | 已实现声明子集 | src/v5/router.ts、access.ts；authority 转角色，iframe 需应用白名单组件 |
| 旧 Lumal 兼容入口 | 保留 | src/index.ts 与 legacy.ts；仍为 register/API 结构 |
| Vben 全局认证/偏好/Modal Store | 不计划兼容 | 应用服务、Core 偏好与 Element Plus Dialog 为替代路径 |
| 全量 VXE、复杂 renderer/虚拟编辑 | 不计划内置 | 无默认 VXE 依赖；需应用另选引擎，不以空方法假兼容 |

具体方法、参数、事件、插槽与迁移等级以
[迁移矩阵](./migration-from-vben.md) 为准。最终执行结果与性能见
[升级验收](./upgrade-verification.md)。
