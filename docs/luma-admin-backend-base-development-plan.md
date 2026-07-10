# Luma Admin 完整后台基座开发计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` when executing this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将 `apps/luma-admin` 从“组件能力示例集合”升级为一个完整后台基座，覆盖登录会话、动态菜单、权限控制、字典管理、主题与布局设置、系统管理 CRUD、工作台和开发示例区。

**架构：** `@luma/core` 继续保持框架包边界，只提供通用布局、权限、字典、请求、主题、路由和组件能力；`apps/luma-admin` 承担具体后台应用的数据模型、mock API、页面工作流和系统管理模块。开发时对照 `E:\gr-framework\example` 的应用壳、核心服务页、主题抽屉和 mock 数据方式，但转成 Luma 自己的轻量基座形态。

**技术栈：** Vue 3、TypeScript、Vite、Vue Router、Element Plus、`@luma/core`、`@luma/icons`、`@luma/charts`、Vitest。

---

## 1. 参考对照

### 1.1 gr-framework example 可借鉴点

- `example/src/App.vue`
  - 偏好状态由应用壳持有。
  - `GThemeSettingsPanel` 放在右侧全局抽屉中，不只是一个普通示例页。
  - 主题切换按钮、设置按钮位于 header actions。
  - `AppRouterView` 的 progress、loading、transition、cache 由偏好驱动。
  - 菜单、标签页、路由跳转统一由应用壳协调。

- `example/src/main.ts`
  - 框架安装时传入 router、theme defaults、permission initial values、dict fetcher、local icons。
  - mock 能力集中在 `mock/permission.ts`、`mock/dict.ts`、`mock/request.ts`。

- `example/src/pages/ServicesPage.vue`
  - 权限、角色、权限指令、字典、Auth、Request 在一个“核心服务”视图里闭环演示。

- `example/src/routes.ts`
  - 示例页和系统菜单分离。
  - 菜单有明确分组，不把所有示例平铺到一级导航。

### 1.2 Luma 当前基础

- `@luma/core` 已有：
  - `createLumaAdmin`
  - `LumaLayout`、`LumaRouterView`、`LumaTopNav`
  - `createPermissionStore`、`setupPermissionGuard`、`v-authority` / `v-permission`
  - `normalizeMenuRecords`、`createRouteRecords`、`createSidebarMenus`、`createTopMenus`
  - `createAuthSession`、token storage、session expired handler
  - `installDictionary`、`useDictionary`、`useDictionaryMap`
  - `LumaThemeSettingsPanel`、`createDefaultPreferences`、`applyThemePreferences`
  - `LumaSchemaForm`、`LumaSchemaTable`、`LumaCrudTable`

- `apps/luma-admin` 当前问题：
  - 菜单以示例为主，系统管理能力不足。
  - 权限 store 是硬编码初始权限，缺用户/角色切换和授权闭环。
  - 字典只有示例数据，没有字典类型/字典项管理页。
  - 主题设置是示例页，没有成为全局应用设置入口。
  - 布局偏好没有真正驱动 `LumaLayout`、`LumaRouterView` 和菜单拆分。
  - 业务 mock 数据分散在示例目录，缺应用级 mock API 层。

---

## 2. 目标信息架构

### 2.1 一级导航

最终 `luma-admin` 一级导航建议为：

1. **工作台**
   - `/dashboard`
   - 展示项目状态、快捷入口、权限与请求摘要。

2. **系统管理**
   - `/system/user`
   - `/system/role`
   - `/system/menu`
   - `/system/dict`
   - `/system/config`

3. **能力示例**
   - `/examples/overview`
   - `/examples/schema-form`
   - `/examples/schema-table`
   - `/examples/crud-table`
   - `/examples/chart`
   - `/examples/chart-panel`
   - `/examples/composables`
   - `/examples/utils`
   - `/examples/services`

4. **项目管理**
   - `/project`
   - 保留为业务页面示例，受 `project:list` 权限控制。

5. **错误页**
   - `/403`
   - `/:pathMatch(.*)*` 兜底。

### 2.2 页面定位

- 系统管理页是“后台基座能力”，不是组件演示。
- 能力示例页用于验证包公开 API，保留但放到次级导航。
- 主题与布局设置从示例页转为全局抽屉入口；可保留一个 `/examples/theme-settings` 说明页，但不作为主入口。

---

## 3. 文件结构规划

### 3.1 新增目录

- `apps/luma-admin/src/api/`
  - 应用级 mock API facade。页面只调用这里，不直接读 mock 数据。

- `apps/luma-admin/src/mock/`
  - mock 数据源和模拟请求延迟。

- `apps/luma-admin/src/stores/`
  - 无 Pinia 时也可以用普通模块状态。第一版优先普通模块，避免引入额外状态依赖。

- `apps/luma-admin/src/services/`
  - 会话、权限初始化、应用偏好持久化等应用级服务。

- `apps/luma-admin/src/views/system/`
  - 系统管理页面。

- `apps/luma-admin/src/views/login/`
  - 登录页。

- `apps/luma-admin/src/components/app/`
  - 应用壳局部组件，例如 header actions、设置抽屉。

### 3.2 重点文件职责

- `apps/luma-admin/src/main.ts`
  - 安装 Luma、字典、图标、router。
  - 注册 `v-authority` / `v-permission`。
  - 初始化 mock session。

- `apps/luma-admin/src/App.vue`
  - 持有全局偏好、主题应用、布局菜单拆分、设置抽屉。
  - 不放系统管理 CRUD 逻辑。

- `apps/luma-admin/src/router/index.ts`
  - 路由创建、权限守卫、菜单归一化。
  - 从应用权限服务读取当前权限和角色。

- `apps/luma-admin/src/router/routes.ts`
  - 维护静态菜单/路由配置。
  - 后续可替换为 mock API 返回菜单树。

- `apps/luma-admin/src/router/components.ts`
  - component 字符串到 Vue 组件的映射。
  - 为后续切换 `createGlobComponentResolver` 留出边界。

- `apps/luma-admin/src/services/session.ts`
  - 登录、登出、当前用户、token、角色、权限。

- `apps/luma-admin/src/services/preferences.ts`
  - 默认偏好、读取持久化偏好、保存偏好、应用主题。

- `apps/luma-admin/src/services/permission.ts`
  - 当前权限 store、权限初始化、菜单权限同步。

- `apps/luma-admin/src/mock/system.ts`
  - 用户、角色、菜单、字典、配置 mock 数据。

- `apps/luma-admin/src/api/system.ts`
  - 用户、角色、菜单、字典、配置的 CRUD mock API。

---

## 4. 阶段计划

## 阶段 1：应用壳升级为后台基座

**目标：** 把主题、布局、菜单、标签页和 RouterView 变成真正的全局应用能力。

**修改文件：**

- `apps/luma-admin/src/App.vue`
- `apps/luma-admin/src/main.ts`
- `apps/luma-admin/src/styles.scss`
- `apps/luma-admin/tests/router.test.ts`

**新增文件：**

- `apps/luma-admin/src/services/preferences.ts`
- `apps/luma-admin/src/components/app/AppHeaderActions.vue`
- `apps/luma-admin/src/components/app/AppSettingsDrawer.vue`

**任务：**

- [x] 在 `services/preferences.ts` 中定义 `adminPreferenceDefaults`，默认启用 `mixed-nav`、tabbar、transition、cache。
- [x] 在 `App.vue` 中使用 `createDefaultPreferences(adminPreferenceDefaults)` 持有偏好。
- [x] watch 偏好并调用 `applyThemePreferences`，使主题变量实时应用到 DOM。
- [x] 用 `LumaThemeSettingsPanel` 创建全局设置抽屉。
- [x] header 增加主题明暗切换按钮、设置按钮、用户入口占位。
- [x] 用 `preferences.transition` 驱动 `LumaRouterView` 的 `progress`、`loading`、`transition`、`transitionName`。
- [x] 用 `preferences.tabbar` 驱动 `LumaRouterView` 的 `cache`、`cacheMax`。
- [x] 用 `preferences.sidebar.width` 和 `preferences.sidebar.collapsed` 驱动 `LumaLayout`。
- [x] 使用 `splitMenusByLayout` 接入 `sidebar-nav`、`top-nav`、`mixed-nav`。
- [x] 验证设置抽屉修改布局模式后，菜单区域按布局变化。

**验收：**

- 设置抽屉是全局入口，不依赖进入某个示例页。
- 切换浅色/深色会立即改变页面。
- 切换布局模式会改变顶部菜单和侧栏菜单。
- `corepack pnpm --filter luma-admin build` 通过。

---

## 阶段 2：会话与登录闭环

**目标：** 建立真实后台基座的登录、登出、token、当前用户、登录守卫流程。

**新增文件：**

- `apps/luma-admin/src/views/login/LoginView.vue`
- `apps/luma-admin/src/services/session.ts`
- `apps/luma-admin/src/mock/auth.ts`
- `apps/luma-admin/src/api/auth.ts`
- `apps/luma-admin/tests/session.test.ts`
- `apps/luma-admin/tests/login-view.test.ts`

**修改文件：**

- `apps/luma-admin/src/router/index.ts`
- `apps/luma-admin/src/App.vue`
- `apps/luma-admin/src/main.ts`
- `apps/luma-admin/src/components/app/AppHeaderActions.vue`

**任务：**

- [x] 使用 `@luma/core/auth` 的 `createAuthSession` 管理 token。
- [x] mock 三类账号：
  - `admin`：拥有系统管理全部权限。
  - `operator`：拥有工作台、项目、字典查看、示例查看权限。
  - `guest`：仅能访问工作台和部分示例。
- [x] 登录页提供账号选择、用户名、密码输入，第一版 mock 校验即可。
- [x] 登录成功写入 token 和当前用户快照。
- [x] 登出清理 token、权限、角色，并跳转 `/login`。
- [x] `setupPermissionGuard` 开启 `isAuthenticated`、`loginPath`、`whiteList`、`requireLoginByDefault`。
- [x] `/login` 使用 public layout，不显示后台壳。
- [x] 登录后按 redirect 参数回跳，缺省跳第一个可访问菜单。

**验收：**

- 未登录访问 `/dashboard` 会跳转 `/login?redirect=/dashboard`。
- 登录 admin 后可以访问系统管理。
- 登出后访问任意后台页面会回到登录页。
- `corepack pnpm --filter luma-admin test` 通过。

---

## 阶段 3：权限、角色、菜单数据模型

**目标：** 从硬编码权限数组升级为应用级 mock 权限树，形成“用户 -> 角色 -> 权限 -> 菜单/按钮”的闭环。

**新增文件：**

- `apps/luma-admin/src/mock/permission.ts`
- `apps/luma-admin/src/services/permission.ts`
- `apps/luma-admin/src/router/routes.ts`
- `apps/luma-admin/src/router/components.ts`
- `apps/luma-admin/src/views/system/SystemPlaceholderView.vue`

**修改文件：**

- `apps/luma-admin/src/router/index.ts`
- `apps/luma-admin/tests/router.test.ts`

**权限码建议：**

- `dashboard:view`
- `system:user:list`
- `system:user:create`
- `system:user:update`
- `system:user:delete`
- `system:role:list`
- `system:role:create`
- `system:role:update`
- `system:role:delete`
- `system:role:authorize`
- `system:menu:list`
- `system:menu:create`
- `system:menu:update`
- `system:menu:delete`
- `system:dict:list`
- `system:dict:create`
- `system:dict:update`
- `system:dict:delete`
- `system:config:view`
- `project:list`
- `examples:view`

**任务：**

- [x] 把现有 `adminRouteRecords` 拆到 `router/routes.ts`。
- [x] 把 `resolveRouteComponent` 拆到 `router/components.ts`。
- [x] mock 角色和权限关系，角色持有权限码。
- [x] 登录后根据用户角色计算权限集合，并同步到 `permissionStore`。
- [x] 菜单配置使用标准 `meta.authority` 字段，不使用 `permissions` 和 `dictType`。
- [ ] 系统管理页面的按钮使用 `v-authority` 控制。
- [x] 测试 admin/operator/guest 三种权限下侧边栏菜单输出。
- [x] 测试无权限访问 `/system/user` 进入 `/403`。

**验收：**

- 不同账号看到不同菜单。
- 按钮级权限能隐藏无权限操作。
- 路由测试覆盖角色和权限变化。

---

## 阶段 4：系统管理 CRUD

**目标：** 用 Luma 原生组件实现真实后台常见系统管理模块。

### 4.1 用户管理

**新增文件：**

- `apps/luma-admin/src/views/system/UserView.vue`
- `apps/luma-admin/src/api/system.ts`
- `apps/luma-admin/src/mock/system.ts`

**任务：**

- [ ] 使用 `LumaCrudTable` 实现用户查询、列表、创建、编辑、删除。
- [ ] 字段包括：用户名、昵称、角色、状态、手机号、创建时间。
- [ ] 状态和角色字段使用字典或角色 API options。
- [ ] 新增、编辑、删除按钮分别受 `system:user:create`、`system:user:update`、`system:user:delete` 控制。
- [ ] mock API 保持内存数据可变，页面操作后刷新列表。

### 4.2 角色管理

**新增文件：**

- `apps/luma-admin/src/views/system/RoleView.vue`

**任务：**

- [ ] 使用 `LumaCrudTable` 实现角色查询、列表、创建、编辑、删除。
- [ ] 字段包括：角色名称、角色编码、状态、说明。
- [ ] 提供“授权”按钮，打开权限树弹窗。
- [ ] 权限树基于菜单和按钮权限生成。
- [ ] 授权保存后更新 mock 角色权限关系。

### 4.3 菜单管理

**新增文件：**

- `apps/luma-admin/src/views/system/MenuView.vue`

**任务：**

- [ ] 使用 `LumaSchemaTable` 展示菜单树。
- [ ] 支持目录、菜单、按钮三类节点。
- [ ] 字段包括：标题、路径、组件、图标、权限码、排序、是否隐藏。
- [ ] 创建和编辑使用 `LumaSchemaForm`。
- [ ] 保存后更新 mock 菜单树，并提示重新登录或刷新权限。

### 4.4 字典管理

**新增文件：**

- `apps/luma-admin/src/views/system/DictView.vue`

**任务：**

- [ ] 左侧字典类型列表，右侧字典项表格。
- [ ] 字典类型字段：名称、编码、状态、说明。
- [ ] 字典项字段：标签、值、颜色、排序、状态。
- [ ] 保存字典项后更新 `installDictionary` 使用的 mock fetcher 数据源。
- [ ] 示例页和系统页能读到更新后的字典项。

### 4.5 系统配置

**新增文件：**

- `apps/luma-admin/src/views/system/ConfigView.vue`

**任务：**

- [ ] 使用 `LumaSchemaForm` 展示应用配置。
- [ ] 包含应用名称、默认布局、默认主题色、是否启用 tabbar、是否启用页面动画。
- [ ] 保存后更新应用偏好默认值，当前会话立即生效。

**阶段验收：**

- 系统管理模块可以完成常见后台的查询、新增、编辑、删除和授权。
- 所有页面消费 `@luma/core` 公开组件，不写本地假组件。
- `corepack pnpm --filter luma-admin build` 通过。

---

## 阶段 5：字典服务产品化

**目标：** 字典不只作为示例 options，而是成为系统能力。

**修改文件：**

- `apps/luma-admin/src/views/examples/dictionary.ts`
- `apps/luma-admin/src/main.ts`
- `apps/luma-admin/src/api/system.ts`
- `apps/luma-admin/src/mock/system.ts`
- `apps/luma-admin/src/views/system/DictView.vue`

**任务：**

- [ ] 将 `views/examples/dictionary.ts` 迁移为 `mock/system.ts` 中的 `dictionaryTypes` 和 `dictionaryItems`。
- [ ] `mockDictionaryFetcher` 从系统字典数据源读取。
- [ ] 表单、表格、CRUD 示例统一使用 `dictionary: 'status'`、`dictionary: 'priority'`。
- [ ] 字典管理保存后清理或刷新字典缓存。
- [ ] 增加“颜色标签”渲染示例，验证字典项 color 字段。

**验收：**

- 字典管理页新增选项后，相关表单和表格可以读取新选项。
- 字典示例页变成字典能力说明，不承担数据源定义。

---

## 阶段 6：菜单与动态路由产品化

**目标：** 让 admin 具备“后端菜单驱动路由”的完整示范能力。

**修改文件：**

- `apps/luma-admin/src/router/index.ts`
- `apps/luma-admin/src/router/routes.ts`
- `apps/luma-admin/src/router/components.ts`
- `apps/luma-admin/src/mock/permission.ts`
- `apps/luma-admin/src/views/system/MenuView.vue`

**任务：**

- [ ] mock API 返回菜单树，而不是在 router 中直接读取静态常量。
- [ ] 登录后加载菜单树，归一化后生成路由和菜单。
- [ ] 使用 `createRouteRecords` 生成动态路由。
- [ ] 用 `createRouteRegistry` 管理动态路由注册和登出重置。
- [ ] 组件解析先保留显式映射，视图目录规整后切换到 `createGlobComponentResolver`。
- [ ] 外链菜单使用 `externalLink`，新增外链展示页或新窗口打开策略。
- [ ] 未知路径进入 404 或回退到首个可访问菜单。

**验收：**

- 修改 mock 菜单树即可改变侧栏菜单。
- 登出后动态路由被移除。
- 无权限菜单不会生成可见菜单。

---

## 阶段 7：请求与核心服务页升级

**目标：** 对齐 gr-framework `ServicesPage`，让 request、permission、dict、auth 在 Luma Admin 中有真实闭环。

**修改文件：**

- `apps/luma-admin/src/views/examples/ServicesView.vue`
- `apps/luma-admin/src/composables/useMockRequestExample.ts`

**新增文件：**

- `apps/luma-admin/src/api/request-client.ts`

**任务：**

- [ ] 创建 admin request client，接入 token header。
- [ ] 演示标准响应解析。
- [ ] 演示 requestId。
- [ ] 演示重复提交拦截。
- [ ] 演示 session expired handler，触发后登出并跳登录页。
- [ ] 服务页展示当前权限、角色、字典、token、请求状态。
- [ ] 服务页按钮使用 `v-authority` 演示按钮权限。

**验收：**

- 核心服务页不再只是说明文字，而能实际操作 token、权限、字典和请求。

---

## 阶段 8：示例区降噪和文档化

**目标：** 保留示例价值，但让它服务于后台基座，而不是占据主应用叙事。

**修改文件：**

- `apps/luma-admin/src/views/examples/OverviewView.vue`
- `apps/luma-admin/src/views/examples/ThemeSettingsView.vue`
- `apps/luma-admin/src/views/examples/PageLayoutView.vue`
- `apps/luma-admin/src/views/examples/SchemaFormView.vue`
- `apps/luma-admin/src/views/examples/SchemaTableView.vue`
- `apps/luma-admin/src/views/examples/CrudTableView.vue`
- `apps/luma-admin/src/views/examples/ServicesView.vue`

**任务：**

- [ ] 示例总览改为能力索引，说明每个示例对应哪个公开包入口。
- [ ] 删除“为了示例而示例”的重复文案。
- [ ] 主题设置页改为说明页，指向右上角设置抽屉。
- [ ] Schema、CRUD、Chart 示例保留为开发者参考。
- [ ] 示例页数据统一从 `mock/system.ts` 或 `example-data.ts` 获取，不散落在各页面。

**验收：**

- 用户进入应用首先感知到完整后台，而不是组件 demo。
- 开发者仍能从示例区学习 Luma 包能力。

---

## 阶段 9：脚手架同步

**目标：** `create-luma-admin` 生成的模板与最终后台基座方向一致。

**修改文件：**

- `packages/create-luma-admin/src/scaffold.ts`
- `packages/create-luma-admin/tests/scaffold.test.ts`
- `packages/create-luma-admin/README.md`

**任务：**

- [ ] 将脚手架模板从最小示例升级为“轻量后台基座模板”。
- [ ] 保留简化版登录、工作台、系统菜单、403。
- [ ] 不把全部系统管理 CRUD 放进脚手架首屏，避免模板过重。
- [ ] README 写清楚完整版在 `apps/luma-admin`，脚手架是精简起点。

**验收：**

- `corepack pnpm --filter create-luma-admin test` 通过。
- 生成项目可直接运行并具备登录、菜单、权限、字典示例。

---

## 阶段 10：测试与验收矩阵

### 10.1 单元测试

- `apps/luma-admin/tests/router.test.ts`
  - 菜单权限过滤。
  - 登录守卫。
  - 动态路由注册和重置。
  - 403 兜底。

- `apps/luma-admin/tests/session.test.ts`
  - 登录成功写 token。
  - 登出清 token 和权限。
  - redirect 解析。

- `apps/luma-admin/tests/system-api.test.ts`
  - 用户 CRUD。
  - 角色授权。
  - 菜单树更新。
  - 字典项更新。

### 10.2 构建验证

每个阶段至少运行：

```bash
corepack pnpm --filter luma-admin test
corepack pnpm --filter luma-admin build
```

涉及 core 包行为时追加：

```bash
corepack pnpm --filter @luma/core test
corepack pnpm --filter @luma/core typecheck
```

发布前运行：

```bash
corepack pnpm lint
corepack pnpm test
corepack pnpm typecheck
corepack pnpm admin:build
```

### 10.3 人工验收路径

1. 访问 `/dashboard`，未登录进入 `/login`。
2. 使用 admin 登录，进入工作台。
3. 打开右上角设置抽屉，切换主题、布局、tabbar、动画。
4. 进入系统管理，完成用户新增、编辑、删除。
5. 进入角色管理，修改角色权限。
6. 登出后用 operator 登录，确认菜单和按钮减少。
7. 修改字典项，确认系统页和示例页同步变化。
8. 访问无权限路由，确认进入 `/403`。
9. 访问未知路径，确认进入 404 或首个可访问菜单。

---

## 5. 实施顺序建议

优先级按“基座可用性”排序：

1. 应用壳升级为后台基座。
2. 会话与登录闭环。
3. 权限、角色、菜单数据模型。
4. 系统管理 CRUD。
5. 字典服务产品化。
6. 菜单与动态路由产品化。
7. 请求与核心服务页升级。
8. 示例区降噪和文档化。
9. 脚手架同步。
10. 全量测试和发布前验证。

每完成一个阶段，更新本文件对应复选框和 `docs/luma-next-development-plan.md` 的 admin 接入状态。

---

## 6. 边界原则

1. 不把具体用户、角色、菜单、字典数据放进 `@luma/core`。
2. 不在 `@luma/core` 中硬编码登录页、业务接口或状态码。
3. `apps/luma-admin` 可以使用 mock API，但页面只依赖 `src/api/*`，不直接改 mock 数据。
4. 系统管理页优先使用 `LumaCrudTable`、`LumaSchemaForm`、`LumaSchemaTable`。
5. Vue 组件必须使用 `<script setup lang="ts">`。
6. 涉及模板 ref 必须使用 `useTemplateRef`。
7. Vue 组件脚本区按功能块使用 `/***********************说明*********************/`。
8. 新增页面先补测试，再实现最小可用行为。
9. 示例区保留，但不作为后台主导航叙事中心。
10. 每阶段以可运行、可构建、可验收为完成标准。
