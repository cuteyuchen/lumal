# Lumal 部署说明

## 推荐拓扑

- GitHub：源码、Pull Request、CI、CodeQL、Changesets 发布 npm 包。
- Vercel：文档与四个静态 Demo，每个应用一个 Project。
- Node 服务：`apps/lumal-mock-api`。它使用 Nitro `node-server` preset，应作为长期运行的 Node 服务部署。

## 只在发版时部署

唯一发布入口为 `.github/workflows/release-gate.yml`，接受 `v*` tag 或手动触发。手动默认 `dry_run=true`，不会发包或部署。`deploy.yml` 仅可由编排工作流调用，没有独立触发入口。

```text
版本 / Ubuntu 完整发布检查（含生产 E2E）/ Windows / 站点和预算
  → npm 发布
    → production 配置预检
      → Vercel 五站点部署（复用同 run 验证产物）
```

任何门禁失败、取消或跳过都会阻断发布与部署。Vercel **控制台 Git 集成**独立于 Actions，必须另行关闭自动生产部署，避免绕过上述门禁；不要用“工作流成功”代替平台 READY 和公开访问验收。

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

Node.js 使用 22，pnpm 使用 `package.json` 中声明的 10.33.0。

五站点沿用现有 Vercel Project，公开链接统一使用上表中的自定义域名；Cloudflare 使用 DNS-only CNAME，不负责产物托管。不使用受登录保护的部署长域名作为文档入口。Vercel 项目若从 Git 构建，仓库根目录下使用 `pnpm docs:build`，Output Directory 必须是 `apps/lumal-docs/dist`，不能写成根目录的 `dist`。

正式发布使用 `scripts/prepare-vercel-output.mjs` 封装已验证的静态目录，再执行固定版本 Vercel CLI 的 `deploy --prebuilt --prod`，不在凭据作业重新构建。Docs 启用 `--clean-urls`，保留无扩展名深层路径、目录首页和 HTTP 404。完整说明见 [发布检查清单](../docs/release-checklist.md#部署配置)。

## 工作流分工

| 工作流 | 触发 | 职责 |
| --- | --- | --- |
| `ci.yml` | push master / PR | lint、release:boundaries、test、typecheck、build |
| `build-validation.yml` | push master / PR | 包构建 + create-lumal-admin 消费者校验 |
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

Mock API 是演示用途，当前数据在内存中，不应当作生产数据库服务。容器启动命令为：

```bash
pnpm --filter lumal-mock-api build
pnpm --filter lumal-mock-api start
```

Docker 构建文件在 `apps/lumal-mock-api/Dockerfile`。

仓库部署链不再调用 Cloudflare Pages，Cloudflare 仅负责自定义域名的 DNS 解析。历史迁移操作及平台验证见 [修复执行报告](../docs/repair-report-2026-10-19.md)；历史部署错误保留为审计证据，不是当前配置要求。
