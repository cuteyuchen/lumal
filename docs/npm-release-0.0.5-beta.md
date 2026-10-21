# 0.0.5-beta npm 发布执行记录

日期：2026-10-21（Asia/Shanghai）。维护者明确授权提交、推送并发布新版本；不包含生产站点部署。

## 当前状态

**正式 Release Gate 成功，九个发布命令全部完成；registry 核验暂为 8/9。**
截至 2026-10-21 10:31（北京时间），仅 `@lumal/cockpit@0.0.5-beta` 仍不可见，
其 `beta` 仍为 `0.0.4-beta`。其余八包的版本、`beta`、实际 tarball 和公开入口均通过核验，
三种真实 npm 脚手架消费者全部通过；不能据此声明九包发布验收完成。
九包 `latest` 均保持 `0.0.1-beta`，生产部署作业已跳过。

- 目标版本：九个公共包统一 `0.0.5-beta`，使用 npm `beta` 标签，保留 `latest`。
- 源提交：`53395dc8753361d9e79e2da496d67da2e39ac35e`。
- 正式标签：`v0.0.5-beta`，注释标签已普通推送，没有移动历史标签。
- `master` 与 `codex/lumal-admin-upgrade` 已推送上述源提交，没有强制推送。
- 演练：[Release Gate 39528515204](https://github.com/cuteyuchen/lumal/actions/runs/39528515204)。
- 正式运行：[Release Gate 39530242191](https://github.com/cuteyuchen/lumal/actions/runs/39530242191)。

## 代码、文档与 Skill

| 提交 | 内容 |
| --- | --- |
| `14c7d2a` | 三预设文件模板、真实 HTTP 认证与会话、显式 Vben 5 兼容入口及完整消费者验收 |
| `f8d1e25` | Skill、三预设使用契约、Vben 5 迁移及文档同步 |
| `53395dc` | 发布前文档、正式域名与站点配置，保留并提交工作区已有修改 |

九包 manifests、内部精确依赖、lockfile、各包 CHANGELOG 和空 Changeset 已在版本准备阶段同步；
此次没有再次提升版本。功能矩阵、参考 Vben 版本与 SHA、兼容限制及性能样本分别见
[升级审计](./upgrade-audit.md)、[迁移说明](./migration-from-vben.md)和
[升级验收](./upgrade-verification.md)。

## 发布前核对

2026-10-21 09:43（北京时间）公开 registry 快照确认：九包 `0.0.5-beta` 均不存在，
`beta=0.0.4-beta`、`latest=0.0.1-beta`。正式标签推送前再次执行
`pnpm release:verify --require-tag --check-registry`，版本、内部依赖、lockfile、
标签与 HEAD 一致，九包仍全部未发布。

只读确认仓库 Actions Variable `DEPLOY_PRODUCTION` 未设置，未读取或打印 Secret 值。
唯一发布入口、四个成功依赖、发布前 registry 拒绝重发检查、同 run 产物复用均保持不变。
GitHub 的 `NPM_TOKEN` 只由发布作业使用，本机没有绕过门禁执行 `npm publish`。

## 无副作用演练

运行 `39528515204` 对应上述同一源提交，手动输入 `dry_run=true`，结论 **success**。

| 作业 | 结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS，九包/lockfile/工作流约束及 actionlint |
| Windows checks | PASS，完整 lint / test / typecheck / build |
| Ubuntu release check | PASS，完整 `pnpm release:check` |
| Static site builds | PASS，文档、五站点产物及全部消费者预算 |
| Gated npm publication | SKIPPED，符合演练 |
| Gated production deployment | SKIPPED，符合演练与授权范围 |

本轮远端日志实际结果：

- 工作区单测：13 组、115 个文件、908 项通过，Windows 与 Ubuntu 均通过。
- 独立 tarball 消费者：三预设 × Local/HTTP × Hash/History 共 12 个主组合；
  另有 4 个可选模块组合，共 82 项生成项目测试，安装、类型、Lint、构建均通过。
- 消费者同时验证真实 npm tarball CLI、8 项非 TTY 参数场景、无 UI peer 轻入口、
  真实 HTTP 服务和 12 个生产 Chromium 流程。
- Admin 生产 Chromium E2E：28 项通过，1.7 分钟；使用 Admin `dist` 与 Mock Node 产物。
- 九包 pack、公开入口、单块及消费者预算通过，没有提高预算或跳过检查。

环境：GitHub 托管 Ubuntu 24.04.5 与 Windows Server 2025，
Node.js 22.23.3、pnpm 10.33.0。Actions 自身 Node 20 弃用及 Ubuntu runner
迁移提示属于平台警告；没有将本次验收描述为零警告。

## 正式发布

正式运行固定在源提交与版本标签上，重新执行四项门禁，结论 **success**。

| 作业 | 正式结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS，正式标签与九包版本一致 |
| Windows checks | PASS，115 个文件、908 项测试，类型与全包构建通过 |
| Ubuntu release check | PASS，908 项工作区单测、82 项生成项目测试、28 项生产 Chromium E2E（1.6 分钟） |
| Static site builds | PASS，五站点产物及全部消费者预算 |
| Gated npm publication / Publish validated packages | PASS，58 秒，九个 `publish --tag beta` 全部完成 |
| Gated production deployment | SKIPPED，`DEPLOY_PRODUCTION` 未启用 |

发布作业于北京时间 10:14:05 结束。逐包日志均包含 `+ <package>@0.0.5-beta`，
同时提示版本仍在处理、可能需要数分钟才能公开。没有重新发布任何包或移动标签。
发布后的只读等待经历 1/9、7/9、8/9；十分钟上限到达时明确失败，
后续逐包核验仍以退出码 1 保留 8/9 状态，没有放宽通过标准。

### Registry 与实际 tarball

以下为 10:31 的公开 registry 快照；八包实际下载的 SHA-512 / SHA-1
分别与 `dist.integrity` / `dist.shasum` 一致，SHA-1 另与发布 job 日志逐包一致，
入口文件与公开 manifest 配置一致。

| 包 | 版本 / beta | 发布时间（北京时间） | tarball 字节数 | 校验 |
| --- | --- | --- | ---: | --- |
| `@lumal/icons` | `0.0.5-beta` | 10:14:17.044 | 19,210 | PASS |
| `@lumal/icons-vue` | `0.0.5-beta` | 10:14:39.304 | 16,827 | PASS |
| `@lumal/core` | `0.0.5-beta` | 10:14:45.332 | 176,023 | PASS |
| `@lumal/charts` | `0.0.5-beta` | 10:14:43.973 | 12,076 | PASS |
| `@lumal/datav` | `0.0.5-beta` | 10:17:58.624 | 92,335 | PASS |
| `@lumal/cockpit` | 目标不可见，beta 仍为 `0.0.4-beta` | 未确认 | 未下载 | 未通过 |
| `@lumal/vben-compat` | `0.0.5-beta` | 10:14:52.692 | 33,067 | PASS |
| `@lumal/vite` | `0.0.5-beta` | 10:14:36.152 | 5,702 | PASS |
| `create-lumal-admin` | `0.0.5-beta` | 10:14:58.135 | 43,546 | PASS |

已核验包没有 `workspace:` 消费依赖，内部依赖精确为 `0.0.5-beta`；
CLI 的 HTTP、system 和 V5 迁移模板资源随 tarball 存在。
registry 未提供这八包的 `gitHead`，不伪造其校验结果；
源提交关联由 Actions SHA、同 run 已验证产物与发布日志和实际 tarball 校验和共同佐证。

### 真实 npm CLI 消费者

在仓库外全新目录通过 `pnpm create lumal-admin@0.0.5-beta` 创建，
没有源码 alias、本地 tarball、workspace 链接或 pnpm overrides。
每个项目独立运行 `pnpm install --frozen-lockfile=false`、`pnpm lint`、
`pnpm typecheck`、`pnpm test` 和 `pnpm build`，全部成功。

| 项目 | 模式 | 测试 | 构建 |
| --- | --- | --- | --- |
| minimal | Local / Hash | 2 个文件、4 项通过 | PASS |
| standard | HTTP / History | 2 个文件、7 项通过 | PASS |
| vben-compatible | Local / History | 2 个文件、4 项通过 | PASS |

环境为 Windows、Node.js 24.14.1、pnpm 10.33.0，项目位于
`C:/Users/yuchen/AppData/Local/Temp/lumal-npm-0.0.5-YERCmK`。
安装的 Lumal 直接依赖均再次核对为精确 `0.0.5-beta`；
这些模板不依赖 Cockpit，因此上述检查不代表最后一包已可安装。
此次没有重复启动本机浏览器，生产 Chromium 行为由正式门禁的真实产物验证；
不把三项目 15 项测试加进 908 项工作区测试。

### 未完成边界

`@lumal/cockpit` 的公开版本接口仍返回 404，原因尚不能由公开数据确定。
npm 官方 API 提供需身份认证的版本状态查询，区分 processing / published / failed 等状态；
公开 404 不能证明仅需继续等待，也不能证明发布已被拒绝。
按 [官方 API 文档](https://api-docs.npmjs.com/) 对
`GET /-/package/@lumal%2fcockpit/version/0.0.5-beta/status` 发起不带凭据的只读查询，
实际返回 HTTP 401，未能取得内部处理状态。
本轮没有读取 GitHub Secret 值、改变 2FA、撤包、重发或擅自采用新统一版本。
后续应由维护者核对 npm 版本生命周期，或在其变为公开后执行严格九包只读核验。
遵守 [中断恢复](./release-checklist.md#中断与恢复)，禁止重跑全量发布链。

## 文档与 Skill 补验

正式发布源提交之后仅补充发布结果文档，不改包源码、版本或既有标签。
README、更新日志、路线图、发布清单、Changesets 指引和文档导航均标出 8/9 边界。
历史升级验收保留原始阶段事实，新增链接指向本记录。

| 检查 | 实际结果 |
| --- | --- |
| `pnpm lint` | PASS |
| `pnpm test:scripts` | PASS，8 个文件、86 项 |
| `pnpm docs:build` | PASS，客户端、服务端及页面渲染 |
| `pnpm release:boundaries` | PASS |
| `pnpm release:workflows` | PASS |
| `pnpm changeset:status` | PASS，无待再次提升的版本 |
| Skill Creator `quick_validate.py` | PASS，仓库与安装副本均通过 |
| Skill 分发 SHA-256 比较 | PASS，14 个文件一致；只同步知识文件，未修改宿主元数据或删除额外文件 |
| 严格九包 registry 核验 | FAIL，8/9；保留失败退出码，不声称全部通过 |

本轮新增的本机消费者测试只使用 npm 上的真实包；没有为了文档同步再启动浏览器，
也没有把同一源提交的演练结果当成正式作业的重复执行证明。
本轮没有执行生产部署或验证线上站点同步新版。

## 本机证据

日志和校验脚本位于 ignored 的 `output/release/`，不随 npm 分发：

- `registry-before-0.0.5-beta.json`：发布前九包及 dist-tag 快照。
- `tag-preflight-0.0.5-beta.log`：版本、lockfile、正式标签和 registry 预检。
- `gate-dry-run-0.0.5-beta.json`：演练源提交、完整作业和结论。
- `gate-dry-run-windows-0.0.5-beta.log`：115 个测试文件、908 项测试及类型/构建日志。
- `gate-dry-run-ubuntu-0.0.5-beta.log`：完整发布检查、82 项消费者测试及 28 项生产 E2E。
- `gate-dry-run-site-builds-0.0.5-beta.log`：站点构建和全部消费者预算。
- `release-run-0.0.5-beta.json`：正式成功作业、源提交及部署跳过。
- `release-{version,windows,ubuntu,site-builds,publish}-0.0.5-beta.log`：正式门禁和九包发布日志。
- `release-tests-0.0.5-beta.json`：正式 908 / 82 / 28 的独立汇总口径。
- `registry-verified-0.0.5-beta.json`：八包完整核验和 Cockpit pending；`complete=false`，不是通过报告。
- `registry-final-0.0.5-beta.json`：10:31 再次严格复核仍为 8/9，退出码 1。
- `publisher-checksums-0.0.5-beta.json`：九个发布日志校验和，八个可下载包逐一匹配。
- `cockpit-version-status-0.0.5-beta.json`：官方版本状态接口无凭据查询返回 401。
- `registry-consumers-0.0.5-beta.json` 及 `registry-*-{create,install,lint,typecheck,test,build}.log`：
  三种真实 registry 消费者逐命令结果。
- `postrelease-{lint,scripts,docs,boundaries,workflows,changesets}-0.0.5-beta.log`：
  发布后文档与分发补验。
- `skill-distribution-0.0.5-beta.json`：仓库与本机安装副本的逐文件哈希比较。

后续发布记录只补充实际发生的结果；历史升级阶段的本地验收数量与未发布状态保留，
不会将历史报告改写成当时已经发布或已经运行远端 Actions。
