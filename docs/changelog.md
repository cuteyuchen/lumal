# 更新日志

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
