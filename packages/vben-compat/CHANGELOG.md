# @lumal/vben-compat

## 0.1.1-beta (2026-10-30)

- 包含下方未发布的 0.1.0-beta Core 宽度适配；同步固定发布组内部依赖。
- 保持 v5、legacy 与无 UI 路由入口，不新增兼容包装或运行时依赖。

## 0.1.0-beta (2026-10-28)

- 同步 Core 唯一宽度适配与固定包组依赖；兼容表单/表格继续使用其公开入口。

## 0.0.7-beta (2026-10-26)

### Patch Changes

- 同步 Core 与图标依赖至 0.0.7-beta；保持 v5、legacy 和无 UI 路由入口，不增加迁移运行时依赖。

## 0.0.6-beta (2026-10-25)

### Patch Changes

- 同步 Core 与图标依赖至 0.0.6-beta，保留 v5、legacy 及无 UI 路由入口。
- 继续通过 Vben Compatible 脚手架、生产消费者和兼容层回归验证，不增加 VXE/Vben 全量依赖。

## 0.0.5-beta (2026-10-20)

### Minor Changes

- 新增 `/v5`，固定 Vben 5.7.0 高频 Form/Grid、路由与权限契约，返回可渲染组件和 API。
- 新增 `/v5/router` 无 UI 菜单适配入口，保留页面级懒加载；不引入 VXE/Vben 运行时。
- 根入口保留旧 register/API 语义，新增 `/legacy` 显式别名。
- 补齐校验、动态字段、分页排序、多选、失败恢复、生命周期及旧入口回归测试。
- 同步 Core 与图标依赖至 0.0.5-beta；未支持能力有明确类型、错误和迁移说明。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 同步 Core 依赖至 0.0.4-beta，继续保持既有表单与表格迁移子集 API。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 兼容表格查询使用请求代数，旧查询不能覆盖新结果、错误或 loading。
- 作用域销毁后忽略在途查询，补齐逆序完成、失败和销毁回归。
- 同步 Core 依赖版本，继续保持迁移子集边界。

## 0.0.2-beta (2026-08-01)

- Version bump only, to stay in lockstep with the other @lumal packages.
