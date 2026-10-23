# 屏幕与工作区适配

这是未发布开发分支中的能力，不等同于 registry 已发布的同版本内容。
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
| `disabled` 或 `policy=false` | 不测量、不变换、不设置适配变量 | 保留普通布局 |
| `responsive`（默认） | 正常布局，提供容器尺寸变量 | 应用负责断点、滚动和最小可读字号 |
| `contain` | 设计宽高完整等比缩放并居中 | 可能留白；设置 minScale 后可能出现局部滚动 |
| `width` | 按设计宽度等比缩放，顶部对齐 | 可能溢出高度，保留局部滚动 |
| `vw` | 不 transform；显式使用 x/y unit 变量 | 根据实际容器宽高独立适配，不保证比例 |

`vw` 的变量是容器相对尺寸的 px 值，不是覆盖全局的浏览器 vw；
构建时 px→vw 是另一项可选能力，不能用于弥补工作区高度约束。
`minScale/maxScale` 为明确缩放限制。`minFontSize` 仅提供变量，不会自动改写后代样式。
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
- `--lumal-viewport-scale` 是组件施加的比例；responsive/vw 下为1。
- `--lumal-viewport-x-unit/y-unit` 为实际容器尺寸 / 设计尺寸，可用于指定浮层。
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

## 隔离验收

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
