# @luma/core

Luma 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

```ts
import { createLumaAdmin } from '@luma/core'
import { LumaCrudTable, LumaSchemaForm } from '@luma/core/components'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
```

`createLumaAdmin` 支持 preset、异步 mount、应用侧 `router` / `pinia`、权限 Store 自动注入、Element Plus options 和选择性全局组件注册；这些依赖保持为 peer dependency，不会由 core 默认创建。

路由子入口提供 `createMenuRouteRuntime`，统一静态与远程菜单的校验、排序、组件解析和原子注册。布局子入口提供面包屑、全局搜索、菜单徽标与 `activeMenu` 高亮；主题偏好支持持久化动态标题、导航开关和 12-20px 全局字号。

详细说明见仓库文档 `docs/core-api.md`。
