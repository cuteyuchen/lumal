# 安装与包地址

## 包列表

> 在线文档：[Lumal 文档](https://luma-docs-seven.vercel.app)

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

## npm 安装

当前工作区及下列命令对应 `0.0.5-beta`。2026-10-20 核对 registry 的 beta
仍为 `0.0.4-beta`，latest 为 `0.0.1-beta`；本轮仅验证本地 tarball，没有执行发布。
下列命令以 registry 存在对应版本为前提；当前可从源码构建，或按
[升级验收](/reference/upgrade-verification) 运行独立 tarball 消费测试。

```bash
pnpm add @lumal/core@0.0.5-beta @lumal/icons@0.0.5-beta @lumal/icons-vue@0.0.5-beta @iconify/vue element-plus vue vue-router
pnpm add @lumal/charts@0.0.5-beta echarts@^6 vue-echarts@^8   # 可选
pnpm add @lumal/datav@0.0.5-beta echarts@^6                  # 可选
pnpm add @lumal/cockpit@0.0.5-beta                           # 可选
pnpm add -D @lumal/vite@0.0.5-beta
pnpm add @lumal/vben-compat@0.0.5-beta                       # 迁移
```

Pinia 不是默认依赖，应用需要时自行安装。图表不再兼容 ECharts 5 / vue-echarts 7；默认主题与布局迁移注意事项见 [更新日志](/reference/changelog)。

只使用 `@lumal/core/minimal` 或 request 等纯服务子入口时，只需安装 Core 和 Vue，无需 Element Plus；消费 UI、图标或 Router 子入口时再安装对应 peer。脚手架本身是带 Element Plus 的后台基座。

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
| `LUMAL_DOCS_URL` | 文档站根 | `https://luma-docs-seven.vercel.app` |
| `LUMAL_ADMIN_DEMO_URL` | Admin 演示 | `https://lumal-admin-demo.vercel.app` |
| `LUMAL_COCKPIT_DEMO_URL` | 驾驶舱演示 | `https://lumal-cockpit-demo.vercel.app` |
| `LUMAL_DATAV_GUIDE_URL` | DataV 指南 | `https://lumal-datav-guide.vercel.app` |
| `LUMAL_GITHUB_URL` | 仓库 | `https://github.com/cuteyuchen/lumal` |
| `LUMAL_NPM_*` | 各包 npm 页 | 对应的 npm 正式包页面 |

配置文件：`apps/lumal-docs/src/.vitepress/config/links.ts`。

## Peer 依赖摘要

见各 [包文档](/packages/) 页内说明。
