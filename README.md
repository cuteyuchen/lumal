# Luma

Luma 是一套面向中小型后台项目的轻量 Vue Admin 基础设施。它以 Vue 3、TypeScript、Vite 和 Element Plus 为基础，提供应用安装、布局导航、主题、权限、路由、请求、字典、Schema 表单、Schema 表格、CRUD、图标、图表、驾驶舱编排、DataV 可视化组件和迁移兼容能力。

`apps/luma-admin` 是公开 API 的集成示例与验收入口；可复用能力必须沉淀到 `packages/*`，业务接口字段、状态码和页面逻辑不得进入框架包。

## 快速开始

环境要求：Node.js 20+、pnpm 10.33.0。

```bash
pnpm install
pnpm admin:dev
```

`pnpm admin:dev` 会直接解析 `packages/*/src` 并启用 Vite HMR，无需预先构建各包。

创建新项目：

```bash
pnpm create luma-admin my-admin
```

应用侧最小接入：

```ts
import { createLumaAdmin } from '@luma/core'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons/style.css'
import App from './App.vue'

createLumaAdmin({
  rootComponent: App,
}).mount('#app')
```

## 工作区

| 目录 | 职责 |
| --- | --- |
| `packages/icons` | 独立图标注册、渲染、选择和构建能力 |
| `packages/core` | 安装器、布局、路由、权限、请求、主题、字典和核心组件 |
| `packages/charts` | 可选 ECharts 面板与自适应能力 |
| `packages/datav` | 面向驾驶舱的 Vue 3 DataV 可视化组件包（38 个组件重构） |
| `packages/cockpit` | 通用驾驶舱编排框架：布局运行时、组件注册、设计器与消息总线 |
| `packages/vben-compat` | 常用旧项目写法到 Luma 原生 API 的迁移层 |
| `packages/vite` | 组件 resolver、工作区 alias 和可选 Devtools 配置助手 |
| `packages/create-luma-admin` | 轻量后台项目脚手架 |
| `apps/luma-admin` | 原生 Admin 集成、系统管理示例和浏览器验收入口 |
| `apps/luma-cockpit` | 独立驾驶舱示例应用 |
| `apps/luma-datav-guide` | `@luma/datav` 组件指南站，可静态托管并作为 Admin 外链嵌入 |
| `apps/luma-mock-api` | Nitro/H3 演示接口服务 |
| `apps/vben-compat-demo` | 兼容层构建示例 |

依赖方向固定为：

```text
@luma/icons
     ↑
@luma/core  ←  apps/luma-admin
     ↑
@luma/cockpit  ←  apps/luma-admin, apps/luma-cockpit
     ↑
@luma/vben-compat  ←  apps/vben-compat-demo

@luma/charts  ←  apps/luma-admin
@luma/datav   ←  apps/luma-admin, apps/luma-cockpit, apps/luma-datav-guide
@luma/vite    →  Vite 配置与构建辅助
create-luma-admin  →  生成消费公开包入口的应用
```

`@luma/datav` 是独立可视化包，只把 `vue` 和 `echarts` 作为 peer dependency，不依赖 `@luma/core`；驾驶舱和 Admin 直接按需消费其组件。

## 当前稳定能力

- Element Plus 驱动的三种桌面布局、移动抽屉菜单和完整标签页工作流。
- 静态与后端菜单统一运行时、权限过滤、原子动态路由、403/404、外链和登出重置闭环。
- 面包屑、全局搜索、父菜单高亮、菜单徽标和动态页面标题。
- 明暗/系统主题、全局字号、布局与标签偏好持久化、重置、导出和设置抽屉。
- 字典上下文、标准 `{ items }` 响应、字段映射与颜色标签回显。
- `LumaSchemaForm`、`LumaSchemaTable`、`LumaCrudTable`、页面与分页组件。
- fetch 请求客户端、统一错误、接口适配、Token 刷新单飞和安全重放。
- 用户、角色、菜单、字典和系统配置 Mock CRUD 页面。
- 响应式图标系统、图表工作流、迁移兼容层、Vite 助手和后台脚手架。
- DataV 可视化组件包：15 个组件覆盖边框、装饰、数字翻牌、胶囊图、水位图、飞线图、滚动表和原生 ECharts 封装，支持 DataV `config` 与现代 props 双套 API。
- Playwright 关键流程验收、跨平台 CI、Changesets、CodeQL、明确 vendor 分包和发布产物体积门禁。

全量重构已完成，阶段实施记录和最终验收结果统一维护在 [开发路线图](docs/development-roadmap.md)。

## 标准模型与适配原则

框架内部优先使用稳定的语义字段：

- 菜单：`path`、`name`、`component`、`children`、`meta.title`、`meta.authority`、`meta.activeMenu`、`meta.badge`。
- 字典：`label`、`value`、`color`、`disabled`、`children`。
- 表单和表格：`field`、`dictionary`、`options`、`componentProps`。
- 分页：`{ items, total }`。
- 会话：`{ accessToken, refreshToken?, expiresAt? }`。

非标准后端结构必须在应用适配层通过 `fieldNames`、`parseResponse`、`transform` 或专用 adapter 转换。组件内不得散落公司分页字段、Token 字段、菜单字段和业务状态码判断。

## 常用命令

请直接使用项目声明的 pnpm 版本，不通过可能在部分 Windows 环境切换错误版本的 Corepack 包装执行。

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm admin:build
pnpm compat:build
pnpm test:e2e
pnpm lint
pnpm release:boundaries
pnpm release:artifacts
pnpm pack:dry-run
pnpm release:check
```

构建任务会清理并重建 `dist`，组合执行时保持串行，避免消费方在产物重建过程中读取到不完整声明。

## 开发约定

- Vue 组件使用 `<script setup lang="ts">`，模板引用优先使用 `useTemplateRef`。
- 样式使用 SCSS 和语义变量，不在业务组件中重复硬编码主题色、间距和层级。
- Admin 只通过 `@luma/*` 公开入口消费包能力，不直连包源码或包内测试文件。
- 每个阶段完成后先验证，再按 `<type>(<scope>): <中文动宾描述>` 提交。
- 不自动推送；不同 Conventional Commit 类型的修改拆分提交。

## 文档

- [开发路线图](docs/development-roadmap.md)
- [架构说明](docs/architecture.md)
- [Core API](docs/core-api.md)
- [Mock API 与线上 Demo 部署](docs/mock-api.md)
- [图标系统](docs/icons.md)
- [DataV 组件示例](docs/datav-examples.md)
- [包边界](docs/package-boundaries.md)
- [发布检查清单](docs/release-checklist.md)
- [从 Vben 迁移](docs/migration-from-vben.md)
