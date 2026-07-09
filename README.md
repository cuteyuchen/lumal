# Luma

Luma 是一个面向中小型后台项目的轻量 Vue Admin 框架。底层能力以 `@luma/*` 包提供，使用这些包创建出来的后台管理平台叫 `luma-admin`。

## 包规划

- `@luma/icons`：独立图标系统。
- `@luma/core`：轻量后台核心能力。
- `@luma/vben-compat`：Vben Admin 常用写法兼容层，后续实现。

## 当前开发阶段

当前先执行 Sprint 1：

1. 建立 pnpm monorepo 基线。
2. 实现最小 `@luma/icons`。
3. 实现最小 `@luma/core`。
4. 创建最小 `apps/luma-admin` 验证包拆分和应用启动链路。

## 包消费原则

`packages/*` 按最终发包模型开发，公开入口通过 package `exports` 指向 `dist` 产物。示例应用只通过 workspace 依赖消费 `@luma/*` 包，不直接 alias 到包源码。

## 样式约束

Luma 统一使用 SCSS 维护样式。包内公共样式以可发布入口暴露，例如 `@luma/core/theme-chalk/index.scss`；示例应用只作为消费方引入这些入口，不直接读取 `packages/*/src`。
