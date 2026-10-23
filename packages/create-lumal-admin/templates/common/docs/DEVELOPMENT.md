# 开发约定

## 通用

组件使用 PascalCase 文件名，目录、普通 TypeScript 文件使用 kebab-case。
页面负责组合功能组件；组件通过 props/emits 通信，真正跨页面的状态才放入 Store。
异步副作用必须处理加载、失败、取消和卸载，不用假成功替代后端错误。
公共逻辑优先使用稳定生态或已安装包的公开 API，禁止导入 `packages/*/src`。
业务响应在 API Adapter 中转成稳定类型，校验与业务规则不散落到模板。

ESLint 负责质量与依赖约束，Prettier 负责格式。不要同时开启其他格式化插件。
`src/shared` 不反向依赖业务模块；存在 admin/screen 双域时两者互不依赖。
只有当前项目存在相应目录时才应用这些边界，不要求 Blank 建立业务架构。

## 测试与检查

- 新增页面：覆盖关键交互、加载失败和权限边界。
- 修改接口：验证响应转换、错误、取消和会话切换，不只验证成功路径。
- 修改公共能力：增加契约回归测试，同时检查已有消费者。
- 布局、图表、Canvas、地图或点击坐标变化：必要时运行真实浏览器检查，DOM 模拟不能证明布局正确。

统一命令：`pnpm lint`、`pnpm format:check`、`pnpm typecheck`、`pnpm test`、`pnpm build`。
提交前运行 `pnpm check`。初次安装生成 lockfile，之后使用 `pnpm install --frozen-lockfile`。
`pnpm format` 应可重复运行且不产生新变化；依赖、产物与声明文件不参与格式化。

<!-- PROJECT_CONVENTIONS -->
