---
layout: home
title: Lumal
titleTemplate: 轻量 Vue Admin 基础设施

hero:
  name: Lumal
  text: 轻量 Vue Admin 基础设施
  tagline: 开箱可用的布局权限、Schema 表单表格、图标图表、DataV 与驾驶舱编排 · 业务协议留在应用层
  image:
    src: /logo.svg
    alt: Lumal
  actions:
    - theme: brand
      text: 快速开始 →
      link: /guide/introduction/quick-start
    - theme: alt
      text: 包使用说明
      link: /packages/
    - theme: alt
      text: 组件文档
      link: /components/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/example/lumal

features:
  - icon: 🚀
    title: 最新技术栈
    details: Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router。pnpm monorepo 工程化，Changesets 发布。
    link: /guide/introduction/lumal
    linkText: 了解 Lumal
  - icon: 📦
    title: 按职责拆包
    details: core / icons / charts / datav / cockpit / vite 等独立包，按需安装，边界清晰，可发布 npm。
    link: /packages/
    linkText: 包使用
  - icon: 🎨
    title: 主题与布局
    details: 明暗/系统主题、全局字号、侧栏顶栏混合布局、标签工作流与偏好持久化。
    link: /guide/in-depth/theme
    linkText: 主题文档
  - icon: 🔐
    title: 权限与路由
    details: 静态与远程菜单统一运行时、权限过滤、动态路由、403/404 与指令级控制。
    link: /guide/in-depth/access
    linkText: 权限文档
  - icon: 🧩
    title: Schema 表单表格
    details: LumalSchemaForm / SchemaTable / CrudTable，字典联动、列设置、查询区自适应列数。
    link: /components/form/lumal-schema-form
    linkText: 组件文档
  - icon: 📺
    title: 驾驶舱与 DataV
    details: 通用布局编排 + Designer + 消息总线；15 个 DataV 导出组件，含变体共 38 种形态。
    link: /packages/cockpit
    linkText: 驾驶舱包
  - icon: ⚡
    title: Vite 工具链
    details: 组件 resolver、工作区 source/dist alias，monorepo 开发免预构建。
    link: /packages/vite
    linkText: '@lumal/vite'
  - icon: 🧱
    title: 脚手架
    details: create-lumal-admin 一键生成通过公开包入口消费的后台基座。
    link: /packages/create-lumal-admin
    linkText: create-lumal-admin
---

## 快速安装

当前工作区准备版本为 `0.0.4-beta`，以下命令在本版发布后使用；显式指定版本，不依赖 npm 的 `latest` 标签，见 [更新日志](/reference/changelog)。

::: code-group

```bash [npm]
pnpm add @lumal/core@0.0.4-beta @lumal/icons@0.0.4-beta @lumal/icons-vue@0.0.4-beta @iconify/vue element-plus vue vue-router
```

```bash [本地 monorepo]
# 在 apps 或外部项目 package.json
"@lumal/core": "workspace:*"
# 或
pnpm add @lumal/core@file:../lumal/packages/core
```

```bash [脚手架]
pnpm create lumal-admin@0.0.4-beta my-admin
cd my-admin && pnpm install && pnpm dev
```

:::

## 包地址占位

| 包 | 文档 | 本地路径 | 正式地址（上线后） |
| --- | --- | --- | --- |
| `@lumal/core` | [/packages/core](/packages/core) | `packages/core` | `https://www.npmjs.com/package/@lumal/core` |
| `@lumal/icons` | [/packages/icons](/packages/icons) | `packages/icons` | `https://www.npmjs.com/package/@lumal/icons` |
| `@lumal/icons-vue` | [/packages/icons-vue](/packages/icons-vue) | `packages/icons-vue` | `https://www.npmjs.com/package/@lumal/icons-vue` |
| `@lumal/charts` | [/packages/charts](/packages/charts) | `packages/charts` | `https://www.npmjs.com/package/@lumal/charts` |
| `@lumal/datav` | [/packages/datav](/packages/datav) | `packages/datav` | `https://www.npmjs.com/package/@lumal/datav` |
| `@lumal/cockpit` | [/packages/cockpit](/packages/cockpit) | `packages/cockpit` | `https://www.npmjs.com/package/@lumal/cockpit` |
| `@lumal/vite` | [/packages/vite](/packages/vite) | `packages/vite` | `https://www.npmjs.com/package/@lumal/vite` |
| `@lumal/vben-compat` | [/packages/vben-compat](/packages/vben-compat) | `packages/vben-compat` | `https://www.npmjs.com/package/@lumal/vben-compat` |
| `create-lumal-admin` | [/packages/create-lumal-admin](/packages/create-lumal-admin) | `packages/create-lumal-admin` | `https://www.npmjs.com/package/create-lumal-admin` |

> 演示与 npm 外链当前指向本地占位，部署时通过环境变量替换，见 [安装与包地址](/guide/essentials/installation)。
