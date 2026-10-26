# @lumal/vite

## 可选的局部 px → vw

`0.0.6-beta` 已提供来源受控的 CSS 转换。以下精细控制和 Vue 行内样式功能自
已发布并核验的 **`0.0.7-beta`** 提供。开发未发布源码时使用精确提交的 tarball，不用旧包代替：

```ts
import { createViewportTransformPlugin } from '@lumal/vite'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/screen/**'],
  exclude: ['**/map/**'],
  viewportWidth: 1920,
  fontSize: false,
  minSize: false,
  customProperties: false,
  includeProperties: ['width', 'height', 'top', 'left', 'padding*', '*gap'],
  excludeProperties: ['border*', 'margin*'],
  excludeSelectors: ['.runtime-canvas', '.map', /\.el-(?:dialog|popper)\b/],
  inlineStyles: false,
})
// 将 viewport 加入已有 Vite plugins。
```

默认 `enabled=false`，开启必须指定 include。Dev/Build 共用 PostCSS 声明转换，
保留已有 inline 或文件 PostCSS 配置；SCSS 在预处理后转换。
默认不转换 node_modules，仅 `dependencies: ['明确的包名']` 可白名单加入。

### 属性与优先级

| 选项 | 默认值 | 行为 |
| --- | --- | --- |
| `includeProperties` | `['*']` | CSS 属性 glob 白名单；`[]` 不转换任何属性 |
| `excludeProperties` | `[]` | CSS 属性 glob 黑名单，始终优先于白名单和属性开关 |
| `excludeSelectors` | `[]` | 字符串按子串、正则按选择器匹配；命中任一分组或嵌套祖先时整条声明保留 |
| `fontSize` | `false` | 同时保护 `font-size`、`font`、`line-height` |
| `minSize` | `false` | 保护 `min-width`、`min-height`、`min-inline-size`、`min-block-size` |
| `customProperties` | `false` | 保护 CSS 自定义属性；保留的 `--lumal-viewport-*` 不允许再次转换 |
| `minPixelValue` | `1` | 绝对值不大于阈值的 px 保留，保护细边框，必须为非负有限数 |
| `precision` | `6` | 小数位数，范围 `0..10` |
| `inlineStyles` | `false` | 独立开启 Vue 模板行内样式转换 |

属性使用 CSS 连字符形式，普通 CSS 属性匹配不区分大小写；`padding*`、`border*`、
`margin*` 和 `*gap` 可分别控制内边距、边框、外边距和间隙。
文件范围、依赖限制、选择器、忽略标记与已有适配保护先决定是否允许转换；
属性黑名单优先于白名单，白名单不能绕过 `fontSize/minSize/customProperties` 保护。
最后按像素阈值和精度转换。正则 `g/y` 不产生跨规则状态，也不修改调用方正则。

例如 `font-size:14px; line-height:20px` 默认两者均不变；
`fontSize: true` 才一起转换。若只希望行高转换，可开启 `fontSize` 并用
`excludeProperties: ['font', 'font-size']` 继续保护字体。
最小尺寸需要参与缩放时显式设置 `minSize: true`，不必关闭其他保护。

### 声明与选择器排除

```css
.screen-panel {
  /* lumal-viewport-ignore-next */
  width: 382px;
  height: 210px; /* lumal-viewport-ignore */
  padding: 24px;
}
```

前置 `ignore-next` 仅保护紧随的声明；后置 `ignore` 仅保护紧邻的前一条声明，
不会影响其他规则。Sass 压缩时使用 `/*! lumal-viewport-ignore-next */` /
`/*! lumal-viewport-ignore */` 保留注释。
选择器分组采用整条保留，不拆出部分选择器再缩放。

含 `var()`、`env()`、`attr()`、`min()`、`max()`、`clamp()`、已有视口/容器/字体相对单位的
声明整体保留，不会只转换动态表达式旁边的 px。例如
`calc(192px * var(--lumal-viewport-scale))`、`calc(10vw + 24px)` 和
`clamp(320px, 50vw, 960px)` 均保持原值。URL、引号字符串、普通数字不变，重复执行幂等。

### Vue 行内样式

开启 `inlineStyles: true` 后，以 Vue 模板 AST 定位 `style` / `:style`，
再用相同 CSS 声明规则处理静态字符串，不对整份 SFC 做正则替换：

```vue
<template>
  <div style="width: 192px; height: 96px" />
  <div :style="[{ width: '192px' }, runtimeStyle, { top: '24px' }]" />
  <!-- lumal-viewport-ignore -->
  <div style="width: 192px">
    <span style="height: 96px" />
  </div>
</template>
```

设计宽度 1920 时，前两项中的静态尺寸分别成为 `10vw`、`5vw`、`1.25vw`；
`runtimeStyle` 不分析、不求值，忽略标记保护紧随的元素及子树。
支持无插值模板字符串与对象属性的 CSS fallback 字符串数组；
条件/逻辑表达式内部不遍历。对象中的 `fontSize`、`lineHeight` 等 camelCase 键按对应 CSS 属性过滤。
配置了选择器排除但元素或祖先的 class/id、data 等非 style 属性为动态绑定时，保守跳过该元素子树，
不猜测运行时是否会命中排除规则。
默认仍不处理行内样式；class、`:class`、`aria-label`、其他模板属性、脚本变量、
业务字符串及动态尺寸表达式保持原样。无法安全分析时留给运行时 API。

Tailwind/UnoCSS 的 `w-[192px]`、`h-[96px]` 等任意值类名不会改变，
对应的 `.w-\[192px\] { width:192px }` 规则也默认保留；原子类不会阻止显式行内 style 的转换。
选择器解析区分 class 与普通属性选择器，不因 `[data-size="192px"]` 而误排除普通规则。

### 预处理与来源边界

预处理器有原始 source map 时，按每条声明的真实来源判断范围，而非入口文件名。
没有可靠 source map 时，跨文件 `@use` / `@forward` / Sass `@import`、
无法解析的预处理语法或函数形式 `additionalData` 会使该 style 整体跳过并警告。
这是对转换边界的保护：请把第三方/Shared 样式与需要转换的 Screen 声明分开；
同一 SFC 的独立安全 CSS/SCSS style 块仍可转换。纯 SCSS 声明不受此限制。
直接使用 `createViewportPostcssPlugin` 处理预编译的 SCSS/SFC 输出时，
必须传入原始 source map，否则保守保留 px，不能根据入口路径猜测来源。

不转换 TS/JS 字符串或坐标；动态数值布局使用响应式 viewport Composable。
不提供旧插件的全依赖/全脚本扫描开关。不要将本插件与同一画布的 transform 双重缩放，
也不要让转换范围覆盖 Admin、Element Plus 或地图引擎样式。
解析依赖仅供 Node 构建工具使用，不进入应用运行时。

### 与运行时协作

`@lumal/vite` 的 vw 相对浏览器视口，`@lumal/viewport` 的测量和单位变量相对实际容器，
两者不能互相代替。应用自己的 `viewport.config.ts` 可导出无依赖的
`viewportDesign = { designWidth: 1920, designHeight: 1080 }`，运行时 policy 展开该对象，
构建配置使用 `viewportWidth: viewportDesign.designWidth`，不必让两个包互相依赖。
Screen 视口脚手架已使用这种共享方式，但不默认安装或开启构建转换。

运行时 `contain/width` 画布必须从构建 `include` 中分离，或显式用 `exclude`、
`excludeSelectors` / 忽略标记保护。插件不能自动推断外部或跨组件的 transform。
全局、路由和容器测量仍由现有运行时 API 配置；Admin、Screen、Blank 按需选择，
ECharts 数值、地图和 Teleport 弹窗继续通过公开 API 显式测量和 resize。

旧配置保持有效，`inlineStyles` 默认关闭。此次安全修正会额外保留行高、最小尺寸及
已有适配表达式；旧项目若确需转换最小尺寸，显式启用 `minSize`，不要扩大文件范围。

Lumal 的轻量 Vite 配置助手，提供组件 resolver、工作区源码/产物 alias 和可选 Devtools 接线。

```ts
import { createLumalAliases, createLumalComponentResolver } from '@lumal/vite'

const aliases = createLumalAliases({ workspaceRoot: process.cwd() })
const resolver = createLumalComponentResolver({ importStyle: true })
```

本包不隐式提供全项目 viewport 转换，也不强制安装自动导入或 Devtools 插件。

### 仓库验证

运行 `pnpm --filter @lumal/vite test` 和 `pnpm test:vite-consumer`：
后者构建并打包当前源码，在独立 Vue 项目中验证类型、SSR、SCSS、Source Map、
Dev/Build 和运行时协作，不依赖工作区源码 alias，不启动浏览器。
