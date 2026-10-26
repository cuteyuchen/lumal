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

本包不强制安装 Devtools、自动导入或打包完整行业预设。静态 SVG 插件属于 `@lumal/icons/vite`。

## 视口转换

`0.0.6-beta` 已提供 `createViewportTransformPlugin` / `createViewportPostcssPlugin`；
以下精细控制、行内样式和原子化保护自已发布的 `0.0.7-beta` 提供，
不能用历史 registry 包验证新增能力。开发未发布源码时使用精确提交的 tarball。
默认关闭，启用必须明确 `include`，例如 `src/screen/**`。

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/screen/**'],
  exclude: ['src/screen/canvas/**', '**/map/**'],
  viewportWidth: 1920,
  fontSize: false,
  minSize: false,
  includeProperties: ['width', 'height', 'padding*', '*gap'],
  excludeProperties: ['border*', 'margin*'],
  excludeSelectors: ['.runtime-canvas', /\.el-(?:dialog|popper)\b/],
  inlineStyles: false,
})
```

- 属性使用 CSS 连字符形式与 glob；白名单默认全部，`[]` 不转换，黑名单始终优先。
- `fontSize:false` 同时保留 font/font-size/line-height；minSize默认false，保护物理及逻辑最小宽高。
  白名单不绕过这些开关。边框、间距按属性名单独立控制；<=1px默认保留。
- 默认保留自定义属性，`--lumal-viewport-*` 始终保留。含var/env/attr/min/max/clamp、
  已有视口/容器/字体相对单位的整条声明保留，不转换表达式旁的px。
- `excludeSelectors` 字符串按子串、正则按选择器匹配，分组或嵌套祖先命中则整条声明保留。
  紧邻前置 `/* lumal-viewport-ignore-next */` 或后置 `/* lumal-viewport-ignore */`
  保护单条声明；Sass压缩时使用 `/*! ... */`。
- `inlineStyles:true` 才用Vue模板AST+CSS AST处理静态style及可静态分析的:style对象/数组。
  支持无插值模板字符串与CSS fallback字符串数组，不遍历条件/逻辑表达式。
  动态值不求值；class/:class/aria和其他属性、JS数字/业务字符串不修改。
  配置selector排除且class/id、data等非style属性动态绑定时，保守跳过该元素子树。
  模板 `<!-- lumal-viewport-ignore -->` 跳过紧随元素及子树。
- 原子化任意值class和对应生成CSS规则保留，普通属性选择器不误伤；原子class本身不阻止显式inline style转换。
- Dev/Build共用转换规则，保留已有PostCSS配置、source map和文件边界。
  node_modules默认排除，仅精确包名dependencies白名单允许加入。
  无可靠map的跨文件Sass导入、无法解析语法或函数additionalData让该style跳过并警告；
  独立安全CSS/SCSS块仍可转换。低层PostCSS处理预编译SCSS/SFC也需原始map。

同一内容树不能与运行时contain/width或外部transform双重缩放。无法自动推断跨组件缩放，
显式排除画布文件/selector/声明。项目级普通 `viewport.config.ts` 可共享设计对象：
运行时policy展开designWidth/designHeight，Vite使用viewportWidth=designWidth；
不增加两个包间依赖。构建vw相对浏览器，运行时单位相对真实容器。
Admin/地图/Teleport浮层不要纳入宽泛转换；ECharts与动态尺寸继续显式使用运行时API。
新选项默认关闭或保守保护，旧最小尺寸如需继续缩放必须显式minSize:true。

仓库核对位置：`packages/vite/src/{index,component-resolver,aliases,devtools,viewport-transform}.ts`。
