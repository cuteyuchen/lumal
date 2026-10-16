# @lumal/core

Lumal 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

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
