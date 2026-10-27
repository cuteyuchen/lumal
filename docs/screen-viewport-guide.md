# 屏幕与工作区适配

本文的运行时 API 面向已发布的 `0.0.6-beta`，正式标签与逐包核验见
[本版发布记录](./npm-release-0.0.6-beta.md)。开发未发布源码时使用本地 tarball，不用历史包代替新增能力验收。
下文的属性名单、最小尺寸保护、Vue 行内样式、原子化 CSS 保护及浏览器 vw 协作属于下一版未发布源码。
`@lumal/viewport` 仅以 Vue 为 peer；不依赖 Core、Element Plus、地图、图表或 Cockpit。
独立包让普通 Vue/Blank/Screen 能使用同一算法，DataV/Cockpit 也无需反向依赖后台。
复制三份算法或放进 Core 会分别增加维护成本或后台依赖；因此选择单独的小包。

## 作用范围与策略

作用范围由配置安装位置和包装位置决定，不属于模式枚举：

| 范围 | 入口 | 行为 |
| --- | --- | --- |
| 应用默认 | `app.use(createViewportPlugin(defaults))` | 仅提供默认配置，不修改 DOM 根、Router 或全局字体 |
| 页面/路由 | `LumalViewport :policy="route.meta.viewport"` | 仅包住当前内容区；其他页面显式关闭或覆盖 |
| 局部容器 | `LumalViewport :policy="localPolicy"` | 观察自身可用尺寸，不取整屏高度 |

| `policy.mode` | 行为 | 比例与溢出 |
| --- | --- | --- |
| `disabled` 或 `policy=false` | 不测量、不变换，重置继承的适配单位为1px | 保留普通布局 |
| `responsive`（默认） | 正常布局，提供容器尺寸变量 | 应用负责断点、滚动和最小可读字号 |
| `contain` | 设计宽高完整等比缩放并居中 | 可能留白；设置 minScale 后可能出现局部滚动 |
| `width` | 按设计宽度等比缩放，顶部对齐 | 可能溢出高度，保留局部滚动 |
| `vw` | 流式布局，不 transform；构建协作或显式单位适配 | 宽高均按浏览器宽度 / 设计宽度换算 |

下一版修正旧 `vw` 把实际容器宽高分别作为基准的行为。设计宽1920、窗口宽1280、
容器宽1000时，宽192px与高96px应为128px与64px，而不是100px与不同的高度比例。
只设置运行时 `mode: 'vw'` 不会自动重写原有 px，需开启下述构建协作或显式使用单位变量。
要保留旧容器宽高独立计算，使用 `responsive` 的 x/y-unit；不要把它称为浏览器 vw。
`minScale/maxScale` 仅约束 contain/width 画布，不限制原生 vw。
`minFontSize` 仅提供变量，不会自动改写后代样式。
缩放下限与完整容纳冲突时，必须允许局部滚动或切换响应式布局，不能同时承诺无溢出。

## 全局默认示例

```ts
import { createViewportPlugin } from '@lumal/viewport'

app.use(createViewportPlugin({
  mode: 'responsive',
  designWidth: 1920,
  designHeight: 1080,
  minFontSize: 12,
}))
```

需要应用级统一策略时，让应用内容区使用一个 `<LumalViewport>`。
此处没有对 `html/body/#app` 施加 transform，默认值支持 ref/getter 动态更新。

## 页面与混合路由示例

应用侧声明路由元信息，不需要给视口包安装 Vue Router：

```ts
import type { ViewportPolicy } from '@lumal/viewport'

declare module 'vue-router' {
  interface RouteMeta {
    viewport?: ViewportPolicy | false
  }
}

// 路由记录片段；实际组件由应用提供。
const dashboardMeta = { viewport: { mode: 'responsive' as const, designWidth: 1920, designHeight: 964 } }
const systemMeta = { viewport: false }
```

页面包装组件：

```vue
<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport'
import { useRoute } from 'vue-router'

/***********************仅适配当前内容容器*********************/
const route = useRoute()
</script>

<template>
  <LumalViewport :policy="route.meta.viewport">
    <slot />
  </LumalViewport>
</template>
```

包装器的父容器必须有确定高度、`min-height: 0`；Header/Tabbar 由真实布局占位，
不能再把 `window.innerHeight` 当作内容高度。Admin、Screen 使用同一 Router 即可；
鉴权与菜单继续由 Core 管理，适配元信息不授予任何访问权限。
KeepAlive 停用时断开观察器和待执行帧；激活重新测量，不重建页面实例。
组件只写自己的行内变量，切路由不会残留全局样式。

## 容器与独立 Screen 示例

```vue
<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport'
</script>

<template>
  <section style="height: 540px; min-width: 0">
    <LumalViewport :policy="{ mode: 'contain', designWidth: 1920, designHeight: 1080 }">
      <slot />
    </LumalViewport>
  </section>
</template>
```

Screen 可让视口容器占满应用高度；Admin 内嵌容器则只占实际工作区。
同一内容树只有一个主要缩放责任方。内部 Cockpit 使用 `viewport-mode="external"`，
不能再叠 DataV FullScreenContainer 或额外的 px→vw 全画布转换。

## 字号与浮层约定

- Admin 保留用户字号偏好（默认14，12–20）与 Element Plus 变量，不默认全屏缩放。
- `--lumal-viewport-unit` 在 vw 下为 `100 / designWidth vw`，其余模式为1px。
- `--lumal-viewport-scale` 在画布模式为 transform 比例，vw 下为窗口宽度 / 设计宽度，responsive/disabled为1。
- `--lumal-viewport-x-unit/y-unit` 在 vw 下同为浏览器宽度单位，其他启用模式仍为实际容器尺寸 / 设计尺寸。
- `--lumal-viewport-min-font-size` 已反算设计坐标，可在画布内用 `max(14px, var(...))`。
- 不自动转换全局字体、表格、输入框或弹窗。字号下限可能让文本换行，须保留合理空间。
- 数值布局使用 `computed(() => designPx * scale.value)`；纯函数 `computeViewportFontSize`
  可计算最终 CSS 字号下限，不会建立响应式依赖。

Teleport 到 body 的弹窗不会继承局部缩放变量，这是刻意的隔离。
Element Plus Dialog 使用 append-to-body；Popper/Select/Tooltip 保持默认 teleport，
由其引擎基于触发器的实际矩形定位。不要把已计算的屏幕坐标再次乘 scale。

## 地图与图表

省级工作台应选择“地图实际尺寸 + 浮层协调宽高”，不是整体变换 OpenLayers。
使用 `useElementSize({ target: useTemplateRef(...) })` 观察容器，尺寸变更时调用现有
`map.updateSize()` / `chart.resize()`；这些回调不得重建地图、重新请求业务或清空中心位置。
首次创建后也要更新尺寸；卸载清理实例；KeepAlive 下同时管理业务轮询。

浮层布局需要由消费项目修改：去掉工作区固定 min1280×660，按实际内容高度划分顶部、
左右和底部区域；中部使用 `minmax(0, 1fr)`、`min-height: 0`，不足时局部滚动或折叠。
382px侧栏、210px底栏、业务 mapPadding、行业断点和颜色不能硬编码进 Lumal。
不要为了适配删除地图、配色和业务回归断言；固定尺寸断言应改成可配置策略与边界断言。

## 共享设计配置

两个包没有相互依赖，也无需新增配置框架。用应用自己的 `viewport.config.ts` 保存同一份设计尺寸：

```ts
// 应用自有 viewport.config.ts，不导入 Vue 或 Vite。
export const viewportDesign = {
  designWidth: 1920,
  designHeight: 1080,
} as const

export const viewportPolicy = {
  ...viewportDesign,
  mode: 'vw',
  minFontSize: 12,
} as const
```

运行时在既有入口使用 `app.use(createViewportPlugin(viewportPolicy))`，并由全局、页面或
局部 `<LumalViewport :policy="...">` 包装器实际采用；未使用包装器不会自动缩放 DOM。
Vite 使用 `viewportWidth: viewportDesign.designWidth`，无需让两个包互相依赖或新增公共包。
构建与测量可独立启用：默认直接 vw 输出可单独使用；运行时也可只做测量/画布适配。
混合项目中选择 `output: 'runtime'`，则同一份编译 CSS 可由各包装器的 mode 控制：
vw 使用浏览器单位，其余模式恢复设计 px，contain/width 只 transform 一次。
页面、路由和容器可分别覆盖，禁用的内层包装器明确重置单位。

这份普通配置只是应用侧约定，不是新配置框架。
Screen 视口脚手架生成的根 `viewport.config.ts` 已集中 `viewportDesign/viewportPolicy`；
仅 `--viewport vw` 安装并启用 `@lumal/vite`，其他模式保持轻量。
Admin 和 Blank 可以同样按需添加这份普通配置，不转换整个后台和第三方库。

## 可选构建转换

CSS、SFC style 和 SCSS 预处理后的声明共用 PostCSS 管线；Vue 行内样式有独立开关，
基于模板 AST 定位并复用 CSS 声明规则，不扫描整份 SFC 或 TS/JS：

```ts
import { createViewportTransformPlugin } from '@lumal/vite'
import { viewportDesign } from './viewport.config'

const viewport = createViewportTransformPlugin({
  enabled: true,
  include: ['src/screen/**'],
  exclude: ['**/map/**', 'src/screen/canvas/**'],
  viewportWidth: viewportDesign.designWidth,
  output: 'runtime',
  fontSize: false,
  minSize: false,
  customProperties: false,
  includeProperties: ['width', 'height', 'top', 'left', 'padding*', '*gap'],
  excludeProperties: ['border*', 'margin*'],
  excludeSelectors: ['.runtime-canvas', '.map', /\.el-(?:dialog|popper)\b/],
  inlineStyles: true,
})
```

插件加入已有 plugins；默认关闭，必须显式 include，不按 serve/build 分支重复配置。
默认不转换依赖，确需转换时用 `dependencies` 精确包名白名单。
同一规则中的任一分组、嵌套祖先命中排除选择器时整条声明保留，不拆分选择器。
字符串按选择器子串、正则按选择器匹配，正则 `g/y` 无跨规则状态。

### 两种输出

默认 `output: 'vw'` 直接生成 `width:10vw;height:5vw`，不依赖运行时包，
但不能再与同一内容的 contain/width 或外部 transform 叠加。
可选 `output: 'runtime'` 生成：

```css
.panel {
  width: calc(192 * var(--lumal-viewport-unit, 1px));
  height: calc(96 * var(--lumal-viewport-unit, 1px));
}
```

该模式由 `LumalViewport` 设置局部单位：vw 为 `100 / designWidth vw`，
responsive/disabled/contain/width 为1px；无包装器时也回退设计 px。
由此支持按路由切换与局部容器覆盖，避免画布的二次缩放。
转换精度在直接模式作用于 vw 数字，在协作模式作用于设计 px 系数。
CSS 本身的宽高、间距无需改写为手工适配表达式。

自定义属性默认仍保留；若显式开启，其值在定义位置解析单位，需在对应包装器内定义，
不能指望 `:root` 上已解析的变量在局部容器重新求值。
Teleport 到包装器外会回退为设计 px；自定义 body 全局单位、外部 transform 或已输出 raw vw
不受局部协作自动撤销，必须由应用隔离。
即便都是 LumalViewport，也不能在外层 contain/width 画布内再嵌套 vw 区域；
单位重置无法撤销祖先 transform。支持的是同一包装器切换模式，或外层流式 vw 下的局部画布隔离。

### 属性控制

| 控制 | 默认 | 说明 |
| --- | --- | --- |
| `includeProperties` | `['*']` | CSS 连字符属性 glob；`[]` 不转换 |
| `excludeProperties` | `[]` | 黑名单优先，支持 `border*`、`padding*`、`margin*`、`*gap` |
| `fontSize` | `false` | `font-size`、`font`、`line-height` 一起保留 |
| `minSize` | `false` | 保留物理和逻辑的宽高下限 |
| `customProperties` | `false` | 保留自定义属性；`--lumal-viewport-*` 始终保留 |
| `minPixelValue` | `1` | 保留绝对值不大于该值的 px，保护细边框 |
| `precision` | `6` | 转换精度，`0..10` 位小数 |
| `inlineStyles` | `false` | 独立开启 Vue 模板行内样式转换 |
| `output` | `'vw'` | 可选 `'runtime'` 与局部包装器协作，默认直接 vw 保持兼容 |

文件和来源限制、选择器/忽略标记/已有适配保护都不能被属性名单绕过；
黑名单优先于白名单，白名单不能绕过字体、最小尺寸、自定义属性开关。
因此 `font-size:14px; line-height:20px` 在 `fontSize:false` 时都保持原值，
不会出现字号不变却行高缩小的问题。`fontSize:true` 才一起转换；
若只转换行高，可再用 `excludeProperties: ['font', 'font-size']` 保护字体。

`min-width/min-height/min-inline-size/min-block-size` 默认不转换，避免缩小最小可用尺寸；
确需按设计尺寸缩放时设置 `minSize:true`。边框、间距继续沿用原像素阈值和转换行为，
可以分别通过属性名单排除，不必关闭其他布局属性。

### 声明与已有适配

```css
.panel {
  /* lumal-viewport-ignore-next */
  width: 382px;
  height: 210px; /* lumal-viewport-ignore */
  padding: 24px;
}
```

前置 `ignore-next` 只保护紧随声明，后置 `ignore` 只保护紧邻前一声明。
Sass 压缩时使用 `/*! ... */` 保留标记。原始注释不会改写为运行时逻辑。

含 `var/env/attr/min/max/clamp` 函数或已有视口、容器、字体相对单位的声明整体保留，
不会把 `calc(192px * var(--lumal-viewport-scale))` 中的 192px 再变成 vw，
也不把 `clamp(320px, 50vw, 960px)` 的上下限缩小。
URL、引号字符串、普通数字不变，重复处理仍然幂等。
外部 transform 或非协作的跨组件运行时策略无法靠 CSS 源码可靠推断，必须显式排除其文件、
选择器或声明；不承诺自动识别任意缩放容器。

### Vue 行内样式与原子化 CSS

设置 `inlineStyles:true` 后：

```vue
<template>
  <div style="width: 192px; height: 96px; font-size: 14px; line-height: 20px" />
  <div :style="[{ width: '192px' }, runtimeStyle, { top: '24px' }]" />
  <!-- lumal-viewport-ignore -->
  <div style="width: 192px">
    <span style="height: 96px" />
  </div>
  <div class="w-[192px] h-[96px]" aria-label="width: 192px" />
</template>
```

默认直接输出下，设计宽1920时静态宽高变为 `10vw/5vw`；
协作输出下使用相应单位表达式，在运行时 vw 模式得到相同尺寸。字号和行高保持 `14px/20px`；
样式数组中的静态对象值同样处理，`runtimeStyle` 不求值。
对象的 CSS fallback 字符串数组与无插值模板字符串可以处理；
条件/逻辑表达式内部不遍历。对象的 `fontSize/lineHeight` 等 camelCase 属性按对应 CSS 属性过滤。
模板忽略注释跳过紧随元素及子树。无法静态分析的表达式保持原样，交给运行时 API。
配置了选择器排除时，动态 class/id、data 等非 style 属性无法确定是否命中，保守跳过该元素子树。
不会修改 class、`:class`、`aria-label`、其他模板属性、脚本变量或业务字符串。

Tailwind/UnoCSS 任意值类名及其生成 CSS 都保留，例如
`.w-\[192px\] { width:192px }` 不参与转换；原子类本身不会阻止显式行内 style 的转换。解析选择器的 class AST，
不会把普通的 `[data-size="192px"]` 属性选择器误识别为原子化规则。
这不是脚本字符串转换；ECharts 配置和动态业务数值继续显式使用现有公开 API。

### 动态数值

小流域式流式适配的动态数值也按浏览器宽度换算，而非默认 contain 比例：

```ts
import { useViewportScale } from '@lumal/viewport'
import { computed } from 'vue'
import { viewportDesign } from './viewport.config'

// 不传 target 表示窗口；显式 width 才不会受到窗口高度影响。
const { scale } = useViewportScale({ ...viewportDesign, mode: 'width' })
const tableColumnWidth = computed(() => 80 * scale.value)
```

这是已有公开 API，不新增全脚本扫描，也不替调用方猜测业务字符串。
只在 vw 流式区域使用这种数值；contain/width 画布使用设计数值，交给 transform 一次缩放。
地图和 ECharts 实例本身依旧按实际 DOM 容器 resize，不对引擎渲染结果再次缩放。

已有 PostCSS 插件与配置文件保留；配置错误明确失败，不忽略。

SCSS等预处理输出有原始source map时，逐声明校验其来源，避免Screen入口合并
Element Plus、Shared或Admin样式后绕过白名单。没有可靠map时，含跨文件
`@use` / `@forward` / Sass `@import`、无法解析语法或函数`additionalData`的
style整体跳过并发出警告；将外部样式与Screen声明拆成独立文件或style块。
纯SCSS声明与同一SFC中的独立安全CSS/SCSS style仍可转换。低层PostCSS入口处理预编译
SCSS/SFC时也必须提供原始map；来源不明的声明保留px，不能扩大转换范围。

已有选项与调用方式保留，行内样式仍默认关闭。此次安全修正会额外保护行高、最小尺寸和
已有适配表达式；依赖旧最小尺寸缩放结果的项目需显式启用 `minSize` 后验证。
构建 vw 仍相对浏览器视口；嵌入 Admin 的窄容器优先采用运行时测量和容器单位，
不要把浏览器 vw 当作容器宽度。地图、Element Plus 与 Teleport 浮层默认保持在转换范围之外。

## 隔离验收

本次浏览器 vw 协作的代码测试、tarball 与真实 CLI 生成项目结果见
[vw 协作验收](./viewport-vw-2026-10-27.md)；它不启动浏览器，不代替实际项目的视觉验收。

`apps/lumal-viewport-lab` 通过公开包名使用视口，使用真实 OpenLayers 矢量图、ECharts Canvas、
Element Plus 表格/弹窗/下拉/Tooltip；全部数据为独立编写的通用示例，无业务服务。
`scripts/check-viewport-consumer.mjs` 同时启动 Dev 和生产静态服务并在结束后关闭。

```bash
pnpm --filter @lumal/viewport build
pnpm --filter lumal-viewport-lab typecheck
pnpm --filter lumal-viewport-lab build
node scripts/check-viewport-consumer.mjs
```

结果在 `output/release/viewport-report.json`，截图在 `output/playwright/viewport/`。
脚本不使用 deviceScaleFactor、CSS zoom 或 viewport 尺寸冒充浏览器缩放；
使用临时 Chromium profile + 本仓库最小扩展调用 tabs.setZoom，
记录80/100/125/150%的实际 zoom、innerWidth/innerHeight、DPR、工作区及组件矩形。
扩展只装在临时 profile，不修改用户浏览器。没有扩展支持时测试失败而非静默降级。
此夹具不能代替真实消费者的最终部署验收，业务仓库保持只读。
实际尺寸、原生缩放、交互与实例稳定性证据见 [隔离验收报告](./screen-viewport-verification.md)。
