# 更新日志

## 0.0.4-beta (2026-10-20)

九个公共包统一准备为 `0.0.4-beta`，内部依赖和锁文件同步。本轮仅提交代码与版本准备，不创建 tag、不执行 npm 发布或生产部署；以下安装命令在本版发布后使用。

### Core 与示例修复

- 请求前 `onRequest` 可以改写真实 fetch URL；缓存、身份作用域、重复提交、错误回调和认证刷新重放统一使用最终请求上下文。
- `LumalRouterView` 以真实页面容器承接 Transition，支持多根路由页面，保留 KeepAlive、标签关闭/刷新、容量淘汰和 `meta.keepAlive=false` 语义；关闭动画不再启用 out-in。
- 修复内容最大化时的零宽度、退出登录竞态、系统表格插槽及多根页面导航；补充普通路由、403/404、缓存生命周期和会话回归。

### 图标

- 新增 `@lumal/icons/morph` 通用 SVG 转换与原生 DOM 形变控制器，Morphicons 2.0.0 为可选 peer，静态入口不加载动画引擎。
- `LumalIcon` 增加按需形变与弹簧预设，支持 SSR 静态渲染、减少动画偏好和失败回退；选择器增加分组插槽与标签换行，修复弹窗布局。
- Admin 增加离线图标示例、菜单图标选择和按需 Element Plus SVG 资源，保留资源许可；主题图标等待整页主题过渡完成后切换。
- 修复独立 SVG Data URI 的命名空间和内置设置图标；Vite alias 补齐 morph 的源码及产物入口。

### 发布链路

- 发布与部署统一由 Release Gate 的显式 needs 阻断；旧工作流仅保留 workflow_call，发布凭据作业之前执行版本、registry 和环境配置预检。
- 完整发布 E2E 改用 Admin dist 与 Mock Node 产物，保留失败截图、trace 和报告；开发态 E2E 入口继续保留。
- 五个站点统一使用 Vercel，文档旧 Cloudflare 项目已下线，公开文档地址为 `https://luma-docs-seven.vercel.app`。
- 增加图标 ESM/CJS、Vue SSR、原生 DOM 形变消费者和轻量入口边界检查，不提高现有体积预算。
- 发布边界扫描排除根目录诊断快照，保留源码检查，并补充四项真实 CLI 回归测试。

### 脚手架与同步包

- 脚手架生成的 Core 和图标依赖精确同步为 `0.0.4-beta`，保留 minimal/request、local 和 HTTP 三种独立 tarball 消费验收。
- Charts、DataV 无新的运行时 API 改动；Cockpit 与 Vben 兼容层同步 Core/图标依赖，保持九包同版。

```bash
pnpm create lumal-admin@0.0.4-beta my-admin
pnpm create lumal-admin@0.0.4-beta my-admin-http --api-mode http
```

历史修复与平台操作证据见 [修复报告](./repair-report-2026-10-19.md)。版本准备不等于完整发布门禁或线上部署成功；本轮代码验收不替代后续生产 E2E 和正式 tag 门禁。

## 0.0.3-beta (2026-10-16)

本版统一更新九个公共包：`@lumal/core`、`@lumal/icons`、`@lumal/icons-vue`、`@lumal/charts`、`@lumal/datav`、`@lumal/cockpit`、`@lumal/vben-compat`、`@lumal/vite` 和 `create-lumal-admin`。

本版通过 `v0.0.3-beta` 标签触发 npm 发布，使用 `beta` dist-tag；安装时显式指定版本，不依赖 `latest`。实际发布状态以 npm registry 和仓库发布工作流为准，各包的详细变更随包内 `CHANGELOG.md` 一起分发。

### 升级与兼容

- 图表组合升级为 ECharts 6 / vue-echarts 8，开发和示例锁定解析到 `6.1.0` / `8.3.2`。Charts peer 为 `echarts ^6.0.0`、`vue-echarts ^8.0.0`，DataV peer 为 `echarts ^6.0.0`，不再支持旧主版本组合。
- ECharts 6 的默认主题、图例和标签布局遵循新版本；需要保留旧外观的项目应在应用侧调整配置。
- 新增 `@lumal/core/minimal`，不静态加载默认 UI 注册表，字典默认关闭，只接受显式组件映射。根入口保留便利型默认 UI 接线，根入口的 `preset: 'minimal'` 不等同于依赖隔离。
- 请求缓存默认关闭；启用后默认仅缓存 GET，非 GET 必须显式指定 key。新增身份/租户作用域和 `clearCache()`，退出或切换上下文时应清理缓存。
- `LumalRouterView` 新增 `cacheKeys`，标签关闭和刷新可以剔除对应缓存；默认缓存上限为 20，并遵守 `meta.keepAlive=false`。自定义布局应同步标签 key 与视图 key，接入方式见 [Core API](./core-api.md)。

### 修复与轻量化

- 修复字典旧请求回填、标签快照恢复/退出清理、Esc 退出最大化和新窗口 history/base 地址。
- 图表事件正确传给 VChart；动画遵守显式 prop、option、reduced-motion 默认值的优先级，移除重复 resize，接通图表/表格宽度。
- DataV 通用图表按模式动态加载引擎，无引擎组件继续提供独立子入口；合并动画暂停接线，删除未使用的私有自动播放 helper。
- 修复直接传入图标定义、静态 SVG 插件代理、图标弹窗焦点与 Teleport；SVG 仍只接受可信资源，有限格式校验不等于安全净化。
- 驾驶舱动态注册可响应更新，消息总线隔离异步订阅错误；兼容表格防止旧查询和已销毁作用域回填。
- 补齐组件 resolver，新增最小消费者和首屏静态闭包体积预算，参考长文改为 `docs/*.md` 单源。

### 脚手架

- 生成项目精确依赖同版 `0.0.3-beta` 的 Core 与图标包，要求 Node.js `>=22.12.0`、pnpm `10.33.0`。
- 启动改用 `@lumal/core/minimal`，显式安装 Element Plus、Router 和权限；生成的是带 UI 的后台基座，不是无 UI 应用。
- 模板同步标签版本、`cacheKeys`、关闭清理和用户会话隔离，登录成功写入新会话前清理旧状态。
- `local` 和 `http` 两模式均纳入 tarball 独立生成、精确版本、安装与生产构建检查。HTTP 模式提供接入示例，业务项目仍需实现实际后端和认证适配。

```bash
pnpm create lumal-admin@0.0.3-beta my-admin
pnpm create lumal-admin@0.0.3-beta my-admin-http --api-mode http
```

本版验证记录见 [轻量框架审计](./architecture-audit-2026-10-16.md)，发布步骤见 [发布检查清单](./release-checklist.md)。本地验收未执行浏览器、E2E 或实机视觉测试；CI 发布门禁结果以对应工作流为准。

## 0.0.2-beta (2026-08-01)

上一版公共包统一版本。具体历史变更保留在各包的 `CHANGELOG.md`。
