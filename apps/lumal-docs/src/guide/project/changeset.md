# Changeset 发布

## 记录变更

```bash
pnpm changeset
pnpm changeset:status
```

十个公共包属于同一个 fixed 组，始终同版；私有应用只同步内部依赖，不发包。

## 准备 Beta

本轮破坏性变更准备 `0.1.1-beta` 候选，尚未发布，见 [工作记录](/reference/pure-vw-refactor-2026-10-28)。
每次准备时，`NEXT_VERSION` 必须是已核对registry、尚未发布的统一合法预发布版本：

```bash
pnpm release:version NEXT_VERSION
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

版本命令只修改 package.json，不会自动更新锁文件、日志、文档或发布。将待处理 Changeset 汇总进十包 CHANGELOG，确认完整后移除已消费记录；同步文档版本、安装命令、Skill API 基线和脚手架说明。脚手架在生成时读取随 tarball 分发的 package.json，精确同步依赖版本。

手工汇总后用一份无包 bump 的空记录注明已进入本版日志（本轮为 `prepared-0-1-1-beta.md`）。
历史 `prepared-0-0-7-beta.md` 与 `prepared-0-0-6-beta.md` 保留原发布语境；
空记录只避免未提交的版本工作区被 status 判为缺少记录，不会生成下一次发布计划。

`pnpm changeset:version` 属于标准 Changesets 自动 bump 流程，minor 变更可能得到 `0.1.0`，不是本轮 beta 流程；不要在手工版本准备后对同一批记录重复执行。

## 验证与发布

```bash
pnpm build
pnpm test:create-consumer
pnpm docs:build
pnpm release:boundaries
pnpm changeset:status
pnpm release:verify --check-registry
pnpm pack:dry-run
pnpm release:check
```

构建、类型检查和包消费验收保持串行，避免同时清理 `dist`。版本准备可只做代码验收，但必须注明 E2E 未验证；真实发布仍必须通过包含完整生产 E2E 的 `release:check`，不能用历史审计结果代替。

npm 发布统一由 `release-gate.yml` 编排，历史 `v0.0.7-beta` 已完成发布，不能重跑同版本发布链。
当前候选仅授权提交、推送及 PR 校验，未授权合并、创建 tag、发布或生产部署。
后续发布须经维护者授权并通过全部门禁；部署须独立授权。分支手动运行默认 `dry_run=true`，不会发包。
`release-npm.yml` 仅保留复用入口；本地版本准备不会触发真实发布。

清单见 [发布检查清单](/reference/release-checklist)，版本变化见 [更新日志](/reference/changelog)。
