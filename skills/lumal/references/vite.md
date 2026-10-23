# @lumal/vite

## 什么时候用

需要 Lumal 组件自动导入 resolver、Lumal monorepo 源码/产物 alias，或可选 Devtools 接线时使用。它是配置助手，不是替代 `@vitejs/plugin-vue` 的编译器。

## 组件 resolver

```ts
import { createLumalComponentResolver } from '@lumal/vite'

const resolver = createLumalComponentResolver({ importStyle: true })
```

把 resolver 放到应用已经安装的组件自动导入插件中，例如 `unplugin-vue-components` 的 `resolvers`。本包不安装该插件；没有自动导入需求就手动 import。

- 内置映射覆盖 Core、Icons Vue 和 Charts 的常见组件。
- 不自动覆盖所有 DataV/Cockpit 组件。它们优先显式导入；确需自动导入时通过 `customComponents` 指定公开入口。
- `importStyle: true` 为已知包提供 CSS sideEffects，不会替应用准备 SCSS 主题和所有 peer。
- 自定义组件映射不自动推导额外样式，应用显式导入。

## 工作区 alias

只在存在 Lumal `packages/*` 目录的仓库开发/联调中使用：

```ts
import { createLumalAliases } from '@lumal/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: createLumalAliases({
      workspaceRoot: process.cwd(),
      target: 'source',
      packages: ['core', 'icons', 'icons-vue'],
    }),
  },
})
```

- `workspaceRoot` 必须是 Lumal 仓库根，不是任意消费项目目录。
- `target: 'source'` 供 HMR；`target: 'dist'` 需要先构建依赖包。
- 结果是按更长 specifier 优先的 alias 数组，保留顺序，不转成会覆盖子入口的宽泛 alias。
- 当前 DataV alias 只有根入口与样式等显式登记项；独立 DataV 子入口源码联调前核对 `aliases.ts`，不能假设自动映射所有 exports。
- npm 消费项目用包原生 exports，不加指向 monorepo 源码的 alias。

## Devtools 与非职责

`resolveLumalDevtoolsPlugin({ enabled, factory })` 只在开启时调用 factory，Devtools 实现由应用安装并提供。关闭时返回 `undefined`，按 Vite 插件列表用法处理。

开发分支新增 `createViewportTransformPlugin`，默认关闭；必须显式 enabled/include，
例如 `include: ['src/screen/**']`。Dev/Build共用PostCSS，不扫描JS数字/字符串或模板内联style。
默认不处理node_modules、font/font-size和自定义属性；依赖只通过精确包名白名单加入。
保留已有PostCSS配置；不转换URL和已有vw；不要与同一画布transform叠加。
这不是全局px-to-viewport开关，不应用到后台或地图样式。
本包不强制安装 Devtools、自动导入或打包完整行业预设。静态 SVG 插件属于 `@lumal/icons/vite`。

仓库核对位置：`packages/vite/src/{index,component-resolver,aliases,devtools}.ts`。
