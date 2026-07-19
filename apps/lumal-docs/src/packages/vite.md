# @lumal/vite

Vite 配置助手：组件 resolver、工作区源码 / 产物 alias、可选 Devtools 接线。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/vite` |
| 本地路径 | `packages/vite` |
| 在线文档 | https://lumal-docs-cf.pages.dev/packages/vite |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/vite` |

## 安装

```bash
pnpm add -D @lumal/vite
```

## 公开入口

仅 `@lumal/vite`。

## Workspace Alias

```ts
import { resolve } from 'node:path'
import { createLumalAliases } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: createLumalAliases({
      workspaceRoot: resolve(__dirname, '../..'),
      // 开发默认 source；CI 验证 dist 时可改为 'dist'
      target: 'source',
      // packages: ['core', 'icons', 'icons-vue', 'charts', 'datav', 'cockpit', 'vben-compat'],
    }),
  },
})
```

`createLumalAliases` 会为各包主入口、子路径（如 `@lumal/core/layout`）与 `style.css` 生成别名，并按路径长度排序，避免前缀冲突。

## 组件 Resolver

配合 `unplugin-vue-components` 等：

```ts
import { createLumalComponentResolver } from '@lumal/vite'
import Components from 'unplugin-vue-components/vite'

export default {
  plugins: [
    Components({
      resolvers: [
        createLumalComponentResolver({ importStyle: true }),
      ],
    }),
  ],
}
```

内置解析（节选）：`LumalSchemaForm`、`LumalLayout`、`LumalIcon`、`LumalChart`、`LumalChartPanel` 等。`importStyle: true` 时附加对应 `style.css` sideEffects。

可通过 `customComponents` 扩展名称 → 包名映射。

## 边界

- 不强制安装自动导入、Devtools 或 viewport 转换插件
- 无 `@lumal/core` 运行时依赖
