# Lumal 修复执行报告

执行日期：2026-10-19，Asia/Shanghai。本报告中的 PASS 仅指实际运行范围，不代表 GitHub Actions 或生产平台已验证。

2026-10-20 后续更新：按维护者要求，发布链已改为 Docs 与四个示例统一使用 Vercel，不再要求 Cloudflare 凭据；当前配置以[发布检查清单](release-checklist.md#部署配置)为准。下文保留 2026-10-19 的历史执行证据，不代表最新部署结构。后续验证见文末。

## 执行范围

- 实际仓库：`F:/my-project/luma`；初始分支 `master`、HEAD `dd343faf9e2c122dd23a34309c391e400b200a78`，与只读远端核对结果一致，没有回退。
- 初始已有 82 个改动文件，逐文件备份保存在 `F:/my-project/lumal-repair-baseline-20261019`，初始 tracked diff 保存在 `output/repair/baseline.patch`。备份移出仓库是为避免边界扫描把备份当作公开源码，并未放宽扫描规则。
- 本轮在 `codex/release-hardening` 提交修复。没有推送、合并、创建 PR、打 tag、执行 npm publish 或真实云部署。
- Node `v24.14.1`、pnpm `10.33.0`、Windows。系统原 pnpm wrapper 指向不存在的 Node，实际使用本机缓存中的 pnpm 10.33.0，并在命令进程 PATH 中选择它，没有改系统配置。
- Playwright `1.61.1`；配套 Chromium 初始不存在，安装下载未完成，改用已安装的 Chrome `155.0.8059.84`。默认 API 端口已有其他服务，未终止该服务；开发测试使用 `4177/5324`，生产测试使用 `4176/5323`。
- 已阅读 README、根与相关包 manifests、全部相关 workflows、架构/边界/发布清单/历史审计、实现与测试。有 `.codegraph`，但 CLI/MCP 不可用，尝试后使用源码检索。

**验证快照是保留用户原有改动的工作区，不是仅含本轮三个提交的干净 checkout。** 尤其 RouterView 单元素根修复及原有生命周期测试已存在于用户未提交改动中。本轮保留它们，只提交本轮增量；维护者发布前必须先审阅、整合这些原有改动，再在最终提交快照上运行门禁。

## A. 修改结果总表

| 优先级 / 问题 | 当前根因证据 | 修改文件 / 函数 | 修复方式 | 回归证据 | 状态 |
| --- | --- | --- | --- | --- | --- |
| P0 发布门禁失效 | 原 tag 触发三个独立工作流，没有跨流程成功依赖；历史 Gate 失败而 npm 同 SHA 成功 | 五个 workflows；`check-release-workflows.mjs`、`verifyWorkspaceRelease`、`verifyUnpublishedRelease` | 唯一编排入口、显式 needs、默认成功传播、默认无副作用 dispatch、tag/九包/lockfile/registry 校验、复用同 run 产物 | actionlint 1.7.12、发布安全破坏性回归、完整 release:check | 本机 PASS；服务端调度未验证 |
| P1 Transition / KeepAlive | HEAD 的 slot 数组根不满足元素过渡契约；但用户工作区已用真实根容器修复；仍有强制子页 flex 撑高 | `LumalRouterView.vue` 样式；新增 `router-view-release.test.ts` | 不重复改用户的根节点实现；仅解除普通业务页强制伸展，保留填充页和滚动责任 | 普通/403/404、多根、props、缓存/动画四组合、LRU、卸载；既有关闭/刷新/剔除测试；真实浏览器 | 当前工作区 PASS；原有修复未被代提交 |
| P1 浏览器剩余失败 | 可用浏览器基线为 23 PASS / 5 FAIL；根因包括退出竞态、旧定位、自然高度、popup 竞态、移动标签行高，后续还发现 Popover ARIA | Admin request/session/auth、初始化页面、E2E；`LumalSchemaTableCell.vue`、`LumalSchemaTable.vue` | 取消旧会话请求、退出先清本地、初始化错误显式呈现；准确定位/等待；标签独立行高、Popover menu 语义 | 开发 28/28；生产 28/28；会话与真实 Popover 单测 | PASS |
| P1 生产产物 E2E 缺失 | 原配置启动 Nitro dev + Vite dev；preview 的 command 也是 serve，旧条件仍会启用源码 alias | `playwright.release.config.ts`、Admin Vite config、fixture、根 scripts | 真构建 + Node Mock + Vite preview；构建/preview 无源码 alias；完整测试集成为门禁步骤 | 一条命令及 release:check 内再次完整运行，各 28/28 | PASS |
| P2 URL hook 契约 | hook 得到临时对象，但 fetch/缓存/去重继续使用原 resolvedUrl | `request/client.ts`、`types.ts`、`request-client.test.ts`、`docs/core-api.md` | hook 后上下文统一驱动发送、缓存、去重、错误报告；重放重新执行 hook；处理身份及取消 | Request 39 项；先红 URL/取消回归后修复；全量单测 | PASS |
| P2 部署配置和输出契约 | 历史日志为空 Vercel token / 缺 CF token；不能归为构建错误；prebuilt 需要真实 Build Output 目录 | `deploy.yml`、`check-release-env.mjs`、`prepare-vercel-output.mjs`、发布清单 | 云动作前只列缺失名称；复用已验证 dist，封装 Build Output API v3；CLI 固定版本 | 缺配置、输出结构/缺产物/旧输出回归；YAML 静态验证 | 本机 PASS；凭据/平台部署 BLOCKED，未访问生产 |

## B. 核心技术说明

### 发布依赖与权限

```text
tag / workflow_dispatch（默认 dry_run=true）
  version-check
    ├─ release-check（Ubuntu 完整 release:check，含完整生产 E2E）
    │    └─ site-build（另 needs version-check，复用包与 Admin/Compat）
    └─ windows-check（lint、test、typecheck、build）

  publish needs [version-check, release-check, windows-check, site-build]
    → release-npm.yml / publish（npm-release Environment）

  deploy needs [version-check, release-check, windows-check, site-build, publish]
    → deploy.yml / configuration（production Environment，全部平台预检）
        ├─ vercel（四站点矩阵，needs configuration）
        └─ cloudflare-pages（needs configuration）
```

`publish/deploy` 仅额外判断 `github.event_name == 'push' || !inputs.dry_run`，不含状态函数，因此不覆盖默认成功条件；任一 needs 失败、取消、跳过均不能进入副作用。分支上的 `dry_run=false` 会在 version-check 的 `--require-tag` 处失败。失败诊断上传单独使用 `failure()`，不会把失败 job 变绿。

保留 `release-npm.yml`、`deploy.yml` 为仅 `workflow_call` 的复用单元，移除了旧 tag 和独立手动入口。静态检查遍历所有工作流的调用及发布/部署命令，拒绝其他仓库内旁路。普通 CI、Windows 校验、产物/独立消费者/所有预算门禁保留；`deployment-artifacts.yml` 仍只构建。

普通门禁无发布 Secrets。只有门禁后的发布/部署作业得到明确列出的所需 Secret，不使用 `secrets: inherit`，权限为 `contents: read`。包、应用、站点使用同 run、同 SHA artifact；凭据作业不重新构建。仓库外的 Vercel/Cloudflare Git 自动生产部署仍需维护者关闭，代码静态检查无法证明它们已关闭。

`release:verify` 检查九包统一版本、内部依赖、lockfile 链接、tag 版本及 tag commit。发布前只读查询九包版本，任一已存在、部分存在、查询失败均中止，不自动覆盖或补发。实际查询 `0.0.3-beta` 九包均已发布，预检按预期非零拒绝；没有尝试 publish。部分发布优先人工核对 integrity、选新统一版本重新过门禁；具体步骤见发布清单。

### RouterView 与会话

旧实现的 `slots.default?.()` 返回数组，形成 Fragment；用户原有 `createPageView()` 改为真实 div 承接过渡，并按原页面类型复用非缓存包装，禁用动画时不用 out-in。本轮没有冒领或覆盖这一修复。KeepAlive 仍使用公开的 include/max，关闭/刷新通过 cacheKeys 与版本 key 淘汰，不读取 Vue 私有缓存。

本轮样式只保留包装层的 flex 伸展，不再让所有业务根节点 `flex: 1`。自然高度页面不被撑满；User/CRUD 填充页继续使用自身 flex 契约，纵向滚动仍由 LumalContent 承担。E2E 增加了填充页高度断言，没有降低自然高度或移动尺寸阈值。

退出登录先取消旧请求并清除本地身份，再用独立 public transport 携带原 token 撤销服务端会话。刷新响应、忽略 signal 的 transport 和 response parser 均防止旧会话影响新身份。Menu/Dictionary 初始化取消被明确识别；真正网络错误通过表格 error/retry 呈现。Role 的挂载权限树预取没有消费者，删除后仍在打开授权时正常获取。

严格诊断 fixture 保留，仅有原先两种精确 ResizeObserver 通知豁免。未新增 Vue 警告忽略项。测试通过不意味着开发服务器 stdout 完全没有 ResizeObserver 通知。

### 本轮 5 项基线失败的分别处理

| 当前基线失败用例 | 实测错误 / 根因 | 修复 |
| --- | --- | --- |
| operator 和 guest 按各自权限加载动态菜单 | 退出时旧 Dashboard 请求使用已撤销 token，出现未声明 401 | 会话取消/隔离；测试等待已声明的 operator 403 完成再退出 |
| 三种布局多视口导航 | 移动端偏好入口已移至账户菜单，旧测试仍点击隐藏按钮 | `openPreferences()` 沿实际入口打开 |
| 宽屏普通页面自然高度 | 工作台 922px 被强制撑满，断言要求低于 842px | RouterView 普通子页不强制 flex 伸展 |
| 全局搜索和外链 | popup 创建时 URL 尚为空；另有外网依赖和模糊 combobox 定位 | 拦截外站、等待 URL、限定搜索 dialog 与 accessible name |
| 移动用户页 | 实际行高 55px，原阈值 52px；标签继承 32px 行高 | 标签独立 1.5 行高；继续操作发现的 Popover ARIA 另修 role=menu；查看弹窗断言使用实际“关闭”按钮 |

### Request 契约

例如 `/users` + baseURL `/api` + query `page=1`，hook 把 `context.url` 改为 `/gateway/api/users?page=1`：修复前 fetch 仍请求 `/api/users?page=1`，现在请求 hook 最终值。

执行顺序为 baseURL/query → Token/requestId → await onRequest → 最终 URL/init → 缓存/去重 → fetch。hook 可以修改 URL、修改或替换 init；不再二次拼接 baseURL/query。缓存含最终 method/URL，即使相同自定义 cache.key 也隔离不同目标；Authorization/getCacheScope 与请求 scope 仍参与身份隔离，不把 token 写入缓存 key。

去重使用最终 method/URL、字符串 body、身份/作用域；一次逻辑请求持有自己的锁集合，重放可重入自己的锁，finally 释放。网络/响应/会话错误使用实际 URL。刷新重放从原始已解析 URL 再跑 hook、保持 requestId，避免路径叠加。hook 改成写方法仍需 retryOnAuthRefresh；外部 Authorization 不自动用管理 token 重放；最终 signal 也作用于缓存命中与刷新等待。

测试实际断言 fetch URL，覆盖相对/绝对/带 query、headers/init 替换、同目标缓存、不同目标不串缓存、身份/作用域、并发去重、错误释放、认证重放、刷新取消。没有引入 Axios 或新状态管理。

### 生产 E2E 与部署

一条命令：`pnpm test:e2e:release`。先执行 Admin 真构建和 Mock `build:test`；既有产物入口是 `pnpm test:e2e:release:built`，发布检查使用后者且已在前序构建产物。

- Admin：`apps/lumal-admin/dist`，`vite preview --host 127.0.0.1 --port 4176 --strictPort`。
- Mock：`apps/lumal-mock-api/.output/server/index.mjs`，Node 直接启动，`NITRO_HOST=127.0.0.1`、`NITRO_PORT=5323`，等待 `/api/status`。
- preview 的 `/api` proxy 继承 server.proxy，指向 Mock；实际登录/API/CRUD 测试验证联通。build 与 preview 无工作区源码 alias，生产 fixture 拒绝 Vite client/src/packages 网络请求。
- 不复用已有服务；Playwright 启停本轮子进程。完整 28 项，release 配置 retries=0，没有以 smoke 替代。
- HTML：`playwright-report/release`；JSON：`.playwright-results/release-report.json`；失败截图/trace：`.playwright-results/release`。本轮稳定副本见 `output/repair/*-report.json`。

Vercel 使用已验证站点 artifact 封装 `.vercel/output/config.json`（version 3）和 `static/`，再 pull 项目配置并 `deploy --prebuilt --prod`，认证使用环境变量；Cloudflare 上传 `apps/lumal-docs/dist`。CLI 固定为 Vercel 64.5.0 / Wrangler 4.151.1。输出结构测试不等于真实上传成功。

## C. 验证证据

日志目录为 `F:/my-project/luma/output/repair`。所有构建任务串行执行；以下数量有重叠，不能把定向回归加到全量数量上。

| 实际命令 / 范围 | 结果 | 数量或摘要 / 日志 |
| --- | --- | --- |
| `git status --short`、`git branch --show-current`、`git rev-parse HEAD` | PASS | 初始 master/dd343faf，有 82 个原有改动，未回退；备份及 baseline.patch |
| `node --version`、`pnpm --version` | PASS | v24.14.1 / 10.33.0 |
| `pnpm install --frozen-lockfile` | PASS | 初始安装及新增 yaml 后再次安装；`install.log`、`install-final.log` |
| 初次 `pnpm test:e2e`（默认配套浏览器） | BLOCKED | 28 项在 launch 时失败，Executable doesn't exist，不是 28 个产品根因；`baseline-e2e.log` |
| `pnpm exec playwright install chromium` | BLOCKED | 下载未完成，停止本轮安装进程；`install-chromium.log`；之后使用 Chrome channel |
| 初始可用浏览器完整 E2E | FAIL | 23 PASS / 5 FAIL，截图/trace 位于 `baseline-browser`；`baseline-browser.log`、JSON |
| `pnpm lint` | PASS | `lint.log`，完整 release:check 中再次通过 |
| `pnpm test` | PASS | 766 项、105 文件；core 346，Admin 128；`test.log`，完整 release:check 再次同数量 |
| `pnpm typecheck` | PASS | `typecheck.log` |
| `pnpm build` | PASS | 九包及 Mock 构建；`build.log` |
| `pnpm test:create-consumer` | PASS | 无 UI peer 的 minimal/request tarball；脚手架 local/HTTP 独立安装、类型和构建；`test-create-consumer.log` |
| `pnpm release:boundaries` | PASS | `release-boundaries.log`；首次被仓库内备份命中，移出备份后通过，未改规则 |
| `pnpm admin:build` | PASS | `admin-build.log` |
| `pnpm compat:build` | PASS | `compat-build.log` |
| `pnpm release:artifacts` | PASS | ESM/CJS/声明/样式/兼容产物及图标消费者；最大 Admin JS 块 387664 B < 500 KB；`release-artifacts.log` |
| `pnpm docs:build` | PASS | `docs-build.log` |
| `pnpm cockpit:build` | PASS | `cockpit-build.log` |
| `pnpm datav-guide:build` | PASS | `datav-guide-build.log` |
| `pnpm release:budgets --require-all` | PASS | 全部预算，没有调整门槛；`release-budgets-final.log` |
| `pnpm test:e2e '--reporter=list,json' --output=output/repair/development-final` | PASS | Chrome，28 PASS、0 skipped、0 flaky；`development-final.log` / JSON |
| `pnpm test:e2e:release` | PASS | 真构建产物，28 PASS、0 skipped、0 flaky；`production-final.log` / JSON |
| `pnpm release:check` | PASS | 整链退出 0；766 单测 + 28 生产 E2E + 九包 pack；`release-check.log`、`release-check-browser-report.json` |
| `pnpm pack:dry-run` | PASS | 独立再次执行，九包；`pack-dry-run-final.log` |
| `pnpm release:verify` | PASS | 九包/依赖/lockfile 一致；本地没有声称验证真实 tag；`release-verify-final.log` |
| `pnpm release:verify --check-registry` | PASS（预期拒绝） | 0.0.3-beta 九包全部已发布，非零停止；`existing-version-preflight.log` |
| `pnpm release:workflows` | PASS | 唯一入口、needs、dry-run、Secrets、完整生产 E2E；`release-workflows-final.log` |
| `output/repair/actionlint/bin/actionlint.exe -color` | PASS | v1.7.12，全部工作流无诊断、退出 0；`actionlint-final.log` 为空诊断 |
| 核心六文件定向 Vitest（下方完整命令） | PASS | 77 项：Request 39、真实路由 5、路由生命周期 15、Layout 6、表格 11+1；`core-release-regressions.log` / JSON |
| 本轮新 Actions run / GitHub Linux Node22 / windows-latest | 未运行 | 未推送、未触发远端；不能以本机 Windows Node24 替代 |
| 真实 npm publish / Vercel / Cloudflare | 未运行 / BLOCKED | 未使用生产凭据；平台成功、令牌权限及线上 API 均未验证 |

核心定向命令：

```powershell
pnpm --filter @lumal/core exec vitest run --config ../../vitest.config.ts tests/request-client.test.ts tests/router-view-release.test.ts tests/router-view-lifecycle.test.ts tests/layout-lifecycle.test.ts tests/schema-table-release.test.ts tests/schema-table-component.test.ts --reporter=default --reporter=json --outputFile=../../output/repair/core-release-regressions.json
```

过程中的非绿色结果全部保留：Request URL、刷新取消、真实 Popover 的红灯见 `request-red.log`、`request-cancellation-red.log`、`table-popover-red.log`；首次全量单测因会话取消产生未处理拒绝，见 `test-first.log`，修复后全量通过。首次核心宽泛命令触发的原有 icon 测试失败见 `baseline-core-lifecycle.log`，未删断言或代改用户图标逻辑，后续全量包含该测试并通过。

另外三次命令调用问题已纠正并留证：PowerShell 数组把预算命令作为单一参数、未加引号的 reporter 逗号被解析为空格、额外核心定向命令从根目录运行导致原有 cwd 相对源码测试 ENOENT。分别保留 `release-budgets-command-first.log`、`development-final-command-first.log`、`core-release-regressions-root-cwd.log`；使用准确参数和包 cwd 后通过，没有为此修改产品代码或断言。

### 预算实测

| 项目 | 本轮最终 gzip | 原门槛 |
| --- | --- | --- |
| Vue 基线 / minimal | 23303 B / 26090 B；增量 2787 B | minimal 增量 ≤ 10000 B |
| request | 2455 B | ≤ 5000 B |
| DataV charts 初始 | 26398 B | ≤ 55000 B；无静态引擎 |
| Admin 首屏 JS / CSS | 310063 B / 42331 B | 335000 B / 50000 B |
| Cockpit 首屏 JS / CSS | 703418 B / 70847 B | 800000 B / 80000 B |
| DataV Guide 首屏 JS / CSS | 416527 B / 46025 B | 850000 B / 55000 B |
| Compat 首屏 JS / CSS | 271363 B / 40221 B | 300000 B / 45000 B |

没有修改公开包集合、导出清单、体积门槛或兼容 API；minimal/request 无 UI peer 独立 tarball 验证通过。用户已有图标功能改动仍留在工作区，不能把其体积变化冒认为本轮收益。

### 历史 28 项 E2E 对照

2026-10-16 历史 Gate 的以下 28 项均失败；本轮可用浏览器初始基线只剩 5 项失败。当前两列结果分别来自完整开发与生产 JSON，均无 skip/retry/flaky。不能据此倒推历史 28 项只有一个根因。

| 用例 | 当前初始基线 | 最终开发 | 最终生产 |
| --- | --- | --- | --- |
| 登录后加载权限菜单并正确处理 403、404 与退出 | PASS | PASS | PASS |
| admin 可以在动态菜单间导航 | PASS | PASS | PASS |
| operator 和 guest 按各自权限加载动态菜单 | FAIL | PASS | PASS |
| Header 入口引用独立驾驶舱应用 | PASS | PASS | PASS |
| 无查看权限账号看不到驾驶舱入口 | PASS | PASS | PASS |
| 用户管理支持查询和新增流程 | PASS | PASS | PASS |
| 会话凭据失效后重新进入登录页 | PASS | PASS | PASS |
| Schema Form 保持范围日期样式、区块间距并支持图标选择 | PASS | PASS | PASS |
| Schema Table 支持错误恢复与持久化列设置 | PASS | PASS | PASS |
| CRUD Table 可在弹窗与抽屉编辑器之间切换 | PASS | PASS | PASS |
| CRUD Table 收起筛选同行布局并让表格填满剩余高度 | PASS | PASS | PASS |
| CRUD Table 在移动端不会产生页面级溢出，弹窗标签改为上置 | PASS | PASS | PASS |
| 设置、标签页和移动布局可以完整操作并持久化 | PASS | PASS | PASS |
| 三种布局在 375、768、1024、1440px 下保持导航可用且无页面级溢出 | FAIL | PASS | PASS |
| 侧栏折叠后仍显示已注册的菜单图标 | PASS | PASS | PASS |
| 混合导航会根据一级菜单子级动态显示和隐藏侧栏 | PASS | PASS | PASS |
| 宽屏普通页面保持自然高度且卡片内容从顶部排列 | FAIL | PASS | PASS |
| 主题设置页和抽屉共享自适应图标卡片布局 | PASS | PASS | PASS |
| 系统主题和 reduced-motion 偏好会应用到真实页面 | PASS | PASS | PASS |
| 全局搜索、徽标、面包屑和 activeMenu 在真实导航中协同工作 | FAIL | PASS | PASS |
| mixed-nav 顶级目录只切换侧栏，外链与内嵌子项各自导航 | PASS | PASS | PASS |
| 全局字号设置会持久化并影响核心与业务文本 | PASS | PASS | PASS |
| 个人中心可更新资料并校验修改密码表单 | PASS | PASS | PASS |
| 菜单弹窗在桌面端保持宽度、栅格对齐并适配深浅主题 | PASS | PASS | PASS |
| 菜单弹窗在 768px 和 375px 下单列显示且无横向溢出 | PASS | PASS | PASS |
| 角色页显示角色编码并可打开菜单与按钮授权树 | PASS | PASS | PASS |
| 用户管理支持机构筛选、批量启停和批量追加角色 | PASS | PASS | PASS |
| 用户管理在移动端紧凑显示机构筛选并在五档视口下无页面级横向溢出 | FAIL | PASS | PASS |

历史日志副本：`historical-release-gate.log`、`historical-deploy.log`。npm 成功与 Gate 失败的历史结论来自只读 Actions 查询，不是本轮发布。

## D. 改动与提交

| SHA | Conventional Commit |
| --- | --- |
| `a00e63c6e5dcb177bf301fd641e4fe239d13e572` | `fix(core): 修复请求钩子 URL 改写与身份隔离` |
| `93c4f9501d6e7742fae4ecd3bc37fd1aadd70481` | `fix(admin): 修复会话退出竞态和路由页面回归` |
| `26a4bbc45849f5d4c11be88422cdf2912af15dfd` | `ci(release): 串联完整门禁与生产产物验收` |

三个代码主题提交的 `git diff --stat dd343faf..26a4bbc`：**43 files changed, 1451 insertions(+), 253 deletions(-)**。本报告另作文档提交，不计入上面代码统计。

提交按文件及 hunk 选择性暂存。Menu 图标、SchemaTable 图标按钮、RouterView 原有根节点修复、原有生命周期测试、图标 morph/主题等没有被一并提交；共享文档仅提交本轮 Request/发布/生产 E2E 段落，lockfile 只提交新增 yaml importer。工作区仍有用户未提交 tracked/untracked 文件，不是 clean；报告外的完整状态/统计见最终 `git status --short`、`git diff --stat` 输出日志。没有推送。

保留的未提交状态为 61 个 tracked 文件与 24 个 untracked 文件；tracked `git diff --stat` 为 **61 files changed, 1025 insertions(+), 192 deletions(-)**，不含 untracked 内容，也不是本轮修复统计。初始备份后仍出现用户侧更新，均未回退或代提交。

**特别提醒：仅检出这三个提交，不能宣称包含用户已有 RouterView 修复或复现本轮全部绿色结果。** 这些原有改动由用户决定如何提交，本任务没有替用户整理或提交整批工作。

## E. 人工事项与未验证范围

1. 先审阅并整合保留的用户改动，特别是 RouterView/生命周期测试及正在进行的图标工作；在最终干净提交快照上重跑 release:check 与全部站点预算。
2. GitHub Settings → Environments 建立/核对 `npm-release`、`production`，设置审批人与 tag 限制。在 Actions Secrets/Variables 或对应 Environment 配置下列名称，绝不提交秘密值。
3. `npm-release`：`NPM_TOKEN`。`production`：`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID_ADMIN`、`VERCEL_PROJECT_ID_COCKPIT`、`VERCEL_PROJECT_ID_DATAV_GUIDE`、`VERCEL_PROJECT_ID_VBEN_COMPAT`、`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`；Variable：`CF_PAGES_PROJECT`。核对 npm 九包写权限/有效期/2FA、Vercel team 与项目访问、CF 目标 account Pages 编辑权限及可 Direct Upload 的项目，生产分支与 workflow 的 `main` 一致。
4. 关闭或限制 Vercel/Cloudflare 独立 Git 自动生产部署。平台设置未读取、未更改，不可标记完成。
5. 用户审核推送代码后，Actions → Release Gate 选择开发分支，保持 `dry_run=true`；确认四门禁成功、publish/deploy skipped。本轮没有触发此远端 run。
6. 失败/取消/跳过传播验收：在无生产 Secrets、无平台 Git 连接的隔离测试仓库复制工作流，把副作用 job 换为仅输出 `UNEXPECTED_SIDE_EFFECT` 的哨兵，保持 needs/if；用匹配版本的测试 tag，分别制造 exit 1、手动 Cancel、校验 job if:false，确认哨兵 skipped，再验证成功路径可达。不要直接在正式仓库推普通 v* 测试 tag。
7. 正式发布由维护者选择未发布的新统一版本，更新 lockfile/日志并审核，完整门禁成功后才授权真实 tag。`0.0.3-beta` 不可重发。真实发布后逐包核对版本/integrity/dist-tag，并分别核对每个平台 Deployment READY/成功、commit、域名和 API。

配置名称非空、构建成功、GitHub run 成功、平台部署成功、线上业务验收通过是不同证据。本轮只完成本机代码/构建/浏览器/静态门禁验证，不声明生产上线。

## F. 2026-10-20 后续：统一 Vercel 部署

按维护者要求，文档不再单独使用 Cloudflare 发布。`deploy.yml` 的五站点 Vercel 矩阵包含 Docs，新增 `VERCEL_PROJECT_ID_DOCS`，调用方和预检同步移除 Cloudflare 三项配置要求。发布门禁、npm 成功依赖、默认 dry-run、production Environment 及同 run 产物复用均保留。

文档开启了 `cleanUrls`，因此只为 Docs 增加 `--clean-urls` 产物模式：Build Output API `overrides` 映射无扩展名路径，目录首页保持文件系统行为，未知路径回退到文档 `404.html` 并保留 HTTP 404。其他四个示例的打包行为不变。测试先复现旧配置阻断和缺少文档路由契约，再修改实现；没有关闭断言或增加发布旁路。

插件只读确认 Vercel 已有 `lumal-docs` 项目。但其 2026-10-19、`dd343faf…` 的最近生产部署为 ERROR，平台日志是 `STATIC_BUILD_NO_OUT_DIR`（文档构建完成后找不到指定的 dist），不是 token 错误。这个历史 Git 部署失败不等于新工作流已执行或已修复线上状态。

| 本次实际命令 / 范围 | 状态 | 证据（`output/repair/`） |
| --- | --- | --- |
| 新增回归后的 `pnpm test:scripts` | FAIL（预期红灯） | CF 前置要求 / 旧矩阵两个失败；随后文档模式两个失败；`vercel-only-red.log`、`vercel-docs-routing-red.log` |
| 修复后 `pnpm test:scripts` | PASS | 4 文件、33 项；`vercel-only-tests.log` |
| `pnpm exec eslint scripts/check-release-env.mjs scripts/prepare-vercel-output.mjs scripts/release-safety.test.mjs` | PASS | `vercel-only-scoped-lint.log` |
| `pnpm lint` | FAIL | 工作期间新增的用户侧 `apps/lumal-admin/src/router/index.ts:84-85` 有两处 `style/no-mixed-operators`；本轮未修改或提交该文件；`vercel-only-lint.log` |
| `pnpm release:workflows` | PASS | 唯一入口、门禁 needs、dry-run、Secret 隔离、完整生产 E2E 保留；`vercel-only-workflows.log` |
| `output/repair/actionlint/bin/actionlint.exe -color` | PASS | 全部 workflow 无诊断；`vercel-only-actionlint.log` |
| `pnpm docs:build` | PASS | VitePress 构建完成；`vercel-only-docs-build.log` |
| `node scripts/prepare-vercel-output.mjs apps/lumal-docs/dist output/repair/vercel-docs-clean-urls-20261020 --clean-urls` | PASS | 只生成本地产物，未上传；`vercel-only-prebuilt.log` |
| Node 逐文件比较原始 dist 和 prebuilt/static，并断言配置 | PASS | 219 文件逐字节一致、63 条映射、首页和 404 配置；`vercel-only-prebuilt-verify.log` |
| 新 Actions run / 真实部署 / 线上 URL 与 HTTP 行为 | 未运行 / 未验证 | 未推送、未触发远端、未使用生产凭据；本地结构测试不能证明 Vercel 服务端路由 |

本次仅改发布配置、部署脚本和文档，没有重跑全量应用单测、类型检查、九包构建、浏览器 E2E 或完整 `release:check`，也不复用上文历史 PASS 充当本次结果。文档中的全量发布门禁仍必须在最终快照执行成功；当前全量 lint 不绿，不能声称可发布。

人工后续：在 `production` 配置指向已有 `lumal-docs` 的 `VERCEL_PROJECT_ID_DOCS`，核对 Vercel token/team 和五项目权限。插件 OAuth 不会自动成为 Actions Secret。新文档部署 READY 后再用未登录访问核对 Deployment Protection、深层页面、静态资源与 404，随后迁移域名和既有 CF 在线链接并停用旧 Git 自动部署。本次不删除 CF 项目、不提前更换有效链接，也不修改任何线上项目设置。
