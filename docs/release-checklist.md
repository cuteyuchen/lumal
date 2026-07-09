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
- `@luma/core` 不默认依赖 VXE。
- `@luma/core` 不默认引入多语言运行时。

## 验证命令

推荐直接运行串行发布检查，避免多个构建命令同时清理和重写 `dist`：

```bash
corepack pnpm release:check
```

拆开执行时也必须保持串行：

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
corepack pnpm admin:build
corepack pnpm compat:build
```

## 发包 dry-run

```bash
corepack pnpm pack:dry-run
```

等价于：

```bash
corepack pnpm --filter @luma/icons pack --dry-run
corepack pnpm --filter @luma/core pack --dry-run
corepack pnpm --filter @luma/vben-compat pack --dry-run
```

检查 tarball 内容：

- 包含 `dist`。
- 包含包内 `README.md`。
- `@luma/core` 包含 `theme-chalk/index.scss`。
- 不包含 `apps/*`。
- 不包含本地日志、IDE 文件和构建缓存。

## 文档检查

- README 与当前实现一致。
- `docs/architecture.md` 说明包边界。
- `docs/icons.md` 说明图标注册、渲染和选择器。
- `docs/core-api.md` 说明 core 公开入口。
- `docs/vben-compat-api.md` 说明兼容范围和不支持项。
- `docs/migration-from-vben.md` 说明迁移边界。

## npm scope

当前按 `@luma` 规划。`npm view @luma/core` 返回 404 只能说明包名当前未在 registry 查询到，不能证明当前 npm 账号拥有或可创建 `@luma` scope。正式发布前需要用发布账号确认 scope 权限；如果不可用，再确定备用 scope。

## License

正式发布前需要确认开源许可证，并把许可证写入根 `LICENSE` 和各包 `package.json`。这个决定属于项目所有者，当前不在代码里预设。
