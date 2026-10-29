# @lumal/vben-compat

常见 Vben Admin 写法到 Lumal 原生 API 的迁移层，**不**完整复刻 Vben。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/vben-compat` |
| 本地路径 | `packages/vben-compat` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/vben-compat |
| npm 地址 | `https://www.npmjs.com/package/@lumal/vben-compat` |
| 在线示例 | https://lumal-compat.cuteyuchen.top |
| 迁移指南 | [从 Vben 迁移](/reference/migration-from-vben) |
| 示例 | `apps/vben-compat-demo` |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/vben-compat@0.1.0-beta @lumal/core@0.1.0-beta vue@^3.5 element-plus@^2.11 @iconify/vue@^5
```

## 用法

```ts
import { useVbenForm, useVbenVxeGrid } from '@lumal/vben-compat/v5'
import '@lumal/vben-compat/style.css'

const [Form, formApi] = useVbenForm({
  schema: [{ fieldName: 'name', component: 'Input', label: '姓名', rules: 'required' }],
})
```

- `/v5` 固定 Vben `v5.7.0`，返回 `[Form, api]` / `[Grid, api]`，不是注册函数。
- Form 支持 `schema`、常见 Element Plus 控件、校验、值 API、动态字段和字段插槽。
- Grid 支持顶层 `formOptions`、分页查询、排序、刷新、列设置、多选、插槽及失败恢复。
- 根入口及 `/legacy` 继续保留 `[register, api]` 和旧 Lumal `schemas` 协议。
- 启动阶段适配菜单使用 `/v5/router` 纯数据入口，避免提前加载 Form/Grid。
- 路由与权限通过显式 adapter 接入 Core，Vben 全局认证与偏好 Store 需要应用迁移。

完整映射表、不支持项与迁移步骤见 [从 Vben 迁移](/reference/migration-from-vben)。

## 边界

- 可依赖 `@lumal/core`
- `@lumal/core` **不能**反向依赖本包
- 新项目优先直接使用 Lumal 原生 API
- 不安装 VXE/Vben/Zod 运行时；高级编辑、虚拟表格、自定义 renderer 和完整 Tailwind 布局不在轻量子集内
