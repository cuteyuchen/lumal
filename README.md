# Luma

Luma 是一个面向中小型后台项目的轻量 Vue Admin 框架。它的最终目标不是复刻一个完整的 Vben Admin，也不是沉淀公司内部业务框架，而是打造一套可以独立发包、可以稳定复用、可以让 Vben 用户低成本迁移的开源 Admin 基础设施。

用 `@luma/*` 包创建出来的后台管理平台叫 `luma-admin`。`luma-admin` 本身应该是示例、模板和验证入口；真正可复用、可发布的能力必须沉淀在包中。

## 最终目标

Luma 要成为一个“mini 但完整”的 Vue Admin 方案：

- **轻量**：不默认携带小型项目不需要的多语言、大型偏好设置、重型插件链和业务模板。
- **通用**：不绑定公司后端字段、接口路径、状态码、菜单结构或业务 store。
- **可迁移**：保留 `useVbenForm`、`useVbenVxeGrid` 等常用 Vben 写法兼容层，同时保留 Luma 原生写法。
- **可发包**：`@luma/core`、`@luma/icons`、`@luma/vben-compat`、`create-luma-admin` 都按 npm 包设计，而不是普通项目源码。
- **可验证**：所有核心能力都在 `apps/luma-admin` 中直接使用公开包入口验证，不再维护独立 playground。
- **可维护**：接口字段使用语义化标准字段；非标准后端结构通过 `fieldNames`、`parseResponse` 等显式配置适配。

目标形态是：开发者可以用 Luma 快速搭建后台项目，获得布局、菜单、权限、主题、图标、字典、请求、表单、表格、CRUD 等基础能力；如果来自 Vben 项目，可以先通过兼容层平滑迁移，再逐步改成 Luma 原生 API。

## 技术栈

- Vue 3
- TypeScript
- Vite
- pnpm workspace
- Element Plus
- SCSS
- Vitest
- Vue Test Utils

## 包边界

### `@luma/icons`

独立图标系统，不依赖 `@luma/core`。

计划和已有职责：

- 图标注册表
- Iconify 图标适配
- 本地 SVG 适配
- data URI 生成
- `LumaIcon`
- 图标选择器
- 构建期 SVG 注入能力

### `@luma/core`

Luma 的后台核心包。

职责：

- 应用安装器
- 后台布局
- 路由和菜单辅助
- 权限 store、权限守卫和权限指令
- 请求客户端辅助
- 主题运行时
- 字典能力
- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- 页面容器、信息表格、分页等基础组件

`@luma/core` 不应该依赖 `@luma/vben-compat`，也不应该默认依赖 VXE。

### `@luma/vben-compat`

Vben 常用写法兼容层，只用于降低迁移成本。

职责：

- `useVbenForm`
- `useVbenVxeGrid`
- Vben 风格 schema 到 Luma 原生配置的转换
- 常用 Vben grid/form 调用方式兼容

新页面优先使用 Luma 原生 API；旧项目迁移时再使用兼容层。

### `@luma/charts`

可选图表包，基于 ECharts 与 vue-echarts 封装 `LumaChart`、`LumaChartPanel`、`useChartResize`。ECharts、vue-echarts 作为 peer dependency，不进入 `@luma/core` 默认依赖，符合 Luma mini 定位。

### `create-luma-admin`

脚手架包，用于创建基于 Luma 包的后台项目模板。

## 目标使用方式

安装核心包：

```bash
pnpm add @luma/core @luma/icons element-plus vue
```

如果需要迁移 Vben 常用写法：

```bash
pnpm add @luma/vben-compat
```

创建后台项目：

```bash
pnpm create luma-admin my-admin
```

Luma 原生写法示例：

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

Vben 兼容写法示例：

```ts
import { useVbenForm, useVbenVxeGrid } from '@luma/vben-compat'

const [, formApi] = useVbenForm({
  schemas: [
    { fieldName: 'keyword', label: '关键词', component: 'Input' },
  ],
})

const [, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', title: '名称' },
    ],
  },
})
```

## 当前开发进度

截至 2026-07-10，当前仓库已经完成以下基线：

- monorepo 工程结构、pnpm workspace、MIT License。
- `@luma/icons` 独立包基线。
- `@luma/core` 应用安装器、布局、权限、请求、主题、字典、基础组件。
- `@luma/vben-compat` 常用写法适配基线。
- `create-luma-admin` 脚手架包基线。
- `apps/luma-admin` 作为唯一原生示例和验证入口。
- 删除独立 playground，后续示例统一进入 admin 路由体系中验证。

已经完成并提交的增强阶段：

- Schema Form 增强：支持 `create/edit/view` 模式、更多控件、校验、布局、权限、字典、插槽和公开方法。
- Schema Table 增强：支持 selection、index、loading、pagination、列隐藏、列权限、Element Plus 透传、字典回显和操作列插槽。
- CRUD Table 增强：支持标准 `dataSource`、远程加载、分页、查询、新增、查看、编辑、删除、批量删除、loading、error 和标准响应 `{ items, total }`。

当前正在推进的阶段：

- 阶段 2：权限和动态路由体系升级。
- 当前工作区已有路由相关草稿改动：菜单字段显式映射、动态路由注册器、对应测试。
- 后续还需要继续补齐 `meta.authority` 权限守卫、登录守卫、白名单、403/404 兜底、动态菜单过滤、首个可访问菜单解析、admin 中的完整路由权限示例。

## 后续开发目标

优先级从高到低：

1. **权限和动态路由**
   - 标准后端菜单模型。
   - 非标准字段通过 `fieldNames` 显式映射。
   - 动态路由注册和重置。
   - 登录态守卫和白名单。
   - 403/404 兜底。
   - 顶部菜单、侧边菜单和首个可访问菜单解析。
   - 在 `apps/luma-admin` 中用真实路由示例验证权限体系。

2. **Auth 会话能力**
   - token 存储。
   - 用户信息加载。
   - 登录、退出、刷新会话。
   - 不绑定具体接口字段，通过配置函数适配后端。

3. **主题能力完善**
   - 主题切换。
   - Element Plus 主题变量联动。
   - 暗色模式。
   - 主题设置面板。
   - admin 中提供可交互示例。

4. **字典能力继续打磨**
   - 标准响应固定为 `{ items: DictionaryOption[] }`。
   - 表单、表格、CRUD 中统一使用字典 options 和回显。
   - 非标准响应通过显式解析函数适配。

5. **组件和工具子入口**
   - `@luma/core/components`
   - `@luma/core/router`
   - `@luma/core/permission`
   - `@luma/core/request`
   - `@luma/core/theme`
   - `@luma/core/dictionary`
   - `@luma/core/composables`
   - `@luma/core/directives`
   - `@luma/core/utils`

6. **admin 示例完善**
   - 仪表盘。
   - 表单示例。
   - 表格示例。
   - CRUD 示例。
   - 字典示例。
   - 权限路由示例。
   - 主题切换示例。
   - 图标示例。
   - 请求和错误处理示例。

7. **发布前质量建设**
   - 单元测试覆盖核心行为。
   - admin 构建通过。
   - 包边界检查通过。
   - `pack --dry-run` 验证发包内容。
   - 文档同步 API。

## 字段设计原则

Luma 不沿用公司内部后端字段，也不默认猜测各种历史响应结构。

推荐标准字段：

- 路由权限：`meta.authority`、`meta.roles`、`meta.title`、`meta.icon`。
- 菜单：`id`、`parentId`、`title`、`path`、`name`、`component`、`redirect`、`children`。
- 字典：`type`、`label`、`value`、`color`、`disabled`。
- 表单：`field`、`label`、`component`、`dictionary`、`options`、`rules`、`defaultValue`、`componentProps`。
- 表格：`field`、`label`、`dictionary`、`options`、`formatter`、`componentProps`。
- CRUD 响应：`{ items, total }`。

非标准后端结构必须通过显式配置适配，例如：

- `fieldNames`
- `parseResponse`
- `transform`
- `componentResolver`

## 开发规范

- 始终使用中文文档和中文提交信息。
- Vue 组件使用 `<script setup lang="ts">`。
- Vue 组件 ref 使用 `useTemplateRef`。
- Vue 组件组合式 API 按 `/***********************说明*********************/` 功能块划分。
- 样式使用 SCSS。
- 包代码不能写业务接口、业务路由、业务 store。
- admin 应通过公开包入口消费能力，不直连包源码。
- 每个阶段完成后建议中文提交一次。

## 常用命令

```bash
corepack pnpm install
corepack pnpm build
corepack pnpm test
corepack pnpm lint
corepack pnpm release:boundaries
corepack pnpm admin:build
corepack pnpm compat:build
corepack pnpm pack:dry-run
```

开发 admin：

```bash
corepack pnpm admin:dev
```

注意：`luma-admin` 的类型和构建依赖 `@luma/core` 的产物声明。排查构建问题时，优先先构建 core，再构建 admin。

```bash
corepack pnpm --filter @luma/core build
corepack pnpm --filter luma-admin build
```

## 给后续 Claude 开发的接力说明

建议先阅读：

- `LUMA_DEVELOPMENT_PLAN.md`
- `docs/source-framework-migration-plan.md`
- `docs/core-api.md`
- `docs/architecture.md`
- `docs/package-boundaries.md`

开始开发前先检查：

```bash
git status --short --branch
git diff --stat
```

当前分支可能存在阶段 2 的未提交路由改动，请不要直接重置。后续开发应优先继续完成“权限和动态路由体系升级”，并在通过测试后提交中文 commit。

推荐阶段 2 的验证命令：

```bash
corepack pnpm exec vitest run --config vitest.config.ts packages/core/tests/router.test.ts packages/core/tests/permission.test.ts
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter @luma/core build
corepack pnpm --filter luma-admin build
corepack pnpm lint
corepack pnpm release:boundaries
```

## 文档

- [架构说明](docs/architecture.md)
- [图标系统](docs/icons.md)
- [Core API](docs/core-api.md)
- [Vben 兼容 API](docs/vben-compat-api.md)
- [从 Vben 迁移](docs/migration-from-vben.md)
- [源框架能力迁移计划](docs/source-framework-migration-plan.md)
- [后续开发计划](docs/luma-next-development-plan.md)
- [发布检查清单](docs/release-checklist.md)
