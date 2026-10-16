# 发布检查清单

发布前需要确认包内容、依赖方向、文档和示例应用都处于可发布状态。

## 版本准备

当前目标为 `0.0.3-beta`，沿用 `0.0.x-beta` 序列。九个公共包统一版本，私有应用保留 `0.0.0`，只更新内部依赖。

```bash
pnpm release:version 0.0.3-beta
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

`release:version` 只修改 manifests，不更新锁文件、日志和文档，也不提交、推送、打 tag 或发布。版本准备还需：

- 将 pending Changeset 汇总进每个公共包 CHANGELOG，确认完整后移除已消费记录；本轮不运行标准 `changeset:version`，避免把 beta 序列变为稳定版 `0.1.0`。
- 更新 `docs/changelog.md`、路线图基线、文档导航、安装命令和脚手架说明；历史版本与验收证据保留。
- 保留脚手架源码的三个版本占位符；`pnpm build` 时按脚手架 package.json 注入精确版本，再用 `pnpm test:create-consumer` 验证 tarball 的 minimal/request、local、HTTP 三种消费路径。
- 以空 Changeset 注明变更已手工汇总（本轮为 `prepared-0-0-3-beta.md`，不含包 bump），再执行 `pnpm changeset:status`，确认没有下一轮发布计划；否则已消费记录可能重复提升版本。

发布另行通过 `release-npm.yml`：推送 `v0.0.3-beta` tag 或手动指定版本与 `beta` dist-tag，两种方式只选择一种，避免重复发布。仓库版本准备不代表 npm 已可安装本版。

提交并推送版本改动后，先确认该提交的 CI 和 Build Validation 成功，再推送发布 tag。发布与完整门禁当前由独立工作流运行；如需在发包前执行完整门禁，可先手动触发该提交的 `release-gate.yml`。发布结束后逐包核对 npm 版本与 `beta` dist-tag，不能只以 tag 推送成功判断发包完成。

## 命名检查

```bash
rg -n "guiren|gr-framework|GrFramework|GSchemaForm|GSchemaTable|GCrudTable|GPage|GPagination" README.md docs packages apps --glob "!docs/release-checklist.md"
```

当前首版不保留 `G*` 组件别名，公开 API 使用 `Lumal*` 命名。如果后续为了迁移保留别名，需要明确写成兼容 API，不能作为推荐 API。

## 依赖方向

- `@lumal/icons` 保持零运行时依赖和零 Vue 引用。
- `@lumal/icons-vue` 只依赖 `@lumal/icons`，并把 Vue 与 Iconify Vue 保持为 peer dependency。
- `@lumal/core` 不依赖 `@lumal/vben-compat`。
- Element Plus 保持为 `@lumal/core` 的 peer dependency，Lumal 不从零重写基础 UI 控件。
- `@lumal/core` 不默认依赖 VXE。
- `@lumal/core` 不默认引入多语言运行时。
- `@lumal/charts` 将 ECharts 和 vue-echarts 保持为 peer dependency。
- `@lumal/cockpit` 依赖 `@lumal/core`，`@lumal/core` 不反向依赖 `@lumal/cockpit`；`@lumal/cockpit` 不依赖 `@lumal/charts` 或任何地图/图表运行时。
- `@lumal/vite` 不引入强制运行时依赖。

## 验证命令

推荐直接运行串行发布检查，避免多个构建命令同时清理和重写 `dist`：

```bash
pnpm release:check
```

其中 `release:boundaries` 会作为发布检查的一部分自动执行；如果只想快速检查包边界，可以单独运行：

```bash
pnpm release:boundaries
```

首次发布前还需要检查目标包名是否已被 npm registry 占用：

```bash
pnpm release:names
```

这个命令验证 `@lumal/icons`、`@lumal/icons-vue`、`@lumal/core`、`@lumal/charts`、`@lumal/datav`、`@lumal/cockpit`、`@lumal/vben-compat`、`@lumal/vite`、`create-lumal-admin` 是否能在 registry 查询到；它不能证明发布账号拥有或可创建 `@lumal` scope。

拆开执行时也必须保持串行：

```bash
pnpm lint
pnpm release:boundaries
pnpm test
pnpm typecheck
pnpm build
pnpm test:create-consumer
pnpm docs:build
pnpm admin:build
pnpm compat:build
pnpm release:artifacts
pnpm test:e2e
pnpm pack:dry-run
```

只做代码验收时，单独执行上述非浏览器命令，跳过 `pnpm test:e2e`；不得据此声明完整 `release:check` 或实机验收通过。

## 发包 dry-run

```bash
pnpm pack:dry-run
```

等价于：

```bash
pnpm --filter @lumal/icons pack --dry-run
pnpm --filter @lumal/icons-vue pack --dry-run
pnpm --filter @lumal/core pack --dry-run
pnpm --filter @lumal/charts pack --dry-run
pnpm --filter @lumal/datav pack --dry-run
pnpm --filter @lumal/cockpit pack --dry-run
pnpm --filter @lumal/vben-compat pack --dry-run
pnpm --filter @lumal/vite pack --dry-run
pnpm --filter create-lumal-admin pack --dry-run
```

检查 tarball 内容：

- 包含 `dist`。
- 包含包内 `README.md`。
- 包含包内 `CHANGELOG.md`，并记录当前版本。
- `@lumal/core` 包含 `theme-chalk/index.scss` 和 `dist/core.css`。
- `@lumal/core` 包含 `minimal.js` / `minimal.cjs` 及类型入口；`test:create-consumer` 在不安装 Element Plus 的临时项目中验证 minimal/request。
- `@lumal/icons-vue` 包含 `dist/icons-vue.css`。
- `@lumal/cockpit` 包含 `dist/cockpit.css` 及 `dist/runtime.js`、`dist/designer.js` 独立入口。
- `create-lumal-admin` 包含 `dist/cli.js` 和 `dist/index.js`，两模式生成的 Core/图标依赖精确等于脚手架版本，不能残留 `^0.0.0` 占位符。
- 不包含 `apps/*`。
- 不包含本地日志、IDE 文件和构建缓存。

## 浏览器与产物检查

- Chromium E2E 覆盖登录与动态菜单、403/404/退出、标签和设置持久化、用户查询/新增、会话凭据失效。
- 移动端流程验证 375px 下不存在页面级横向溢出。
- `release:artifacts` 检查必要构建产物、`vendor-echarts`、`vendor-element-plus`、`vendor-lumal` 分包和 500 KB 单块上限。
- `release:budgets` 检查 Vue 基线、轻入口、request、DataV charts 和应用首屏静态闭包；构建四个示例后使用 `pnpm release:budgets --require-all` 防止漏验。
- 每轮实际结果以对应审计/验收记录为准，不把历史 E2E 或块大小当作当前工作区的验收证明。本轮无浏览器验收的范围见 `architecture-audit-2026-10-16.md`。

## 文档检查

- README 与当前实现一致。
- `docs/changelog.md`、九包 CHANGELOG、文档导航版本、安装命令与公共包版本一致。
- `docs/development-roadmap.md` 是唯一开发规划和阶段状态来源。
- `docs/architecture.md` 说明包边界。
- `docs/icons.md` 说明图标注册、渲染和选择器。
- `docs/core-api.md` 说明 core 公开入口。
- `docs/migration-from-vben.md` 说明兼容映射、迁移边界和不支持项。
- `apps/lumal-docs/src/reference` 仅 include 对应 `docs/*.md`，`release:boundaries` 阻止正文副本重新出现。

## npm scope

当前按 `@lumal` 规划。`pnpm release:names` 用于检查目标包名是否能在 registry 查询到。

此前版本准备阶段已用 npm 用户 `cuteyuchen` 确认 scope 权限，复核命令如下：

```bash
npm whoami --registry=https://registry.npmjs.org
npm org ls lumal --registry=https://registry.npmjs.org
npm access list packages @lumal --registry=https://registry.npmjs.org
```

当时确认账号为 `lumal` 组织 owner，并可列出 scope 下已有包。本机登录状态可能过期；CI 使用仓库 `NPM_TOKEN`，每次发布仍需以工作流和 registry 结果确认实际权限。

## License

当前使用 MIT License。发布边界检查会确认根目录 `LICENSE` 存在，并确认各发布包 `package.json` 的 `license` 字段为 `MIT`。
