# @lumal/core

Lumal 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

本文 API 基线为 `0.0.7-beta` 候选契约，实际版本可用性以 registry 为准；核验前使用候选 tarball。

```ts
import { createLumalAdmin } from '@lumal/core'
import { LumalCrudTable, LumalSchemaForm } from '@lumal/core/components'
import '@lumal/core/theme-chalk/index.scss'
import '@lumal/core/style.css'
```

`createLumalAdmin` 支持 preset、异步 mount、应用侧 `router` / `pinia`、权限 Store 自动注入、Element Plus options 和选择性全局组件注册；这些依赖保持为 peer dependency，不会由 core 默认创建。

纯服务或需要严格按需加载时，使用无默认 UI 注册表的轻入口：

```ts
import { createLumalAdmin } from '@lumal/core/minimal'
await createLumalAdmin({ rootComponent: App }).mount('#app')
```

轻入口默认不安装字典，只接受显式 `components: { MyComponent }` 映射，不静态加载 Element Plus 或 Sortable。根入口的 `preset: 'minimal'` 只关闭默认注册，不是体积隔离边界。`@lumal/core/request` 等纯服务子入口也无需安装 Element Plus；UI 子入口仍需安装对应 peer 和样式。

路由子入口提供 `createMenuRouteRuntime`，统一静态与远程菜单的校验、排序、组件解析和原子注册。布局子入口提供面包屑、全局搜索、菜单徽标与 `activeMenu` 高亮；主题偏好支持持久化动态标题、导航开关和 12-20px 全局字号。

详细说明见仓库文档 `docs/core-api.md`。

## 0.0.6-beta 修复

以下变更自 `0.0.6-beta` 提供，当前候选继续保留；升级验证应使用目标版本的实际 tarball：

- 序号列 `{ type: 'index', label: '序号' }` 不要求业务 field，支持跨页/选中行导出，不派生 CRUD 表单。
- 清理缓存、切换 scope 或替换客户端凭据后，旧写请求401/刷新失败不触发新会话退出；刷新与过期通知按会话隔离。
- TypedArray 保留二进制请求体。业务成功码、字段和上下文继续由应用 Adapter 处理。

`clearCache` 不替应用取消在途请求或保护自定义刷新写入。应用仍须使用会话 AbortSignal/代次。
升级含旧补丁的消费者前，先在隔离副本验证候选tarball；详见 `docs/upgrade-guide.md`。
