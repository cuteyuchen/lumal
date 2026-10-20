# 从 Vben 迁移

Vben 5.7.0 页面显式选择 `/v5`，返回 `[Form, api]` / `[Grid, api]`：

```ts
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5'
```

- 根及 `/legacy` 保留旧 Lumal 的 `[register, api]`，不能将其注册函数作为组件
- **不**完整复刻 Vben
- 新功能优先用 Lumal 原生 Schema / CRUD
- 完整映射与不支持项见 [从 Vben 迁移](/reference/migration-from-vben)
- 包说明：[vben-compat](/packages/vben-compat)
- 示例：`apps/vben-compat-demo`
