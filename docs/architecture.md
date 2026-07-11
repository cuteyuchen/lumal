# 架构说明

Luma 使用 pnpm workspace 组织包和示例应用。`packages/*` 按最终发包模型开发，示例应用通过 workspace 包名消费，不直接 alias 到包源码。

## 分层

- `packages/icons`：独立图标包，不依赖 `@luma/core`。
- `packages/core`：后台核心包，可以依赖 `@luma/icons`。
- `packages/vben-compat`：迁移兼容包，可以依赖 `@luma/core`。
- `packages/create-luma-admin`：可发布脚手架包，生成最小 Luma Admin 应用。
- `apps/luma-admin`：Luma 原生写法示例应用，验证 layout、router、permission、theme、dictionary、CRUD 和 request 的组合方式。
- `apps/vben-compat-demo`：Vben 兼容写法示例应用。

## 依赖方向

```text
@luma/icons
     ↑
@luma/core  ←  apps/luma-admin
     ↑
@luma/vben-compat  ←  apps/vben-compat-demo

create-luma-admin  →  生成消费 @luma/core / @luma/icons 的应用
```

`@luma/core` 不能依赖 `@luma/vben-compat`。Vben 兼容能力只能作为迁移层存在，不能反向定义 core 的设计。

## Core 职责

`@luma/core` 负责通用后台基础设施：

- `createLumaAdmin`
- layout 壳层组件
- router/menu 辅助函数
- permission store、指令和 guard
- request client
- theme runtime
- dictionary context
- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- `LumaPage`
- `LumaPagination`

它不负责业务页面、业务接口路径、业务 store，也不默认携带多语言运行时。

## UI 基础

Luma 不从零重写基础控件。当前核心组件基于 Element Plus 组合实现，Element Plus 保持 peer dependency，应用侧按需安装。

`Luma*` 组件是后台框架组件，不是 `El*` 基础控件的替代品。表单、表格、分页、按钮、菜单、布局容器等基础交互优先使用 Element Plus，Luma 只在其上提供 schema、CRUD、布局壳、权限、请求、主题和迁移兼容能力。后续如果某个控件能力不足，应优先通过 schema 扩展、插槽或 Element Plus 配置透传解决，而不是在 `@luma/core` 中重写一套基础 UI。

## 样式

包和应用样式统一使用 SCSS。`@luma/core` 通过 `@luma/core/theme-chalk/index.scss` 暴露 Element Plus 主题入口，通过 `@luma/core/style.css` 暴露 Luma 组件样式入口，示例应用只通过公开入口消费。

## 运行时数据流

```text
登录接口
  → 会话 adapter
  → 用户 / 角色 / 权限 / 菜单标准模型
  → permission store
  → menu normalize
  → route registry
  → Layout 菜单与 Tabs
  → 页面组件

页面请求
  → request client
  → response / pagination adapter
  → Schema / CRUD 标准模型
  → Element Plus 基础控件
```

应用负责接口地址、字段映射、业务状态码和错误文案；Core 只处理标准模型、通用状态和可组合行为。Admin 登录后通过菜单 API 加载标准菜单，使用 route registry 动态注册路由；首次守卫初始化复用同一个 Promise。会话清理通过应用侧重置回调统一清除权限、菜单、动态路由和标签，避免 Core 反向依赖 Admin 路由实现。

## 文档职责

- `development-roadmap.md`：唯一开发规划和阶段状态。
- `core-api.md`：当前公开 Core API。
- `package-boundaries.md`：依赖和发布边界。
- `release-checklist.md`：真实发布命令与验收清单。
- 包 README：安装、入口和最小示例。

## 兼容策略

`@luma/vben-compat` 当前覆盖 `useVbenForm` 和 `useVbenVxeGrid` 的常用子集。兼容层会把 Vben 风格 schema/grid 配置转换为 Luma 原生组件 props，不完整复刻 Vben，也不引入 VXE 作为 core 默认依赖。
