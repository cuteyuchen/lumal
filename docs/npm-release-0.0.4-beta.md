# 0.0.4-beta npm 发布执行记录

日期：2026-10-20（Asia/Shanghai）。维护者本轮明确授权 npm 发布，未授权生产部署。

## 当前状态

**PASS：更新 `NPM_TOKEN` 后，第 4 次运行成功发布九包 `0.0.4-beta`，公开 registry、`beta` 标签、tarball 完整性及公开入口均已逐包核验通过。** 九包 `latest` 仍为 `0.0.1-beta`；原 tag 未移动，生产部署按授权范围跳过。前三次失败的历史证据保留在下文，不作为当前错误。

- 目标版本：九个公开包统一为 `0.0.4-beta`，npm dist-tag 为 `beta`，不改 `latest`。
- 目标提交：`fd640c33469cc92d7f83e7e3ebea6d47040a7c94`。
- 正式 tag：`v0.0.4-beta`，本机已校验九包、内部依赖、lockfile 与 tag 指向一致，已普通推送。
- 发布前 registry 快照：九包均没有 `0.0.4-beta`；九包 `beta=0.0.3-beta`，`latest=0.0.1-beta`。
- 正式运行：[Release Gate 39364257259](https://github.com/cuteyuchen/lumal/actions/runs/39364257259)。

## 发布与部署授权隔离

原编排在 npm 发布后会直接进入生产部署。为落实本轮仅发 npm 的授权，提交 `fd640c3` 增加显式部署开关：

```text
version-check
  ├─ release-check（Ubuntu 完整 release:check，含生产 E2E）
  │    └─ site-build（复用已验证产物，检查全部预算）
  └─ windows-check

四个校验全部成功
  → publish（九包 registry 预检 → 串行 npm 发布）
    → deploy（仍依赖上述全部作业，且 DEPLOY_PRODUCTION=true 才执行）
```

`DEPLOY_PRODUCTION` 为仓库 Actions Variable，缺失或非字符串 `true` 均不部署。正式 tag 推送前已只读确认该变量未设置；没有修改或读取任何 Secret 值。仓库存在 `NPM_TOKEN`，仅存在性不能证明有效性，实际认证以发布作业为准。

新增回归先复现 1 项失败、40 项通过，修复后脚本测试 41 项全部通过；移除部署显式授权时，静态检查会拒绝。`pnpm lint`、`pnpm docs:build`、`pnpm release:boundaries`、`pnpm release:workflows` 和 `actionlint 1.7.12` 均通过。未削弱门禁、未提高预算、未跳过测试。

## 无发布演练

[Release Gate 39363194840](https://github.com/cuteyuchen/lumal/actions/runs/39363194840) 在同一目标提交上手动运行，`dry_run=true`，结论为 **success**。

| 远端作业 | 结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS |
| Ubuntu release check | PASS，完整 `pnpm release:check` |
| Windows checks | PASS，lint / test / typecheck / build |
| Static site builds | PASS，全部站点与消费者预算 |
| Gated npm publication | SKIPPED，符合 dry-run |
| Gated production deployment | SKIPPED，符合 dry-run |

Ubuntu 日志实际汇总：13 组、110 个测试文件、805 项单测通过；完整生产 Chromium E2E **28 项通过，耗时 1.6 分钟**。本次是 Admin `dist` 和 Mock Node 产物，不是开发服务，也不引用历史测试数量。

### 生产 E2E 用例

以下 28 项均来自本轮演练的真实 Playwright 日志，全部 PASS：

1. 登录后加载权限菜单并正确处理 403、404 与退出。
2. admin 可以在动态菜单间导航。
3. operator 和 guest 按各自权限加载动态菜单。
4. Header 入口引用独立驾驶舱应用。
5. 无查看权限账号看不到驾驶舱入口。
6. 用户管理支持查询和新增流程。
7. 会话凭据失效后重新进入登录页。
8. Schema Form 保持范围日期样式、区块间距并支持图标选择。
9. Schema Table 支持错误恢复与持久化列设置。
10. CRUD Table 可在弹窗与抽屉编辑器之间切换。
11. CRUD Table 收起筛选同行布局并让表格填满剩余高度。
12. CRUD Table 在移动端不会产生页面级溢出，弹窗标签改为上置。
13. 设置、标签页和移动布局可以完整操作并持久化。
14. 三种布局在 375、768、1024、1440px 下保持导航可用且无页面级溢出。
15. 侧栏折叠后仍显示已注册的菜单图标。
16. 混合导航根据一级菜单子级动态显示和隐藏侧栏。
17. 宽屏普通页面保持自然高度且卡片内容从顶部排列。
18. 主题设置页和抽屉共享自适应图标卡片布局。
19. 系统主题和 reduced-motion 偏好应用到真实页面。
20. 全局搜索、徽标、面包屑和 activeMenu 在真实导航中协同工作。
21. mixed-nav 顶级目录只切换侧栏，外链与内嵌子项各自导航。
22. 全局字号设置持久化并影响核心与业务文本。
23. 个人中心可更新资料并校验修改密码表单。
24. 菜单弹窗在桌面端保持宽度、栅格对齐并适配深浅主题。
25. 菜单弹窗在 768px 和 375px 下单列显示且无横向溢出。
26. 角色页显示角色编码并可打开菜单与按钮授权树。
27. 用户管理支持机构筛选、批量启停和批量追加角色。
28. 用户管理在移动端紧凑显示机构筛选，并在五档视口下无页面级横向溢出。

## 首次正式发布（attempt 1）

正式运行 `39364257259` 已完成，结论 **failure**，失败发生在 npm 写入，不是构建或 E2E：

| 远端作业 | 结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS，版本和 tag 一致 |
| Windows checks | PASS，lint / test / typecheck / build |
| Ubuntu release check | PASS，110 个文件、805 项单测，生产 Chromium E2E 28 项通过（1.4 分钟） |
| Static site builds | PASS，全部站点构建及预算 |
| Gated npm publication / Publish validated packages | FAIL，首包 npm PUT 返回 E404 |
| Gated production deployment | SKIPPED，没有生产部署 |

首包 `@lumal/icons@0.0.4-beta` 的请求返回：

```text
npm error code E404
npm error 404 Not Found - PUT https://registry.npmjs.org/@lumal%2ficons - Not found
```

只读 GET 能查询该包，公开 maintainer 为 `cuteyuchen`，因此不能把 PUT 的 E404 直接解释为包不存在。仓库 registry 配置为 `https://registry.npmjs.org/`，没有指向其他 registry。本机 `npm whoami --registry=https://registry.npmjs.org` 另行返回 E401，本机认证也不可用。

CI 与本机使用的认证来源不同，不能据此断言 GitHub 令牌一定过期。CI 令牌是否过期、被撤销、缺少包写权限或受其他策略约束，尚需维护者在 npm 控制台确认。`npm-release` Environment 的 Secret 列表为空，当前发布流程使用仓库级 `NPM_TOKEN`；只检查了配置名称，没有获取秘密值。

## 更新 Token 后重跑（attempt 2）

维护者确认 Token 已更新后，只读检查仓库 `NPM_TOKEN` 的 `updated_at=2026-10-20T03:41:19Z`（北京时间 11:41:19），未读取或打印值。再次执行 `pnpm release:verify --check-registry` 通过，确认九包目标版本仍全部不存在；原运行的 npm artifact `12239047486` 未过期，tag 仍指向 `fd640c3`，`DEPLOY_PRODUCTION` 仍未设置。

本次仅执行一次有凭据变更依据的失败作业重跑，没有重新发 tag 或绕过成功门禁：

```bash
gh run rerun 39364257259 --repo cuteyuchen/lumal --failed
gh run watch 39364257259 --repo cuteyuchen/lumal --compact --interval 30 --exit-status
```

重跑于 2026-10-20 03:45 UTC（北京时间 11:45）结束。发布 job `118442632880` 已下载并校验同一运行的构建 artifact，版本、tag 与 registry 预检通过，但首包发布返回：

```text
npm error code EOTP
npm error This operation requires a one-time password from your authenticator.
```

| 远端作业 | attempt 2 结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS，沿用同一运行已成功的门禁 |
| Ubuntu release check / Windows checks / Static site builds | PASS，沿用已验证结果和产物；没有宣称本次重新运行测试 |
| Gated npm publication / Publish validated packages | FAIL，首包 `@lumal/icons@0.0.4-beta` 返回 `EOTP` |
| Gated production deployment | SKIPPED，没有生产部署 |

该次错误表明当次发布要求交互式 2FA；不能据此宣称九包的写权限已全部验证，也不能将其写成首次 `E404`。没有传入或收集 OTP，没有禁用 2FA。

## 再次更新 Token 后重跑（attempt 3）

维护者再次确认已更新免交互验证的 Token 后，只读确认仓库 `NPM_TOKEN` 的 `updated_at=2026-10-20T03:49:54Z`（北京时间 11:49:54）。`pnpm release:verify --check-registry` 再次通过，九包没有部分发布，原 tag 不变；随后只重跑失败作业，没有修改发布命令或生产部署开关。

发布 job `118444278254` 于 2026-10-20 03:51 UTC（北京时间 11:51）执行，产物下载及版本、tag、registry 校验均通过；npm 首包写入返回不同且明确的错误：

```text
npm error code E403
This token can only publish to a staging area.
Run `npm stage publish` to publish this version, then approve it. (E_STAGE_REQUIRED)
```

| 远端作业 | attempt 3 结果 |
| --- | --- |
| Version / Ubuntu / Windows / Static site 门禁 | PASS，沿用同一运行的成功结果与校验产物 |
| Gated npm publication / Publish validated packages | FAIL，首包 `@lumal/icons@0.0.4-beta` 返回 `E403 / E_STAGE_REQUIRED` |
| Gated production deployment | SKIPPED，没有生产部署 |

该错误与 npm 官方对 stage-only Token 的限制一致：它可以上传待审批版本，但不能直接发布新版本。本轮没有擅自切换成 staging 流程、代替维护者审批、提高 Token 权限或再盲目重跑；`0.0.4-beta` 也没有因此成为已发布版本。

## 前三次失败后的只读核查（历史）

三次失败后均逐包查询 npm registry；第 3 次快照再次确认全部目标版本不存在，`beta` 和 `latest` 均未改变，没有部分发布，也没有可记录的本版 integrity 或发布时间：

| 包 | `0.0.4-beta` | `beta` | `latest` |
| --- | --- | --- | --- |
| `@lumal/icons` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/icons-vue` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/core` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/charts` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/datav` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/cockpit` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/vben-compat` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `@lumal/vite` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |
| `create-lumal-admin` | 未发布 | `0.0.3-beta` | `0.0.1-beta` |

## 更新直接发布权限后重跑（attempt 4）

维护者再次更新 Token 后，只读确认仓库 Secret `NPM_TOKEN` 的 `updated_at=2026-10-20T05:49:36Z`（北京时间 13:49:36），没有读取值。`pnpm release:verify --check-registry` 通过，九包当时均未发布；原 npm artifact `12239047486` 未过期，tag 仍指向 `fd640c3`，`DEPLOY_PRODUCTION` 仍未设置。

仅执行 `gh run rerun 39364257259 --repo cuteyuchen/lumal --failed`，未修改工作流、构建产物或发布命令。正式运行第 4 次结论为 **success**，发布 job `118477536213` 于 2026-10-20 05:51:42 UTC（北京时间 13:51:42）成功结束：

| 远端作业 | attempt 4 结果 |
| --- | --- |
| Version / lockfile / workflow safety | PASS，沿用同一 tag 已成功的门禁 |
| Ubuntu release check | PASS，沿用已完成的 805 项单测、28 项生产 Chromium E2E 及产物 |
| Windows checks / Static site builds | PASS，沿用既有校验与消费者预算结果 |
| Gated npm publication / Publish validated packages | PASS，九个 `pnpm publish --tag beta` 命令全部成功 |
| Gated production deployment | SKIPPED，没有生产部署 |

npm 日志逐包输出 `+ <package>@0.0.4-beta`，同时提示新版本仍需处理数分钟。最初严格只读查询未发现首包目标版本并非零退出，日志完整保留；随后快照依次为 1/9、3/9、5/9、8/9，最终于北京时间 13:56:02 达到 9/9。这是发布后的 registry 可用性核验过程，不是重复发包，也没有调整项目测试超时。

### 最终 registry 核验

以下均为 2026-10-20 的实际公开元数据；`0.0.4-beta` 及 `beta` 九包全部正确，`latest` 均保持 `0.0.1-beta`：

| 包 | 版本 / `beta` | 发布时间（北京时间） | tarball 字节数 | SHA-512 / SHA-1 |
| --- | --- | --- | --- | --- |
| `@lumal/icons` | `0.0.4-beta` | 13:55:27.608 | 19033 | PASS |
| `@lumal/icons-vue` | `0.0.4-beta` | 13:53:58.728 | 16777 | PASS |
| `@lumal/core` | `0.0.4-beta` | 13:52:59.982 | 175637 | PASS |
| `@lumal/charts` | `0.0.4-beta` | 13:52:21.036 | 11882 | PASS |
| `@lumal/datav` | `0.0.4-beta` | 13:54:06.880 | 92132 | PASS |
| `@lumal/cockpit` | `0.0.4-beta` | 13:53:11.286 | 96586 | PASS |
| `@lumal/vben-compat` | `0.0.4-beta` | 13:54:13.327 | 10654 | PASS |
| `@lumal/vite` | `0.0.4-beta` | 13:54:15.360 | 5469 | PASS |
| `create-lumal-admin` | `0.0.4-beta` | 13:54:47.209 | 19372 | PASS |

实际下载九个 tarball，用 Node `node:crypto` 分别计算 SHA-512 和 SHA-1，与 registry 的完整 `dist.integrity` / `dist.shasum` 比对，全部一致；完整 integrity 值在 `npm-0.0.4-registry-final.jsonl`。另将 registry 的九个 shasum 与发布 job 输出逐个比对，也全部一致，证据为 `npm-0.0.4-publisher-checksums.jsonl`。

九包 registry 元数据均未提供 `gitHead`，因此不伪造该字段的核验结果。源提交关联由 Actions 的 `headSha=fd640c3`、同一运行的校验产物下载，以及发布日志和实际 tarball 校验和一致共同佐证。

逐包比对已发布 manifest 的 `main` / `module` / `types` / `style` / `exports` / `sideEffects` 与工作区公开配置，全部一致；消费者依赖没有遗留 `workspace:`。实际内部依赖均为精确的 `0.0.4-beta`：Core → Icons / Icons Vue，Icons Vue → Icons，Cockpit → Core / Icons Vue，Vben Compat → Core。未改变 minimal/request、ESM/CJS、样式或其他按需入口。

## 凭据修复步骤与安全约束

以下保留此次凭据修复的操作依据，不代表要求再次创建 Token 或重发本版。第 4 次发布及最终 registry 核验均已成功；本版不可重复发布，未来需新版本与对应门禁。当前没有待修复的 npm 发布阻塞，生产部署未在本轮执行。

1. 在 npm 登录维护者账号，核对其对上述九包的发布权限及各包 Settings → Publishing access。若安全策略允许使用自动发布 Token，新建最小范围、短有效期的 granular access token，在 Packages and scopes 中选择九包的 `Read and write (publish and stage)`，包含非 scope 包 `create-lumal-admin`，并在创建时启用 `Bypass two-factor authentication`。该选项默认关闭；不能只授予组织管理权限，也不能使用仅 stage 权限代替直接发布权限。
2. 若包选择 `Require two-factor authentication and disallow tokens`，或组织要求完整强制 2FA，则不要降低安全策略来让当前脚本通过。应另行配置 npm Trusted Publishing 并调整受门禁保护的发布作业，或使用维护者批准的交互式发布流程；本轮未自动变更这些设置。不要把 OTP 写入 GitHub Secret、工作流或聊天，也不要关闭账户 2FA。
3. 若有意保留更受限的 stage-only Token，需要另行设计受门禁保护的 staging 上传与维护者 2FA 审批流程，不能只把现有命令改成 `npm stage publish` 就宣称完成发布。本轮未自动变更这条发布链路。
4. 继续使用 Token 路径时，在 GitHub 仓库 Settings → Secrets and variables → Actions 更新仓库 Secret `NPM_TOKEN`。秘密值只在可信 npm / GitHub 页面输入，不粘贴到聊天、源码、终端命令参数或报告。
5. 更新凭据后，先重新执行 `pnpm release:verify --check-registry`，只有九包仍全部未发布才能继续。保留 tag `v0.0.4-beta` 及其原提交，不删除或移动 tag。
6. 在已验证构建 artifact 的七天保留期内，可对运行 `39364257259` 执行 Re-run failed jobs，复用同一 tag 与成功门禁的产物；发布权限与 2FA 策略未处理前不要重试。若 artifact 过期，须在相同 tag 上重新跑完整门禁，不能直接本机发包。
7. 若再次核查发现部分包已发布，立即停止全量重跑并按 [发布清单](./release-checklist.md) 的中断恢复规则处理。只有九包版本、`beta`、integrity 和发布作业都核对成功，才能宣布发布完成。

上述配置按 2026-10-20 查阅的 npm 官方文档核对：[创建 Token](https://docs.npmjs.com/creating-and-viewing-access-tokens/)、[Token 权限与 stage-only](https://docs.npmjs.com/about-access-tokens/)、[包级 2FA 策略](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/)、[CI/CD 认证](https://docs.npmjs.com/using-private-packages-in-a-ci-cd-workflow/)。

## 本次本机验证

重跑及文档更新后实际执行。npm 成功由上文远端发布和 registry 核验共同证明，以下本机检查不代表生产部署成功：

| 命令 | 结果 | 日志 |
| --- | --- | --- |
| `pnpm release:verify --check-registry` | PASS，第 4 次重跑前九包版本、内部依赖和 lockfile 一致，registry 无本版；不是发布后的结论 | `npm-0.0.4-retry4-preflight.log` |
| `node --input-type=module -e ...`（首次严格 registry 查询） | FAIL，当时首包目标版本尚不可见，保留断言失败及本机 Node 退出诊断 | `npm-0.0.4-registry-after-retry4.jsonl` |
| `node --input-type=module -e ...`（只读轮询与 tarball 校验） | PASS，最终 9/9 版本、dist-tag、SHA-512、SHA-1 均一致 | `npm-0.0.4-registry-final.jsonl` |
| `node --input-type=module -e ...`（发布日志校验和比对） | PASS，9/9 实际发布 shasum 与 registry 一致 | `npm-0.0.4-publisher-checksums.jsonl` |
| `node --input-type=module -e ...`（公开 manifest 比对） | PASS，9/9 入口配置及依赖检查 | `npm-0.0.4-public-manifests.jsonl` |
| `pnpm lint` | PASS | `npm-0.0.4-final-docs-lint.log` |
| `pnpm docs:build` | PASS，VitePress 成功构建 | `npm-0.0.4-final-docs-build.log` |
| `pnpm test:scripts` | PASS，6 个文件、41 项测试 | `npm-0.0.4-final-scripts-tests.log` |
| `pnpm release:boundaries` | PASS | `npm-0.0.4-final-boundaries.log` |
| `pnpm release:workflows` | PASS，唯一入口、needs、Secrets 隔离和生产 E2E 约束保留 | `npm-0.0.4-final-workflows.log` |
| `git diff --check` | PASS，仅提示仓库 CRLF 转换策略，无空白错误 | 终端退出码 0 |

本次只改文档，未重新执行整套本机单测或浏览器测试；远端完整校验结果及其执行阶段见上文，没有将沿用结果写成本次重跑测试。

## 本机证据

原始日志在本机 ignored 的 `output/repair/`，不随源码提交：

- `npm-0.0.4-deploy-opt-in-repro.log` / `npm-0.0.4-deploy-opt-in-tests.log`：新增安全回归的失败与通过证据。
- `npm-0.0.4-registry-before.jsonl`：正式发布前九包 registry 元数据快照。
- `npm-0.0.4-tag-preflight.log`：本机版本、tag、lockfile 与 registry 预检。
- `npm-0.0.4-gate-dry-run.json`：演练运行结论及作业结果。
- `npm-0.0.4-gate-dry-run-ubuntu.log`：演练完整校验与 28 项生产 E2E 日志。
- `npm-0.0.4-release-watch.log` / `npm-0.0.4-release.json`：正式运行失败结论与各 job 状态。
- `npm-0.0.4-release-ubuntu.log`：正式 tag 的 805 项单测和 28 项生产 E2E 通过证据。
- `npm-0.0.4-publish.log`：npm 首包 PUT E404，GitHub 已遮蔽凭据；报告不包含 Secret 值。
- `npm-0.0.4-registry-after-attempt.jsonl`：失败后九包均未发布的 registry 快照。
- `npm-0.0.4-retry-preflight.log`：更新 Token 后的 registry 和版本预检。
- `npm-0.0.4-release-retry-watch.log` / `npm-0.0.4-release-retry.json`：attempt 2 的失败结论、门禁成功与部署跳过状态。
- `npm-0.0.4-publish-retry.log`：job `118442632880` 的 `EOTP` 原始日志。
- `npm-0.0.4-registry-after-retry.jsonl`：attempt 2 后九包目标版本仍全部不存在，dist-tag 未改变。
- `npm-0.0.4-retry3-preflight.log`：再次更新 Token 后的 registry 和版本预检。
- `npm-0.0.4-release-retry3-watch.log` / `npm-0.0.4-release-retry3.json`：attempt 3 的失败结论、门禁成功与部署跳过状态。
- `npm-0.0.4-publish-retry3.log`：job `118444278254` 的 `E403 / E_STAGE_REQUIRED` 原始日志。
- `npm-0.0.4-registry-after-retry3.jsonl`：attempt 3 后九包目标版本仍全部不存在，dist-tag 未改变。
- `npm-0.0.4-retry4-preflight.log`：第 4 次发布前九包均未发布、版本与 lockfile 一致。
- `npm-0.0.4-release-retry4-watch.log` / `npm-0.0.4-release-retry4.json`：attempt 4 的成功结论、既有门禁成功及生产部署跳过。
- `npm-0.0.4-publish-retry4.log`：job `118477536213` 九包全部发布成功。
- `npm-0.0.4-registry-after-retry4.jsonl` / `npm-0.0.4-registry-propagation.jsonl` / `npm-0.0.4-icons-propagation.jsonl`：初次目标版本尚不可见及随后处理过程。
- `npm-0.0.4-registry-final.jsonl`：最终九包版本、dist-tag、完整 integrity、发布时间、实际 tarball 大小及 hash 校验。
- `npm-0.0.4-publisher-checksums.jsonl`：九包实际发布 shasum 与公开 registry 一致。
- `npm-0.0.4-public-manifests.jsonl`：九包公开入口及内部依赖核验结果。

此前 [版本准备记录](./release-preparation-0.0.4-beta.md) 的“未发布 / E2E 未验证”是上一阶段状态。本记录补充后续真实远端验收，不将演练成功等同于 npm 或线上部署成功。
