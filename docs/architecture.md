# 架构说明

Luma 使用 pnpm workspace 组织包和示例应用。`packages/*` 按最终发包模型开发，示例应用通过 workspace 包名消费，不直接 alias 到包源码。

## 分层

- `packages/icons`：独立图标包，不依赖 `@luma/core`。
- `packages/core`：后台核心包，可以依赖 `@luma/icons`。
- `packages/vben-compat`：迁移兼容包，可以依赖 `@luma/core`。
- `apps/luma-admin`：Luma 原生写法示例应用。
- `apps/vben-compat-demo`：Vben 兼容写法示例应用。

## 依赖方向

```text
@luma/icons
     ↑
@luma/core  ←  apps/luma-admin
     ↑
@luma/vben-compat  ←  apps/vben-compat-demo
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
- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- `LumaPage`
- `LumaPagination`

它不负责业务页面、业务接口路径、业务 store，也不默认携带多语言运行时。

## UI 基础

Luma 不从零重写基础控件。当前核心组件基于 Element Plus 组合实现，Element Plus 保持 peer dependency，应用侧按需安装。

## 样式

包和应用样式统一使用 SCSS。`@luma/core` 通过 `@luma/core/theme-chalk/index.scss` 暴露包级样式入口，示例应用只通过公开入口消费。

## 兼容策略

`@luma/vben-compat` 当前覆盖 `useVbenForm` 和 `useVbenVxeGrid` 的常用子集。兼容层会把 Vben 风格 schema/grid 配置转换为 Luma 原生组件 props，不完整复刻 Vben，也不引入 VXE 作为 core 默认依赖。
