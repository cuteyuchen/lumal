# Luma 部署说明

## 推荐拓扑

- GitHub：源码、Pull Request、CI、CodeQL、Changesets 发布 npm 包。
- Vercel：VitePress 文档和所有静态 Demo，每个应用一个 Project。
- Node 服务：`apps/luma-mock-api`。它使用 Nitro `node-server` preset，应作为长期运行的 Node 服务部署。

## Vercel 项目

所有 Vercel Project 都连接同一个仓库，并将 **Root Directory** 保持为仓库根目录：

| Project | Build Command | Output Directory |
| --- | --- | --- |
| luma-docs | `pnpm docs:build` | `apps/luma-docs/dist` |
| luma-admin-demo | `pnpm admin:build` | `apps/luma-admin/dist` |
| luma-cockpit-demo | `pnpm --filter @luma/cockpit build && pnpm --filter luma-cockpit build` | `apps/luma-cockpit/dist` |
| luma-datav-guide | `pnpm --filter @luma/datav build && pnpm --filter luma-datav-guide build` | `apps/luma-datav-guide/dist` |
| luma-vben-compat-demo | `pnpm compat:build` | `apps/vben-compat-demo/dist` |

Install Command 统一使用：

```bash
pnpm install --frozen-lockfile
```

Node.js 使用 22，pnpm 使用 `package.json` 中声明的 10.33.0。

## 环境变量

文档站的外链通过 `apps/luma-docs/src/.vitepress/config/links.ts` 注入：

```text
LUMA_DOCS_URL
LUMA_ADMIN_DEMO_URL
LUMA_COCKPIT_DEMO_URL
LUMA_DATAV_GUIDE_URL
LUMA_GITHUB_URL
LUMA_NPM_SCOPE_URL
LUMA_DOCS_EDIT_PATTERN
LUMA_NPM_CORE ... LUMA_NPM_CREATE
```

## Mock API

Mock API 是演示用途，当前数据在内存中，不应当作生产数据库服务。容器启动命令为：

```bash
pnpm --filter luma-mock-api build
pnpm --filter luma-mock-api start
```

Docker 构建文件在 `apps/luma-mock-api/Dockerfile`。

## Cloudflare

Cloudflare Pages 可以替代 Vercel 托管静态站，但需要为每个应用建立独立 Pages Project。Mock API 只有在切换并验证 Nitro 的 Cloudflare preset 后，才建议迁移到 Workers。
