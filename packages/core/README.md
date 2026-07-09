# @luma/core

Luma 后台核心包，提供应用安装器、布局、路由菜单辅助、权限、请求、主题和基础组件。

```ts
import { createLumaAdmin } from '@luma/core'
import { LumaCrudTable, LumaSchemaForm } from '@luma/core/components'
import '@luma/core/theme-chalk/index.scss'
```

`createLumaAdmin` 支持应用侧传入 `router`、`pinia`、`elementPlus` 和全局组件；这些依赖保持为 peer dependency，不会由 core 默认引入。

详细说明见仓库文档 `docs/core-api.md`。
