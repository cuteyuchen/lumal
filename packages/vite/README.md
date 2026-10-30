# @lumal/vite

来源受控的 px → vw 编译转换，以及组件 resolver、工作区 alias 与可选 Devtools 接线。
本文对应 `0.1.1-beta` 候选源码，破坏性变更未发布；本地 tarball 是验收入口。

## 最小接入

```ts
import { createViewportTransformPlugin } from '@lumal/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createViewportTransformPlugin({
      enabled: true,
      include: ['src/**'],
      viewportWidth: 1920,
      dependencies: ['element-plus'],
    }),
    vue(),
  ],
})
```

未启用时不转换。开启后，选中应用源码与 Lumal 自有样式统一按 `P / D * 100 vw` 输出，
同一设计宽度自动注入 Core/DataV/Cockpit 与 `@lumal/viewport` 数字工具。
没有 Vue 页面包装器、运行时 DOM 扫描、整页 transform 或高度比例。
纯静态项目不需要加载 Viewport 运行时包。

```css
.panel {
  width: 192px; /* D=1920 → 10vw */
  font-size: 14px; /* → 0.729167vw */
  line-height: 20px; /* → 1.041667vw */
  min-height: 40px; /* → 2.083333vw */
  border: 1px solid red; /* 默认物理细边框保留 */
}
```

## 配置与优先级

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `false` | 显式开启，关闭时运行时数字工具也使用 px |
| `include` | 必填 | 相对 root 的 glob；局部可用 `src/screen/**` |
| `exclude` | `[]` | 排除优先，包括自有包和依赖 |
| `viewportWidth` | `1920` | 唯一正设计宽度，消费者构建时生效 |
| `frameworkStyles` | `true` | 接入 Core/Icons Vue/Charts/DataV/Cockpit/兼容包 CSS 和源码 alias |
| `dependencies` | `[]` | 第三方只按精确包名授权，不扫描全部 node_modules |
| `includeProperties` | `['*']` | CSS 连字符属性 glob，空数组不转换 |
| `excludeProperties` | `[]` | 属性黑名单优先于白名单 |
| `excludeSelectors` | `[]` | 子串或正则；分组/嵌套祖先命中时整条声明保留 |
| `fontSize` | `true` | 字体、font 简写、有单位行高同步；false 同时保护三者 |
| `minSize` | `true` | 设计最小宽高参与；操作下限用忽略标记保留 |
| `inlineStyles` | `true` | Vue 模板 AST 静态分析，独立关闭 |
| `customProperties` | `false` | 业务自定义属性默认保护，可显式开启 |
| `variableFallbacks` | `false` | 业务 var/min/max/clamp 默认保护，可显式开启普通设计 fallback |
| `minPixelValue` | `1` | 绝对值 <= 阈值保留；0 可转换细边框 |
| `precision` | `6` | 0..10 位小数 |

顺序：来源允许 → 选择器/忽略/已有适配保护 → 属性黑名单 → 白名单与类别开关 → 像素阈值/精度。
白名单不能绕过 `fontSize:false` 等保护，无单位 line-height、rem/em/%/vh 不改。
媒体查询与容器查询断点不是设计尺寸，不转换。

## 忽略与已有适配

```css
.map-toolbar {
  /*! lumal-viewport-ignore-next */
  min-width: 120px;
  height: 40px; /* lumal-viewport-ignore */
  padding: 24px;
}
```

前置标记仅保护下一声明，后置仅保护上一声明；Sass 压缩使用 `/*! ... */`。
含 var/env/attr/min/max/clamp 或已有视口/容器/字体相对单位的业务声明默认整条保留，
包括 `calc(10vw + 24px)`。URL、字符串、普通数字不改，重复执行幂等。
受控 Lumal 自有 CSS 和明确授权的 Element Plus CSS 允许转换其设计 token/fallback，
但已有 vw/rem 等适配信号仍保护，禁止把这一授权外推至未知依赖或混合 Sass 来源。

## Vue 模板

```vue
<template>
  <div style="width: 192px; height: 96px" />
  <div :style="[{ width: '192px' }, dynamicStyle, { top: '24px' }]" />
  <!-- lumal-viewport-ignore -->
  <div style="min-width: 120px" />
  <div class="w-[192px]" style="height: 96px" aria-label="192px" />
</template>
```

静态 style、可分析的 :style 字符串/对象/数组共用 CSS AST；无插值模板字符串和 fallback 字符串数组可分析。
动态表达式不执行、不猜测，不扫描整份 TS/JS。
class/:class/aria/普通属性和业务字符串不改。
任意值原子类及其生成的转义 CSS 规则保留，普通属性选择器不误判；
元素带原子类不妨碍显式 inline style 转换。
模板忽略注释跳过紧随元素子树。配置选择器排除后，动态选择器属性保守跳过子树。

## 来源、公共 CSS 与生产消费

保留既有 PostCSS 配置与 Source Map，SCSS 在预处理输出上转换。
有原始 map 按每条声明来源过滤；跨文件 Sass 导入或函数 additionalData 没有可靠 map 时跳过并警告，
不因入口在 include 中就批准外部声明。独立安全块继续转换。
低层 `createViewportPostcssPlugin(options, root)` 用相同规则，预编译 Sass/SFC 必须提供原始 map。

公共包发布 CSS 仍为设计 px，不预先写死 1920 的 vw。消费项目导入公共 `style.css` 后由本插件转换。
Core 主题逐文件导入 Element Plus CSS，保留可靠来源；第三方 JS 内联尺寸不在自动覆盖范围。
Core 自有主题初始化、切换、恢复和数字布局输入使用同一编译配置，不二次缩放测量/Popper 坐标。

局部 include 只控制编译来源，不是运行时路由模式。已编译的 vw 不能通过当前页面开关还原；
需要 px 的文件/声明在编译时排除。地图实际宽高用于 resize，不再乘设计比例。
`enabled`/`viewportWidth` 是项目级配置；文件过滤和 `frameworkStyles:false` 不关闭
Core/DataV/Cockpit 内部的动态设计尺寸换算，后者只控制自有静态 CSS 的来源接入。

## 其他构建助手

```ts
import { createLumalAliases, createLumalComponentResolver } from '@lumal/vite'

const aliases = createLumalAliases({ workspaceRoot: process.cwd(), target: 'source' })
const resolver = createLumalComponentResolver({ importStyle: true })
```

alias 只用于真实 Lumal 工作区；npm 消费者使用公开 exports。
resolver 接入已有自动导入插件，不强制安装该插件或全量 UI。
`resolveLumalDevtoolsPlugin({ enabled, factory })` 仅开启时调用 factory。

## 验证与迁移

运行 `pnpm --filter @lumal/vite test`、`pnpm test:vite-consumer`。
后者从 tarball 验证 ESM/CJS、Vue 类型、SSR、SCSS、来源、映射、幂等和不同设计宽度的 Dev/Build。
真实布局/原生 zoom 证据单独记录，不把字符串断言当成浏览器结果。

本次删除旧 runtime 输出和媒体断点切换 API；开启后的默认字体、最小尺寸、行内样式行为改变。
升级时移除旧运行时包装器，审查显式忽略项与第三方授权。
详见 [统一指南](../../docs/screen-viewport-guide.md)。
