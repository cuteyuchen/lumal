# Lumal 部署说明

## 推荐拓扑

- GitHub：源码、Pull Request、CI、CodeQL、Changesets 发布 npm 包。
- Vercel：文档与四个静态 Demo，每个应用一个 Project。
- Mock API：`apps/lumal-mock-api`。默认使用 Nitro `vercel` preset；自托管 Node 服务使用 `build:test` 生成 `node-server` 产物。

## 发布与恢复边界

唯一发布入口为 `.github/workflows/release-gate.yml`，接受 `v*` tag 或手动触发。手动默认 `dry_run=true`，不会发包或部署。`deploy.yml` 仅可由编排工作流调用，没有独立触发入口。

```text
版本 / Ubuntu 完整发布检查（含生产 E2E）/ Windows / 站点和预算
  → npm 发布
    → production 配置预检
      → Vercel 五站点部署（复用同 run 验证产物）
```

任何门禁失败、取消或跳过都会阻断发布与部署。Vercel **控制台 Git 集成**独立于 Actions，必须另行关闭自动生产部署，避免绕过上述门禁；不要用“工作流成功”代替平台 READY 和公开访问验收。

上述依赖约束描述 Actions 发布链，不证明平台 Git 自动部署已关闭。
2026-10-26 的六项目 PR Preview 仍由 Git 集成触发；平台现状必须逐项目核实。
公共包已经发布而站点落后时，不重发 npm、不移动 tag，也不为补部署重跑正式发布链。
维护者单独授权站点恢复后，先验证精确提交的全部 PR 门禁，再定向恢复对应站点；
记录所用 Git 构建或 prebuilt 路径、生产环境配置、提交、READY、alias 和公网资源结果。
本次恢复证据见 [0.0.7-beta 执行记录](../docs/npm-release-0.0.7-beta.md#pr-收尾与部署恢复)。
Docs 仍保留 Ignored Build Step：Git 检查显示绿色的 Canceled 不算文档构建成功，
需要单独授权后从精确源码构建固定快照、定向 prebuilt 上传并验证公开域名全部文件。
首次恢复的合并 SHA、Deployment 与 HTTP 证据见该记录的「合并与站点实际验收」。

`0.1.1-beta` 发包后的官网、Admin、DataV Guide、Compat、Mock API 与宿主 Skill 更新已另获授权，
具体提交、定向部署与公开资源证据见 [本版后置记录](../docs/npm-release-0.1.1-beta.md#非-cockpit-站点与宿主-skill-更新)。
该次更新不修改或手动部署独立 Cockpit Demo，不重发十包，也不启用包含 Cockpit 的全量部署矩阵。
Git 自动部署若已为相同提交生成 READY 产物，先核对正式别名与实际资源，不重复上传其他站点。

## GitHub Actions 配置

在仓库 Settings → Environments → `production` 设置以下 Secrets（也可使用仓库级 Actions Secrets），设置审批人及 tag 限制。`npm-release` Environment 另需 `NPM_TOKEN`。插件登录不会自动写入这些配置。

| Secret | 用途 |
| --- | --- |
| `VERCEL_TOKEN` | Vercel CLI 部署令牌，需有五项目访问权限 |
| `VERCEL_ORG_ID` | 五项目所属 Vercel team/org ID |
| `VERCEL_PROJECT_ID_DOCS` | 已有 `lumal-docs` 的 Project ID |
| `VERCEL_PROJECT_ID_COCKPIT` | cockpit demo 的 Project ID |
| `VERCEL_PROJECT_ID_ADMIN` | admin demo 的 Project ID |
| `VERCEL_PROJECT_ID_DATAV_GUIDE` | datav-guide 的 Project ID |
| `VERCEL_PROJECT_ID_VBEN_COMPAT` | vben-compat demo 的 Project ID |

## 构建命令与产物

| 站点 | 构建脚本 | 产物目录 | 公开地址 |
| --- | --- | --- | --- |
| 文档 | `pnpm docs:build` | `apps/lumal-docs/dist` | https://lumal.cuteyuchen.top |
| admin demo | `pnpm admin:build` | `apps/lumal-admin/dist` | https://lumal-admin.cuteyuchen.top |
| cockpit demo | `pnpm cockpit:build` | `apps/lumal-cockpit/dist` | https://lumal-cockpit.cuteyuchen.top |
| datav-guide | `pnpm datav-guide:build` | `apps/lumal-datav-guide/dist` | https://lumal-datav.cuteyuchen.top |
| vben-compat demo | `pnpm compat:build` | `apps/vben-compat-demo/dist` | https://lumal-compat.cuteyuchen.top |

Install Command 统一使用：

```bash
pnpm install --frozen-lockfile
```

CI 与 Release Gate 使用 Node.js 22，pnpm 使用 `package.json` 中声明的 10.33.0；
仓库 `engines.node` 的最低要求为 22.12.0。
2026-10-27 只读核对时，六个 Vercel 项目的 `nodeVersion` 均显式为 `24.x`，
与 CI 的 Node 22 环境应分别记录，不能将其中一方的通过结果称为另一方的验证。
本次未修改平台 Node 配置；后续若调整版本，仍须核对精确提交的构建及公开资源。

五站点沿用现有 Vercel Project，公开链接统一使用上表中的自定义域名；Cloudflare 使用 DNS-only CNAME，不负责产物托管。不使用受登录保护的部署长域名作为文档入口。

Vercel 项目若从 Git 构建，Root Directory 设为仓库根目录；Build Command 和 Output Directory 必须成对使用上表的值。
例如 Cockpit 使用 `pnpm cockpit:build` 与 `apps/lumal-cockpit/dist`，Docs 使用 `pnpm docs:build` 与
`apps/lumal-docs/dist`，不能统一写成根目录的 `dist`。不要沿用改名前的 package filter：
pnpm 输出 `No projects matched the filters` 不代表应用已经构建，即使命令最终返回零也必须修正配置。
平台设置不随源码中的包名自动更新；应分别检查项目当前设置和失败 Deployment 的设置快照。
Cockpit 改名前配置的历史证据见 [Demo 整改验收](../docs/cockpit-demo-remediation-2026-10-26.md#vercel-preview-配置审计)，
后续定向配置修复与复验状态见本版执行记录。

正式发布使用 `scripts/prepare-vercel-output.mjs` 封装已验证的静态目录，再执行固定版本 Vercel CLI 的 `deploy --prebuilt --prod`，不在凭据作业重新构建。Docs 启用 `--clean-urls`，保留无扩展名深层路径、目录首页和 HTTP 404。完整说明见 [发布检查清单](../docs/release-checklist.md#部署配置)。

## 工作流分工

| 工作流 | 触发 | 职责 |
| --- | --- | --- |
| `ci.yml` | push master / PR | lint、format:check、发布边界与工作流安全、test、typecheck、build |
| `build-validation.yml` | push master / PR | Ubuntu 消费者/真实 zoom、Windows DataV 视觉；Ubuntu + Windows 完整 Cockpit 两种构建入口、Cockpit/Admin 生产 E2E、文档死链接、原体积预算 |
| `codeql.yml` | push master / PR / 每周 | 代码扫描 |
| `release-gate.yml` | `v*` tag / 手动（默认 dry-run） | 完整 `release:check`（含生产 E2E、pack 验证）、Windows、各站点构建与预算，成功后才调用发布/部署 |
| `deployment-artifacts.yml` | `v*` tag / 手动 | 仅上传静态产物、构建 mock-api 镜像，不部署 |
| `deploy.yml` | 仅 `workflow_call` | 门禁及 npm 成功后，将五站点验证产物部署到 Vercel |
| `release-npm.yml` | 仅 `workflow_call` | 门禁成功、配置及 registry 预检通过后发布 npm 包 |

## 环境变量

文档站的外链通过 `apps/lumal-docs/src/.vitepress/config/links.ts` 注入：

```text
LUMAL_DOCS_URL
LUMAL_ADMIN_DEMO_URL
LUMAL_COCKPIT_DEMO_URL
LUMAL_DATAV_GUIDE_URL
LUMAL_VBEN_COMPAT_DEMO_URL
LUMAL_GITHUB_URL
LUMAL_NPM_SCOPE_URL
LUMAL_DOCS_EDIT_PATTERN
LUMAL_NPM_CORE ... LUMAL_NPM_CREATE
```

## Mock API

Admin 的 `VITE_API_BASE_URL` 是构建时配置。线上使用独立公开 Mock 服务，
没有同域 `/api` 反向代理；Vite 的开发/preview 代理不会随静态产物部署。
不能把 CI 默认 `/api` 的产物直接覆盖生产：使用生产 Git 构建时保留平台公开配置，
使用 prebuilt 时必须按相同生产配置重新构建并验证产物。
更新远程菜单、权限或组件白名单时，Admin 和 Mock 应使用相容的提交，不能只部署静态页面。

Mock API 是演示用途，当前数据在内存中，不应当作生产数据库服务。
Vercel 使用默认 `pnpm --filter lumal-mock-api build`；
本地长期运行的 Node 服务启动命令为：

```bash
pnpm --filter lumal-mock-api build:test
pnpm --filter lumal-mock-api start
```

Docker 构建文件在 `apps/lumal-mock-api/Dockerfile`。

仓库部署链不再调用 Cloudflare Pages，Cloudflare 仅负责自定义域名的 DNS 解析。历史迁移操作及平台验证见 [修复执行报告](../docs/repair-report-2026-10-19.md)；历史部署错误保留为审计证据，不是当前配置要求。
