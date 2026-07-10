# Luma 后续开发计划（对照 gr-framework 接力）

> **给后续执行者：** 本文件用于接力开发。`LUMA_DEVELOPMENT_PLAN.md` 的阶段 0–9（monorepo 基线、包拆分、组件三件套、发布、脚手架）已全部完成；本文件只跟踪 `docs/source-framework-migration-plan.md` 定义的**能力补齐**部分中尚未落地的项。使用复选框（`- [ ]`）跟踪任务状态。
>
> **参考源框架：** `E:\gr-framework`（单包 `@guiren/framework@0.2.3`）。下文所有「源」路径均相对 `E:\gr-framework`；所有「落点」路径均相对仓库根 `F:\my-project\luma`。

---

## 0. 背景与纪律

Luma 的组件三件套（`LumaSchemaForm` / `LumaSchemaTable` / `LumaCrudTable`）已按计划增强完成。从**权限动态路由**开始，源框架里已有、Luma 尚缺的能力仍需补齐。

**关键纪律（必须遵守）：**

1. `apps/luma-admin` 的示例页**必须消费公开包入口**（`@luma/core/*`、`@luma/charts` 等），**禁止在页面内写本地占位实现冒充能力完成**。当前 `ComposablesView`、`UtilsView`、`ChartView`、`ChartPanelView`、`ThemeSettingsView` 就是本地占位，需要在对应阶段用真实能力替换。
2. `@luma/core` 不绑定公司字段、接口路径、状态码；非标准结构通过 `fieldNames` / `parseResponse` 等显式适配。
3. `@luma/core` 不默认依赖 VXE、ECharts、i18n。
4. Vue SFC 使用 `<script setup lang="ts">` + 组合式 API + `useTemplateRef`，按功能块使用 `/***********************说明*********************/` 分隔注释，各功能块变量就近声明。
5. 导入文件必须携带后缀。
6. 先做包级测试，再做应用级测试。

---

## 1. 当前完成度对照

| 能力域 | gr-framework 源 | Luma 现状 | 结论 |
| --- | --- | --- | --- |
| Schema Form / Table / CRUD | `src/components/*` | `packages/core/src/components/*` 已增强 | ✅ 基本完成 |
| 权限动态路由 | `src/services/permission/{factory,createAdminPermissionRouter,route/*,store,utils}` | 仅 `permission/{store,guard,helpers,directive}` + `router/` 草稿 | ⚠️ 进行中，缺闭环 |
| Auth 会话 | `src/services/auth/{session,storage,redirect,session-expired}` | **无 `auth` 目录** | ❌ 未开始 |
| Request 进阶 | `src/services/request/{cache,standard,presets,defaults}` + 上传 | 仅 `request/client.ts`（`duplicateSubmit`/`onResponse`） | ⚠️ 缺 hooks/upload/cache/标准解析 |
| 主题设置面板 | `src/services/theme/{GThemeSettingsPanel.vue,theme-color-presets}` | `theme/{store,preferences,tokens,dom}`，**无面板组件** | ❌ 缺面板 |
| 布局 TopNav / mixed-nav | `src/layout/{components/AppTopNav,state/top-nav}` | `layout/*` 无 TopNav / mixed-nav / maximize / tab 策略 | ❌ 未开始 |
| composables 子入口 | `src/composables/*` | **无 `composables` 子入口**，admin 为本地占位 | ❌ 未开始 |
| utils 子入口 | `src/utils/*` | **无 `utils` 子入口**，admin 为本地占位 | ❌ 未开始 |
| directives 子入口 | `src/directives/v-permission` | 有 `permission/directive.ts`，**无独立 `./directives` 子入口** | ⚠️ 缺子入口 |
| charts | `src/components/chart` | **无**，admin `ChartView` 为本地占位 | ❌ 未开始 |
| 构建插件 / resolver | `src/plugin/{viewportTransform,vueDevtools}`、`src/resolver.ts` | icons 有 `vite` 插件，core 无 resolver | ⏭️ 后续评估 |
| 图标 runtime 增强 | `src/components/icons` | `@luma/icons` 已独立 | ⏭️ 增量 |

---

## 阶段 2：权限与动态路由闭环（最高优先级，进行中）

**目标：** 让一个小型后台能凭后端菜单跑通「登录 → 动态注册路由 → 侧边/顶部菜单 → 403/404 兜底 → 登出重置」全链路。

**源参考：**
- `src/services/permission/factory.ts`（`createPermissionRouter`、`createGlobComponentResolver`）
- `src/services/permission/route/{guard,routes,runtime}.ts`
- `src/services/permission/store/use-permission-store.ts`
- `src/services/permission/utils/access.ts`
- `src/services/permission/createAdminPermissionRouter.ts`

**落点：** `packages/core/src/router/`、`packages/core/src/permission/`

**任务：**

- [x] 确认标准菜单模型 `LumaAccessMenu`（`id/parentId/title/path/component/type/icon/authority/roles/order/hidden/externalLink/children`）与 `AccessMenuFieldNames` 字段映射已在 `router/types.ts` 完整定义。
- [x] 完成动态路由注册/重置闭环：`createRouteRegistry` 支持 `reset()` 并在登出时调用。
- [x] 实现 glob 组件 resolver（`createGlobComponentResolver`），把菜单 `component` 字符串解析为 `import.meta.glob` 组件，带候选路径与缓存、fallback。
- [x] 外链路由：`externalLink` 字段贯穿 `normalize` → 路由 `meta.externalLink` → 侧边栏菜单（内嵌外链页 iframe 组件留待 admin 侧接入）。
- [x] 登录守卫 + 白名单 + 未登录跳登录页（`setupPermissionGuard` 扩展 `whiteList`/`loginPath`/`isAuthenticated`/`redirectQueryKey`，向后兼容原权限校验）。
- [x] 403 兜底路由（admin 已注册 `/403` + `/:pathMatch(.*)*` 兜底重定向）。
- [x] 顶部菜单与侧边菜单拆分（新增 `createTopMenus`，按 `meta.topMenu` 过滤，未标记回退全部一级菜单）。
- [x] 非标准菜单通过 `fieldNames` 适配，不识别公司字段。
- [x] 补齐 `packages/core/tests/router.test.ts`、`permission.test.ts`（glob resolver、外链、顶部菜单、登录守卫/白名单用例）。
- [~] `apps/luma-admin` 已用菜单配置驱动动态路由 + `/403` 兜底；glob resolver 接入待视图目录规整后切换（当前视图使用自定义命名而非 `index.vue`）。

**验证：**
```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter luma-admin build
```

**验收：** 后端返回菜单树即可驱动路由与菜单；登出后路由被重置；无权限进 403、未知路径进 404。

---

## 阶段 3：Auth 会话 + Request 进阶

**目标：** 提供可替换的登录会话管理与完整请求生命周期，均不绑定具体后端接口/字段。

### 3.1 Auth（新增子入口 `@luma/core/auth`）

**源参考：** `src/services/auth/{session,storage,redirect,session-expired}.ts`
**落点：** 新建 `packages/core/src/auth/`，在 `packages/core/package.json` 的 `exports` 增加 `./auth`。

- [ ] token storage：`getStoredToken` / `setStoredToken` / `clearStoredToken`，key 可配置，默认 `luma:token`。
- [ ] 可替换 storage：`createTokenStorage(storage, key)`，支持注入 `localStorage` / `sessionStorage` / 自定义。
- [ ] 登录跳转解析：`resolveLoginRedirect(currentPath, options)`。
- [ ] session expired handler：`registerSessionExpiredHandler` / `clearSessionExpiredHandler`。
- [ ] 聚合 API：`createAuthSession({ tokenKey, storage, onSessionExpired })`，返回 token 读写 + logout hook。
- [ ] 不绑定具体登录接口/字段。
- [ ] `packages/core/tests/auth.test.ts`。

### 3.2 Request 进阶

**源参考：** `src/services/request/{cache,standard,presets,defaults,api-types}.ts`
**落点：** 扩展 `packages/core/src/request/`

- [ ] 完整生命周期 hooks：`onRequest` / `onRequestError` / `onResponse` / `onResponseError`（当前仅 `onResponse`）。
- [ ] upload 支持（`FormData` / 进度回调）。
- [ ] request id 注入。
- [ ] cache hooks（参考 `createStandardRequestCache`，显式启用）。
- [ ] 标准响应解析 helper（参考 `standard.ts`，显式启用、可关闭）。
- [ ] 保留 fetch client 为默认，Axios 仅作可选 adapter，不进默认依赖。
- [ ] `packages/core/tests/request.test.ts` 补齐新增能力。

**验收：** 可配置 token 注入、会话过期跳转、上传、重复提交拦截、可选缓存；默认响应解析可关闭以适配非标准后端。

---

## 阶段 4：主题设置面板 + 布局增强

### 4.1 主题设置面板 `LumaThemeSettingsPanel`

**源参考：** `src/services/theme/{GThemeSettingsPanel.vue,theme-color-presets.ts}`
**落点：** 新建 `packages/core/src/theme/LumaThemeSettingsPanel.vue` + `theme/theme-color-presets.ts`，从 `@luma/core/theme` 导出。

- [ ] 面板支持：明暗模式、主题色（预设色板）、圆角、侧边栏宽度、tabbar 开关、动画开关、布局模式切换。
- [ ] 仅通过 props / `v-model:preferences` 控制，不依赖业务 store。
- [ ] `packages/core/tests/theme-settings-panel.test.ts`。
- [ ] **用真面板替换 admin `ThemeSettingsView.vue` 的本地占位。**

### 4.2 布局增强

**源参考：** `src/layout/{components/AppTopNav.vue,state/top-nav.ts}`
**落点：** `packages/core/src/layout/`

- [ ] 新增 `LumaTopNav` 组件。
- [ ] 新增 `layout/state/top-nav.ts` 状态与 `active menu` 解析。
- [ ] 布局模式：mixed-nav / top-nav / side-nav，菜单按布局拆分。
- [ ] tab 最大数量与缓存策略。
- [ ] maximize（内容区最大化）。
- [ ] `packages/core/tests/layout.test.ts` 补齐。

**验证：**
```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter luma-admin build
```

---

## 阶段 5：composables / utils / directives 子入口

### 5.1 `@luma/core/composables`

**源参考：** `src/composables/{usePagination,useDictMap,useDeleteConfirm,usePersistentState}.ts`
**落点：** 新建 `packages/core/src/composables/` + `exports`，package `exports` 增加 `./composables`。

- [ ] `usePagination`
- [ ] `useConfirmAction`（参考 `useDeleteConfirm`）
- [ ] `usePersistentState`
- [ ] `useDictionaryMap`（参考 `useDictMap`）
- [ ] `useSelection`
- [ ] `useFullscreen`
- [ ] 各自单测。
- [ ] **用真实子入口替换 admin `ComposablesView.vue` 的本地占位。**

### 5.2 `@luma/core/utils`

**源参考：** `src/utils/{clone,color,common,download,object,path,storage,withInstall,form}.ts`
**落点：** 新建 `packages/core/src/utils/` + package `exports` 的 `./utils`。

- [ ] `cloneDeep`、`joinPath`、`omitUndefined`、`serializeQuery`、`downloadBlob`、`createStorage`、`withInstall`。
- [ ] 标准库/原生能直接解决的不封装。
- [ ] 单测。
- [ ] **用真实子入口替换 admin `UtilsView.vue` 的本地占位。**

### 5.3 `@luma/core/directives`

**源参考：** `src/directives/v-permission.ts`
**落点：** 新增 `./directives` 子入口，复用现有 `permission/directive.ts`。

- [ ] 导出 `v-authority`，`v-permission` 作为兼容别名。
- [ ] 单测。

---

## 阶段 6：独立 `@luma/charts` 包

**目标：** 图表能力作为独立可选包，ECharts 不进 `@luma/core` 默认依赖。

**源参考：** `src/components/chart/`
**落点：** 新建 `packages/charts/`（包名 `@luma/charts`）。

- [ ] 建包：`package.json` / `tsconfig.json` / `vite.config.ts`，ECharts 设为 **peer dependency**。
- [ ] `LumaChart`（基础图表组件）。
- [ ] `LumaChartPanel`（带标题/工具条的面板）。
- [ ] `useChartResize`（容器自适应）。
- [ ] 确认 `pnpm-workspace.yaml` 的 `packages/*` 覆盖新包。
- [ ] 更新根 `package.json` 构建脚本、`docs/package-boundaries.md`、`scripts/check-release-boundaries.mjs`（确保 core 不依赖 charts/ECharts）。
- [ ] 包级测试。
- [ ] **用真实包替换 admin `ChartView.vue` / `ChartPanelView.vue` 的本地占位。**

**验证：**
```bash
corepack pnpm --filter @luma/charts test
corepack pnpm --filter @luma/charts typecheck
corepack pnpm --filter @luma/charts build
corepack pnpm --filter luma-admin build
```

---

## 阶段 7–9：构建插件 / 图标增强 / vben-compat 同步（后续增量）

### 阶段 7：构建插件与 resolver（评估后决定）
- [ ] 评估迁移 viewport transform（`src/plugin/viewportTransform`）。
- [ ] 评估迁移 devtools helper（`src/plugin/vueDevtools.ts`）。
- [ ] 评估按需组件 resolver（`src/resolver.ts`）。
- [ ] 若迁移，放独立 `@luma/vite-plugins` 或 `@luma/core/vite` 子入口，默认关闭，不影响 core 运行时。

### 阶段 8：图标系统增强（增量）
- [ ] 内置基础图标集。
- [ ] Element Plus 图标适配。
- [ ] manifest 缓存。
- [ ] lazy registration。

### 阶段 9：vben-compat 同步（core 增强后）
- [ ] `useVbenForm` 同步支持新增控件类型。
- [ ] `useVbenVxeGrid` 同步 toolbar / actions / proxy request / columns / form config。
- [ ] 文档明确支持与不支持范围。

---

## 每阶段收尾（贯穿所有阶段）

每个 core 能力落地后同步更新：

- [ ] `apps/luma-admin` 真实示例路由/页面（消费公开入口）。
- [ ] `docs/core-api.md`。
- [ ] `packages/create-luma-admin` 模板（如涉及默认能力）。
- [ ] `docs/release-checklist.md` 验证项。
- [ ] 回到本文件勾选对应任务。

---

## 总体执行顺序

1. 阶段 2：权限与动态路由闭环。
2. 阶段 3：Auth 会话 + Request 进阶。
3. 阶段 4：主题设置面板 + 布局增强。
4. 阶段 5：composables / utils / directives 子入口。
5. 阶段 6：独立 `@luma/charts` 包。
6. 阶段 7–9：构建插件、图标增强、vben-compat 同步（增量）。
