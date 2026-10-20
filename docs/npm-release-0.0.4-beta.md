# 0.0.4-beta npm 发布执行记录

日期：2026-10-20（Asia/Shanghai）。维护者本轮明确授权 npm 发布，未授权生产部署。

## 当前状态

**BLOCKED：全部发布前门禁通过，但 npm 拒绝首包发布请求，九包均未发布 `0.0.4-beta`。** 需要维护者更新有效且具备九包发布权限的 GitHub `NPM_TOKEN` 后，才可继续。未绕过门禁本地发布，未盲目重试。

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

## 正式发布结果

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

### 发布后只读核查

失败后逐包查询 npm registry，全部目标版本不存在；`beta` 和 `latest` 均未改变，没有部分发布：

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

### 人工恢复步骤

1. 在 npm 登录维护者账号，核对其对上述九包的发布权限。新建或修复 granular access token，必须在 Packages and scopes 中授予九包的发布写权限，包含非 scope 包 `create-lumal-admin`，不能只配置组织管理权限。核对有效期及 npm / 组织的 2FA 自动发布策略，不降低组织安全要求。
2. 在 GitHub 仓库 Settings → Secrets and variables → Actions 更新仓库 Secret `NPM_TOKEN`。秘密值只在可信 npm / GitHub 页面输入，不粘贴到聊天、源码、终端命令参数或报告。
3. 更新凭据后，先重新执行 `pnpm release:verify --check-registry`，只有九包仍全部未发布才能继续。保留 tag `v0.0.4-beta` 及其原提交，不删除或移动 tag。
4. 在已验证构建 artifact 的七天保留期内，可对运行 `39364257259` 执行 Re-run failed jobs，复用同一 tag 与成功门禁的产物；凭据未修复前不要重试。若 artifact 过期，须在相同 tag 上重新跑完整门禁，不能直接本机发包。
5. 若再次核查发现部分包已发布，立即停止全量重跑并按 [发布清单](./release-checklist.md) 的中断恢复规则处理。只有九包版本、`beta`、integrity 和发布作业都核对成功，才能宣布发布完成。

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

此前 [版本准备记录](./release-preparation-0.0.4-beta.md) 的“未发布 / E2E 未验证”是上一阶段状态。本记录补充后续真实远端验收，不将演练成功等同于 npm 或线上部署成功。
