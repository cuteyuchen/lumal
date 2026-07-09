# 包边界

Luma 按职责拆包，兼容层不能反向污染核心包。

## 依赖方向

- `@luma/icons` 不依赖 `@luma/core`。
- `@luma/core` 可以依赖 `@luma/icons`。
- `@luma/vben-compat` 可以依赖 `@luma/core`。
- `@luma/core` 不能依赖 `@luma/vben-compat`。

## 初版约束

- `@luma/core` 默认不引入多语言。
- `@luma/core` 默认不依赖 VXE。
- `@luma/icons` 必须能独立构建。
- 业务接口、业务路由、业务 store 不进入包源码。
- `apps/*` 只作为消费方验证，通过 workspace 包依赖使用 `@luma/*`，不直接 alias 到 `packages/*/src`。
- `packages/*` 的公开入口必须能通过 `exports`、`types`、`main`、`module` 指向 `dist` 产物。
- 样式统一使用 SCSS，包级样式入口必须能通过 package `exports` 被消费方引入。
