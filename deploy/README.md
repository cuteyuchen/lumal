# Lumal 部署说明

## 推荐拓扑

- GitHub：源码、Pull Request、CI、CodeQL、Changesets 发布 npm 包。
- Vercel：所有静态 Demo，每个应用一个 Project。
- Cloudflare Pages：VitePress 文档站（当前 `lumal-docs-cf`）。
- Node 服务：`apps/lumal-mock-api`。它使用 Nitro `node-server` preset，应作为长期运行的 Node 服务部署。

## 只在发版时部署

部署由 `.github/workflows/deploy.yml` 承担，**只在推送 `v*` tag 或手动触发时执行**，日常提交不再触发打包与部署。

⚠️ 只改工作流是不够的。Vercel / Cloudflare 的**控制台 Git 集成**是独立机制，会自己监听 `master` 推送。必须同时完成以下手工设置，否则日常提交仍会被自动部署：

1. **Vercel**：每个 Project → Settings → Git → 关掉 automatic deploy；
   或在 **Ignored Build Step** 填入（非 tag 提交直接跳过构建）：

   ```bash
   git describe --exact-match --tags HEAD || exit 0
   ```

2. **Cloudflare Pages**：项目 → Settings → Builds & deployments → 关掉 Git 集成的自动构建。

3. **GitHub Secrets**（仓库 Settings → Secrets and variables → Actions）：

   | Secret | 用途 |
   | --- | --- |
   | `VERCEL_TOKEN` | Vercel CLI 部署令牌 |
   | `VERCEL_ORG_ID` | Vercel 组织 ID |
   | `VERCEL_PROJECT_ID_COCKPIT` | cockpit demo 的 Project ID |
   | `VERCEL_PROJECT_ID_ADMIN` | admin demo 的 Project ID |
   | `VERCEL_PROJECT_ID_DATAV_GUIDE` | datav-guide 的 Project ID |
   | `VERCEL_PROJECT_ID_VBEN_COMPAT` | vben-compat demo 的 Project ID |
   | `CLOUDFLARE_API_TOKEN` | Pages 部署令牌 |
   | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID |

   另可选配 Variables：`CF_PAGES_PROJECT`（默认 `lumal-docs-cf`）。

## 构建命令与产物

| 站点 | 构建脚本 | 产物目录 | 部署目标 |
| --- | --- | --- | --- |
| 文档 | `pnpm docs:build` | `apps/lumal-docs/dist` | Cloudflare Pages |
| admin demo | `pnpm admin:build` | `apps/lumal-admin/dist` | Vercel |
| cockpit demo | `pnpm cockpit:build` | `apps/lumal-cockpit/dist` | Vercel |
| datav-guide | `pnpm datav-guide:build` | `apps/lumal-datav-guide/dist` | Vercel |
| vben-compat demo | `pnpm compat:build` | `apps/vben-compat-demo/dist` | Vercel |

Install Command 统一使用：

```bash
pnpm install --frozen-lockfile
```

Node.js 使用 22，pnpm 使用 `package.json` 中声明的 10.33.0。

## 工作流分工

| 工作流 | 触发 | 职责 |
| --- | --- | --- |
| `ci.yml` | push master / PR | lint、release:boundaries、test、typecheck、build |
| `build-validation.yml` | push master / PR | 包构建 + create-lumal-admin 消费者校验 |
| `codeql.yml` | push master / PR / 每周 | 代码扫描 |
| `release-gate.yml` | `v*` tag | 完整 `release:check`（含 E2E、pack 验证）、Windows 校验、各站点构建 |
| `deployment-artifacts.yml` | `v*` tag | 上传静态产物、构建 mock-api 镜像 |
| `deploy.yml` | `v*` tag | 部署到 Vercel / Cloudflare Pages |
| `release-npm.yml` | `v*` tag | 发布 npm 包 |

## 环境变量

文档站的外链通过 `apps/lumal-docs/src/.vitepress/config/links.ts` 注入：

```text
LUMAL_DOCS_URL
LUMAL_ADMIN_DEMO_URL
LUMAL_COCKPIT_DEMO_URL
LUMAL_DATAV_GUIDE_URL
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

## Cloudflare

文档站当前托管在 Cloudflare Pages（`lumal-docs-cf`），由 `deploy.yml` 的 `cloudflare-pages` job 在 tag 上部署。其余静态站也可以改用 Pages，但需为每个应用建立独立 Pages Project。Mock API 只有在切换并验证 Nitro 的 Cloudflare preset 后，才建议迁移到 Workers。
