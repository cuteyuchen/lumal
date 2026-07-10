# @luma/core

Luma 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

```ts
import { createLumaAdmin } from '@luma/core'
import { LumaCrudTable, LumaSchemaForm } from '@luma/core/components'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
```

`createLumaAdmin` 支持 preset、异步 mount、应用侧 `router` / `pinia`、Element Plus options 和选择性全局组件注册；这些依赖保持为 peer dependency，不会由 core 默认创建。

主题子入口提供 `createPreferencesStore`，用于偏好持久化、重置、导出和系统主题监听。

详细说明见仓库文档 `docs/core-api.md`。
