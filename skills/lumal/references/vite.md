# @lumal/vite

本页对应已发布的 `0.1.1-beta`。消费项目使用公开 exports，不使用工作区源码 alias。

## 什么时候用

需要普通 px→vw、Lumal 组件 resolver、monorepo alias 或可选 Devtools 时使用。它不替代 `@vitejs/plugin-vue`。

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

默认关闭，启用必须明确 `include`，例如 `src/screen/**`。

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/**'],
  viewportWidth: 1920,
  dependencies: ['element-plus'],
})
```

加入现有Vite plugins并保留Vue插件。业务写普通px，CSS/SCSS预处理输出与Vue静态style、
可分析:style字符串/对象/数组共用PostCSS规则，输出普通vw。
唯一D同时注入Core/DataV/Cockpit/Viewport动态数值；不要求main或页面重新配置。
未启用时保留px；静态CSS项目不需要运行时包。

- 默认字体/有单位行高、最小尺寸、模板样式转换；`fontSize:false`保护font/font-size/line-height。
- `includeProperties/excludeProperties`为属性glob，黑名单优先。`excludeSelectors`为子串/正则。
- 声明前`/*! lumal-viewport-ignore-next */`、后`/* lumal-viewport-ignore */`保护单声明。
- 模板`<!-- lumal-viewport-ignore -->`保护紧随元素子树；动态表达式不执行。
- `inlineStyles:false`独立关闭模板处理；class/:class/aria/普通属性/业务脚本不扫描。
- 任意值原子class及生成的转义CSS规则保留，普通属性选择器不误伤，原子class不阻止显式style转换。
- `minPixelValue`默认1，物理细边框保留；`precision`默认6。无单位行高及rem/em/%/vh不改。
- 业务var/min/max/clamp与已有适配单位默认保护，`customProperties/variableFallbacks`可显式授权普通设计token。
- `frameworkStyles`默认true，在消费者构建时接入自有CSS和源码alias，公共包不写死1920。
- 第三方只精确包名`dependencies`白名单；Core主题逐CSS文件导入保留Element Plus来源。
- 原始map逐声明定位；无法证明跨文件Sass/additionalData来源时跳过并警告，不能扩大全依赖绕过。
- 媒体/容器断点不转换，已编译vw不能由路由开关撤销。

低层`createViewportPostcssPlugin(options, root)`规则一致，预编译Sass/SFC需原始map。
Dev/Build、幂等、映射、D1920/1440由tarball消费者验证。运行时数字见[Viewport](viewport.md)。

其他API：`createLumalComponentResolver({ importStyle:true })`接入已有组件自动导入插件；
`createLumalAliases({ workspaceRoot, target:'source' })`只用于真实Lumal工作区；
`resolveLumalDevtoolsPlugin({ enabled, factory })`按需调用factory，不强制安装Devtools。
旧runtime输出/媒体断点切换已删除，不保留兼容选项。
