# 安装与包地址

## 包列表

> 在线文档：[Lumal 文档](https://lumal.cuteyuchen.top)

| 包名 | 本地路径 | 文档 | npm 地址 |
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

下列命令对应 `0.0.5-beta`，显式指定预发布版本，不依赖 npm 的 `latest` 标签。
实际可用版本以 registry 和发布工作流为准；开发尚未发布的源码时，按
[升级验收](/reference/upgrade-verification) 构建并运行独立 tarball 消费测试。

```bash
pnpm add @lumal/core@0.0.5-beta @lumal/icons@0.0.5-beta @lumal/icons-vue@0.0.5-beta vue@^3.5 vue-router@^4.5 element-plus@^2.11 @iconify/vue@^5
pnpm add @lumal/charts@0.0.5-beta echarts@^6 vue-echarts@^8   # 可选
pnpm add @lumal/datav@0.0.5-beta echarts@^6                  # 可选
pnpm add @lumal/cockpit@0.0.5-beta                           # 可选
pnpm add -D @lumal/vite@0.0.5-beta
pnpm add @lumal/vben-compat@0.0.5-beta                       # 迁移
```

Pinia 是可选 peer；使用 `createPinia()` 时另装 `pinia@^3.0.3`，框架不会自动创建 Store。图表不再兼容 ECharts 5 / vue-echarts 7；默认主题与布局迁移注意事项见 [更新日志](/reference/changelog)。

只使用 `@lumal/core/minimal` 或 request 等纯服务子入口时，只需安装 Core 和 Vue，无需 Element Plus；消费 UI、图标或 Router 子入口时再安装对应 peer。

开发分支新增 Blank/Screen 模板与仅 Vue peer 的 `@lumal/viewport`，并把 DataV 的
ECharts peer 改为可选；纯数字/边框不需要图表引擎。这些能力尚未发布，不能由历史
`0.0.5-beta` 命令取得。候选接入与按需依赖见[项目模板](/reference/project-template-guide)
及[屏幕适配](/reference/screen-viewport-guide)；历史脚手架仍是 Admin 基座。

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
| `LUMAL_DOCS_URL` | 文档站根 | `https://lumal.cuteyuchen.top` |
| `LUMAL_ADMIN_DEMO_URL` | Admin 演示 | `https://lumal-admin.cuteyuchen.top` |
| `LUMAL_COCKPIT_DEMO_URL` | 驾驶舱演示 | `https://lumal-cockpit.cuteyuchen.top` |
| `LUMAL_DATAV_GUIDE_URL` | DataV 指南 | `https://lumal-datav.cuteyuchen.top` |
| `LUMAL_VBEN_COMPAT_DEMO_URL` | Vben 兼容示例 | `https://lumal-compat.cuteyuchen.top` |
| `LUMAL_GITHUB_URL` | 仓库 | `https://github.com/cuteyuchen/lumal` |
| `LUMAL_NPM_*` | 各包 npm 页 | 对应的 npm 正式包页面 |

配置文件：`apps/lumal-docs/src/.vitepress/config/links.ts`。环境变量会去除首尾空白，空值使用上述默认地址。自定义域名已绑定到现有 Vercel 项目，Cloudflare 仅负责 DNS 解析，不使用 Pages 部署。

## Peer 依赖摘要

以下范围与已发布包的 `peerDependencies` 一致；按实际使用的入口安装，不必为了纯服务入口安装全部 UI peer。

| 依赖 | 兼容范围 | 使用场景 |
| --- | --- | --- |
| `vue` | `^3.5.0` | Core、Vue 图标、Charts、DataV、Cockpit、兼容层 |
| `vue-router` | `^4.5.0` | Core 路由与布局接入，可选 peer |
| `element-plus` | `^2.11.0` | Core / Cockpit UI；Core 中为可选 peer |
| `pinia` | `^3.0.3` | 应用显式接入 Pinia，Core 可选 peer |
| `@iconify/vue` | `^5.0.0` | Vue 图标适配 |
| `echarts` | `^6.0.0` | Charts / DataV 图表 |
| `vue-echarts` | `^8.0.0` | Charts |
| `morphicons` | `2.0.0` | 纯图标包 `/morph` 的可选 peer；静态图标无需单独安装 |

包内运行时依赖由包管理器安装；例如 DataV 的 `@jiaminghi/charts` 不需要消费方重复声明。公开入口和样式接线见各 [包文档](/packages/)。
