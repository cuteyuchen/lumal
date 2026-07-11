# 包边界

Luma 按职责拆包，兼容层不能反向污染核心包。

## 依赖方向

- `@luma/icons` 不依赖 `@luma/core`。
- `@luma/core` 可以依赖 `@luma/icons`。
- `@luma/vben-compat` 可以依赖 `@luma/core`。
- `@luma/core` 不能依赖 `@luma/vben-compat`。
- `@luma/charts` 独立可选包，不依赖 `@luma/core`；`@luma/core` 也不能依赖 `@luma/charts`。
- `@luma/vite` 是独立构建辅助包，不依赖 `@luma/core` 运行时。

## 初版约束

- `@luma/core` 基于 Element Plus 组合后台框架能力，不从零重写基础 UI 控件。
- Element Plus 必须保持为 `@luma/core` 的 peer dependency，不能放进普通 dependencies。
- `@luma/core` 默认不引入多语言。
- `@luma/core` 默认不依赖 VXE。
- `@luma/core` 默认不依赖 ECharts / vue-echarts，图表能力由 `@luma/charts` 单独承载。
- `@luma/charts` 必须把 `echarts`、`vue-echarts` 作为 peer dependency，不能放进普通 dependencies。
- `@luma/icons` 必须能独立构建。
- `@luma/vite` 不强制安装自动导入、Devtools 或 viewport 转换插件。
- 业务接口、业务路由、业务 store 不进入包源码。
- `apps/*` 只作为消费方验证，通过 workspace 包依赖使用 `@luma/*`，不直接 alias 到 `packages/*/src`。
- `packages/*` 的公开入口必须能通过 `exports`、`types`、`main`、`module` 指向 `dist` 产物。
- 样式统一使用 SCSS，包级样式入口必须能通过 package `exports` 被消费方引入。

## 自动检查

发布前运行：

```bash
pnpm release:boundaries
```

这个脚本会检查包发布字段、依赖方向、Element Plus / ECharts peer dependency、core 中禁止默认引入的 i18n/VXE/ECharts 标识，以及示例应用是否绕过包名直连 `packages/*` 源码或测试内部文件。

完整构建后还需运行：

```bash
pnpm release:artifacts
```

该脚本检查六个发布包和 Admin 的必要产物、明确 vendor 分包，以及 Admin 单个 JavaScript 块不超过 500 KB。

当前 Windows 开发环境直接执行项目声明的 pnpm 10.33.0；不要使用可能切换到其他 pnpm 版本的包装命令。
