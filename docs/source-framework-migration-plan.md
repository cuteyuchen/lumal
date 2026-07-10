# 源框架能力迁移开发计划

## 目标

将源框架中适合中小型后台项目复用的能力迁移到 Luma，同时删除公司后端接口、业务字段、业务流程和历史兼容包袱。迁移不是逐文件搬运，而是重新设计为 `@luma/*` 可发布包的稳定公共 API。

最终目标：

- `@luma/core` 提供通用后台基础设施和高质量组件。
- `@luma/icons` 保持独立图标系统。
- `@luma/vben-compat` 只承载迁移兼容，不反向影响 core。
- `apps/luma-admin` 作为唯一原生示例和验证入口。
- 所有接口相关字段使用语义化标准字段；非标准后端结构通过显式映射或解析函数适配。

## 迁移原则

1. **吸收设计，不搬硬编码**
   - 迁移交互模式、组件能力、测试思路和工程边界。
   - 不迁移公司接口路径、固定状态码、固定菜单字段、固定字典字段、固定后端响应结构。

2. **公共字段语义化**
   - 权限路由使用 `meta.authority`、`meta.roles`、`meta.title`、`meta.icon`。
   - 字典使用 `dictionary`，标准响应固定为 `{ items: DictionaryOption[] }`。
   - 表单使用 `field`、`label`、`component`、`rules`、`defaultValue`、`componentProps`。
   - 表格使用 `field`、`label`、`columns`、`rows`、`rowKey`、`selection`、`pagination`。

3. **显式适配非标准结构**
   - 不默认兼容 `data/result/list/rows` 等任意响应结构。
   - 需要通过 `parseResponse`、`fieldNames`、`transform`、`componentResolver` 这类配置显式接入。

4. **包代码不写业务逻辑**
   - 不写具体业务接口 URL。
   - 不写业务模块 store。
   - 不写公司菜单类型枚举。
   - 不写项目专属默认字典。

5. **最小默认依赖**
   - Element Plus 继续作为 peer dependency。
   - 图表、VXE、Axios、Devtools、ECharts 等只在明确需要时做可选能力，不进入 core 默认依赖。

6. **代码规范**
   - Vue 组件使用 `<script setup lang="ts">`。
   - 组件 ref 使用 `useTemplateRef`。
   - 组合式 API 按 `/***********************说明*********************/` 分块。
   - 优先清晰类型、纯函数和可测试逻辑，少做隐式魔法。

## 当前状态

已完成：

- monorepo 基线和发布包结构。
- `@luma/icons` 独立包。
- `@luma/core` 基础应用安装器。
- 基础布局、权限、请求、主题、字典。
- 基础 `LumaSchemaForm`、`LumaSchemaTable`、`LumaCrudTable`。
- `LumaInfoTable`、`LumaPageLayout`。
- `apps/luma-admin` 统一示例入口。
- 删除独立示例应用。
- `@luma/vben-compat` 常用写法适配基线。

仍需迁移：

- 完整表单能力。
- 完整表格能力。
- 完整 CRUD 工作流。
- 动态权限路由。
- Auth 会话能力。
- 主题设置面板。
- 可选图表能力。
- composables、utils、directives 子入口。
- 构建插件与 resolver 能力。
- 更完整的图标内置资产和运行时能力。

> **接力状态更新（2026-07-10）：** 组件三件套（Schema Form / Table / CRUD）已增强完成。阶段 2「动态权限路由」正在进行（`packages/core/src/router/` 为草稿，权限守卫闭环、外链、403/404、动态注册与重置尚未完成）。阶段 3 及之后（Auth、Request 进阶、主题面板、TopNav、composables/utils/directives 子入口、charts 包）尚未开始。
>
> 需注意：`apps/luma-admin` 中的 `ComposablesView`、`UtilsView`、`ChartView`、`ChartPanelView`、`ThemeSettingsView` 目前是**页面内本地占位实现**，并未消费真正的 `@luma/core` 子入口能力，不能视为对应能力已完成。
>
> 具体逐项任务与源框架参考路径见 [后续开发计划](luma-next-development-plan.md)。

## 阶段 1：组件三件套能力补齐

### 1.1 Schema Form

目标：把当前基础表单升级为可支撑真实后台表单的通用 schema 表单。

新增能力：

- 表单模式：`create`、`edit`、`view`。
- 控件类型：
  - `input`
  - `textarea`
  - `select`
  - `number`
  - `switch`
  - `date`
  - `datetime`
  - `daterange`
  - `radio`
  - `checkbox`
  - `tree-select`
  - `upload`
- 字典选项：`dictionary`。
- 静态选项：`options`。
- 表单校验：`rules`。
- 栅格布局：`span`、`columns`、`labelWidth`。
- 字段状态：`hidden`、`disabled`、`readonly`。
- 权限控制：`authority` 或 `visibleWhen`。
- 组件透传：`componentProps`。
- 插槽扩展：字段前缀、后缀、自定义渲染。
- 暴露方法：`validate`、`resetFields`、`getValues`、`setValues`、`setMode`。

字段设计：

```ts
interface SchemaFormField {
  field: string
  label: string
  component?: SchemaFormComponent
  dictionary?: string
  options?: DictionaryOption[]
  defaultValue?: unknown
  rules?: FormRule[]
  span?: number
  hidden?: boolean | ((context: SchemaFormContext) => boolean)
  disabled?: boolean | ((context: SchemaFormContext) => boolean)
  readonly?: boolean | ((context: SchemaFormContext) => boolean)
  authority?: string | string[]
  componentProps?: Record<string, unknown>
}
```

验收：

- 所有控件有组件测试。
- 字典下拉和静态 options 均可用。
- `view` 模式不提交可编辑控件。
- `validate/reset/setValues` 类型和行为稳定。
- admin 中有完整表单示例。

### 1.2 Schema Table

目标：让表格从展示型组件升级为可用于列表页面的基础表格。

新增能力：

- selection。
- index column。
- loading。
- 内部分页。
- 列隐藏。
- 列权限。
- 列设置。
- tree table。
- Element Plus 列属性透传。
- row class、cell class、header class。
- auto resize 和 `doLayout`。
- 字典回显和颜色渲染。
- 操作列插槽。

字段设计：

```ts
interface SchemaTableColumn<Row = Record<string, unknown>> {
  field: keyof Row & string
  label: string
  dictionary?: string
  options?: DictionaryOption[]
  hidden?: boolean | ((row?: Row) => boolean)
  authority?: string | string[]
  formatter?: (value: unknown, row: Row, index: number) => unknown
  componentProps?: Record<string, unknown>
}
```

验收：

- selection 行为有测试。
- 列权限和隐藏有测试。
- 字典回显覆盖单值、多值、空值、未知值。
- admin 中有可交互表格示例。

### 1.3 CRUD Table

目标：把 CRUD 从静态展示封装升级为真实后台列表工作流。

新增能力：

- 查询表单。
- 远程加载数据。
- 分页请求。
- 新增、查看、编辑、删除。
- 批量删除。
- 选择行。
- 弹窗表单。
- 操作列。
- 工具栏：刷新、导出、全屏、列设置。
- 删除确认。
- loading、empty、error 状态。
- 请求适配：
  - `fetchData`
  - `create`
  - `update`
  - `remove`
  - `removeMany`
  - `parseResponse`

推荐 API：

```ts
interface CrudDataSource<Row, Query> {
  fetch: (params: CrudFetchParams<Query>) => Promise<unknown>
  create?: (model: Partial<Row>) => Promise<unknown>
  update?: (row: Row, model: Partial<Row>) => Promise<unknown>
  remove?: (row: Row) => Promise<unknown>
  removeMany?: (rows: Row[]) => Promise<unknown>
  parseResponse?: (response: unknown) => CrudFetchResult<Row>
}
```

标准响应：

```ts
interface CrudFetchResult<Row> {
  items: Row[]
  total: number
}
```

非标准响应必须显式配置 `parseResponse`。

验收：

- CRUD 全流程组件测试。
- admin 中有 mock 远程 CRUD 示例。
- 不绑定任何业务接口字段。

## 阶段 2：权限和路由体系升级

目标：支持真实项目常见的后端菜单、动态路由和权限守卫，但字段设计必须通用。

新增能力：

- 后端菜单标准模型。
- 菜单字段映射。
- 动态路由注册和重置。
- 外链路由和内嵌外链页。
- 登录守卫。
- 白名单。
- 403/404 兜底。
- 首个可访问菜单解析。
- 菜单树过滤。
- 顶部菜单和侧边菜单拆分。

标准模型：

```ts
interface LumaAccessMenu {
  id: string
  parentId?: string
  title: string
  path?: string
  component?: string
  type?: 'directory' | 'page' | 'button' | 'link'
  icon?: string
  authority?: string | string[]
  roles?: string | string[]
  order?: number
  hidden?: boolean
  externalLink?: string
  children?: LumaAccessMenu[]
}
```

适配模型：

```ts
interface AccessMenuFieldNames {
  id?: string
  parentId?: string
  title?: string
  path?: string
  component?: string
  authority?: string
  roles?: string
  order?: string
  hidden?: string
  children?: string
}
```

验收：

- 不再默认识别公司接口字段。
- 标准字段可直接使用。
- 非标准菜单通过 `fieldNames` 或 `normalizeMenu` 适配。
- admin 中用 mock 后端菜单验证动态路由。

## 阶段 3：Auth 和 Request 收敛

### 3.1 Auth

新增能力：

- token storage。
- 登录跳转解析。
- session expired handler。
- logout hook。
- 可替换 storage。

不做：

- 不绑定具体登录接口。
- 不绑定具体 token 字段名。

推荐 API：

```ts
createAuthSession({
  tokenKey: 'token',
  storage: localStorage,
  onSessionExpired: () => {},
})
```

### 3.2 Request

新增能力：

- 生命周期 hooks：
  - `onRequest`
  - `onRequestError`
  - `onResponse`
  - `onResponseError`
- upload。
- duplicate submit。
- request id。
- cache hooks。
- 标准响应解析 helper。

原则：

- 继续保留当前 fetch client。
- Axios 只能作为可选 adapter，不能成为 core 默认依赖。
- 默认不假设响应结构；标准解析 helper 需要显式启用。

## 阶段 4：主题和布局补齐

### 4.1 主题设置面板

新增能力：

- `LumaThemeSettingsPanel`。
- 明暗模式切换。
- 主题色选择。
- 圆角比例。
- 侧边栏宽度。
- tabbar 开关。
- 动画开关。
- 布局模式切换。

验收：

- 组件不依赖业务 store。
- 可通过 props/model 控制。
- admin 中完整展示。

### 4.2 布局增强

新增能力：

- `LumaTopNav`。
- mixed-nav。
- top-nav。
- 菜单按布局拆分。
- active menu 解析。
- tab 最大数量。
- tab 缓存策略。
- maximize。

## 阶段 5：通用 composables、utils、directives

### 5.1 composables 子入口

建议新增 `@luma/core/composables`。

候选能力：

- `usePagination`
- `useConfirmAction`
- `usePersistentState`
- `useDictionaryMap`
- `useSelection`
- `useFullscreen`

原则：

- 只迁移跨项目稳定复用的组合式逻辑。
- 不迁移业务页面 helper。

### 5.2 utils 子入口

建议新增 `@luma/core/utils`。

候选能力：

- `cloneDeep`
- `joinPath`
- `omitUndefined`
- `serializeQuery`
- `downloadBlob`
- `createStorage`
- `withInstall`

原则：

- 标准库能直接解决的不封装。
- 函数必须纯、短、可测试。

### 5.3 directives 子入口

建议新增 `@luma/core/directives`。

候选能力：

- `v-permission`
- `v-authority`

命名建议：

- 推荐 `v-authority`，兼容 `v-permission`。

## 阶段 6：可选图表能力

目标：提供轻量可选图表封装，不让图表库进入 core 默认依赖。

方案：

- 新包：`@luma/charts`。
- 或 core 可选子入口：`@luma/core/charts`。

推荐新包：

```text
packages/charts
```

原因：

- 图表依赖较重。
- 并非所有后台项目都需要。
- 更符合 Luma mini 定位。

能力：

- `LumaChart`
- `LumaChartPanel`
- `useChartResize`

## 阶段 7：构建插件和 resolver

目标：只迁移对开源项目通用的构建能力。

候选能力：

- 静态 SVG 图标插件继续放在 `@luma/icons/vite`。
- viewport transform 是否迁移需要单独评估。
- devtools 插件只做可选 helper。
- resolver 用于按需导入时再做。

建议：

- 暂不把 viewport transform 放入 core。
- 如果确实需要，放在 `@luma/vite-plugins` 或 `@luma/core/vite`，并默认关闭。

## 阶段 8：图标系统增强

目标：保持图标独立，同时补齐源框架中更成熟的 runtime 能力。

新增能力：

- 内置基础图标集。
- Element Plus 图标适配。
- manifest 缓存。
- lazy registration。
- 图标分类优化。

原则：

- 不迁移业务地图图标到默认内置。
- 业务图标由应用侧注册。

## 阶段 9：Vben 兼容层同步升级

当 core 的 Form/Table/CRUD 能力增强后，同步升级兼容层：

- `useVbenForm` 支持更多 component。
- `useVbenVxeGrid` 支持 toolbar、actions、proxy request、columns、form config。
- 文档明确支持范围。
- 不引入 VXE 到 core。

## 阶段 10：脚手架和 Admin 示例同步

每完成一个 core 能力，都需要同步：

- `apps/luma-admin` 增加真实示例路由。
- `create-luma-admin` 模板升级。
- `docs/core-api.md` 更新。
- `docs/migration-from-vben.md` 更新。
- `docs/release-checklist.md` 更新验证项。

## 推荐开发顺序

1. 补齐 `LumaSchemaForm`。
2. 补齐 `LumaSchemaTable`。
3. 重构 `LumaCrudTable` 为真实 CRUD 工作流。
4. 增强动态权限路由。
5. 增加 Auth service。
6. 增强 Request hooks 和 upload。
7. 增加主题设置面板。
8. 补齐 top-nav/mixed-nav。
9. 新增 composables/utils/directives 子入口。
10. 评估并拆出 charts 包。
11. 评估构建插件。
12. 同步升级 vben compat、admin 示例和脚手架。

## 每阶段验收命令

组件阶段：

```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
corepack pnpm --filter @luma/core build
corepack pnpm --filter luma-admin test
corepack pnpm --filter luma-admin build
```

兼容层阶段：

```bash
corepack pnpm --filter @luma/vben-compat test
corepack pnpm --filter @luma/vben-compat typecheck
corepack pnpm --filter @luma/vben-compat build
corepack pnpm --filter luma-vben-compat-demo build
```

发布前：

```bash
corepack pnpm release:check
```

## 明确不迁移的内容

- 公司接口路径。
- 公司后端菜单字段默认值。
- 业务模块页面。
- 业务字典默认项。
- 业务状态码判断。
- 项目专属地图图标。
- 为单个项目存在的临时兼容逻辑。

## 完成标准

迁移完成不以“源码长得像”为标准，而以以下结果为准：

- Luma 原生 API 能覆盖真实中小后台常见工作流。
- admin 示例能展示每个能力。
- 兼容层能支撑常见迁移场景。
- 包边界检查通过。
- 文档说明 API、适配方式和不支持项。
- 不包含公司后端硬编码。
- 所有新增能力有测试和构建验证。
