# 0.0.4-beta 版本准备与分支合并记录

日期：2026-10-20。范围：保存现有改动、合并全部现有分支、准备九包 `0.0.4-beta` 并推送代码；不创建 tag、不发布 npm、不执行生产部署。

## 分支整合

先保存原有工作区，再正常合并到 `master`，没有重置历史、强推或删除分支。远端地址保留用户配置，GitHub 将 `cuteyuchen/luma` 重定向到 `cuteyuchen/lumal`。

| 分支 | 整合方式 / 证据 |
| --- | --- |
| `codex/release-hardening` / `origin/codex/release-hardening` | 快进合入 `dea957b`，包含原有修复与本轮保存的改动 |
| `codex/luma-standard-route-fields` | `463bbb2` 已在主线历史内 |
| `origin/ci/build-scan-20260724` | 合并提交 `4cca07d` |
| `origin/ci/build-wrapper-scan-20260724` | 合并提交 `7b7f16d` |
| `origin/fix/create-lumal-admin-consumer` | 合并提交 `803969f` |
| `origin/fix/release-consumer-hardening-20260730` | 合并提交 `8404716` |

历史修复分支的部分内容已通过 squash 进入主线。冲突逐项核对后保留现有实现与测试，不恢复过时的独立发布触发器、重复文档正文或已消费的 Changeset。

执行 `git fetch origin --prune` 后，以下命令没有输出，证明当时所有本地分支及远端跟踪分支的提交均为 `master` 的祖先：

```bash
git for-each-ref --no-merged=master --format='%(refname:short) %(objectname:short)' refs/heads refs/remotes/origin
```

## 版本与新增修复

- 九个公共包统一为 `0.0.4-beta`，内部依赖和 lockfile 同步；六个私有应用保留 `0.0.0`。没有升级外部依赖。
- 九包 CHANGELOG、主更新日志、安装说明、文档导航及仓库 Lumal Skill 同步版本；历史版本和历史验收报告保留。
- 脚手架源码保留版本占位符，构建时注入精确版本；真实 tarball 生成项目已断言三个 Lumal 依赖为 `0.0.4-beta`。
- 修正 Changeset 指南中的旧独立发包说明，发布入口仍只有 `release-gate.yml`。
- 边界校验曾误扫根目录 `output/repair` 的诊断快照。先以 CLI fixture 复现 1 项失败、3 项通过，再仅排除根目录诊断输出；源码下同名目录仍接受检查。新增 4 项回归全部通过，修复提交为 `935c528`。

## 本机验证

环境：Windows、Node `v24.14.1`、pnpm `10.33.0`。下面均为本轮实际执行，不引用历史测试数量。构建任务按依赖顺序串行执行；已完成根构建后直接调用应用已声明的 build 脚本，避免重复清理依赖包 dist。

日志保存在本机 ignored 目录 `output/repair/`，下表日志名均以 `prepare-0.0.4-` 开头，不随代码提交。

| 命令 | 状态 / 摘要 | 日志后缀 |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS，升级后锁文件一致 | `install.log` |
| `pnpm lint` | PASS | `lint-final.log` |
| `pnpm test` | PASS，13 组、110 个文件、804 项 | `tests-final.log` |
| `pnpm typecheck` | PASS | `typecheck.log` |
| `pnpm build` | PASS，九包及 Mock 构建，脚手架注入新版本 | `build.log` |
| `pnpm test:create-consumer` | PASS，minimal/request、local、HTTP 三种独立 tarball 消费 | `consumer.log` |
| `pnpm --filter lumal-admin build` | PASS | `admin.log` |
| `pnpm --filter lumal-vben-compat-demo build` | PASS | `compat.log` |
| `pnpm docs:build` | PASS | `docs.log` |
| `pnpm --filter lumal-cockpit build:app` | PASS | `cockpit.log` |
| `pnpm --filter lumal-datav-guide build:app` | PASS | `datav-guide.log` |
| `pnpm release:boundaries` | PASS，保留源码检查 | `boundaries-final.log` |
| `pnpm release:artifacts` | PASS，ESM/CJS、样式、图标 SSR/DOM 消费及预算 | `artifacts.log` |
| `pnpm release:budgets --require-all` | PASS，四应用产物齐全，无门槛调整 | `budgets.log` |
| `pnpm release:verify --check-registry` | PASS，九包版本及内部依赖一致，registry 未发现本版；未验证 tag | `version-final.log` |
| `pnpm changeset:status` | PASS，没有额外 bump 计划 | `changesets.log` |
| `pnpm release:workflows` | PASS，唯一入口、needs、dry-run、Secrets 隔离及生产 E2E 静态约束 | `workflows-final.log` |
| `actionlint 1.7.12 -color` | PASS，全部工作流；下载校验和已核对 | 终端退出码 0，成功时无输出 |
| `pnpm pack:dry-run` | PASS，九包，无 npm 发布 | `pack.log` |
| `git diff --check` | PASS | 无空白错误 |

独立 minimal/request 消费项目未安装 Element Plus，类型检查和构建通过。生产产物预算如下，单位为 gzip bytes：

| 消费者 | 实测 | 现有门槛 |
| --- | --- | --- |
| minimal 相对 Vue 增量 | 2787 | 10000 |
| request | 2455 | 5000 |
| DataV charts 首屏 | 26398 | 55000 |
| Admin JS / CSS | 311866 / 42489 | 335000 / 50000 |
| Cockpit JS / CSS | 703417 / 71191 | 800000 / 80000 |
| DataV 指南 JS / CSS | 416661 / 46183 | 850000 / 55000 |
| 兼容示例 JS / CSS | 271496 / 40378 | 300000 / 45000 |

消费者安装保留了 Node shell 弃用提示、纯服务消费者的非必需 UI peer 提示及 Windows Sass bin 链接警告，随后三个消费场景均成功构建。Cockpit / DataV 指南仍有 Vite 大块提示；未修改警告门槛，现有首屏预算实际通过。

## 未验证与发布边界

- **E2E 未验证**：本轮按代码验收范围未运行 `pnpm test:e2e` 或 `pnpm test:e2e:release`，不能以单测和构建替代浏览器验收。
- **`pnpm release:check` 未运行**：该命令包含生产 E2E。表内分别执行的非浏览器检查不等于完整发布门禁通过。
- **GitHub Actions 远端验收未在本机证明**：本机 Node 24 不替代工作流的 Ubuntu / Windows Node 22 验证；推送后的运行状态以实际 Actions run 为准。
- **npm / 生产部署未执行**：本轮不创建 `v0.0.4-beta`、不运行 publish、不调用 Vercel 部署，也不变更 Secrets。registry 未发现版本只是检查时的状态，正式发布前必须再次核对。
- 后续可在 GitHub Actions 手动运行 `Release Gate`，选择 `master` 并保留默认 `dry_run=true`，无发包/部署副作用地验证完整生产 E2E 和服务端依赖链。
- 真实发布须另行授权，先核对 [发布清单](./release-checklist.md) 的 GitHub 环境、npm 和 Vercel 配置，再对版本一致的 tag 执行完整门禁。文档迁移与旧站下线证据仍见 [历史修复报告](./repair-report-2026-10-19.md)。
