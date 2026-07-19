# 安装与包地址

## 包列表

> 在线文档：[https://lumal-docs-cf.pages.dev](https://lumal-docs-cf.pages.dev)

| 包名 | 本地路径 | 文档 | npm / 外链（占位→正式） |
| --- | --- | --- | --- |
| `@lumal/core` | `packages/core` | [/packages/core](/packages/core) | `https://www.npmjs.com/package/@lumal/core` |
| `@lumal/icons` | `packages/icons` | [/packages/icons](/packages/icons) | 同上规则 |
| `@lumal/icons-vue` | `packages/icons-vue` | [/packages/icons-vue](/packages/icons-vue) | 同上 |
| `@lumal/charts` | `packages/charts` | [/packages/charts](/packages/charts) | 同上 |
| `@lumal/datav` | `packages/datav` | [/packages/datav](/packages/datav) | 同上 |
| `@lumal/cockpit` | `packages/cockpit` | [/packages/cockpit](/packages/cockpit) | 同上 |
| `@lumal/vite` | `packages/vite` | [/packages/vite](/packages/vite) | 同上 |
| `@lumal/vben-compat` | `packages/vben-compat` | [/packages/vben-compat](/packages/vben-compat) | 同上 |
| `create-lumal-admin` | `packages/create-lumal-admin` | [/packages/create-lumal-admin](/packages/create-lumal-admin) | 同上 |

## 正式安装（发布后）

```bash
pnpm add @lumal/core @lumal/icons @lumal/icons-vue element-plus vue vue-router pinia
pnpm add @lumal/charts echarts vue-echarts   # 可选
pnpm add @lumal/datav echarts               # 可选
pnpm add @lumal/cockpit                     # 可选
pnpm add -D @lumal/vite
pnpm add @lumal/vben-compat                 # 迁移
```

## 本地 monorepo

```json
{
  "dependencies": {
    "@lumal/core": "workspace:*",
    "@lumal/icons": "workspace:*",
    "@lumal/icons-vue": "workspace:*"
  }
}
```

## 外部项目 file 依赖

```bash
pnpm add @lumal/core@file:../lumal/packages/core
```

使用前在 monorepo 根目录 `pnpm build`。

## 环境变量（文档构建）

| 变量 | 含义 | 默认 |
| --- | --- | --- |
| `LUMAL_DOCS_URL` | 文档站根 | `https://lumal-docs-cf.pages.dev` |
| `LUMAL_ADMIN_DEMO_URL` | Admin 演示 | `https://lumal-admin-demo.vercel.app` |
| `LUMAL_COCKPIT_DEMO_URL` | 驾驶舱演示 | `https://lumal-cockpit-demo.vercel.app` |
| `LUMAL_DATAV_GUIDE_URL` | DataV 指南 | `https://lumal-datav-guide.vercel.app` |
| `LUMAL_GITHUB_URL` | 仓库 | `https://github.com/cuteyuchen/lumal` |
| `LUMAL_NPM_*` | 各包 npm 页 | 对应的 npm 正式包页面 |

配置文件：`apps/lumal-docs/src/.vitepress/config/links.ts`。

## Peer 依赖摘要

见各 [包文档](/packages/) 页内说明。
