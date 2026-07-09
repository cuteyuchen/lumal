# Luma 开发实施计划

> **给后续执行者：** 后续按任务开发时，建议使用 `superpowers:subagent-driven-development` 或 `superpowers:executing-plans` 逐项执行。本计划使用复选框（`- [ ]`）跟踪任务状态。

**目标：** 将 Luma 开发为个人开源的轻量 Vue 后台框架，底层包使用 `@luma/*` 命名，用这些包创建出来的后台管理平台叫 `luma-admin`。

**架构思路：** Luma 按职责拆包，而不是为了拆包而拆包。`@luma/core` 是轻量后台框架核心，`@luma/icons` 是独立图标系统，`@luma/vben-compat` 是 Vben Admin 常用写法的迁移兼容层。现有 Schema 表单、Schema 表格、CRUD 表格这类原生写法继续保留为一等能力；`useVbenForm`、`useVbenVxeGrid` 作为适配层复用底层能力，不重复实现一套。

**技术栈：** Vue 3、TypeScript、Vite、pnpm workspace、Vitest、Vue Test Utils、Element Plus、Iconify、SCSS；VXE 仅作为兼容层可选能力。

---

## 1. 命名与边界

### 1.1 最终命名

- 项目族名称：`Luma`
- 核心包：`@luma/core`
- 图标包：`@luma/icons`
- Vben 兼容包：`@luma/vben-compat`
- 脚手架包：`create-luma-admin`
- 后台模板/应用：`luma-admin`
- 后续脚手架：`create-luma-admin` 或 `pnpm create luma-admin`

### 1.2 Luma 是什么

Luma 是面向中小型后台项目的轻量 Vue Admin 框架。它提供启动后台项目所需的基础设施，但不默认携带大型项目才需要的多语言运行时、复杂偏好设置、过重插件链和企业级扩展分支。

### 1.3 Luma 不是什么

- 不是 Vben Admin 的完整 fork。
- 不是公司内部专属框架。
- 不是业务应用。
- 不是 Element Plus 的完整替代 UI 库。
- 不承载具体接口路径、业务页面流程、业务 store。

### 1.4 兼容原则

Vben 兼容能力只用于降低迁移成本，不能反过来定义 Luma 的核心设计。

- `@luma/core` 负责 Luma 原生 API。
- `@luma/vben-compat` 负责 `useVbenForm`、`useVbenVxeGrid` 等 Vben 风格 API。
- `@luma/vben-compat` 可以依赖 `@luma/core`。
- `@luma/core` 不能依赖 `@luma/vben-compat`。
- VXE 等偏重依赖不能成为 `@luma/core` 的默认依赖。

---

## 2. 仓库结构规划

建议在 `F:\my-project\luma` 中建立以下结构：

```text
F:\my-project\luma
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ tsconfig.json
├─ eslint.config.mjs
├─ vitest.config.ts
├─ README.md
├─ LUMA_DEVELOPMENT_PLAN.md
├─ docs
│  ├─ architecture.md
│  ├─ migration-from-vben.md
│  ├─ package-boundaries.md
│  └─ release-checklist.md
├─ packages
│  ├─ create-luma-admin
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ src
│  │  │  ├─ cli.ts
│  │  │  ├─ index.ts
│  │  │  └─ scaffold.ts
│  │  └─ tests
│  ├─ icons
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ vite.config.ts
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  ├─ components
│  │  │  │  ├─ LumaIcon.vue
│  │  │  │  ├─ LumaIconPicker.vue
│  │  │  │  └─ LumaIconPickerDialog.vue
│  │  │  ├─ registry
│  │  │  ├─ runtime
│  │  │  ├─ vite
│  │  │  └─ types.ts
│  │  └─ tests
│  ├─ core
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  ├─ vite.config.ts
│  │  ├─ theme-chalk
│  │  ├─ src
│  │  │  ├─ index.ts
│  │  │  ├─ app
│  │  │  ├─ components
│  │  │  ├─ layout
│  │  │  ├─ request
│  │  │  ├─ permission
│  │  │  ├─ theme
│  │  │  ├─ router
│  │  │  ├─ utils
│  │  │  └─ exports
│  │  └─ tests
│  └─ vben-compat
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vite.config.ts
│     ├─ src
│     │  ├─ index.ts
│     │  ├─ form
│     │  ├─ grid
│     │  └─ types.ts
│     └─ tests
└─ apps
   ├─ playground
   ├─ luma-admin
   └─ vben-compat-demo
```

---

## 3. 对外 API 目标

### 3.1 `@luma/icons`

目标用法：

```ts
import {
  LumaIcon,
  LumaIconPicker,
  getIconDataUri,
  registerIcons,
  registerStaticLocalSvgIcons,
} from '@luma/icons';
```

职责：

- 图标注册表。
- 图标分组。
- Iconify 适配。
- 本地 SVG 支持。
- 静态本地 SVG 支持。
- SVG 改色、渐变、data URI 生成。
- Vue 图标组件。
- 图标选择器。
- 构建期静态 SVG 注入插件。

不做：

- 不硬编码业务图标分组。
- 不要求内建图标依赖异步注册。
- 不依赖 `@luma/core`。

### 3.2 `@luma/core`

目标用法：

```ts
import { createLumaAdmin } from '@luma/core';
import { LumaCrudTable, LumaSchemaForm, LumaSchemaTable } from '@luma/core/components';
import { createRequestClient } from '@luma/core/request';
import { createPermissionStore } from '@luma/core/permission';
```

职责：

- 应用安装器。
- 后台布局壳。
- 路由和菜单辅助能力。
- 权限 store 和权限指令。
- 请求客户端辅助能力。
- 简化主题运行时。
- Schema 表单、Schema 表格、CRUD 表格。
- 页面容器和分页组件。
- 上述能力依赖的通用工具。

不做：

- 默认不引入多语言。
- 不内置 Vben 兼容 API。
- 默认不依赖 VXE。
- 不放具体业务路由、接口、store。

### 3.3 `@luma/vben-compat`

目标用法：

```ts
import { useVbenForm, useVbenVxeGrid } from '@luma/vben-compat';
```

职责：

- 提供常用 Vben 风格 API。
- 将 Vben 风格 form schema 转为 Luma 表单配置。
- 将常见 Vben grid 配置转为 Luma CRUD/grid 配置。
- 将迁移兼容逻辑与 Luma 原生 API 隔离。

不做：

- 不完整复刻 Vben。
- 不承诺兼容所有 Vben 高级插件和边缘场景。
- 不被 `@luma/core` 反向依赖。

---

## 4. 开发阶段

## 阶段 0：仓库基线

**目标：** 建立可独立构建、独立测试的 monorepo 基线。

**创建文件：**

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `tsconfig.json`
- `eslint.config.mjs`
- `vitest.config.ts`
- `README.md`
- `docs/package-boundaries.md`

**任务：**

- [ ] 创建根 `package.json`，包含 workspace 脚本。
- [ ] 创建 `pnpm-workspace.yaml`，纳入 `packages/*` 和 `apps/*`。
- [ ] 创建严格 TypeScript 基础配置。
- [ ] 创建 Vitest 基础配置，支持 Vue 和包别名。
- [ ] 创建 `docs/package-boundaries.md`，明确：
  - `@luma/icons` 不依赖 `@luma/core`。
  - `@luma/core` 可以依赖 `@luma/icons`。
  - `@luma/vben-compat` 可以依赖 `@luma/core`。
  - `@luma/core` 不能依赖 `@luma/vben-compat`。
- [ ] 执行：

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
```

**验收标准：**

- 依赖安装成功。
- typecheck 没有项目代码错误。
- 即使暂时没有测试，test 命令也能正常结束。

**停止条件：**

- workspace 脚本未跑通前，不进入具体包实现。

---

## 阶段 1：实现 `@luma/icons`

**目标：** 先把图标系统做成独立包，再让 core 依赖它。

**创建文件：**

- `packages/icons/package.json`
- `packages/icons/src/index.ts`
- `packages/icons/src/types.ts`
- `packages/icons/src/registry/state.ts`
- `packages/icons/src/registry/icons.ts`
- `packages/icons/src/registry/groups.ts`
- `packages/icons/src/runtime/svg.ts`
- `packages/icons/src/runtime/data-uri.ts`
- `packages/icons/src/runtime/resolver.ts`
- `packages/icons/src/runtime/static-local.ts`
- `packages/icons/src/components/LumaIcon.vue`
- `packages/icons/src/components/LumaIconPicker.vue`
- `packages/icons/src/components/LumaIconPickerDialog.vue`
- `packages/icons/src/vite/static-local-svg-icons.ts`
- `packages/icons/tests/registry.test.ts`
- `packages/icons/tests/runtime.test.ts`
- `packages/icons/tests/static-local-svg-icons.test.ts`

**设计要求：**

- 源 SVG 保持单色，优先使用 `currentColor`。
- 改色、渐变、data URI 由运行时 helper 处理。
- 内建图标必须同步可解析。
- 业务模块顶层使用的图标，必须通过构建期插件或提前同步注册保证可用。
- Vue 组件使用组合式 API，涉及组件或 DOM ref 时必须使用 `useTemplateRef`。

**任务：**

- [ ] 定义 `IconDefinition`、`IconGroupDefinition`、`IconKey`、`IconSource`、渐变相关类型。
- [ ] 实现图标注册表状态，使用普通 TS 模块，不依赖 Vue 全局状态。
- [ ] 实现 `registerIcons`、`registerIconGroups`、`resolveIconDefinition`、`getRegisteredIconDefinitions`。
- [ ] 实现 `svgToDataUri`、`recolorSvgString`、`applySvgGradient`、`getIconDataUri`。
- [ ] 实现 `registerStaticLocalSvgIcons`、`getStaticLocalSvgIconDefinitions`。
- [ ] 实现 `LumaIcon`，支持 `name`、`icon`、`size`、`color`、`gradient`、`title`。
- [ ] 注册表和渲染稳定后，再实现 `LumaIconPicker`、`LumaIconPickerDialog`。
- [ ] 实现 `createStaticLocalSvgIconsPlugin`。
- [ ] 执行：

```bash
corepack pnpm --filter @luma/icons test
corepack pnpm --filter @luma/icons typecheck
corepack pnpm --filter @luma/icons build
```

**验收标准：**

- 注册表测试通过。
- SVG/data URI 运行时测试通过。
- 包声明文件可以正常生成。

**停止条件：**

- `@luma/icons` 不能独立构建前，不开始 `@luma/core`。

---

## 阶段 2：实现 `@luma/core` 最小内核

**目标：** 先搭好轻量后台框架主体，不急着迁移表单和表格。

**创建文件：**

- `packages/core/package.json`
- `packages/core/src/index.ts`
- `packages/core/src/app/createLumaAdmin.ts`
- `packages/core/src/app/types.ts`
- `packages/core/src/exports/components.ts`
- `packages/core/src/exports/request.ts`
- `packages/core/src/exports/permission.ts`
- `packages/core/src/exports/theme.ts`
- `packages/core/src/exports/layout.ts`
- `packages/core/theme-chalk/index.scss`
- `packages/core/tests/createLumaAdmin.test.ts`

**任务：**

- [ ] 定义主安装器 `createLumaAdmin`。
- [ ] 支持基础 options：
  - `rootComponent`
  - `rootProps`
  - `router`
  - `pinia`
  - `elementPlus`
  - `icons.localSvg`
  - `components`
  - `setup`
- [ ] 只有传入 `icons.localSvg` 时，才通过 `@luma/icons` 注册业务本地图标。
- [ ] Element Plus 保持 peer dependency。
- [ ] Pinia 可选，但权限和主题 store 可以使用。
- [ ] 不引入 i18n。
- [ ] 不加入 Vben 兼容 API。
- [ ] 执行：

```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter @luma/core build
```

**验收标准：**

- `createLumaAdmin` 可以在测试中创建并挂载 Vue app。
- `@luma/core` 构建时不依赖 `@luma/vben-compat`。

**停止条件：**

- app 内核导出不稳定前，不迁移 CRUD、表单、表格组件。

---

## 阶段 3：迁移 Luma 原生组件

**目标：** 保留当前原生写法，并将组件命名和 API 收敛到 Luma。

**保留能力：**

- Schema 表单。
- Schema 表格。
- CRUD 表格。
- 页面容器。
- 分页。

**推荐组件名：**

- `LumaSchemaForm`
- `LumaSchemaTable`
- `LumaCrudTable`
- `LumaPage`
- `LumaPagination`

**可考虑的临时兼容别名：**

- `GSchemaForm`
- `GSchemaTable`
- `GCrudTable`
- `GPage`
- `GPagination`

**创建文件：**

- `packages/core/src/components/schema-form`
- `packages/core/src/components/schema-table`
- `packages/core/src/components/crud-table`
- `packages/core/src/components/page`
- `packages/core/src/components/pagination`
- `packages/core/src/components/index.ts`
- `packages/core/tests/schema-form.test.ts`
- `packages/core/tests/schema-table.test.ts`
- `packages/core/tests/crud-table.test.ts`

**任务：**

- [ ] 先迁移 schema 类型定义。
- [ ] 先写 schema 归一化测试，再迁移组件模板。
- [ ] 迁移 `LumaSchemaForm`。
- [ ] 迁移 `LumaSchemaTable`。
- [ ] 迁移 `LumaCrudTable`。
- [ ] 所有 Vue SFC 必须使用：
  - `<script setup lang="ts">`
  - 组合式 API
  - `useTemplateRef`
  - `/***********************状态定义*********************/` 这类功能分块注释
- [ ] 组件中不写业务默认值。
- [ ] 从 `@luma/core/components` 导出组件。
- [ ] 执行：

```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter @luma/core build
```

**验收标准：**

- Luma 原生组件 API 不依赖 `@luma/vben-compat`。
- 表单、表格、CRUD 行为有定点测试覆盖。

**停止条件：**

- 原生 Schema Form 不稳定前，不实现 `useVbenForm`。

---

## 阶段 4：实现布局、权限、请求、主题

**目标：** 提供中小后台项目真正可用的基础设施。

**创建文件：**

- `packages/core/src/layout`
- `packages/core/src/permission`
- `packages/core/src/request`
- `packages/core/src/theme`
- `packages/core/src/router`
- `packages/core/tests/layout.test.ts`
- `packages/core/tests/permission.test.ts`
- `packages/core/tests/request.test.ts`
- `packages/core/tests/theme.test.ts`

**任务：**

- [ ] 实现布局壳组件：
  - `LumaLayout`
  - `LumaHeader`
  - `LumaSidebar`
  - `LumaTabs`
  - `LumaContent`
  - `LumaRouterView`
- [ ] layout 只负责壳层布局和交互，不请求业务数据。
- [ ] 实现权限能力：
  - `createPermissionStore`
  - `hasPermission`
  - `hasRole`
  - `createPermissionDirective`
  - `setupPermissionGuard`
- [ ] 实现路由/菜单辅助：
  - 后端菜单节点归一化
  - 路由记录生成
  - 侧边栏菜单生成
  - 查找第一个可访问菜单
- [ ] 实现请求辅助：
  - `createRequestClient`
  - token header 回调
  - 响应解析回调
  - 会话过期回调
  - 重复提交拦截
  - 可选缓存 helper
- [ ] 实现简化主题运行时：
  - 明暗模式
  - 主题色
  - 必要时支持紧凑布局
  - 不做多语言偏好
- [ ] 执行：

```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter @luma/core build
```

**验收标准：**

- 一个小型后台可以使用 layout、route、permission、request、theme 启动。
- 依赖中没有 i18n。

**停止条件：**

- core 壳层不能稳定渲染路由页面前，不创建最终 admin 模板。

---

## 阶段 5：实现 `@luma/vben-compat`

**目标：** 支持常用 Vben 写法，同时不污染 Luma core。

**创建文件：**

- `packages/vben-compat/package.json`
- `packages/vben-compat/src/index.ts`
- `packages/vben-compat/src/types.ts`
- `packages/vben-compat/src/form/useVbenForm.ts`
- `packages/vben-compat/src/form/adapter.ts`
- `packages/vben-compat/src/grid/useVbenVxeGrid.ts`
- `packages/vben-compat/src/grid/adapter.ts`
- `packages/vben-compat/tests/useVbenForm.test.ts`
- `packages/vben-compat/tests/useVbenVxeGrid.test.ts`

**任务：**

- [ ] 在 `docs/migration-from-vben.md` 中先写清楚兼容范围。
- [ ] 实现 `useVbenForm` 适配器：
  - 接收常见 Vben form options。
  - 转换为 `LumaSchemaForm` 配置。
  - 返回常见 Vben 使用方式需要的 register 函数和 methods。
- [ ] 实现 `useVbenVxeGrid` 适配器：
  - 接收常见 grid options。
  - 转换 columns、form config、proxy request、toolbar config、action column。
  - 驱动 `LumaCrudTable` 或共享 grid core。
- [ ] 在文档中明确不支持的 Vben 高级能力。
- [ ] VXE 依赖保持可选。
- [ ] 如果后续必须真实使用 VXE 渲染，新增独立适配层，不让 `@luma/core` 依赖 VXE。
- [ ] 执行：

```bash
corepack pnpm --filter @luma/vben-compat test
corepack pnpm --filter @luma/vben-compat typecheck
corepack pnpm --filter @luma/vben-compat build
```

**验收标准：**

- 常见 `useVbenForm` 用法可用。
- 常见 `useVbenVxeGrid` 用法可以驱动 Luma 表格能力。
- `@luma/core` 依赖图中不出现 `@luma/vben-compat`。

**停止条件：**

- 没有真实迁移页面验证前，不宣称完整兼容 Vben。

---

## 阶段 6：创建示例应用

**目标：** 用真实示例验证原生写法和 Vben 兼容写法。

**应用：**

- `apps/playground`：组件和服务开发预览。
- `apps/luma-admin`：干净的后台模板。
- `apps/vben-compat-demo`：使用 Vben 兼容 API 的迁移示例。

**任务：**

- [x] 创建 `apps/playground`，通过 workspace 包名和 package exports 消费公开包入口。
- [x] 创建 `apps/luma-admin`，使用：
  - `@luma/core`
  - `@luma/icons`
  - `LumaLayout`
  - `LumaSchemaForm`
  - `LumaCrudTable`
  - `LumaSchemaTable`
- [x] 创建 `apps/vben-compat-demo`，使用：
  - `@luma/core`
  - `@luma/icons`
  - `@luma/vben-compat`
  - `useVbenForm`
  - `useVbenVxeGrid`
- [x] 添加构建脚本：

```json
{
  "scripts": {
    "playground:dev": "pnpm build && pnpm --filter luma-playground dev",
    "playground:build": "pnpm build && pnpm --filter luma-playground build",
    "admin:dev": "pnpm build && pnpm --filter luma-admin dev",
    "admin:build": "pnpm build && pnpm --filter luma-admin build",
    "compat:build": "pnpm build && pnpm --filter luma-vben-compat-demo build"
  }
}
```

- [x] 执行：

```bash
corepack pnpm playground:build
corepack pnpm admin:build
corepack pnpm compat:build
```

**验收标准：**

- 原生后台模板可以构建。
- Playground 可以构建。
- Vben 兼容示例可以构建。
- 三个示例应用都不需要多语言配置。

**停止条件：**

- 三个示例应用构建未通过前，不进入发布准备。

---

## 阶段 7：文档与迁移指南

**目标：** 让外部使用者能理解 Luma 的定位和用法。

**创建文件：**

- `README.md`
- `docs/architecture.md`
- `docs/migration-from-vben.md`
- `docs/icons.md`
- `docs/core-api.md`
- `docs/vben-compat-api.md`
- `docs/release-checklist.md`

**任务：**

- [x] README 写清楚：
  - Luma 是什么。
  - 包列表。
  - 安装方式。
  - 原生写法。
  - Vben 兼容写法。
  - 不做什么。
- [x] 图标文档写清楚：
  - Iconify 图标。
  - 本地 SVG。
  - 静态本地 SVG Vite 插件。
  - 图标选择器。
- [x] core API 文档写清楚：
  - `createLumaAdmin`
  - layout
  - request
  - permission
  - theme
  - schema form/table
  - CRUD table
- [x] Vben 迁移文档写清楚：
  - 支持哪些 `useVbenForm` 配置。
  - 支持哪些 `useVbenVxeGrid` 配置。
  - 不支持哪些 Vben 能力。
  - 迁移示例。

**验收标准：**

- 新用户能判断什么时候用 Luma 原生 API，什么时候用 Vben 兼容 API。

---

## 阶段 8：发布准备

**目标：** 确认包可以发布，且不会泄漏公司名或旧框架名。

**任务：**

- [x] 搜索旧名称：

```bash
rg -n "guiren|gr-framework|GrFramework|GSchemaForm|GSchemaTable|GCrudTable|GPage|GPagination" README.md docs packages apps --glob "!docs/release-checklist.md"
```

- [x] 决定 `G*` 别名是临时兼容导出，还是首个公开版本前删除。
- [x] 增加发布边界自动检查，防止 core 反向依赖兼容层、误引入 i18n/VXE 默认依赖，或把 Element Plus 放进普通 dependencies。
- [ ] 确认 npm scope：
  - 优先确认 `@luma` 是否可用。
  - 如果不可用，再选择备用 scope。
- [x] 执行完整验证：

```bash
corepack pnpm release:check
```

或保持串行执行：

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm admin:build
corepack pnpm compat:build
```

- [x] dry-run 打包：

```bash
corepack pnpm pack:dry-run
```

或逐包执行：

```bash
corepack pnpm --filter @luma/icons pack --dry-run
corepack pnpm --filter @luma/core pack --dry-run
corepack pnpm --filter @luma/vben-compat pack --dry-run
corepack pnpm --filter create-luma-admin pack --dry-run
```

**验收标准：**

- 包内容干净。
- 公开 API 和文档中没有公司名。
- 构建产物只包含预期文件。

---

## 阶段 9：脚手架

**目标：** 提供可发布的 `create-luma-admin` 包，用于生成最小 Luma Admin 应用。

**任务：**

- [x] 新增 `packages/create-luma-admin`。
- [x] 实现 `createLumaAdminProject`，生成 Vue 3、TypeScript、Vite、Element Plus、SCSS 和 Luma Layout 模板。
- [x] CLI 暴露 `create-luma-admin` 命令。
- [x] 生成模板通过 `@luma/core` 和 `@luma/icons` 公开入口消费能力。
- [x] 目标目录非空时拒绝覆盖已有文件。
- [x] 增加脚手架测试、类型检查、构建和 dry-run 打包。

**验收标准：**

- `corepack pnpm --filter create-luma-admin test` 通过。
- `corepack pnpm --filter create-luma-admin build` 通过。
- `corepack pnpm --filter create-luma-admin pack --dry-run` 包含 `dist/cli.js`。

---

## 5. 兼容矩阵

| 能力 | Luma 原生 API | Vben 兼容 API | 初版支持 |
| --- | --- | --- | --- |
| 应用启动 | `createLumaAdmin` | 不需要 | 是 |
| Schema 表单 | `LumaSchemaForm` | `useVbenForm` | 是 |
| Schema 表格 | `LumaSchemaTable` | 通过 grid 适配部分支持 | 是 |
| CRUD 表格 | `LumaCrudTable` | `useVbenVxeGrid` | 支持常用子集 |
| 图标渲染 | `LumaIcon` | 通过适配支持 Vben 风格图标字符串 | 是 |
| 图标选择器 | `LumaIconPicker` | 不要求 | 是 |
| 布局 | `LumaLayout` | 后续支持 Vben 风格布局配置 | 部分 |
| 请求 | `createRequestClient` | 后续提供 Vben 请求封装 | 部分 |
| 权限 | `createPermissionStore` | 后续支持路由/菜单迁移 | 部分 |
| 多语言 | 默认无 | 初版不支持 | 否 |
| VXE 高级表格 | 可选适配 | `useVbenVxeGrid` 高级模式 | 后续 |

---

## 6. 验证规则

按改动范围使用最小有效验证：

**包导出改动：**

```bash
corepack pnpm --filter <package> typecheck
corepack pnpm --filter <package> build
```

**运行时 helper 改动：**

```bash
corepack pnpm --filter <package> test
```

**组件改动：**

```bash
corepack pnpm --filter <package> test
corepack pnpm --filter <package> typecheck
```

**应用集成改动：**

```bash
corepack pnpm admin:build
corepack pnpm compat:build
```

**发布前验证：**

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

如果本机 Node 或 pnpm 在项目代码运行前失败，要记录环境错误，并补充 `rg`、导出检查、文件差异检查等静态验证。

---

## 7. 开发守则

1. 项目讨论和内部文档优先使用中文。
2. Vue 组件使用组合式 API 和 `<script setup lang="ts">`。
3. Vue 组件 ref 必须使用 `useTemplateRef`。
4. Vue 代码按功能块使用 `/***********************状态定义*********************/` 这类分隔注释。
5. 首个公开版本不引入多语言运行时。
6. 不把 Vben 兼容 API 放进 `@luma/core`。
7. 不让 `@luma/core` 依赖 VXE。
8. 迁移完成后不保留两套重复实现，除非明确作为兼容别名写入文档。
9. 请求 token、错误处理、会话过期处理优先使用回调或 hook。
10. 包内不写具体业务接口路径和页面逻辑。
11. 图标源 SVG 保持单色，可在运行时改色。
12. 包和应用样式统一使用 SCSS，包级样式入口通过 package `exports` 暴露。
13. 先做包级测试，再做应用级测试。

---

## 8. 推荐第一个开发 Sprint

第一轮不要试图一次做完整框架，只验证架构是否成立。

### Sprint 1 范围

- workspace 基线。
- `@luma/icons` 最小注册表和 `LumaIcon`。
- `@luma/core` 最小 `createLumaAdmin`。
- `apps/luma-admin` 渲染一个页面和一个图标。

### Sprint 1 完成标准

- `corepack pnpm install` 成功。
- `corepack pnpm --filter @luma/icons build` 成功。
- `corepack pnpm --filter @luma/core build` 成功。
- `corepack pnpm admin:build` 成功。
- 暂时没有 `@luma/vben-compat` 代码。
- 没有 i18n 依赖。

### Sprint 1 意义

先证明包拆分、图标独立、core 安装器和应用集成链路，再迁移大量表单和表格代码。

---

## 9. 开发前待确认问题

1. 公开包 scope 是否确定为 `@luma`，还是要准备备用名称。
2. 初期是否保留 `G*` 组件别名。
3. 首个版本的 `useVbenVxeGrid` 是否真实使用 VXE，还是先适配到 Luma 表格。
4. 文档首版是否只写中文。
5. 初始 admin 模板只使用 mock 数据，还是包含请求封装示例。

推荐默认值：

- 发布前先按 `@luma` 规划。
- `G*` 只作为临时兼容别名，不作为推荐 API。
- `useVbenVxeGrid` 初版先适配到 Luma 表格，真实 VXE 后续再加。
- 文档首版使用中文。
- `apps/luma-admin` 使用 mock 数据，请求封装单独做示例页。

---

## 10. 总体执行顺序

1. 建立 workspace 基线。
2. 实现并验证 `@luma/icons`。
3. 实现并验证最小 `@luma/core`。
4. 创建最小 `apps/luma-admin`。
5. 迁移原生 Schema 表单、Schema 表格、CRUD 表格。
6. 补齐 layout、request、permission、theme。
7. 实现 `@luma/vben-compat`。
8. 创建 `apps/vben-compat-demo`。
9. 编写文档和 Vben 迁移指南。
10. 执行完整发布验证。
