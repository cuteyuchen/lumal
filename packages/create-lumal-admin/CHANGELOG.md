# create-lumal-admin

## 未发布修复 (2026-10-30)

- 生成的 Admin 生产配置保持模块执行顺序，修复循环分包导致角色授权树内部 Checkbox 未初始化的问题；保留原有懒加载、vendor 分组和体积限制。

## 0.1.0-beta (2026-10-28)

- Breaking：删除适配模式枚举和模板，改为 `--viewport` / `--no-viewport` 与 `--design-width`。
- Admin/Screen 默认启用普通 px→vw、一次配置设计宽度；Blank 默认不增加适配依赖。
- 生成配置从公开 Vite 包接线，静态 Screen 不安装 Viewport 运行时。

## 0.0.7-beta (2026-10-26)

### Patch Changes

- Screen 视口模板将设计尺寸与运行时策略集中到项目根 `viewport.config.ts`，便于构建配置复用同一设计宽度。
- 不默认安装或启用 `@lumal/vite`，保留 Admin/Screen/Blank 的按需依赖与既有适配模式。
- 生成依赖精确同步为 0.0.7-beta，保留原有 CLI、权限和登录失败处理契约。

## 0.0.6-beta (2026-10-25)

### Minor Changes

- 使用 Clack 键盘向导、功能注册表和创建前摘要确认，保留参数与非交互调用。
- 按 `app/modules/shared` 组织生成源码；系统管理七页独立实现，开发示例和迁移示例独立分组。
- 增加模块级强类型服务、角色授权、机构和菜单树、字典缓存、配置表单、工作台和个人中心。
- 加固远程菜单、外链、iframe 与权限刷新，保留 Local/HTTP 的失败传播和会话隔离。
- 增加真实 PTY、可选模块组合、生产浏览器业务测试及可复现体积比较。
- 新增 create-lumal binary 和 Admin/Screen/Blank 项目类型，不发布另一个未经验证的 create-lumal npm 包。
- Screen 的认证、数据、路由、Charts/DataV/Cockpit 和视口适配按需生成；Blank 默认仅依赖 Vue。
- 统一 ESLint/Prettier/EditorConfig、测试与 check、分层 AI 开发规范，生成依赖精确同步为 0.0.6-beta。

## 0.0.5-beta (2026-10-20)

### Minor Changes

- 拆分真实模板资源与 CLI/创建器，支持 minimal、standard、vben-compatible，
  交互及非 TTY、Local/HTTP、Hash/History、可选业务层和安全失败回滚。
- 生成真实 HTTP 登录、刷新、用户权限菜单、退出及 CRUD 服务，防止旧会话响应回填。
- standard 增加基础管理模块、Schema/CRUD、标签缓存和偏好；兼容模板增加 V5 迁移页面。
- 显式加载 Element Plus 深色变量，以真实背景色断言保护主题切换，不只检查状态 class。
- 通过真实 tarball 的十二种独立消费者组合验证安装、类型、测试、Lint、生产构建与 Chromium。
- 生成项目依赖精确同步为 0.0.5-beta，不引用 Monorepo 私有源码。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 构建时注入精确的 0.0.4-beta Core 与图标依赖，源码版本占位符保持不变。
- 继续通过实际 tarball 验证 minimal/request 无 UI 消费，以及 local/HTTP 两种生成模式的依赖、类型与生产构建。

## 0.0.3-beta (2026-10-16)

### Patch Changes

- 生成项目精确使用同版 `0.0.3-beta` 的 Core 与图标包，构建时从脚手架 package.json 注入依赖版本。
- 启动代码改用 `@lumal/core/minimal`，显式安装 Element Plus 和权限、路由，不再注册整份默认组件表。
- 模板同步按标签版本刷新的 `cacheKeys` 接线、关闭清理与用户会话隔离，登录前清理旧快照。
- 直接生成完整依赖、tsconfig、Node 与 pnpm 版本要求，移除生成后补写步骤。
- 独立 tarball 消费验收覆盖 local 与 HTTP 两种模式的生成、版本、安装和生产构建。

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the unified static and remote menu route runtime, navigation discovery components, permission access control, and persisted navigation and font-size preferences. Nested route guards enforce ancestor permissions and roles, and generated admin projects now use the same menu runtime.

### Patch Changes

- 补齐生成项目所需的 `@iconify/vue` 与 `sass-embedded` 依赖，并新增打包后生成、安装和生产构建的独立消费检查。
- 修复应用插件安装顺序和脚手架发布后的依赖版本同步，并统一多包版本发布策略。
