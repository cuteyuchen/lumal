# Luma 全量重构与开发路线图

本文档是 Luma 唯一的开发规划与阶段状态来源。功能决策、阶段验收、计划提交和完成记录均在此维护；README 与包文档只描述当前稳定能力。

## 当前基线

- 日期：2026-07-11。
- 工作区版本：`0.0.0`。
- 当前分支：`master`。
- 当前已知最近提交：
  - `2bb2a4e refactor(core): 重构页面与 Schema 组件`
  - `62e02fb docs(project): 更新阶段三实施记录`
  - `b16f770 feat(layout): 对齐后台应用壳与导航交互`
  - `30c00b2 chore(repo): 忽略浏览器验收产物`
  - `ebeec07 docs(project): 更新阶段二实施记录`
  - `6e0e8a8 feat(core): 完善应用安装与偏好基础设施`
  - `5e8e27b docs(project): 统一开发路线图与文档入口`
  - `c7bc066 chore(repo): 修复检查与发布基线`
  - `fea2241 feat(core): 完善字典颜色标签渲染`
  - `8bc806d feat(admin): 优化应用壳与导航体验`
- 包管理器：直接执行 `pnpm 10.33.0`。
- 参考框架仅作为功能、交互、视觉和动画的行为基线，不成为 Luma 运行时或构建依赖。

阶段状态：

| 阶段 | 状态 | 实际提交 |
| --- | --- | --- |
| 0 字典颜色标签 | 已完成 | `fea2241` |
| 1 仓库门禁 | 已完成 | `c7bc066` |
| 1 文档治理 | 已完成 | `5e8e27b` |
| 2 安装器与主题基础 | 已完成 | `6e0e8a8` |
| 3 应用壳、菜单和标签页 | 已完成 | `b16f770` |
| 4 Page 与 Schema | 已完成 | `2bb2a4e` |
| 5 CRUD 工作流 | 待开始 | - |
| 6 后端菜单与动态路由 | 待开始 | - |
| 7 Request/Auth 与适配层 | 待开始 | - |
| 8 Admin 系统页面 | 待开始 | - |
| 9 图标、图表、兼容与 Vite | 待开始 | - |
| 10 脚手架、性能与发布 | 待开始 | - |

## 产品目标

Luma 最终应成为一套“轻量但完整”的 Vue Admin 基础设施：

- 三种桌面布局完整可用：侧边导航、顶部导航、混合导航。
- 移动端统一退化为抽屉菜单，不横向挤压桌面导航。
- 标签页支持刷新、滚动、批量关闭、固定标签、最大数量和内容最大化。
- 主题、布局与标签偏好可持久化、重置、导出并响应系统主题。
- 登录后从接口加载菜单并动态注册路由，登出后重置路由、菜单、标签和权限。
- 用户、角色、菜单、字典、配置页面达到可复用后台模板质量。
- 标准接口模型和公司接口适配完全分层。
- 375、768、1024、1440px 下不存在页面级横向溢出或内容裁切。
- 明暗主题、键盘操作、焦点状态和 reduced-motion 通过验收。
- 测试、类型检查、构建、Lint、发布边界和打包检查全部通过。
- Admin 主业务包不超过 500 KB；大型依赖拆为明确的 vendor chunk。

## 设计原则

### 保留

- Vue 3、TypeScript、Vite、Element Plus 和 fetch。
- Luma 标准字段：`field`、`dictionary`、`rows`、`{ items, total }`。
- `@luma/core`、`@luma/icons`、`@luma/charts`、`@luma/vben-compat` 的包边界。
- Pinia、权限、字典和主题作为可选能力，不成为 Core 强制依赖。
- 现有字典布尔值、children、color 和响应适配设计。

### 迁移并重构

- 参考成熟后台的菜单、标签、设置、CRUD、图标和图表行为。
- 迁移行为和交互，不复制大型单文件组件或混乱状态管理。
- 组件按职责拆分 composable、子组件和 adapter，并补充类型和测试。
- Element Plus 继续承担按钮、输入框、表格、菜单、弹窗等底层交互。

### 明确舍弃

- 固定 1920 设计稿的全局 viewport 转换。
- Axios、IndexedDB 缓存、Pinia 字典或完整多语言运行时作为必选项。
- 内部发布地址、固定业务状态码、公司字段和业务菜单。
- 业务展示工具、旧组件别名和无边界兼容。
- 任意超高 z-index、不可中断动画和纯装饰性无限动画。

## 差距矩阵

| 模块 | 当前状态 | 目标决策 |
| --- | --- | --- |
| 应用安装器 | 基础插件接线，异步 setup 和 Router ready 未闭环 | 增加 preset、选择性组件安装、Element Plus options 和异步 mount |
| 应用壳 | 基础结构可用 | 补齐插槽、可见性、移动菜单和统一高度变量 |
| 顶部菜单 | 层级、对齐和溢出能力有限 | 递归菜单、对齐、最大宽度；移动端改用抽屉 |
| 侧边菜单 | 折叠和遮罩可用 | 隐藏项、外链、递归、折叠提示、键盘和抽屉语义 |
| 标签页 | 基础切换和关闭 | 右键菜单、刷新、滚动、批量关闭、固定标签和最大化 |
| 主题设置 | 模型较完整，面板能力不足 | 持久化 store、重置、导出、联动和动画预览 |
| 设计令牌 | 仍有硬编码色值和间距 | 统一颜色、表面、文字、边框、阴影、尺寸、动效和层级令牌 |
| Page | 卡片和边框层级偏重 | 查询、工具栏、内容、分页分区和稳定滚动模型 |
| Schema Form | 控件覆盖较完整，类型较宽 | 泛型模型、精确 props、编辑禁用、只读权限和复合输入 |
| Schema Table | 基础展示可用 | 列设置、树表、选择 key、Ref options、字段插槽和 resize |
| CRUD Table | 功能可运行，主组件职责过多 | 拆分 data/query/dialog/selection，保留兼容 props |
| Router/Permission | Core registry 可用，Admin 仍以静态链路为主 | 登录后加载菜单、动态注册、403/404、外链和登出重置 |
| Request/Auth | fetch、上传、requestId 和缓存可用 | 统一错误、响应 adapter、刷新 Token 单飞与一次重放 |
| 图标 | 注册和渲染可用，选择器简单 | 响应式 registry、搜索、分组、分页、确认和缓存 |
| 图表 | resize 与标题可用 | 查询区、导出入口、图表/表格切换和状态摘要 |
| 构建 | 静态图标插件 | resolver、源码/产物 alias、可选 devtools 和明确分包 |
| 脚手架 | 最小示例 | 登录、工作台、权限菜单、403/404 和全局设置基座 |

## 公共 API 决策

### 应用安装

`createLumaAdmin` 计划增加：

- `preset: 'admin-default' | 'minimal'`。
- `elementPlus` 兼容 Plugin 和 `{ plugin, options }`。
- `components: true | false | string[] | Record<string, Component>`。
- 异步 `mount()`，等待 `setup()` 和 `router.isReady()`。
- 返回 router、pinia、permissionStore 等实际安装上下文。

### 偏好与主题

新增 `createPreferencesStore`：

- 输入：`storage`、`storageKey`、`defaults`、`runtime`、`autoApply`。
- 输出：`state`、`resolvedThemeMode`、`patch`、`reset`、`exportCurrent`、`dispose`。
- 缓存损坏时清理并回退默认值。
- 只在 `mode === 'system'` 时监听系统主题。

主题令牌覆盖背景、表面、文字、边框、状态色、Header、Sidebar、Tabbar、gutter、圆角、阴影、动效和 z-index。

### Layout 与 Tabs

`LumaLayout` 保留受控模式，并增加可选路由驱动模式、标签解析、最大数量、固定标签、菜单对齐、外链策略和移动抽屉。

`LumaTabs` 增加活动路径、图标、刷新、左右/其他/全部关闭、中键关闭、右键菜单、滚轮滚动、自动滚入视口和内容最大化。交互使用可聚焦按钮或完整 tab 键盘协议。

### Schema 与 CRUD

Schema Form：

- 模型和 field key 泛型化。
- `componentProps` 对应具体 Element Plus props。
- 增加 `editDisabled`、`readonlyAuthority`、`formatter`、复合输入插槽。
- 公开 `validate/resetFields/getValues/setValues/setMode`。

Schema Table：

- `options` 支持数组和 Ref。
- `hidden` 支持行上下文。
- 增加列设置、树表、自动 resize、列宽策略和 `table-${field}` 插槽。
- selection 同时返回 rows 和 row keys。
- 字典颜色始终与文字共同呈现。

CRUD Table：

- 新增 `query`、`table`、`toolbar`、`actions`、`dialog`、`pagination` 配置对象。
- 旧扁平 props 保留到首个稳定版本。
- 主组件只组合 `useCrudData/useCrudQuery/useCrudDialog/useCrudSelection`。

### 接口适配

框架标准模型固定为：

```ts
interface ApiEnvelope<T> {
  data: T
  message?: string
}

interface PageResult<T> {
  items: T[]
  total: number
}

interface Session {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}
```

异常字段只在应用 adapter 层通过 `fieldNames`、`parseResponse`、`transform` 和专用 parser 处理。

Token 刷新规则：

- 并发过期只发起一个刷新请求。
- 等待同一个刷新 Promise，原请求最多重放一次。
- GET 默认可重放；写请求需显式 `retryOnAuthRefresh: true` 且请求体可重放。
- 刷新失败时清理会话、权限、菜单、动态路由和标签并进入登录页。
- HTTP 与业务错误统一转换为 `RequestError.kind`。

## 实施阶段

### 阶段 0：字典颜色标签

状态：已完成。

- 公开 `resolveSchemaTableCellDisplay`，内部保留 `LumaSchemaTableCell`。
- 修复 `useDictionary('status')` 调用契约。
- 覆盖有颜色、无颜色、数组、formatter、空值和暗色主题。

验收：Core 125 项、Admin 53 项、仓库类型检查、Core/Admin 构建和浏览器检查通过。

提交：`fea2241 feat(core): 完善字典颜色标签渲染`。

### 阶段 1：仓库门禁与文档治理

状态：已完成。

- 忽略并清理 `.playwright-cli/`。
- Admin 测试使用自己的 Element Plus stubs。
- 修复 Lint 和发布边界。
- 统一直接使用 pnpm 10.33.0。
- 建立本文档并删除重复规划文档。

提交：

- `c7bc066 chore(repo): 修复检查与发布基线`
- `5e8e27b docs(project): 统一开发路线图与文档入口`

### 阶段 2：安装器、中文环境与主题基础

状态：已完成。

- 实现安装器新 API、异步 mount 和兼容层。
- Admin 接入 Element Plus 中文 locale。
- 实现偏好持久化 store 和完整语义令牌。
- 清理 Core、Icons、Charts 和 Admin 展示组件中的非必要硬编码色值。

验收：安装器、主题、偏好单测；刷新持久化；明暗和系统主题浏览器检查。

验收：Core 130 项、Admin 54 项测试，全仓库类型检查、构建、Lint、发布边界，以及中文 locale、刷新持久化和深色主题浏览器检查通过。

提交：`6e0e8a8 feat(core): 完善应用安装与偏好基础设施`。

### 阶段 3：应用壳、菜单和标签页

状态：已完成。

- 重构 Layout、Header、TopNav、Sidebar、Tabs。
- 完成菜单递归、隐藏、外链、对齐和最大宽度。
- 完成标签右键菜单、刷新、批量关闭、滚动和最大化。
- 移动端统一抽屉菜单，并将抽屉开关与桌面侧栏折叠偏好分离。
- 隐藏抽屉使用 `aria-hidden` 和 `inert` 退出无障碍操作树，头部核心按钮满足 44px 触控区域。
- 设置面板补齐顶部菜单对齐、最大宽度、标签图标、最大化、最大数量和动画类型。

验收：375/768/1024/1440px、三种布局、固定标签、缓存、刷新、键盘、焦点和 reduced-motion。

验收结果：Core 135 项、Admin 54 项测试通过；Core 类型检查和构建、Admin 生产构建、全仓库 Lint、发布边界与 `git diff --check` 通过。浏览器验证三种桌面布局、标签右键与批量关闭、键盘切换、内容最大化、移动抽屉、遮罩关闭、375/768/1024/1440px 无页面级横向溢出，以及 reduced-motion 降级均通过。Admin 当前大包警告保留至阶段 10 统一分包处理。

提交：

- `b16f770 feat(layout): 对齐后台应用壳与导航交互`
- `30c00b2 chore(repo): 忽略浏览器验收产物`

### 阶段 4：Page、Schema Form 与 Schema Table

状态：已完成。

- 重构页面高度、滚动和内容分区。
- 表单桌面多列、平板两列、移动单列。
- 完成精确类型、表单增强、列设置、树表、字段插槽、选择 key 和 resize。
- 表格仅在组件内部横向滚动，窄屏操作列改为更多菜单。

验收结果：Core 139 项、Admin 54 项测试通过；全仓库类型检查、Core/Admin 构建、Lint、发布边界和差异检查通过。浏览器验证 375/768/1024/1440px 表单单列/两列/多列响应式、查看态格式化、编辑禁用、复合输入、列设置、树表、字段插槽、选择主键、深色主题、移动端内部横向滚动和操作列“更多”入口；页面无全局横向溢出，控制台无错误或警告。Admin 大包警告继续保留至阶段 10 分包处理。

提交：`2bb2a4e refactor(core): 重构页面与 Schema 组件`。

### 阶段 5：CRUD 工作流

- 拆分 CRUD 数据、查询、弹窗和选择状态。
- 支持查询折叠、工具栏、导出入口、列设置和批量操作。
- 完成保存 loading、关闭保护和错误恢复。

提交：`refactor(core): 重构 CRUD 表格工作流`。

### 阶段 6：后端菜单、权限与动态路由

- 菜单由 API 返回，登录后加载用户、角色、权限和菜单。
- 使用 registry 动态注册路由，增加独立 404、iframe 和新窗口外链。
- 登出重置路由、菜单、标签、权限和缓存。
- 首次守卫初始化使用单飞 Promise。

提交：`feat(router): 完成后端菜单与动态路由闭环`。

### 阶段 7：Request、Auth 与适配层

- 实现统一响应、分页、菜单和会话 adapter。
- 统一网络、HTTP、业务、会话、重复提交和取消错误。
- 完成刷新 Token 单飞和一次重放。
- 公司异常字段只出现在 Admin adapter 配置。

提交：`feat(request): 完善接口适配与会话刷新`。

### 阶段 8：Admin 系统页面与示例区

- 用户、角色、菜单、字典、配置统一使用新 CRUD/Schema。
- 角色授权、菜单变更、字典缓存形成完整反馈链路。
- 设置页改为说明入口，全局设置统一位于抽屉。
- Dashboard 调整为后台工作台。

提交：`feat(admin): 完善系统管理与核心服务示例`。

### 阶段 9：图标、图表和生态能力

- 图标 registry 响应式化，增加搜索、分组、分页、确认、缓存和合成。
- 图表增加查询、导出、图表/表格切换和状态摘要。
- 同步兼容层控件、toolbar、actions 和 proxy。
- 增加组件 resolver、源码/产物 alias 和可选 devtools。

提交：

- `feat(icons): 完善图标注册与选择体验`
- `feat(charts): 完善图表面板工作流`
- `feat(compat): 同步核心组件兼容能力`
- `feat(vite): 增加按需引入与开发辅助`

### 阶段 10：脚手架、性能与最终发布

- 脚手架生成登录、工作台、权限菜单、403/404 和全局设置。
- 路由和重型依赖分包，消除 500 KB 主包警告。
- 增加登录、布局、标签、动态菜单、CRUD 和会话过期 E2E。
- 更新 API、迁移和发布文档并执行完整发布检查。

提交：

- `feat(scaffold): 升级轻量后台基座模板`
- `perf(admin): 优化路由与依赖分包`
- `test(admin): 补充后台关键流程验收`
- `docs(project): 同步最终 API 与发布说明`
- `chore(release): 完成发布前质量检查`

## 验收门禁

每阶段至少执行对应包的：

```bash
pnpm --filter <package> test
pnpm --filter <package> typecheck
pnpm --filter <package> build
```

应用壳和 Admin 阶段额外执行：

```bash
pnpm --filter luma-admin test
pnpm --filter luma-admin build
pnpm lint
pnpm release:boundaries
```

最终串行执行：

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm admin:build
pnpm compat:build
pnpm lint
pnpm release:boundaries
pnpm pack:dry-run
```

浏览器矩阵：

- 宽度：375、768、1024、1440。
- 主题：浅色、深色、跟随系统。
- 布局：侧边、顶部、混合。
- 动效：默认、reduced-motion。
- 账号：admin、operator、guest。
- 页面：登录、工作台、五个系统管理页、服务页、Schema/CRUD/Chart 示例。
- 操作：菜单、标签、设置、CRUD、授权、外链、403、404、退出。

## 最终完成定义

- 公共 API、类型、文档和示例一致。
- 所有包仅按允许方向依赖，Admin 不引用包内部源码或测试文件。
- 非标准接口字段只存在于 adapter 配置和测试夹具。
- 无页面级横向溢出，无中英文控件文案混排。
- 明暗主题、键盘、焦点、ARIA 和 reduced-motion 通过检查。
- 单元测试、E2E、类型、构建、Lint、边界、dry-run 全部通过。
- 每个阶段至少有一个符合规范的中文 Conventional Commit，且不自动推送。
