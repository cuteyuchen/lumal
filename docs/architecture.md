# 架构说明

Luma 使用 pnpm workspace 组织包和示例应用。`packages/*` 按最终发包模型开发，示例应用通过 workspace 包名消费，不直接 alias 到包源码。

## 分层

- `packages/icons`：独立图标包，不依赖 `@luma/core`。
- `packages/core`：后台核心包，可以依赖 `@luma/icons`。
- `packages/charts`：可选图表包，独立承载 ECharts 面板能力。
- `packages/datav`：独立驾驶舱可视化组件包，基于 DataV 2.10.0（MIT）重构 38 个组件，只把 `vue` 和 `echarts` 作为 peer dependency，不依赖 `@luma/core`。
- `packages/cockpit`：可选驾驶舱编排包，提供布局运行时、组件注册、编排设计器和通用消息总线，可以依赖 `@luma/core`；不内置地图引擎、业务模块或行业术语。
- `packages/vben-compat`：迁移兼容包，可以依赖 `@luma/core`。
- `packages/vite`：无强制运行时依赖的 Vite resolver、alias 和 Devtools 助手。
- `packages/create-luma-admin`：可发布脚手架包，生成最小 Luma Admin 应用。
- `apps/luma-admin`：Luma 原生写法示例应用，验证 layout、router、permission、theme、dictionary、CRUD 和 request 的组合方式，并集成驾驶舱独立路由。
- `apps/luma-cockpit`：独立驾驶舱示例应用，证明 `@luma/cockpit` 能脱离 Admin 单独构建运行，不依赖 `apps/luma-admin` 源码。
- `apps/luma-datav-guide`：`@luma/datav` 的组件文档站，仿 DataV guide 结构提供全部 15 个组件的实时预览、config 与现代 props 用法及属性表，可静态托管并以外链形式嵌入 Admin。
- `apps/vben-compat-demo`：Vben 兼容写法示例应用。

## 依赖方向

```text
@luma/icons
     ↑
@luma/core  ←  apps/luma-admin
     ↑
@luma/cockpit  ←  apps/luma-admin, apps/luma-cockpit
     ↑
@luma/vben-compat  ←  apps/vben-compat-demo

@luma/charts  ←  apps/luma-admin
@luma/datav   ←  apps/luma-admin, apps/luma-cockpit, apps/luma-datav-guide
@luma/vite    →  Vite 配置与构建辅助
create-luma-admin  →  生成消费 @luma/core / @luma/icons 的应用
```

`@luma/cockpit` 依赖 `@luma/core`，但 `@luma/core` 不能反向依赖 `@luma/cockpit`；`@luma/cockpit` 不依赖 `@luma/charts`、`@luma/datav` 或任何地图/图表运行时。

`@luma/datav` 是独立可视化组件包，不依赖 `@luma/core` 或 `@luma/cockpit`；驾驶舱和 Admin 只在应用层按需消费其组件，`@luma/datav` 也不能反向依赖上述任何包。

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
  → HTTP / business / session 错误分类
  → 单飞刷新与最多一次重放
  → response / pagination adapter
  → Schema / CRUD 标准模型
  → Element Plus 基础控件
```

应用负责接口地址、字段映射、业务状态码和错误文案；Core 只处理 `ApiEnvelope<T>`、`PageResult<T>`、`AuthSessionData` 等标准模型、通用状态和可组合行为。Admin 的非标准响应、分页、菜单和 Token 字段集中在 `src/api/adapters.ts`。系统菜单数据是菜单 API 的权威来源，登录后转换为标准菜单并使用 route registry 动态注册；首次守卫初始化复用同一个 Promise。会话清理通过应用侧重置回调统一清除权限、菜单、动态路由和标签，避免 Core 反向依赖 Admin 路由实现。主题、布局、标签和动画只由全局偏好 store 与设置抽屉维护，系统配置页不再保存第二份壳层状态。

## 构建与验收流

Admin 页面路由使用动态导入，Element Plus、ECharts 和 Luma 公共能力拆分为明确的 vendor chunk。`release:artifacts` 检查发布包产物、vendor 命名和单个 Admin JavaScript 块 500 KB 上限，避免通过调高告警阈值掩盖分包问题。

Playwright 通过生产构建预览验证登录、权限菜单、403/404、退出、标签与设置持久化、CRUD、会话失效和移动端横向溢出。浏览器流程消费与用户相同的 Admin 入口，不直接调用组件内部实现。

## 文档职责

- `development-roadmap.md`：唯一开发规划和阶段状态。
- `core-api.md`：当前公开 Core API。
- `package-boundaries.md`：依赖和发布边界。
- `release-checklist.md`：真实发布命令与验收清单。
- 包 README：安装、入口和最小示例。

## 兼容策略

`@luma/vben-compat` 当前覆盖 `useVbenForm` 和 `useVbenVxeGrid` 的常用子集。兼容层会把 Vben 风格 schema/grid 配置转换为 Luma 原生组件 props，不完整复刻 Vben，也不引入 VXE 作为 core 默认依赖。
