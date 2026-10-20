# 发布检查清单

发布前需要确认包内容、依赖方向、文档和示例应用都处于可发布状态。

## 版本准备

九个公共包统一版本，私有应用保留 `0.0.0`，只更新内部依赖。`0.0.3-beta` 的九包在 2026-10-19 已确认全部发布，不能再次作为新版本发布。本轮按维护者要求准备 `0.0.4-beta`；以下 `NEXT_VERSION` 必须由维护者选择尚未发布的合法版本。

```bash
pnpm release:version NEXT_VERSION
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile
pnpm release:verify
```

`release:version` 只修改 manifests，不更新锁文件、日志和文档，也不提交、推送、打 tag 或发布。版本准备还需：

- 将 pending Changeset 汇总进每个公共包 CHANGELOG，确认完整后移除已消费记录；本轮不运行标准 `changeset:version`，避免把 beta 序列变为稳定版 `0.1.0`。
- 更新 `docs/changelog.md`、路线图基线、文档导航、安装命令和脚手架说明；历史版本与验收证据保留。
- 保留脚手架源码的三个版本占位符；`pnpm build` 时按脚手架 package.json 注入精确版本，再用 `pnpm test:create-consumer` 验证 tarball 的 minimal/request、local、HTTP 三种消费路径。
- 以空 Changeset 注明变更已手工汇总（本轮为 `prepared-0-0-4-beta.md`，不含包 bump），再执行 `pnpm changeset:status`，确认没有下一轮发布计划；否则已消费记录可能重复提升版本。

唯一发布入口是 `release-gate.yml`：`v*` tag 或手动运行。手动运行默认 `dry_run=true`，只执行校验；分支上不能以 `dry_run=false` 发包。真实运行必须选择版本相符且指向当前 HEAD 的 tag。含预发布后缀的 tag 使用 `beta`，稳定版使用 `latest`。

默认只发布 npm，不自动授权生产部署。仅在维护者明确要求部署时，将仓库 Actions Variable `DEPLOY_PRODUCTION` 设为字符串 `true`，再启动本次发布；缺失或其他值均跳过部署，npm 发布仍受全部门禁约束。仅发包时应确认该变量不存在或不为 `true`。不要通过反复重跑已发布版本来补做部署，仍需遵守下方中断恢复流程。

`release:verify` 读取九包 manifests、所有工作区内部依赖和 lockfile；Actions 上还校验 tag 版本和 Git commit。安装使用 frozen lockfile。发布作业在任何 `publish` 之前额外执行 `release:verify --require-tag --check-registry`，逐包只读查询，只有九包版本全部不存在才继续；任一已发布、部分发布、网络或 registry 异常均中断。

## 实际发布依赖

```text
tag / workflow_dispatch (默认 dry_run=true)
  version-check：九包 / lockfile / tag / YAML / 发布图
    ├─ release-check (Ubuntu)：完整 release:check
    │    lint → 单测 → 类型 → 九包构建 → tarball 消费者
    │    → Admin / Compat → 产物与预算 → Mock Node 构建
    │    → 完整生产 Chromium E2E → 九包 pack dry-run
    │      └─ site-build：复用上面验证的包、Admin/Compat dist
    │           → Docs / Cockpit / DataV Guide → 全部消费者预算
    └─ windows-check：lint / test / typecheck / build

  四个校验 job 全部成功
    → publish (needs: 四个校验)：凭据预检 → registry 预检 → 九包串行发布
      → deploy (needs: 四个校验 + publish；DEPLOY_PRODUCTION=true 才运行)
          configuration：全部 Vercel 项目配置预检
            └─ vercel：五站点矩阵（Docs / Admin / Cockpit / DataV Guide / Compat）
```

`release-npm.yml`、`deploy.yml` 保留为 `workflow_call` 复用单元，没有 tag、分支或独立手动触发器。发布/部署 job 使用默认成功条件，不使用 `always()` 或状态函数覆盖；上游失败、取消或跳过均阻断。只有失败诊断上传步骤使用 `if: failure()`。所有生产 run 共用串行 concurrency，不取消正在进行的版本发布。

`DEPLOY_PRODUCTION` 只收紧部署条件，不能越过任一门禁或 npm 成功依赖；`dry_run=true` 时无论该变量为何值都不发包、不部署。

普通 CI 继续运行 lint/单测/类型/构建/边界，增加发布图与 actionlint；Build Validation 保留独立脚手架消费者校验。`deployment-artifacts.yml` 仅构建产物，不访问云部署。

校验作业没有发布 Secrets。只有门禁成功后的作业才能访问所需凭据；npm 使用 `npm-release` Environment，部署使用 `production` Environment。维护者应在 Settings → Environments 配置审批人和 tag 限制，同时关闭 Vercel 的独立 Git 自动生产部署，避免仓库外的平台旁路。2026-10-20 已将 Docs 项目的 Ignored Build Step 设为 `exit 0`，跳过 Git 构建但保留显式 prebuilt 部署；另外四个项目仍需逐个核对，不能据此认定整个账户已关闭自动部署。

## 中断与恢复

- 九包尚未开始发布：修复失败原因，在人工确认后重跑完整发布门禁。
- 九包已全部发布：禁止重跑整个发布链覆盖同版本；只读核实每包 `npm view <name>@<version> version dist.integrity --json` 与 dist-tag。部署失败不意味着 npm 回滚。
- 仅部分包已发布：不要盲目 Retry publish、撤包或补发所有包。记录成功包、版本、integrity 和原 run；维护者核对内容与内部依赖后，优先选择新的统一九包版本重新经过门禁。若必须补发剩余同版本包，需要单独人工恢复方案和审批，当前自动化故意拒绝这种操作。
- 平台上传不是原子事务；一个站点部署成功、另一个失败时，必须核对各平台 Deployment 状态，不能用工作流的一条绿色步骤代表全部线上成功。

## 命名检查

```bash
rg -n "guiren|gr-framework|GrFramework|GSchemaForm|GSchemaTable|GCrudTable|GPage|GPagination" README.md docs packages apps --glob "!docs/release-checklist.md"
```

当前首版不保留 `G*` 组件别名，公开 API 使用 `Lumal*` 命名。如果后续为了迁移保留别名，需要明确写成兼容 API，不能作为推荐 API。

## 依赖方向

- `@lumal/icons` 静态入口没有强制运行时依赖和 Vue 引用；`@lumal/icons/morph` 仅允许 `morphicons@2.0.0` 可选 peer，不静态加载引擎。
- `@lumal/icons-vue` 依赖 `@lumal/icons` 与 `morphicons@2.0.0`，Vue 与 Iconify Vue 保持 peer；形变复用通用入口，静态消费不加载动画引擎。
- `@lumal/core` 不依赖 `@lumal/vben-compat`。
- Element Plus 保持为 `@lumal/core` 的 peer dependency，Lumal 不从零重写基础 UI 控件。
- `@lumal/core` 不默认依赖 VXE。
- `@lumal/core` 不默认引入多语言运行时。
- `@lumal/charts` 将 ECharts 和 vue-echarts 保持为 peer dependency。
- `@lumal/cockpit` 依赖 `@lumal/core`，`@lumal/core` 不反向依赖 `@lumal/cockpit`；`@lumal/cockpit` 不依赖 `@lumal/charts` 或任何地图/图表运行时。
- `@lumal/vite` 不引入强制运行时依赖。

## 验证命令

推荐直接运行串行发布检查，避免多个构建命令同时清理和重写 `dist`：

```bash
pnpm release:check
```

其中 `release:boundaries` 会作为发布检查的一部分自动执行；如果只想快速检查包边界，可以单独运行：

```bash
pnpm release:boundaries
```

首次发布前还需要检查目标包名是否已被 npm registry 占用：

```bash
pnpm release:names
```

这个命令验证 `@lumal/icons`、`@lumal/icons-vue`、`@lumal/core`、`@lumal/charts`、`@lumal/datav`、`@lumal/cockpit`、`@lumal/vben-compat`、`@lumal/vite`、`create-lumal-admin` 是否能在 registry 查询到；它不能证明发布账号拥有或可创建 `@lumal` scope。

拆开执行时也必须保持串行：

```bash
pnpm lint
pnpm release:boundaries
pnpm test
pnpm typecheck
pnpm build
pnpm test:create-consumer
pnpm docs:build
pnpm admin:build
pnpm compat:build
pnpm release:artifacts
pnpm cockpit:build
pnpm datav-guide:build
pnpm release:budgets --require-all
pnpm test:e2e
pnpm test:e2e:release
pnpm pack:dry-run
pnpm release:workflows
```

只做代码验收时可以单独执行非浏览器命令，但必须注明“E2E 未验证”；不得据此声明完整 `release:check` 通过。

## 发包 dry-run

```bash
pnpm pack:dry-run
```

等价于：

```bash
pnpm --filter @lumal/icons pack --dry-run
pnpm --filter @lumal/icons-vue pack --dry-run
pnpm --filter @lumal/core pack --dry-run
pnpm --filter @lumal/charts pack --dry-run
pnpm --filter @lumal/datav pack --dry-run
pnpm --filter @lumal/cockpit pack --dry-run
pnpm --filter @lumal/vben-compat pack --dry-run
pnpm --filter @lumal/vite pack --dry-run
pnpm --filter create-lumal-admin pack --dry-run
```

检查 tarball 内容：

- 包含 `dist`。
- 包含包内 `README.md`。
- 包含包内 `CHANGELOG.md`，并记录当前版本。
- `@lumal/core` 包含 `theme-chalk/index.scss` 和 `dist/core.css`。
- `@lumal/core` 包含 `minimal.js` / `minimal.cjs` 及类型入口；`test:create-consumer` 在不安装 Element Plus 的临时项目中验证 minimal/request。
- `@lumal/icons` 包含 `morph.js` / `morph.cjs` 及 `src/morph/index.d.ts`；核对 ESM/CJS 消费、可选 peer 缺失时的静态入口和动态失败回退。
- `@lumal/icons-vue` 包含 `dist/icons-vue.css`。
- `@lumal/cockpit` 包含 `dist/cockpit.css` 及 `dist/runtime.js`、`dist/designer.js` 独立入口。
- `create-lumal-admin` 包含 `dist/cli.js` 和 `dist/index.js`，两模式生成的 Core/图标依赖精确等于脚手架版本，不能残留 `^0.0.0` 占位符。
- 不包含 `apps/*`。
- 不包含本地日志、IDE 文件和构建缓存。

## 浏览器与产物检查

- 开发态 `pnpm test:e2e` 启动 Nitro dev + Vite dev，不能证明发布产物行为。
- 生产态一条命令 `pnpm test:e2e:release`：串行构建九包和 `apps/lumal-admin/dist`、执行 Mock API `build:test`，然后启动下列服务并运行同一完整测试集。已有产物时使用 `pnpm test:e2e:release:built`；这也是 `release:check` 中不可跳过的步骤，不是 smoke。
- Mock 服务为 `apps/lumal-mock-api/.output/server/index.mjs`，直接使用 Node，`NITRO_HOST=127.0.0.1`、`NITRO_PORT=5323`，等待 `/api/status`。Admin 使用 `vite preview --host 127.0.0.1 --port 4176 --strictPort`，等待首页。preview 继承 `server.proxy`，`/api` 指向上述 Mock，登录测试真实验证连通性。
- 构建和 preview 都没有 `packages/*/src` alias；严格浏览器 fixture 拒绝生产态的 Vite client / src / packages 网络请求。不复用端口上已有服务，由 Playwright 启停并清理本轮子进程。
- Chromium 首次安装：`pnpm exec playwright install chromium`；Ubuntu Actions 使用 `--with-deps chromium`。本机可显式设置 `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` 使用已安装 Chrome，报告必须记录与 CI 配套 Chromium 的差异。开发态端口可用 `LUMAL_E2E_ADMIN_PORT` / `LUMAL_E2E_API_PORT` 隔离，生产端口固定且占用时失败。
- 生产报告位于 `playwright-report/release`，JSON 为 `.playwright-results/release-report.json`；失败截图和 trace 位于 `.playwright-results/release`。CI 失败上传诊断，不改成 job 成功。
- Chromium E2E 覆盖登录与动态菜单、403/404/退出、标签和设置持久化、用户查询/新增、会话凭据失效。
- 移动端流程验证 375px 下不存在页面级横向溢出。
- `release:artifacts` 检查必要构建产物、`vendor-echarts`、`vendor-element-plus`、`vendor-lumal` 分包和 500 KB 单块上限。
- `release:artifacts` 同时运行 `node scripts/check-icon-consumers.mjs`，使用 Node DOM 环境验证图标 ESM/CJS 静态资源、Vue SSR、通用控制器动态加载和终态，不启动实机浏览器。
- `release:budgets` 检查 Vue 基线、轻入口、request、DataV charts 和应用首屏静态闭包；构建四个示例后使用 `pnpm release:budgets --require-all` 防止漏验。
- 每轮实际结果以对应审计/验收记录为准，不把历史 E2E 或块大小当作当前工作区的验收证明。本轮无浏览器验收的范围见 `architecture-audit-2026-10-16.md`。

## 无发布验收

本地运行 `pnpm test:scripts`、`pnpm release:workflows` 和固定版本 `actionlint 1.7.12`。脚本通过 YAML parser 检查实际 needs、唯一入口、Secret 隔离，并以移除依赖、恢复旧触发器、添加状态函数、跳过校验、替换 smoke 的破坏性回归验证拒绝行为。静态检查不能模拟 GitHub 服务端调度、Environment 审批或平台权限。

维护者审核并推送代码后，在 Actions → Release Gate 选择开发分支，保持 `dry_run=true`。确认四个校验成功且 `publish`、`deploy` 均为 skipped；此操作不会发包/部署。不要为这一步推送普通 `v*` 测试 tag，它会请求真实发布。

需要验证失败、取消、跳过的服务端传播时：在没有生产 Secrets/平台 Git 连接的独立测试仓库复制工作流，把两个复用工作流的副作用 job 替换为仅输出 `UNEXPECTED_SIDE_EFFECT` 的哨兵，并保持原 needs/if。使用版本相符的安全测试 tag，分别让某校验 `exit 1`、手动 Cancel、在临时副本将校验 job 设 `if: false`，确认哨兵全部 skipped；最后恢复成功校验，确认哨兵可达。该演练不执行任何 npm/云 CLI。真实发布前仍需核实正式仓库审批与配置。

## 部署配置

在 GitHub 仓库 Settings → Environments → `npm-release` / `production` 配置下表中的 Environment Secrets；也可使用 Settings → Secrets and variables → Actions 的仓库级 Secrets。秘密值只由维护者输入，不进入源码、日志或报告。建议为两个 Environment 限制批准人及允许的 tag。Codex 插件登录不会自动给 GitHub Actions 提供凭据。

| 名称 | 类型 / 使用位置 | 用途与人工验证 |
| --- | --- | --- |
| `DEPLOY_PRODUCTION` | 仓库 Actions Variable / release-gate | 部署显式开关，仅字符串 `true` 启用；在 Settings → Secrets and variables → Actions → Variables 配置；仅发 npm 时留空或设为 `false` |
| `NPM_TOKEN` | Secret / npm-release | 允许发布九包的细粒度令牌；维护者核对 scope、包写权限、有效期与组织 2FA 策略 |
| `VERCEL_TOKEN` | Secret / production | Vercel CLI 身份；核对 team 和五项目访问权限 |
| `VERCEL_ORG_ID` | Secret / production | 五项目所属 team/org；与平台 project 设置一致 |
| `VERCEL_PROJECT_ID_ADMIN` | Secret / production | Admin 项目 ID |
| `VERCEL_PROJECT_ID_COCKPIT` | Secret / production | Cockpit 项目 ID |
| `VERCEL_PROJECT_ID_DATAV_GUIDE` | Secret / production | DataV Guide 项目 ID |
| `VERCEL_PROJECT_ID_VBEN_COMPAT` | Secret / production | Compat Demo 项目 ID |
| `VERCEL_PROJECT_ID_DOCS` | Secret / production | 文档项目 ID，复用已有 `lumal-docs` 项目 |

`check-release-env.mjs` 在首次 npm/平台动作前列出缺失名称，绝不输出值。非空检查不等于令牌有效或拥有权限；不在本地执行生产凭据探测。

Vercel 五个静态目录来自同 run 的校验 artifact，文档使用 `apps/lumal-docs/dist`。`prepare-vercel-output.mjs` 封装为各自 `.vercel/output/config.json`（version 3）和 `static/`，再以 `vercel pull` 链接项目、`deploy --prebuilt --prod` 上传，不在凭据作业重新构建，也不依赖平台从仓库根目录自动寻找 `dist`。CLI 固定为 `64.5.0`，认证用环境变量。

文档矩阵额外传 `--clean-urls`，为非首页 HTML 生成 Build Output API `overrides`，使 `/guide/essentials/installation` 等链接定位到实际 `.html` 文件；目录首页仍由文件系统处理。未知路径返回文档 `404.html` 并保留 HTTP 404，不改为 SPA 首页兜底；其余四站点不启用该模式。可在本机只打包、不上传：`node scripts/prepare-vercel-output.mjs apps/lumal-docs/dist output/deploy/docs --clean-urls`。

2026-10-20 已按维护者授权完成 Docs 独立迁移：公开生产地址为 `https://luma-docs-seven.vercel.app`，`LUMAL_DOCS_URL` 默认值、在线文档及 Admin 关于页均已更新。带团队后缀的长域名会跳转 Vercel 登录，不能用作公开文档链接；本次保留了 Deployment Protection，没有关闭访问保护。

Vercel 文档 READY 后，已使用无 Cookie、无 Authorization 的 HTTP 请求校验全部 219 个产物及 63 条无扩展名映射，线上文件 SHA-256 与上传产物一致，未知路径返回真实 404。之后关闭旧 `lumal-docs-cf` 的生产与预览自动部署，清理超过平台直接删除限制的历史记录，再删除项目及剩余部署；删除 API 返回成功，查询项目返回 404。仓库发布链不再调用 Cloudflare，不再要求 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID` 或 `CF_PAGES_PROJECT`；维护者可在确认无其他用途后移除旧 Actions 配置。

历史 `v0.0.3-beta` 的 Vercel 空 token、Cloudflare 缺 token 属于配置失败；不能据此推断构建失败，也不是当前配置清单。本地结构测试不能单独证明平台上传成功。本次授权操作只部署 Docs，不是执行 npm 发布链，也没有增加独立的工作流发布入口；真实平台与 HTTP 证据记录在仓库的 `docs/repair-report-2026-10-19.md`。其他四站点、GitHub Actions Secrets 和服务端门禁传播仍需分别验证，不能把 Docs 成功扩展为全部平台已验收。

官方契约：[GitHub needs](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idneeds)、[复用工作流](https://docs.github.com/en/actions/how-tos/sharing-automations/reusing-workflows)、[Vite preview](https://vite.dev/guide/cli#vite-preview)、[preview.proxy](https://vite.dev/config/preview-options#preview-proxy)、[Nitro Node runtime](https://nitro.build/deploy/runtimes/node)、[Vercel Build Output API](https://vercel.com/docs/build-output-api/v3)、[静态 HTML 路径映射](https://vercel.com/docs/build-output-api/features)。

## 文档检查

- README 与当前实现一致。
- `docs/changelog.md`、九包 CHANGELOG、文档导航版本、安装命令与公共包版本一致。
- `docs/development-roadmap.md` 是唯一开发规划和阶段状态来源。
- `docs/architecture.md` 说明包边界。
- `docs/icons.md` 说明注册、渲染、选择器，以及通用 DOM/其他框架转换与 Vue 形变的入口、安装和回退边界。
- `docs/core-api.md` 说明 core 公开入口。
- `docs/migration-from-vben.md` 说明兼容映射、迁移边界和不支持项。
- `apps/lumal-docs/src/reference` 仅 include 对应 `docs/*.md`，`release:boundaries` 阻止正文副本重新出现。

## npm scope

当前按 `@lumal` 规划。`pnpm release:names` 用于检查目标包名是否能在 registry 查询到。

此前版本准备阶段已用 npm 用户 `cuteyuchen` 确认 scope 权限，复核命令如下：

```bash
npm whoami --registry=https://registry.npmjs.org
npm org ls lumal --registry=https://registry.npmjs.org
npm access list packages @lumal --registry=https://registry.npmjs.org
```

当时确认账号为 `lumal` 组织 owner，并可列出 scope 下已有包。本机登录状态可能过期；CI 使用仓库 `NPM_TOKEN`，每次发布仍需以工作流和 registry 结果确认实际权限。

## License

当前使用 MIT License。发布边界检查会确认根目录 `LICENSE` 存在，并确认各发布包 `package.json` 的 `license` 字段为 `MIT`。
