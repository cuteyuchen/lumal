# Changeset 发布

## 记录变更

```bash
pnpm changeset
pnpm changeset:status
```

十个公共包属于同一个 fixed 组，始终同版；私有应用只同步内部依赖，不发包。

## 准备 Beta

本轮沿用 `0.0.x-beta` 版本序列，候选为 `0.0.6-beta`：

```bash
pnpm release:version 0.0.6-beta
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
```

版本命令只修改 package.json，不会自动更新锁文件、日志、文档或发布。将待处理 Changeset 汇总进十包 CHANGELOG，确认完整后移除已消费记录；同步文档版本、安装命令、Skill API 基线和脚手架说明。脚手架在生成时读取随 tarball 分发的 package.json，精确同步依赖版本。

手工汇总后用一份无包 bump 的空记录注明已进入本版日志（本轮为 `prepared-0-0-6-beta.md`）。它只避免未提交的版本工作区被 status 判为缺少记录，不会生成下一次发布计划。

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

npm 发布统一由 `release-gate.yml` 编排：维护者授权后推送 `v0.0.6-beta` tag，或手动选择匹配版本的 tag 并关闭 `dry_run`；全部门禁成功后才发包。部署还须独立授权并启用开关，发包授权不等于部署授权。分支手动运行默认 `dry_run=true`，不会发包。`release-npm.yml` 仅保留复用入口；本地版本准备不会触发真实发布。

清单见 [发布检查清单](/reference/release-checklist)，版本变化见 [更新日志](/reference/changelog)。
