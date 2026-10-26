# Lumal

Lumal 是一套供个人长期使用、同时开放给其他开发者的轻量 Vue 3 项目基础设施。Admin 以 TypeScript、Vite 和 Element Plus 为基础；独立 Screen 和纯 Blank 按需组合，不为普通 Vue 应用强加后台依赖。公共包集中维护布局、权限、请求、CRUD、图表和屏幕适配等重复能力。

`apps/lumal-admin` 是公开 API 的集成示例与验收入口；可复用能力必须沉淀到 `packages/*`，业务接口字段、状态码和页面逻辑不得进入框架包。

当前工作区与本文 API 基线为已发布的 `0.0.7-beta`，十个公共包保持同版。
正式标签门禁、registry、同次发布产物及六类 registry 消费者均完成核验，见 [本版发布记录](docs/npm-release-0.0.7-beta.md)。
下列 npm 命令显式选择本版，不依赖浮动标签。发布核验时十包 `beta` 均为 `0.0.7-beta`；
既有九包 `latest` 保持 `0.0.1-beta`，`@lumal/viewport` 的 `latest` 保持 `0.0.6-beta`。
后续接入仍需核对实际安装版本；开发未发布源码时使用精确提交的本地 tarball。
公共包发布不等于业务验收或生产部署。
历史 [0.0.6-beta](docs/npm-release-0.0.6-beta.md) 与 [0.0.5-beta](docs/npm-release-0.0.5-beta.md) 的发布记录继续保留。

## 当前能力

- 统一 `create-lumal` bin 生成 Admin、Screen、Blank，旧 Admin 命令与参数保留。
- 所有模板具备 ESLint、Prettier、EditorConfig、AI 规范和统一 `pnpm check`。
- Screen 的认证、业务数据、路由、可视化和视口能力独立选择；Blank 默认仅 Vue。
- `@lumal/viewport` 支持应用默认、页面和容器适配，不变换 DOM 根或全局后台字号。
- 请求会话隔离与无业务字段序号列的修复，配套脱敏真实消费者契约。
- Vite 定向转换增加属性、选择器、声明和可选 Vue 行内样式控制，保护已有适配表达式。
- `0.0.7-beta` 提供 Screen 共享设计配置，并修复 Cockpit Designer 名称输入；已通过正式发布与 registry 核验。

创建方式见 [项目模板](docs/project-template-guide.md)，
三级适配见 [屏幕与工作区](docs/screen-viewport-guide.md)，
兼容边界见 [真实消费者](docs/real-consumer-compatibility.md) 与 [升级指南](docs/upgrade-guide.md)。
通用 binary 仍由 `create-lumal-admin` 包分发，没有新增独立的 `create-lumal` npm 包；
不要把 `pnpm create lumal` 当成已发布命令。

## Demo 后续整改

仓库示例补充 Cockpit 的直接 Viewport 实验、错误恢复和配置交互，
以及 Admin 的 Viewport / DataV / 轻量 Cockpit Runtime 示例。公开 API 以已发布的 `0.0.7-beta` 为基线；
Designer 名称输入修复自本版提供，历史 `0.0.6-beta` 不包含该补丁。生产站点另行核对部署提交。
接入代码见 [Demo 指南](docs/demo-integration-guide.md)，十包能力见 [覆盖表](docs/public-package-coverage.md)，
实际环境、构建与浏览器证据见 [整改验收](docs/cockpit-demo-remediation-2026-10-26.md)。

## 快速开始

环境要求：Node.js 22.12+、pnpm 10.33.0。

```bash
pnpm install
pnpm admin:dev
```

`pnpm admin:dev` 会直接解析 `packages/*/src` 并启用 Vite HMR，无需预先构建各包。

创建新项目：

```bash
pnpm create lumal-admin@0.0.7-beta my-admin --preset standard
# 通用入口由现有包提供，明确选择 binary。
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal my-screen --template screen
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal my-blank --template blank
```

应用侧最小接入：

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
import App from './App.vue'

await createLumalAdmin({
  rootComponent: App,
}).mount('#app')
```

该示例不安装默认 UI 注册表。使用布局、表单等 UI 时，显式导入组件并安装对应 peer 和样式；脚手架会完成这些接线。

## 工作区

| 目录 | 职责 |
| --- | --- |
| `packages/icons` | 框架无关的图标注册、SVG 处理和构建能力 |
| `packages/icons-vue` | Vue 图标组件、选择器和响应式注册表适配 |
| `packages/core` | 安装器、布局、路由、权限、请求、主题、字典和核心组件 |
| `packages/charts` | 可选 ECharts 面板与自适应能力 |
| `packages/viewport` | 纯 Vue 容器尺寸、全局默认/页面/容器适配，不依赖后台或图表 |
| `packages/datav` | 面向驾驶舱的 Vue 3 DataV 可视化包（15 个导出组件，含变体共 38 种形态） |
| `packages/cockpit` | 通用驾驶舱编排框架：布局运行时、组件注册、设计器与消息总线 |
| `packages/vben-compat` | 常用旧项目写法到 Lumal 原生 API 的迁移层 |
| `packages/vite` | 组件 resolver、工作区 alias 和可选 Devtools 配置助手 |
| `packages/create-lumal-admin` | Admin/Screen/Blank 项目脚手架，保留旧 Admin 入口 |
| `apps/lumal-admin` | 原生 Admin 集成、系统管理示例和浏览器验收入口 |
| `apps/lumal-cockpit` | 独立驾驶舱示例应用 |
| `apps/lumal-datav-guide` | `@lumal/datav` 组件指南站，可静态托管并作为 Admin 外链嵌入 |
| `apps/lumal-viewport-lab` | 脱敏工作区与真实浏览器缩放验收，非业务应用 |
| `apps/lumal-mock-api` | Nitro/H3 演示接口服务 |
| `apps/vben-compat-demo` | 兼容层构建示例 |

依赖方向固定为：

```text
@lumal/icons  →  @lumal/icons-vue
     ↑                  ↑
     └──────── @lumal/core  ←  apps/lumal-admin
     ↑
@lumal/cockpit  ←  apps/lumal-cockpit
     ↑
@lumal/vben-compat  ←  apps/vben-compat-demo

@lumal/charts  ←  apps/lumal-admin
@lumal/viewport ← @lumal/datav, @lumal/cockpit, 普通 Vue / Screen
@lumal/datav   ←  apps/lumal-admin, apps/lumal-cockpit, apps/lumal-datav-guide
@lumal/vite    →  Vite 配置与构建辅助
create-lumal-admin  →  生成消费公开包入口的应用
```

`@lumal/datav` 是独立可视化包，不依赖 `@lumal/core`；Vue 保持 peer，ECharts peer 为可选，只有实际使用 ECharts 图表才需安装。DataV `config` 模式声明 `@jiaminghi/charts` 运行时依赖。DataV/Cockpit 共享 `@lumal/viewport` 的算法与尺寸监听；旧缩放契约保持。三级适配与地图约定见[屏幕适配指南](docs/screen-viewport-guide.md)。

需要严格轻量启动时使用 `@lumal/core/minimal`，只显式注册需要的组件；根入口保留默认 UI 便利接线。`@lumal/core/request` 等纯服务子入口无需 Element Plus。DataV 通用图表按模式动态加载引擎，无引擎组件可使用独立子入口。

## AI Skill

[Lumal 总 Skill](skills/lumal/SKILL.md) 以已发布的 `0.0.7-beta` 为 API 基线，覆盖十个公共包。该基线不保证一直是 npm 最新版本，接入时核对 registry 与实际安装包。总入口负责包选型，详细示例按任务从 `references/` 读取，不要求每次加载整套文档。

将 `skills/lumal` 整个目录安装到 AI 工具支持的 Skill 目录后，可用 `$lumal` 显式调用。安装位置、示例请求与维护说明见 [AI Skill 指南](apps/lumal-docs/src/guide/essentials/ai-skills.md)。

## 当前稳定能力

- Element Plus 驱动的三种桌面布局、移动抽屉菜单和完整标签页工作流。
- 静态与后端菜单统一运行时、权限过滤、原子动态路由、403/404、外链和登出重置闭环。
- 面包屑、全局搜索、父菜单高亮、菜单徽标和动态页面标题。
- 明暗/系统主题、全局字号、布局与标签偏好持久化、重置、导出和设置抽屉。
- 字典上下文、标准 `{ items }` 响应、字段映射与颜色标签回显。
- `LumalSchemaForm`、`LumalSchemaTable`、`LumalCrudTable`、页面与分页组件。
- fetch 请求客户端、统一错误、接口适配、Token 刷新单飞和安全重放。
- 用户、角色、菜单、字典和系统配置 Mock CRUD 页面。
- 框架无关图标内核、Vue 图标适配层、图表工作流、迁移兼容层、Vite 助手和后台脚手架。
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
pnpm format:check
pnpm test:create-projects
pnpm test:viewport
pnpm release:boundaries
pnpm release:artifacts
pnpm pack:dry-run
pnpm release:check
```

beta 版本准备使用 `pnpm release:version <version>`，仅同步包版本与内部依赖；锁文件、日志、文档和验收步骤见 [发布检查清单](docs/release-checklist.md)。

构建任务会清理并重建 `dist`，组合执行时保持串行，避免消费方在产物重建过程中读取到不完整声明。

## 开发约定

- Vue 组件使用 `<script setup lang="ts">`，模板引用优先使用 `useTemplateRef`。
- 样式使用 SCSS 和语义变量，不在业务组件中重复硬编码主题色、间距和层级。
- Admin 只通过 `@lumal/*` 公开入口消费包能力，不直连包源码或包内测试文件。
- 每个阶段完成后先验证，再按 `<type>(<scope>): <中文动宾描述>` 提交。
- 不自动推送；不同 Conventional Commit 类型的修改拆分提交。

## 文档

VitePress 文档站位于 `apps/lumal-docs`（信息架构对齐 [Vben 文档](https://doc.vben.pro/)：指南 / 包使用 / 组件 / 参考）：

```bash
pnpm docs:dev      # http://127.0.0.1:5173
pnpm docs:build    # 产物 apps/lumal-docs/dist
pnpm docs:preview
```

- 指南：简介 · 基础 · 深入 · 工程 · FAQ
- 包使用：`@lumal/*` 与 `create-lumal-admin`（含本地路径、npm 地址与 peer 依赖）
- 组件：Layout · Schema 表单表格 · Charts · DataV · Cockpit
- 参考：同步自根目录 `docs/*.md`

| 公开站点 | 地址 |
| --- | --- |
| 文档 | https://lumal.cuteyuchen.top |
| Admin | https://lumal-admin.cuteyuchen.top |
| 驾驶舱 | https://lumal-cockpit.cuteyuchen.top |
| DataV 指南 | https://lumal-datav.cuteyuchen.top |
| Vben 兼容示例 | https://lumal-compat.cuteyuchen.top |

站点链接默认使用上述自定义域名；自建部署可在 `apps/lumal-docs/src/.vitepress/config/links.ts` 对应的 `LUMAL_*_URL` 环境变量中覆盖。

仓库内 Markdown 索引见 [docs/README.md](docs/README.md)。
