# Changesets

Changesets 记录九个公共包的发布意图，公共包按 fixed 组统一版本；私有应用不提升自身版本、不发布，只同步内部依赖。

- `pnpm changeset`：为用户可感知的包变更添加记录。
- `pnpm changeset:status`：查看待处理记录与预计版本。
- `pnpm changeset:version`：按 Changesets 的标准语义生成版本和日志。标准 minor bump 不等于仓库的 `0.0.x-beta` 版本序列，不要与下述手工 beta 流程重复执行。

## Beta 版本准备

本轮沿用 `0.0.x-beta` 序列，目标为 `0.0.3-beta`：

```bash
pnpm release:version 0.0.3-beta
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

`release:version` 只更新公共包版本与工作区内部依赖，不会自动更新锁文件、文档、CHANGELOG 或执行发布。维护者需逐包汇总 pending changeset 到本版日志，确认内容完整后移除已消费的记录，再同步文档导航、安装命令和脚手架说明。不要把已汇总记录留给下一轮再次 bump。

手工汇总后保留一份无包 bump 的空记录（本轮为 `prepared-0-0-3-beta.md`），注明变更已进入本版日志，避免未提交的版本工作区被 `changeset:status` 判为缺少记录。它不产生额外发布计划。

构建脚手架时会把 package.json 版本注入生成项目的三个 Lumal 依赖；源码占位符应保持不变。验收步骤见 `docs/release-checklist.md`。

推送 `v*` tag 或手动触发 `release-npm.yml` 才会执行 npm 发布。Beta 使用 `beta` dist-tag；本地版本准备不会提交、推送、打 tag 或发布包。
