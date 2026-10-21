# 关于 Lumal

你正在阅读的是 **Lumal** 文档站（`apps/lumal-docs`）。

- 可复用能力沉淀在 `packages/*`，业务接口字段、状态码和页面逻辑不得进入框架包。
- `apps/lumal-admin` 是公开 API 的集成示例与验收入口。
- 文档站结构对齐常见企业级文档（指南 / 包 / 组件 / 参考），便于检索与二次维护。

[Lumal](https://github.com/cuteyuchen/lumal) 是一套面向中小型后台项目的轻量 Vue Admin 基础设施，基于 [Vue 3](https://vuejs.org/)、[Vite](https://vitejs.dev/)、[TypeScript](https://www.typescriptlang.org/) 与 [Element Plus](https://element-plus.org/)，提供应用安装、布局导航、主题、权限、路由、请求、字典、Schema 表单 / 表格、CRUD、图标、图表、DataV 可视化与驾驶舱编排能力。

## 特点

- **最新技术栈**：Vue 3、Vite、TypeScript、Element Plus、Pinia、Vue Router。
- **按职责拆包**：`@lumal/core`、icons、charts、datav、cockpit、vite 等独立发布单元。
- **权限与菜单**：静态 / 远程菜单统一运行时、动态路由、403/404、指令级权限。
- **多主题偏好**：明暗 / 系统主题、字号、布局与标签偏好持久化。
- **Schema 驱动**：表单、表格、CRUD 与字典联动，适配非标准后端字段。
- **驾驶舱**：通用编排框架 + DataV 组件包，业务模块由应用注册。
- **工程化**：pnpm monorepo、Changesets、Playwright 关键流程、包边界检查。
- **迁移友好**：`@lumal/vben-compat` 覆盖常见旧写法（不完整复刻 Vben）。

## 浏览器支持

- **本地开发**推荐 Chrome 最新版。
- **生产环境**支持现代浏览器，不支持 IE。

| IE | Edge | Firefox | Chrome | Safari |
| --- | --- | --- | --- | --- |
| 不支持 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 | 最近 2 个版本 |

## 工作区一览

| 目录 | 职责 |
| --- | --- |
| `packages/core` | 安装器、布局、路由、权限、请求、主题、核心组件 |
| `packages/icons` / `icons-vue` | 图标内核与 Vue 适配 |
| `packages/charts` | 可选 ECharts 面板 |
| `packages/datav` | DataV 可视化组件 |
| `packages/cockpit` | 驾驶舱编排 / Designer |
| `packages/vite` | resolver 与 monorepo alias |
| `packages/vben-compat` | 迁移兼容层 |
| `packages/create-lumal-admin` | 脚手架 |
| `apps/lumal-admin` | Admin 集成示例 |
| `apps/lumal-cockpit` | 驾驶舱示例 |
| `apps/lumal-datav-guide` | DataV 指南站 |
| `apps/lumal-docs` | **本文档站** |
| `apps/lumal-mock-api` | Mock 接口 |

## 下一步

- [为什么选择 Lumal](./why)
- [快速开始](./quick-start)
- [包使用概览](/packages/)
