# Luma 全量重构与开发路线图

本文档是 Luma 唯一的开发规划与阶段状态来源。功能决策、阶段验收、计划提交和完成记录均在此维护；README 与包文档只描述当前稳定能力。

## 当前基线

- 日期：2026-07-15。
- 工作区版本：`0.0.0`。
- 当前分支：`master`。
- 当前已知最近提交：
  - `1d66b01 chore(release): 完成发布前质量检查`
  - `9996f05 perf(compat): 优化兼容示例依赖分包`
  - `a2af23f test(admin): 补充后台关键流程验收`
  - `92bec49 perf(admin): 优化路由与依赖分包`
  - `575b3c2 feat(scaffold): 升级轻量后台基座模板`
  - `14b12fc docs(project): 更新阶段九实施记录`
  - `4f7aba6 test(repo): 同步发布包名检查`
  - `95ca1dd feat(vite): 增加按需引入与开发辅助`
  - `a6a36da feat(compat): 同步核心组件兼容能力`
  - `4ce169e feat(charts): 完善图表面板工作流`
  - `96d4d3a feat(icons): 完善图标注册与选择体验`
  - `1b1c78e docs(project): 更新阶段八实施记录`
  - `8ecba31 feat(admin): 完善系统管理与核心服务示例`
  - `2b3f3cc docs(project): 更新阶段七实施记录`
  - `5e00157 feat(request): 完善接口适配与会话刷新`
  - `e5f7923 fix(layout): 修复顶部菜单重复节点标识`
  - `36d0e00 docs(project): 更新阶段六实施记录`
  - `5e233e3 feat(router): 完成后端菜单与动态路由闭环`
  - `d48f913 docs(project): 更新阶段五实施记录`
  - `145a005 refactor(core): 重构 CRUD 表格工作流`
  - `cc75b22 docs(project): 更新阶段四实施记录`
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
| 5 CRUD 工作流 | 已完成 | `145a005` |
| 6 后端菜单与动态路由 | 已完成 | `5e233e3` |
| 7 Request/Auth 与适配层 | 已完成 | `5e00157` |
| 8 Admin 系统页面 | 已完成 | `8ecba31` |
| 9 图标、图表、兼容与 Vite | 已完成 | `96d4d3a`、`4ce169e`、`a6a36da`、`95ca1dd`、`4f7aba6` |
| 10 脚手架、性能与发布 | 已完成 | `575b3c2`、`92bec49`、`a2af23f`、`1d66b01`、`9996f05` |
| 11 组织化用户管理 | 已完成 | 待提交 |

完成审计补充：Core 已补齐 `LumaLayout` 路由驱动标签 API，Admin 不再自行编排访问标签；CRUD 删除确认进入 `actions` 配置且保留旧 prop 兼容；公司异常响应、菜单、分页和会话字段的构造与解析均集中在 Admin adapter 文件。

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
- `@luma/core`、`@luma/icons`、`@luma/charts`、`@luma/vben-compat`、`@luma/vite` 的包边界。
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

`LumaLayout` 直接消费完整菜单树和统一偏好对象，内部负责三种布局的菜单拆分、激活项解析、一级菜单下钻、标签解析、最大数量、固定标签、菜单对齐、外链策略和移动抽屉。

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

验收结果：Core 135 项、Admin 54 项测试通过；Core 类型检查和构建、Admin 生产构建、全仓库 Lint、发布边界与 `git diff --check` 通过。浏览器验证三种桌面布局、标签右键与批量关闭、键盘切换、内容最大化、移动抽屉、遮罩关闭、375/768/1024/1440px 无页面级横向溢出，以及 reduced-motion 降级均通过。阶段 10 已完成最终分包优化。

提交：

- `b16f770 feat(layout): 对齐后台应用壳与导航交互`
- `30c00b2 chore(repo): 忽略浏览器验收产物`

### 阶段 4：Page、Schema Form 与 Schema Table

状态：已完成。

- 重构页面高度、滚动和内容分区。
- 表单桌面多列、平板两列、移动单列。
- 完成精确类型、表单增强、列设置、树表、字段插槽、选择 key 和 resize。
- 表格仅在组件内部横向滚动，窄屏操作列改为更多菜单。

验收结果：Core 139 项、Admin 54 项测试通过；全仓库类型检查、Core/Admin 构建、Lint、发布边界和差异检查通过。浏览器验证 375/768/1024/1440px 表单单列/两列/多列响应式、查看态格式化、编辑禁用、复合输入、列设置、树表、字段插槽、选择主键、深色主题、移动端内部横向滚动和操作列“更多”入口；页面无全局横向溢出，控制台无错误或警告。阶段 10 已完成最终分包优化。

提交：`2bb2a4e refactor(core): 重构页面与 Schema 组件`。

### 阶段 5：CRUD 工作流

状态：已完成。

- 将数据、查询、弹窗和选择状态拆分为 `useCrudData`、`useCrudQuery`、`useCrudDialog`、`useCrudSelection`，主组件只负责配置归一化与编排。
- 新增 `query`、`table`、`toolbar`、`actions`、`dialog`、`pagination` 配置对象，保留原扁平 props 兼容。
- 支持多列查询、折叠/展开、自动 label width、导出事件、列设置、批量操作和按行控制查看/编辑/删除。
- 完成保存 loading、脏表单关闭保护、列表重试、保存失败恢复和统一 `operation-error` 事件。
- 公开查询表单、弹窗表单、表格、选择主键、选择行、加载状态、布局切换和 reload 等方法。
- 用户、角色与 CRUD 示例已切换为新配置对象，异常接口字段仍由应用数据源适配，不进入组件。

验收结果：Core 143 项、Admin 54 项测试通过；Core 类型检查和构建、Admin 生产构建、Lint、发布边界与差异检查通过。浏览器验证新增、编辑、查询折叠、导出、深色主题及 375/768/1024/1440px 响应式；四档均无页面级横向溢出，窄屏表格保持内部滚动并切换“更多”操作入口，控制台无错误或警告。阶段 10 已完成最终分包优化。

提交：`145a005 refactor(core): 重构 CRUD 表格工作流`。

### 阶段 6：后端菜单、权限与动态路由

- 菜单由 API 返回，登录后加载用户、角色、权限和菜单。
- 使用 registry 动态注册路由，增加独立 404、iframe 和新窗口外链。
- 登出重置路由、菜单、标签、权限和缓存。
- 首次守卫初始化使用单飞 Promise。

实施结果：Admin 静态路由只保留登录、根路由、403、404 与 catch-all；登录后通过菜单 API 加载标准菜单，使用 `createRouteRegistry` 动态注册页面路由。首次访问深层地址时会等待同一个初始化 Promise，并在注册完成后重新解析原地址；未知地址进入独立 404。外链支持 `_blank` 新窗口与 `_self` 站内 iframe 两种策略。会话清理会同步重置权限、菜单、动态路由和标签。

验收结果：Core 143 项、Admin 59 项测试通过；Core 与 Admin 类型检查、构建、Lint、发布边界和差异检查通过。浏览器验证 admin/operator/guest 三种账号、深层地址刷新、403、404、iframe、新窗口外链，以及 375/768/1024/1440px 四档无页面级横向溢出；控制台无错误或警告。阶段 10 已完成最终分包优化。

提交：`5e233e3 feat(router): 完成后端菜单与动态路由闭环`。

### 阶段 7：Request、Auth 与适配层

- 实现统一响应、分页、菜单和会话 adapter。
- 统一网络、HTTP、业务、会话、重复提交和取消错误。
- 完成刷新 Token 单飞和一次重放。
- 公司异常字段只出现在 Admin adapter 配置。

实施结果：Core 新增标准 `ApiEnvelope<T>`、`PageResult<T>`、`AuthSessionData` 及响应、分页、会话 parser；`RequestError.kind` 统一覆盖 network、http、business、session、duplicate、cancelled。GET 在认证刷新成功后默认最多重放一次，写请求必须显式设置 `retryOnAuthRefresh: true` 且请求体可重放；显式 Authorization 不进入自动刷新。并发过期请求共享同一个刷新 Promise，刷新失败统一清理访问凭据、刷新凭据、用户、权限、菜单、动态路由和标签。

Admin 新增集中 adapter，`statusCode/result/resultMsg`、`access_token/refresh_token/expire_time`、`records/totalNum`、`menuName/authCode/url` 等异常字段不进入 Core 或页面组件。Services 页面展示业务会话码识别、Token 刷新、GET 重放、分页转换和错误分类。浏览器验收期间同时修复了 mixed-nav flat 顶部菜单重复 vnode key，提交为 `e5f7923`。

验收结果：全仓库测试通过（Core 153 项、Admin 62 项），全包类型检查、Core/Admin 构建、Lint、发布边界和差异检查通过。浏览器实测 Services 请求经过 2 次 fetch 后成功，显示“已单飞刷新并重放”；375/768/1024/1440px 无页面级横向溢出，最终控制台 0 error / 0 warning。阶段 10 已完成最终分包优化。

提交：`5e00157 feat(request): 完善接口适配与会话刷新`。

### 阶段 8：Admin 系统页面与示例区

- 用户、角色、菜单、字典、配置统一使用新 CRUD/Schema。
- 角色授权、菜单变更、字典缓存形成完整反馈链路。
- 设置页改为说明入口，全局设置统一位于抽屉。
- Dashboard 调整为后台工作台。

实施结果：用户、角色继续使用新 CRUD 工作流；菜单、字典使用 Schema 树表与弹窗表单。角色授权增加加载、保存、禁用态和错误恢复；字典项变更继续刷新全局字典缓存。系统菜单 Mock 数据成为动态菜单 API 的权威来源，菜单页支持路由名、重定向、组件、外链及 `_blank/_self` 策略，新增、修改、删除会直接反映到下一次登录的动态路由。系统配置页改为全局设置抽屉的说明和入口，消除页面表单与应用壳偏好的双重状态源。

Dashboard 已调整为后台工作台，展示用户、角色、菜单、字典指标、最近用户和权限感知快捷入口；示例总览改为按公开包入口组织的 API 能力索引，不再重复宣传文案。

验收结果：全仓库测试、全包类型检查、Core/Admin 构建、Lint、发布边界与差异检查通过；Admin 61 项测试通过。浏览器验证工作台、菜单页、系统配置页和全局设置抽屉；375/768/1024/1440px 无页面级横向溢出，控制台 0 error / 0 warning。阶段 10 已完成最终分包优化。

提交：`8ecba31 feat(admin): 完善系统管理与核心服务示例`。

### 阶段 9：图标、图表和生态能力

状态：已完成。

- 图标 registry 响应式化，增加搜索、分组、分页、确认、缓存和合成。
- 图表增加查询、导出、图表/表格切换和状态摘要。
- 同步兼容层控件、toolbar、actions 和 proxy。
- 增加组件 resolver、源码/产物 alias 和可选 devtools。

实施结果：Icons 注册表改为响应式 Map，分组按顺序稳定排序；新增组件/Iconify 定义批量生成、单色 SVG 安全校验、多图层合成和最多 256 项的 data URI 缓存。选择器支持搜索、分组、分页、持久化、选中态和 44px 触控，确认弹窗使用草稿值，只有确认后才更新外部模型，并在移动端退化为底部弹层。

Charts 面板新增 query/table/error 插槽、图表/表格切换、导出与重试事件、loading/empty/error 状态和屏幕阅读器摘要；基础图表根据 `prefers-reduced-motion` 自动关闭动画，同时保留显式 `animation` 覆盖和 `resize()`。Admin Chart Panel 示例已覆盖查询、失败恢复、表格替代视图和导出反馈。

Vben 兼容层同步 number、switch、date/datetime/daterange、radio、checkbox、tree-select、upload 和 password 控件；Grid 增加 toolbar、actions、tableConfig、checkbox selection 映射，支持嵌套结果与数字字符串 total。`reload/search/reset` 返回 `Promise<boolean>`，失败时恢复 loading，并通过 `getError/clearError/onError` 暴露错误状态。

新增独立 `@luma/vite` 包，提供 Luma 组件 resolver、工作区源码/产物 alias 和调用方注入式 Devtools 接线。该包无强制运行时依赖，不包含全局 viewport 转换，并已纳入根级构建、类型检查、测试、打包和发布边界。

验收结果：全仓库测试通过，其中脚本 6 项、Icons 12 项、Core 153 项、Charts 7 项、Compat 12 项、Vite 4 项、脚手架 2 项、Admin 61 项；全仓库类型检查、对应包构建、Admin 生产构建、兼容示例构建、根级全包构建、Lint、发布边界和 `@luma/vite` pack dry-run 通过。浏览器验证 Chart Panel 的查询、表格切换、失败提示和重试入口；375px 下无页面级横向溢出，控制台 0 error / 0 warning。阶段 10 已消除 Admin 与兼容示例的 500 KB 警告。

提交：

- `96d4d3a feat(icons): 完善图标注册与选择体验`
- `4ce169e feat(charts): 完善图表面板工作流`
- `a6a36da feat(compat): 同步核心组件兼容能力`
- `95ca1dd feat(vite): 增加按需引入与开发辅助`
- `4f7aba6 test(repo): 同步发布包名检查`

### 阶段 10：脚手架、性能与最终发布

状态：已完成。

- 脚手架生成登录、工作台、权限菜单、403/404 和全局设置。
- 路由和重型依赖分包，消除 500 KB 主包警告。
- 增加登录、布局、标签、动态菜单、CRUD 和会话过期 E2E。
- 更新 API、迁移和发布文档并执行完整发布检查。

实施结果：脚手架已升级为可直接启动的轻量后台基座，包含中文 Element Plus、登录与会话、权限菜单、工作台、受保护页面、403/404、全局设置和请求示例，但不生成完整系统管理业务。Admin 页面改为路由级动态导入，并将 Element Plus、ECharts、Luma 和其他依赖拆为明确 vendor chunk；兼容示例同步完成依赖分包。

新增 5 项 Chromium E2E，覆盖登录与动态菜单、403/404/退出、标签与设置持久化、用户查询/新增、会话凭据失效，并验证 375px 不存在页面级横向溢出。`release:artifacts` 会检查必要产物、vendor 命名和 500 KB 单块上限。

最终验收结果：完整 `pnpm release:check` 连续两次通过且无大包警告。测试包括脚本 6 项、Icons 12 项、Core 153 项、Charts 7 项、Compat 12 项、Vite 4 项、脚手架 2 项、Admin 61 项和 E2E 5 项；全仓库 Lint、发布边界、类型检查、构建、Admin/Compat 构建、发布产物检查及六个发布包 dry-run 全部通过。Admin 主入口约 91 KB，最大 JavaScript vendor 块为 152,672 bytes。

提交：

- `575b3c2 feat(scaffold): 升级轻量后台基座模板`
- `92bec49 perf(admin): 优化路由与依赖分包`
- `a2af23f test(admin): 补充后台关键流程验收`
- `1d66b01 chore(release): 完成发布前质量检查`
- `9996f05 perf(compat): 优化兼容示例依赖分包`
- `docs(project): 同步最终 API 与发布说明`（本次文档收口提交）

### 阶段 11：组织化用户管理

状态：已完成。

- 为用户增加必填机构归属，机构筛选默认覆盖当前机构及全部下级机构。
- 用户页使用响应式机构树联动用户 CRUD，并增加批量启停与角色追加/替换。
- Mock API 提供精简机构选项和原子批量用户接口；机构存在直属用户时禁止删除。
- `LumaCrudTable` 向 `toolbar-actions` slot 暴露选择行、选择键和清空选择能力。
- 恢复干净检出下的 frozen lockfile 安装，并保持 Changesets、发布边界和完整发布检查通过。

验收要求：覆盖机构归属与子树筛选、停用机构规则、机构占用删除、批量操作原子回滚、权限隔离、响应式布局和浏览器真实流程；最终执行 `pnpm install --frozen-lockfile`、`pnpm release:check`、`git diff --check` 与 `pnpm changeset:status`。

验收结果：Mock API 13 项、Core 273 项、Admin 95 项测试通过；完整 `pnpm release:check` 通过，其中 Playwright 27 项通过，并覆盖组织筛选、创建归属机构用户、批量启停、批量追加角色及 375/768/1024/1440px 无页面级横向溢出。当前工作区与模拟干净检出均通过 `pnpm install --frozen-lockfile`，`pnpm changeset:status`、发布边界、类型检查、构建、发布产物、六个公共包 dry-run 和 `git diff --check` 均通过。

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
pnpm release:check
```

该命令串行包含 Lint、发布边界、全部测试、类型检查、全包构建、Admin/Compat 构建、发布产物检查、Playwright E2E 和六个发布包 dry-run。

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
