# @lumal/vite

Vite 配置助手：组件 resolver、工作区源码 / 产物 alias、可选 Devtools 接线。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/vite` |
| 本地路径 | `packages/vite` |
| 在线文档 | https://lumal.cuteyuchen.top/packages/vite |
| npm 地址 | `https://www.npmjs.com/package/@lumal/vite` |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add -D @lumal/vite@0.0.6-beta
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

## 定向视口转换

`0.0.6-beta` 提供默认关闭的 `createViewportTransformPlugin` 和低层
`createViewportPostcssPlugin`。启用时显式指定 `include: ['src/screen/**']`，
Dev/Build 共用 CSS 声明转换，不扫描脚本、模板内联 style 或业务坐标。
默认不转换 node_modules、字号及自定义属性；依赖只通过精确包名白名单加入。
保留已有 PostCSS 配置和来源边界，无法可靠定位预处理声明时跳过并警告。
配置与限制见 [屏幕适配](/reference/screen-viewport-guide)，不要覆盖 Admin、
Element Plus 或地图样式，也不要与同一画布的 transform 叠加。

## 边界

- 不强制安装自动导入、Devtools 或 viewport 转换插件
- 无 `@lumal/core` 运行时依赖
