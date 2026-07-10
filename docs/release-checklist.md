# 发布检查清单

发布前需要确认包内容、依赖方向、文档和示例应用都处于可发布状态。

## 命名检查

```bash
rg -n "guiren|gr-framework|GrFramework|GSchemaForm|GSchemaTable|GCrudTable|GPage|GPagination" README.md docs packages apps --glob "!docs/release-checklist.md"
```

当前首版不保留 `G*` 组件别名，公开 API 使用 `Luma*` 命名。如果后续为了迁移保留别名，需要明确写成兼容 API，不能作为推荐 API。

## 依赖方向

- `@luma/icons` 不依赖 `@luma/core`。
- `@luma/core` 不依赖 `@luma/vben-compat`。
- Element Plus 保持为 `@luma/core` 的 peer dependency，Luma 不从零重写基础 UI 控件。
- `@luma/core` 不默认依赖 VXE。
- `@luma/core` 不默认引入多语言运行时。

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

这个命令只验证 `@luma/icons`、`@luma/core`、`@luma/vben-compat`、`create-luma-admin` 当前是否能在 registry 查询到；它不能证明发布账号拥有或可创建 `@luma` scope。

拆开执行时也必须保持串行：

```bash
pnpm lint
pnpm release:boundaries
pnpm test
pnpm typecheck
pnpm build
pnpm admin:build
pnpm compat:build
```

## 发包 dry-run

```bash
pnpm pack:dry-run
```

等价于：

```bash
pnpm --filter @luma/icons pack --dry-run
pnpm --filter @luma/core pack --dry-run
pnpm --filter @luma/charts pack --dry-run
pnpm --filter @luma/vben-compat pack --dry-run
pnpm --filter create-luma-admin pack --dry-run
```

检查 tarball 内容：

- 包含 `dist`。
- 包含包内 `README.md`。
- `@luma/core` 包含 `theme-chalk/index.scss` 和 `dist/core.css`。
- `create-luma-admin` 包含 `dist/cli.js` 和 `dist/index.js`。
- 不包含 `apps/*`。
- 不包含本地日志、IDE 文件和构建缓存。

## 文档检查

- README 与当前实现一致。
- `docs/development-roadmap.md` 是唯一开发规划和阶段状态来源。
- `docs/architecture.md` 说明包边界。
- `docs/icons.md` 说明图标注册、渲染和选择器。
- `docs/core-api.md` 说明 core 公开入口。
- `docs/migration-from-vben.md` 说明兼容映射、迁移边界和不支持项。

## npm scope

当前按 `@luma` 规划。`pnpm release:names` 用于检查目标包名是否能在 registry 查询到。

scope 权限已用当前 npm 用户 `cuteyuchen` 确认：

```bash
npm whoami --registry=https://registry.npmjs.org
npm org ls luma --registry=https://registry.npmjs.org
npm access list packages @luma --registry=https://registry.npmjs.org
```

确认结果：当前账号是 `luma` 组织 owner，并且可以列出 `@luma` scope 下已有包。

## License

当前使用 MIT License。发布边界检查会确认根目录 `LICENSE` 存在，并确认各发布包 `package.json` 的 `license` 字段为 `MIT`。
