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
      // packages: ['viewport', 'core', 'icons', 'icons-vue', 'charts', 'datav', 'cockpit', 'vben-compat'],
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
Dev/Build 共用 CSS 声明转换，不扫描脚本或业务坐标。
下列精细控制、Vue 行内样式和原子化 CSS 保护属于**下一版未发布源码**，
需用本地构建的 tarball 验证，不能直接用已发布 `0.0.6-beta` 验收新增选项。
默认不转换 node_modules、字号/行高、最小尺寸及自定义属性；依赖只通过精确包名白名单加入。
保留已有 PostCSS 配置和来源边界，无法可靠定位预处理声明时跳过并警告。
配置与限制见 [屏幕适配](/reference/screen-viewport-guide)，不要覆盖 Admin、
Element Plus 或地图样式，也不要与同一画布的 transform 叠加。

```ts
import { createViewportTransformPlugin } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [createViewportTransformPlugin({
    enabled: true,
    include: ['src/screen/**'],
    exclude: ['src/screen/canvas/**', '**/map/**'],
    viewportWidth: 1920,
    includeProperties: ['width', 'height', 'top', 'left', 'padding*', '*gap'],
    excludeProperties: ['border*', 'margin*'],
    excludeSelectors: ['.runtime-canvas', /\.el-(?:dialog|popper)\b/],
    fontSize: false,
    minSize: false,
    inlineStyles: false,
  })],
})
```

`includeProperties` 默认 `['*']`，空数组不转换；属性黑名单始终优先，不能靠白名单
绕过字体、最小尺寸或自定义属性保护。`fontSize:false` 使 `14px` 字号和 `20px` 行高都保持原值。
`minSize:true` 可显式恢复最小尺寸参与转换；边框和间距可通过名单独立控制。
`/* lumal-viewport-ignore-next */` 保护紧随声明，紧邻后置
`/* lumal-viewport-ignore */` 保护前一声明；Sass 压缩时用 `/*! ... */`。

`inlineStyles:true` 使用 Vue 模板 AST 和 CSS AST 处理静态 `style` 及可静态分析的
`:style` 对象/数组。例如设计宽度 1920 时，`width:'192px'` 变为 `10vw`。
支持无插值模板字符串和 CSS fallback 字符串数组；条件/逻辑表达式内部不遍历。
动态表达式、脚本变量、业务字符串、class、`:class` 和 `aria-label` 不修改；
`<!-- lumal-viewport-ignore -->` 可排除紧随元素及子树。
配置选择器排除但存在动态 class/id、data 等非 style 属性时，行内转换保守跳过该元素子树。
原子化任意值类名及对应生成规则（如 `.w-\[192px\]`）都保留，普通属性选择器不受误伤。

包含视口变量、动态尺寸函数或已有视口/容器单位的整条声明保留，避免重复转换。
插件不能推断跨组件或外部 transform，整体缩放画布必须显式排除。
Dev 与 Build 使用相同入口；完整选项、优先级和 SCSS 来源限制见
[屏幕适配](/reference/screen-viewport-guide)。

运行时与构建可从项目自己的 `viewport.config.ts` 共享无依赖设计常量：
`@lumal/viewport` policy 使用 `designWidth/designHeight`，
Vite 使用同一对象的 `viewportWidth: viewportDesign.designWidth`。
两包不互相依赖，Screen 视口模板不默认启用构建转换。
浏览器 vw 不等于运行时容器单位，地图/ECharts resize 和弹窗仍显式采用运行时 API。

Monorepo 的开发源码 alias 应限定为 `command === 'serve' && !isPreview`，
并包含传递依赖 viewport；普通 npm 消费者不需要这些 alias。
生产构建必须先生成公共包 dist，preview 不得借源码掩盖产物遗漏。

## 边界

- 不强制安装自动导入、Devtools 或 viewport 转换插件
- 无 `@lumal/core` 运行时依赖
