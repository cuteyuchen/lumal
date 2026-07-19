# @lumal/vben-compat

常见 Vben Admin 写法到 Lumal 原生 API 的迁移层，**不**完整复刻 Vben。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/vben-compat` |
| 本地路径 | `packages/vben-compat` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/vben-compat |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/vben-compat` |
| 迁移指南 | [从 Vben 迁移](/reference/migration-from-vben) |
| 示例 | `apps/vben-compat-demo` |

## 安装

```bash
pnpm add @lumal/vben-compat @lumal/core vue
```

## 用法

```ts
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat'
```

- `useVbenForm`：常用控件映射到 Lumal Schema 表单能力
- `useVbenVxeGrid`：proxy、toolbar、actions、错误状态与可等待刷新流程的兼容封装

完整映射表、不支持项与迁移步骤见 [从 Vben 迁移](/reference/migration-from-vben)。

## 边界

- 可依赖 `@lumal/core`
- `@lumal/core` **不能**反向依赖本包
- 新项目优先直接使用 Lumal 原生 API
