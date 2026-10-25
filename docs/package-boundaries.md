# 包边界

Lumal 按职责拆包，兼容层不能反向污染核心包。

## 依赖方向

- `@lumal/icons` 静态入口没有强制运行时依赖，不依赖任何 UI 框架；唯一可选 peer 为 `morphicons@2.0.0`，供独立 `@lumal/icons/morph` 入口动态加载。
- `@lumal/icons-vue` 依赖 `@lumal/icons` 与 `morphicons@2.0.0`，不能依赖 `@lumal/core`。只启用形变时才加载引擎和官方 Vue 绑定。
- `@lumal/core` 可以依赖 `@lumal/icons` 与 `@lumal/icons-vue`。
- `@lumal/vben-compat` 可以依赖 `@lumal/core`。
- `/v5`、`/legacy` 与根入口均独立导出；根入口保留旧 Lumal 契约。兼容 UI 可以依赖
  `@lumal/icons-vue`，但不引入 VXE、Vben、Zod 或 VeeValidate 强制运行时。
- 启动阶段的菜单适配使用 `/v5/router` 纯数据入口，无需 UI peer，不静态加载 Form/Grid。
- `@lumal/core` 不能依赖 `@lumal/vben-compat`。
- `@lumal/charts` 独立可选包，不依赖 `@lumal/core`；`@lumal/core` 也不能依赖 `@lumal/charts`。
- `@lumal/viewport` 只有 Vue peer，不依赖 Core、Element Plus、图表或地图；DataV/Cockpit 可以共享其纯算法与尺寸监听，不能反向定义通用适配策略。
- `@lumal/datav` 独立驾驶舱可视化组件包，不依赖 `@lumal/core`、`@lumal/charts` 或 `@lumal/cockpit`；上述包也不能反向依赖 `@lumal/datav`。DataV `config` 兼容模式允许依赖 `@jiaminghi/charts`。
- `@lumal/cockpit` 可选驾驶舱编排包，可以依赖 `@lumal/core`；`@lumal/core` 不能反向依赖 `@lumal/cockpit`。
- `@lumal/cockpit` 不能依赖 `@lumal/charts`，也不能依赖 ECharts、OpenLayers、Cesium、Mapbox、Leaflet 等可视化或地图运行时。
- `@lumal/vite` 是独立构建辅助包，不依赖 `@lumal/core` 运行时。

## 初版约束

- `@lumal/core` 基于 Element Plus 组合后台框架能力，不从零重写基础 UI 控件。
- Element Plus 必须保持为 `@lumal/core` 的 peer dependency，不能放进普通 dependencies。
- `@lumal/core` 默认不引入多语言。
- `@lumal/core` 默认不依赖 VXE。
- `@lumal/core` 默认不依赖 ECharts / vue-echarts，图表能力由 `@lumal/charts` 单独承载。
- `@lumal/charts` 必须把 `echarts`、`vue-echarts` 作为 peer dependency，不能放进普通 dependencies。
- `@lumal/datav` 必须把 `vue`、`echarts` 作为 peer dependency，不能放进普通 dependencies；`@jiaminghi/charts` 作为 DataV `config` 模式的专用运行时依赖。DataV 2.10.0 作为 MIT 许可下的重构基准，版权声明维护在包内 `THIRD_PARTY_NOTICES.md`，不得引入业务接口、状态码、权限码或字段映射。
- `@lumal/cockpit` 只提供容器、布局运行时、组件注册、配置编辑和消息传递能力；不得内置地图引擎、图表引擎、业务模块、行业分类、固定标题/Logo/背景，也不得包含业务接口地址、状态码、权限码或字段映射。
- `@lumal/cockpit` 必须把 `vue` 作为 peer dependency；`runtime` 与 `designer` 保持独立构建入口，只读驾驶舱可只加载 `runtime`。
- `@lumal/icons` 必须能独立构建，源码不得出现 Vue SFC、Vue 类型或 Vue 运行时引用。
- 通用形变、SVG 转换与原生 DOM 控制放在 `@lumal/icons/morph`，不能只在 Vue 层实现；静态根入口不得静态引入 Morphicons。ESM/CJS 产物保留动态 `import()`，不能用 `require()` 同步加载 ESM 引擎。
- `@lumal/icons-vue` 必须把 `vue` 与 `@iconify/vue` 作为 peer dependency，纯 SVG 算法不得在该包内复制实现。
- `@lumal/vite` 不强制安装自动导入、Devtools 或 viewport 转换插件。
- 业务接口、业务路由、业务 store 不进入包源码。
- `create-lumal-admin/templates` 是可发布资源，按 base / mode / feature / preset 组合；
  system 管理页和后端协议 adapter 属于生成应用，不进入 Core，也不依赖 apps 私有源码。
- `apps/*` 只作为消费方验证，通过 workspace 包依赖使用 `@lumal/*`，不直接 alias 到 `packages/*/src`。
- `packages/*` 的公开入口必须能通过 `exports`、`types`、`main`、`module` 指向 `dist` 产物。
- 样式统一使用 SCSS，包级样式入口必须能通过 package `exports` 被消费方引入。

## 自动检查

发布前运行：

```bash
pnpm release:boundaries
```

这个脚本会检查包发布字段、依赖方向、Element Plus / ECharts peer dependency、DataV `config` 运行时依赖、core 中禁止默认引入的 i18n/VXE/ECharts 标识，以及示例应用是否绕过包名直连 `packages/*` 源码或测试内部文件。

完整构建后还需运行：

```bash
pnpm release:artifacts
```

该脚本检查十个发布包和 Admin 的必要产物、明确 vendor 分包，以及 Admin 单个 JavaScript 块不超过 500 KB。`@lumal/icons` 需产出独立的 `morph.js` / `morph.cjs` 和类型声明；`@lumal/icons-vue` 需产出 ESM、CJS 和 `icons-vue.css`；`@lumal/cockpit` 需产出 ESM、CJS、`cockpit.css` 以及独立的 `runtime`、`designer` 入口；`@lumal/datav` 需产出 ESM、CJS 和 `datav.css`；`@lumal/viewport` 需产出无 UI 依赖的 ESM/CJS 和公开声明。消费者体积检查同时约束静态图标不能加载 Morphicons，不调整现有预算。

当前 Windows 开发环境直接执行项目声明的 pnpm 10.33.0；不要使用可能切换到其他 pnpm 版本的包装命令。
