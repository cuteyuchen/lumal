# @lumal/core

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the unified static and remote menu route runtime, navigation discovery components, permission access control, and persisted navigation and font-size preferences. Nested route guards enforce ancestor permissions and roles, and generated admin projects now use the same menu runtime.
- Expose live selected rows, selected row keys, and a shared clear-selection action through the CRUD table toolbar actions slot.

### Patch Changes

- 让 mixed-nav 顶级目录默认只切换侧栏分组，并提供可配置的子菜单自动激活；同时保留后端菜单重定向，避免首个子项为外链时误跳转和菜单高亮错位。
- 修复应用插件安装顺序和脚手架发布后的依赖版本同步，并统一多包版本发布策略。
- 优化后台布局的面包屑落点、侧栏退场动画和普通路由页面自然高度，避免宽屏页面内容被强制拉伸。
