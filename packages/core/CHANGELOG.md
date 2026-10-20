# @lumal/core

## 0.0.5-beta (2026-10-20)

### Minor Changes

- Schema Form 新增保留值的动态 `visible` 和 `submitDisabled`，供高频迁移表单使用。

### Patch Changes

- 关闭原生 HTML 必填拦截，由 Schema 校验统一呈现错误；修复跨会话认证刷新任务复用。
- 同步内部图标依赖至 0.0.5-beta，维持 minimal/request 无 UI 消费边界。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 落实 onRequest URL 改写契约，缓存、认证作用域、重复提交、错误报告及刷新重放使用最终请求上下文。
- 修复多根路由页面的 Transition/KeepAlive 切换，保留标签关闭、刷新与缓存淘汰生命周期；关闭动画不启用 out-in。
- 修复内容最大化的零宽度和表格插槽回显，统一导航、全屏等状态图标，补齐 radio-button 主题样式。
- Core 与图标依赖同步为 0.0.4-beta，minimal/request 保持轻量边界。

## 0.0.3-beta (2026-10-16)

### Minor Changes

- 新增 `@lumal/core/minimal`，不引用默认 UI 注册表，按需接入组件与插件，字典默认关闭。
- 请求缓存增加身份与租户隔离、显式作用域及 `clearCache()`；默认仅缓存 GET，非 GET 需要显式 key。
- `LumalRouterView` 增加 `cacheKeys`，打通标签关闭和按标签刷新；缓存默认最多 20 项，并遵守 `meta.keepAlive=false`。

### Patch Changes

- 修复字典删除、清空和手动赋值后的旧请求回填、错误与 loading 竞态。
- 路由进度和 loading 改为反映真实导航状态；修复 Esc 退出最大化及新窗口 history/base 地址。
- 标签快照先恢复后持久化、恢复时限量，卸载不再写回已清理快照。
- 全局搜索补齐弹窗焦点约束与恢复，内存 Storage 兜底收敛为共享工具。

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the unified static and remote menu route runtime, navigation discovery components, permission access control, and persisted navigation and font-size preferences. Nested route guards enforce ancestor permissions and roles, and generated admin projects now use the same menu runtime.
- Expose live selected rows, selected row keys, and a shared clear-selection action through the CRUD table toolbar actions slot.

### Patch Changes

- 让 mixed-nav 顶级目录默认只切换侧栏分组，并提供可配置的子菜单自动激活；同时保留后端菜单重定向，避免首个子项为外链时误跳转和菜单高亮错位。
- 修复应用插件安装顺序和脚手架发布后的依赖版本同步，并统一多包版本发布策略。
- 优化后台布局的面包屑落点、侧栏退场动画和普通路由页面自然高度，避免宽屏页面内容被强制拉伸。
