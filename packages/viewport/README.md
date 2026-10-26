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
`width` 同前；`vw` 不施加 transform，仅提供按实际容器计算的
`--lumal-viewport-x-unit/y-unit`，需在局部 CSS 显式使用，不自动转换全部样式。
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
