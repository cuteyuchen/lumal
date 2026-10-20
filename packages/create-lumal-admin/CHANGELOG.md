# create-lumal-admin

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
