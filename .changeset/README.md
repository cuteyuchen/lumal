# Changesets

Changesets 记录十个公共包的发布意图，公共包按 fixed 组统一版本；私有应用不提升自身版本、不发布，只同步内部依赖。

- `pnpm changeset`：为用户可感知的包变更添加记录。
- `pnpm changeset:status`：查看待处理记录与预计版本。
- `pnpm changeset:version`：按 Changesets 的标准语义生成版本和日志。标准 bump 不等于候选预发布版本，不要与下述手工 beta 流程重复执行。

## Beta 版本准备

本轮破坏性重构准备 `0.1.0-beta.0` 候选，尚未发布，见
[工作记录](../docs/pure-vw-refactor-2026-10-28.md)。历史发布证据不改写，
每轮先核对 registry 并由维护者选择尚未发布的合法预发布版本 `NEXT_VERSION`：

```bash
pnpm release:version NEXT_VERSION
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

`release:version` 只更新公共包版本与工作区内部依赖，不会自动更新锁文件、文档、CHANGELOG 或执行发布。维护者需逐包汇总 pending changeset 到本版日志，确认内容完整后移除已消费的记录，再同步文档导航、安装命令和脚手架说明。不要把已汇总记录留给下一轮再次 bump。

手工汇总后保留一份无包 bump 的空记录（本轮为 `prepared-0-1-0-beta-0.md`），注明变更已进入本版日志，避免未提交的版本工作区被 `changeset:status` 判为缺少记录。它不产生额外发布计划。

脚手架读取随 tarball 发布的 package.json，将自身版本注入生成项目所选的 Lumal 依赖；模板版本占位符应保持不变。验收步骤见 `docs/release-checklist.md`。

唯一发布入口是 `release-gate.yml`：推送匹配工作区版本的 `v*` tag，或手动选择该 tag 并关闭 `dry_run`；完整门禁成功后才调用 npm 发布。生产部署额外要求仓库 Actions Variable `DEPLOY_PRODUCTION=true`，默认不部署。分支手动运行保持默认 `dry_run=true`，不会发包。`release-npm.yml` 仅能由门禁复用。Beta 使用 `beta` dist-tag；本地版本准备不会提交、推送、打 tag 或发布包。
