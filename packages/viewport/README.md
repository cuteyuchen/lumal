# @lumal/viewport

本文 API 基线为 `0.0.6-beta`，实际版本可用性以 registry 为准。

仅依赖 Vue peer，不依赖 Core、Element Plus、ECharts、DataV 或 Cockpit。
独立包使纯 Screen 无需为了尺寸适配安装任何后台或图表框架，
同时共享 DataV 与 Cockpit 的算法和监听生命周期。

```ts
import { computed, useTemplateRef } from 'vue'
import { useViewportScale } from '@lumal/viewport'

const container = useTemplateRef<HTMLElement>('container')
const { scale, size } = useViewportScale({ target: container, designWidth: 1920, designHeight: 1080 })
const columnWidth = computed(() => 180 * scale.value)
```

`columnWidth` 是响应式数值；不要在初始化时一次性读取 `scale.value`。
`target` 不传时监听窗口，传入空 ref 时等待元素挂载。设计尺寸、mode、enabled
支持值、ref 或 getter。卸载、目标变化、禁用时清理 ResizeObserver、窗口监听与待执行帧。

`computeViewportScale` 是纯算法；`contain` 保持比例、完整显示并居中，可能留白；
`width` 只按设计宽度等比适配，内容可能超出容器高度。
`LumalViewport :policy="{ mode: 'contain', designWidth: 1920, designHeight: 1080 }"`
基于自己的实际容器适配。`responsive` 不缩放；`disabled` 或 `policy=false` 关闭；
`width` 同前。下一版未发布源码修正 `vw` 为浏览器宽度语义，不施加 transform，
`--lumal-viewport-unit/x-unit/y-unit` 统一为 `100 / designWidth vw`，宽高均按同一宽度比例。
容器测量和 `resize` 事件仍返回实际可用空间，不把窄容器或高度当作 vw 基准。
仅选择运行时 `vw` 不会改写已有 px；使用下述构建协作或显式单位表达式。
容器需有明确宽高。`minScale/maxScale` 可限制比例，超出时保留局部滚动；
`minFontSize` 只提供局部 CSS 变量，使用者决定哪些文字需要可读性下限。
组件不修改全局字号，不接管地图或图表实例。

```ts
import { createViewportPlugin } from '@lumal/viewport'

app.use(createViewportPlugin({ mode: 'responsive', designWidth: 1920, designHeight: 1080 }))
```

插件只提供应用默认值，不修改根元素。页面或路由包装器通过 `policy` 覆盖；
独立容器同样通过 `policy` 配置。包不依赖 Router，路由元信息由应用读取。
监听在 KeepAlive 停用时暂停，激活时重新测量；不写入全局 CSS。
`resize` 事件提供实际 CSS 尺寸，可调用现有地图 `updateSize()` 或图表 `resize()`。

同一内容树只使用一个画布缩放责任方。Cockpit 放入本容器时使用
`viewport-mode="external"`；地图优先按实际容器 resize，避免整体 transform。
完整说明见仓库 `docs/screen-viewport-guide.md`。

## 流式 vw 与构建协作

设计稿仍写 px，使用 `@lumal/vite` 的可选 `output: 'runtime'` 和 `inlineStyles: true`
转换选定 CSS/SCSS/Vue style。`192px` 变为
`calc(192 * var(--lumal-viewport-unit, 1px))`：

- `vw`：单位为浏览器 `100 / designWidth vw`，保留流式布局，无整体画布变换。
- `responsive/contain/width/disabled`：单位为1px，恢复设计 px；画布模式只 transform 一次。
- 未包装或 Teleport 到包装器外：回退1px。嵌套包装器重置单位，禁用区域不继承外层 vw。

项目根 `viewport.config.ts` 共享无依赖的 `viewportDesign`，构建使用其 designWidth，
运行时 policy 展开同一对象。两个包可独立使用，不增加包间依赖。
默认直接 `px → vw` 的输出不受运行时单位控制；不能再套 contain/width 画布。
任意外部 transform、自适应变量和已转换样式仍需显式排除。
不要在 contain/width 画布内部再嵌套 vw 区域；局部单位无法撤销祖先的物理 transform。

`vw` 的 slot.scale、`--lumal-viewport-scale` 和 expose.result 使用窗口宽度比例，
不应用 `minScale/maxScale`，以保持与原生 vw 一致。`minFontSize` 不自动改写字体。
`responsive` 的 x/y单位仍可显式实现原先的容器宽高独立适配。

动态图表尺寸继续用已有公开 API，不扫描脚本：

```ts
// 无 target 表示窗口；这里必须显式 width，默认 contain 会同时受高度影响。
const { scale } = useViewportScale({ designWidth: 1920, mode: 'width' })
const columnWidth = computed(() => 180 * scale.value)
```

仅在 vw 流式内容中使用该结果；已 transform 的画布使用原设计坐标，
图表/地图按实际 DOM 容器 resize，避免把同一数值缩放两次。
