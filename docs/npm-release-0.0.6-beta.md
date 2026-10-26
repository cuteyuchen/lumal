# 0.0.6-beta 发布执行记录

发布日期：2026-10-25。分支：`codex/lumal-project-types-and-quality`。
准备起点：`8c1d7ea55cec1eed6b7fb852badd007e57fcf30a`。

## 当前状态

**十包已发布，registry 与同次 CI 产物核验通过，六类独立消费者复验全部通过。**
正式发布作业于 2026-10-25 15:30:43（北京时间）成功结束，
逐包完整性核验于 15:34:20 完成，六类消费者于 15:41:49 完成。
没有重发、修改既有 tag 或部署生产站点。

- 发布前已只读核实九个既有包的 `beta` 均为 `0.0.5-beta`，新增 `@lumal/viewport` 返回 404。
- 发布前十包均不存在 `0.0.6-beta`，因此选择该统一版本；发布后十包 `beta` 均为本版。
- 既有九包的 `latest` 保持 `0.0.1-beta`；新增 viewport 首次发布后的实际 `latest` 为 `0.0.6-beta`，
  不是把既有稳定标签改为本版，没有额外执行 dist-tag 修改。
- 已同步公共包和应用内部依赖、lockfile、十包 CHANGELOG、当前文档和仓库 Skill。
- 十包构建、冻结安装、registry 预检、85 项文档/Skill/发布安全契约、Skill validator 和文档生产构建通过。
- 准备提交 `6d4f416dafe5c6660cb544f97a6d475ddfccee67` 已普通推送；
  [Draft PR #7](https://github.com/cuteyuchen/lumal/pull/7) 保留审核入口，没有合并或强推。
- 分支 [Release Gate 40168944711](https://github.com/cuteyuchen/lumal/actions/runs/40168944711)
  使用 `dry_run=true`，对应上述提交。四项校验全部通过，发布与部署均跳过。
- 验收记录提交 `827fa8b864318a4940b2abfec311ac5eb1cbb1e4` 已普通推送；
  注释标签 `v0.0.6-beta` 指向该提交，并触发唯一正式
  [Release Gate 40171196908](https://github.com/cuteyuchen/lumal/actions/runs/40171196908)。
  推送前十包 registry 查询及 `--require-tag` 校验均通过；不以演练代替正式标签门禁。
- Git 单次命令使用系统现有代理与已登录的 GitHub 凭据，不修改全局配置或关闭 TLS 校验。
- `DEPLOY_PRODUCTION` 变量不存在，本次只授权 npm 发布，不开启生产部署。

## 门禁

| 项目                                  | 实际状态               |
| ------------------------------------- | ---------------------- |
| 本版版本、内部依赖与 frozen lockfile  | 已通过；发布前 registry 预检通过 |
| 本版完整本地发布检查                  | 已通过，`corepack pnpm release:check` 退出 0 |
| 本版文档生产构建与 Skill 契约         | 已通过，85 项契约及文档生产构建 |
| 候选 Ubuntu / Linux PTY               | 已通过，同一候选 SHA 的完整 `release:check` |
| 候选 Windows / 三轮 DataV 视觉        | 已通过；主链 1,051 tests、PTY 12 项、视觉 21 项 |
| 正式 tag 的 Ubuntu / Linux PTY        | 已通过，完整 `release:check`、源码及 tarball PTY 各 12 项 |
| 正式 tag 的 Windows / 三轮视觉        | 已通过，1,051 tests、PTY 12 项、视觉 21 项 |
| 正式同 run 静态站点与全部预算         | 已通过，五站点产物及 `--require-all` |
| 匹配 tag 的正式 npm 发布              | 已通过，同次门禁后十包串行发布 |
| 十包 registry / beta / tarball 完整性 | 已通过，SHA-512 / SHA-1 及 696 个 dist 文件逐字节匹配 |
| 六类纯 registry 消费者                | 已通过，独立正常 / frozen 安装、完整 check 与格式幂等 |
| 生产部署                              | 未授权；正式 run 的 deploy 为 skipped |

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
Windows 终端 artifact 为 `12590110495`；这些演练与下节正式 tag 结果分别记录。

远端演练的 gzip 预算如下，均未提高既有上限；这些数字不是正式 registry 消费者的测量值：

| 消费入口 | JS gzip bytes / 上限 | CSS gzip bytes / 上限 |
| -------- | -------------------- | --------------------- |
| Admin | 312,408 / 335,000 | 42,600 / 50,000 |
| Cockpit | 703,780 / 800,000 | 71,192 / 80,000 |
| DataV Guide | 417,337 / 850,000 | 46,295 / 55,000 |
| Vben Compat | 285,639 / 300,000 | 40,635 / 45,000 |

## 正式标签门禁

正式 run 为 `40171196908`，事件为 push，tag 为 `v0.0.6-beta`。
tag 对象为 `a531358058ed525e1a523e7a2bf053a579c365e7`，
解引用后的源码提交为 `827fa8b864318a4940b2abfec311ac5eb1cbb1e4`。
发布后的文档收尾提交不移动这个标签，也不再次发布同版。

| Job | ID | 结果 / 用时 |
| --- | --- | ----------- |
| Version / lockfile / workflow safety | `121102183086` | success / 29s |
| Ubuntu release check | `121102285301` | success / 27m13s |
| Windows checks | `121102285266` | success / 10m28s |
| Static site builds | `121107404504` | success / 53s |
| Gated npm publication | `121107573251` | success / 49s |
| Gated production deployment | `121107751486` | skipped |

正式主链仍为 123 files / 1,051 tests，Admin 12 个主组合、4 个可选组合及 12 组浏览器通过。
Blank/Screen 为 14 个消费者、14 个浏览器场景，每个场景五档 viewport，共 70 项布局检查；
这些 viewport 检查不是浏览器 zoom。真实 zoom 由专项夹具另外验证：
40 项 Dev/Build 工作区、8 项局部画布、2 项生命周期均通过，实际 80/100/125/150% 均匹配，
页面、运行时及控制台错误均为 0。完整生产 E2E 31 项和十包 pack dry-run 均通过。
Windows 的 21 项视觉结果沿用原像素阈值，没有跳过或重试。

正式站点预算均通过，未提高上限；与演练的个位数字差异不作为性能收益：

| 消费入口 | JS gzip bytes / 上限 | CSS gzip bytes / 上限 |
| -------- | -------------------- | --------------------- |
| Admin | 312,402 / 335,000 | 42,600 / 50,000 |
| Cockpit | 703,780 / 800,000 | 71,192 / 80,000 |
| DataV Guide | 417,337 / 850,000 | 46,295 / 55,000 |
| Vben Compat | 285,639 / 300,000 | 40,635 / 45,000 |

## Registry 与产物

正式 npm artifact 为 `12591256262`，完整名称为
`lumal-npm-dist-827fa8b864318a4940b2abfec311ac5eb1cbb1e4`；
GitHub API 返回的 artifact digest 为
`sha256:2982568948e893682f0dffb680276480f692d1b5d8cab7538cc82c9fa62d4532`。
来源 API 为本次 run 的 artifacts 列表，含同一 run ID 和 head SHA。
下载到隔离目录后共十个包目录、696 个文件、1,828,077 bytes，不读取工作区共享 dist。

核验实际命令：

```bash
node output/release/verify-published-0.0.6-beta.mjs --tag-sha 827fa8b864318a4940b2abfec311ac5eb1cbb1e4 --publish-log output/release/version006-formal-publish.log --dist-artifact F:/my-project/luma/output/release/version006-formal-dist --wait-for-registry
```

退出 0。这些一次性脚本、原始日志和 JSON 留在本机忽略的 `output/release/`，不作为运行时发布文件。
首轮只读查询为 9/10 可见，下一轮为 10/10；没有重发任何包。
逐包检查 registry 版本、beta、既有 latest、真实 tarball 的 SHA-512 和 SHA-1、
显式 tag 的 manifest / exports / peer / bin、模板资源、内部精确同版依赖，
并将 tarball 内全部 dist 文件集合和字节与下载的同次 artifact 比对。

| 包 | tarball bytes | dist 文件数 | tarball / 正式发布日志 SHA-1 |
| -- | ------------- | ----------- | --------------------------- |
| `@lumal/charts` | 12,126 | 13 | `aa28f502c28cf4364770411ef1256a76c4df698f` |
| `@lumal/cockpit` | 96,412 | 97 | `78e95397557a09940ba6e43aa15af3028ab4668a` |
| `@lumal/core` | 178,121 | 279 | `1c9bbf9e40171ae1048fced4923f0c703603060a` |
| `@lumal/datav` | 92,367 | 131 | `d986106aefe68dd24c1b9f6859a084c8720cdae0` |
| `@lumal/icons` | 19,249 | 44 | `0afc9f3731961cf290fef4fb46731febfd8ad3d1` |
| `@lumal/icons-vue` | 16,908 | 19 | `ad74e409c5bb849f445893ddf50864c431d4455c` |
| `@lumal/vben-compat` | 33,236 | 51 | `78a985a8b39496036622c9fdc6c01910a2dd9d1a` |
| `@lumal/viewport` | 10,547 | 14 | `e97d82ac50ad0487e5a64d6734b6cb787c6f71d0` |
| `@lumal/vite` | 11,413 | 12 | `0d9d62a3263a84b61a66a99350f7e53bf61ef52d` |
| `create-lumal-admin` | 104,743 | 36 | `763c11d77d8be1e0fa40a0f8ca52e27732c15dcb` |

十包 registry 均没有提供 gitHead，实际记录为 null，没有伪造该字段。
来源链由显式 tag、同 run artifact 的实际字节及发布日志 / registry 校验和建立。
完整报告为
`output/release/registry-published-verification-0.0.6-beta-2026-10-25T07-33-05-152Z/report.json`，
SHA256 为 `3b45e0ec3e216b0cbea9e166dc9c9eed91a775ecc699dc8ebbb4825292daf28d`。
正式 publish 原始日志为 111,252 bytes，
SHA256 为 `976716ffa46340a9af5bc5c23382e47421729a02424a3da6db27399f90548db9`。

## 发布后消费者复验

2026-10-25 15:35:38 至 15:41:49（北京时间），在 Windows x64 /
Node 24.14.1 / pnpm 10.33.0 执行六类纯 registry 消费者，进程退出 0，
32 条子命令和 1 次 metadata HTTP 操作均成功。实际命令：

```bash
node output/release/verify-registry-consumers-0.0.6-beta.mjs --tag-sha 827fa8b864318a4940b2abfec311ac5eb1cbb1e4 --registry-report output/release/registry-published-verification-0.0.6-beta-2026-10-25T07-33-05-152Z/report.json --temp-parent F:/lumal-release-validation
```

Blank 使用真实 `pnpm --package=create-lumal-admin@0.0.6-beta dlx create-lumal`；
Minimal 使用保留的 `pnpm create lumal-admin@0.0.6-beta` 入口。
其余场景执行从 registry 安装的 CLI，不导入仓库源码。所有 manifest 拒绝
`file:` / `link:` / `workspace:` / npm alias 和 overrides；全部实际 Lumal 锁项精确为
`0.0.6-beta`，integrity 与上节严格发布报告一致，未混用本地 tarball。

各场景先 `pnpm install --frozen-lockfile=false --registry https://registry.npmjs.org/`，
再复制到独立且没有 node_modules 的目录执行 `pnpm install --frozen-lockfile`；
正常与冻结安装的 lockfile SHA256 逐组相同。冻结副本中的 `pnpm check` 包含
lint、format:check、typecheck、test、build；额外执行 `pnpm format`，以文件哈希断言格式幂等。
下表命令全部退出 0，秒数为单次测量，不作性能加速结论。

| 场景 | runtime / dev 依赖数 | normal / frozen 秒 | check / format 秒 | 总 JS / CSS gzip bytes |
| ---- | ------------------- | ------------------ | ----------------- | ----------------------- |
| Blank | 1 / 12 | 38.618 / 2.381 | 45.494 / 0.540 | 24,028 / 175 |
| 静态 Screen | 1 / 12 | 39.063 / 2.387 | 10.884 / 0.577 | 24,855 / 543 |
| Screen HTTP + HTTP Auth + contain | 4 / 12 | 29.962 / 2.842 | 11.276 / 0.668 | 41,448 / 704 |
| Admin Minimal / Local / Hash | 7 / 13 | 27.814 / 6.252 | 20.236 / 0.926 | 210,151 / 42,380 |
| Admin Standard / HTTP / History | 7 / 13 | 39.399 / 5.919 | 15.639 / 1.348 | 378,610 / 43,182 |
| Admin Vben Compatible / Local / History | 8 / 13 | 28.250 / 8.501 | 15.987 / 1.374 | 394,487 / 43,463 |

gzip 为全部 JS / CSS 文件逐文件压缩后求和，不是入口或首次网络传输；
不与上节站点入口预算、历史模板比较混用。Blank 与静态 Screen 的运行时仅 Vue，
没有隐式 Core、Router、Pinia 或 Element Plus。
Windows 的 pnpm.cmd shell 调用产生一次非致命 Node DEP0190 警告，没有命令失败。
本节只验证已发布包消费与模板质量，不代表真实业务后端联通或业务页面验收。

完整报告为
`output/release/registry-consumers-0.0.6-beta-2026-10-25T07-35-38-108Z/report.json`，
SHA256 为 `a4970f915fcd640ed1c85176ad9a74b9c5e59d1c293e6edba42f8e858dd82fa0`。
隔离工程保留在 `F:/lumal-release-validation/lumal-npm-006-MjlGFN`；
原始日志和逐文件产物在本机忽略目录，不将其中的 node_modules 或构建文件提交到仓库。

## 文档与 Skill 收尾

发布后同步当前 README、安装入口、更新日志、模板 / 适配 / 升级指南和仓库 Skill，
统一使用 `0.0.6-beta`，保留历史报告及未发布源码的 tarball 验证规则。
本机 Skill 仅复制已核对的三份知识文件；15 份分发文件 SHA256 全部一致，
宿主 `agents/openai.yaml` 未改动，不删除目标目录的额外文件。

| 验证 | 实际命令 / 环境 | 结果 | 证据 |
| ---- | --------------- | ---- | ---- |
| 文档、Skill 与发布安全契约 | `corepack pnpm exec vitest run --config vitest.config.ts scripts/docs-links.test.ts scripts/lumal-skill.test.ts scripts/release-safety.test.mjs` | 3 files / 85 tests 通过 | `output/release/version006-postpublish-docs-contracts.log` |
| 仓库 Skill 校验 | 宿主 `quick_validate.py skills/lumal`，UTF-8 Python | 退出 0 | `output/release/version006-postpublish-repo-skill-validator.log` |
| 本机 Skill 校验 | 同一 validator 检查本机安装目录 | 退出 0 | `output/release/version006-postpublish-installed-skill-validator.log` |
| 文档生产构建 | `corepack pnpm docs:build` | 退出 0，VitePress 7.13s；仅大 chunk 提示 | `output/release/version006-postpublish-docs-build.log` |
| 补丁空白检查 | `git diff --check` | 退出 0 | 本次终端输出 |

该收尾只更新文档与 Skill，不修改已发布运行时代码，不移动 `v0.0.6-beta`，
也不重跑发布操作。文档生产构建通过不等于已将文档站部署到生产。

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
