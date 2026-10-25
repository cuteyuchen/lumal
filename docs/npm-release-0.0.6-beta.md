# 0.0.6-beta 发布执行记录

准备日期：2026-10-25。分支：`codex/lumal-project-types-and-quality`。
准备起点：`8c1d7ea55cec1eed6b7fb852badd007e57fcf30a`。

## 当前状态

**候选验收中，尚未发布。** 不把此前 `0.0.5-beta` 或源码验收记录当成本版发布成功。
本页随真实执行结果更新；任何门禁失败、凭据错误或部分发布均停止后续发布动作。

- 已只读核实九个已发布包的 `beta` 均为 `0.0.5-beta`，新增 `@lumal/viewport` 返回 404。
- 十包均不存在 `0.0.6-beta`；选择该统一候选，保留历史版本与 `latest`。
- 已同步公共包和应用内部依赖、lockfile、十包 CHANGELOG、当前文档和仓库 Skill。
- 十包构建、冻结安装、registry 预检、85 项文档/Skill/发布安全契约、Skill validator 和文档生产构建通过。
- 准备提交 `6d4f416dafe5c6660cb544f97a6d475ddfccee67` 已普通推送；
  [Draft PR #7](https://github.com/cuteyuchen/lumal/pull/7) 保留审核入口，没有合并或强推。
- 分支 [Release Gate 40168944711](https://github.com/cuteyuchen/lumal/actions/runs/40168944711)
  使用 `dry_run=true`，对应上述提交。四项校验全部通过，发布与部署均跳过。
- Git 单次命令使用系统现有代理与已登录的 GitHub 凭据，不修改全局配置或关闭 TLS 校验。
- `DEPLOY_PRODUCTION` 变量不存在，本次只授权 npm 发布，不开启生产部署。

## 门禁

| 项目                                  | 实际状态               |
| ------------------------------------- | ---------------------- |
| 本版版本、内部依赖与 frozen lockfile  | 已通过，十包均尚未发布 |
| 本版完整本地发布检查                  | 已通过，`corepack pnpm release:check` 退出 0 |
| 本版文档生产构建与 Skill 契约         | 已通过，85 项契约及文档生产构建 |
| 候选 Ubuntu / Linux PTY               | 已通过，同一候选 SHA 的完整 `release:check` |
| 候选 Windows / 三轮 DataV 视觉        | 已通过；主链 1,051 tests、PTY 12 项、视觉 21 项 |
| 同 run 静态站点与全部预算             | 已通过，五站点产物及 `--require-all` |
| 匹配 tag 的正式 npm 发布              | 未执行                 |
| 十包 registry / beta / tarball 完整性 | 未执行                 |
| 生产部署                              | 未授权，不执行         |

完整本地门禁的主链为 123 files / 1,051 tests；Admin 12 个主组合、4 个可选组合、
12 组生产浏览器，Blank/Screen 14 组消费者与 14 组浏览器、视口检查、
31 项生产 E2E 及十包 pack dry-run 均通过。
本机原始命令日志为 `output/release/version006-release-check.log`，属于忽略的验收证据，不进入 npm。

远端演练直接 checkout `6d4f416dafe5c6660cb544f97a6d475ddfccee67`，
不能与 PR 的 merge SHA `4445b369` 混称。Ubuntu 24.04.5 / Node 22.23.3 /
pnpm 10.33.0 的完整门禁耗时 27m16s；Linux 源码 PTY 12 项、tarball CLI PTY 12 项均通过。
Windows Server 2025 / Node 22.23.4 / pnpm 10.33.0 的主链和 PTY 12 项、
三轮 DataV 视觉 21 项均通过。视口报告包含 40 组工作区、8 组局部缩放、
2 项生命周期检查，Dev/Build 的页面、运行时及控制台错误均为空。
同 run 的消费者 artifact 为 `12589608290`，包产物为 `12589373504`，
Windows 终端 artifact 为 `12590110495`；正式 tag 仍须重新通过同样四项门禁。

远端演练的 gzip 预算如下，均未提高既有上限；这些数字不是正式 registry 消费者的测量值：

| 消费入口 | JS gzip bytes / 上限 | CSS gzip bytes / 上限 |
| -------- | -------------------- | --------------------- |
| Admin | 312,408 / 335,000 | 42,600 / 50,000 |
| Cockpit | 703,780 / 800,000 | 71,192 / 80,000 |
| DataV Guide | 417,337 / 850,000 | 46,295 / 55,000 |
| Vben Compat | 285,639 / 300,000 | 40,635 / 45,000 |

## 消费者与预览边界

2026-10-25 的省级隔离复验已完成：正常安装、独立 frozen 复装、原 lint、类型检查和生产构建退出 0；
原测试仍为 38/41 files、474/480 tests，七个 FAIL 标题与旧基线逐字一致。
原业务门禁并非全绿，不能据此直接删除业务补丁或宣称完成真实后端、原 Dashboard 和生产验收。
具体候选身份、校验和及产物对照见[本版隔离复验](./real-consumer-compatibility.md#省级本版隔离复验)。

PR 的外部 Cockpit Vercel Preview 检查失败，deployment 为
`dpl_4jfQ7CRRWn568qUhVdyZpPoeiSgu`，`source=git`、`target=null`，
错误为 `STATIC_BUILD_NO_OUT_DIR`。日志显示公共包构建成功，
随后 `No projects matched the filters`，没有执行 Cockpit 应用构建，最终找不到 `dist`。
这指向外部预览包过滤或目录配置未匹配，不是已观察到的应用编译错误；具体配置值未获证，不作推断。
本版 Release Gate 的 `pnpm --filter lumal-cockpit build:app` 已通过，未复现应用源码构建失败。
本轮没有修改 Vercel 配置、触发人工部署或把 Preview 状态改为成功。

## 安全边界

仅通过仓库 `release-gate.yml` 发布；分支先运行 `dry_run=true`，
真实发布需要版本匹配的 tag 及四个校验 job 全部成功。
不修改或部署两个原业务项目，不将私有实现、接口配置、凭据或完整业务日志写入公开仓库。
省级旧版/候选隔离对照的既有失败仍见 [真实消费者兼容性](./real-consumer-compatibility.md)，
脱敏夹具和公共包门禁不等于原 Dashboard 或真实后端的业务验收。
