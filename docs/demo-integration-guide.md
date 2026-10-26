# Demo 与业务接入

公开 API 基于已发布并核验的 `0.0.7-beta`，包含 Designer 名称输入修复，
见 [本版发布记录](./npm-release-0.0.7-beta.md)。Demo 页面和文档部署是独立步骤；
正式 npm 发布时未部署生产；后续授权的站点更新已单独完成，
见 [合并与站点实际验收](./npm-release-0.0.7-beta.md#合并与站点实际验收)。
包版本不能替代线上提交和部署证据。

## 选型与运行

| 目标 | 选择 | 不需要的能力 |
| --- | --- | --- |
| 最小 Vue 应用 | Blank | Core、Router、Pinia、Element Plus |
| 静态屏幕 | Screen + none，或 Vue + Viewport | 登录、请求、Admin |
| 内部数据屏幕 | Screen + HTTP auth / data | 后台菜单、系统管理 |
| 常规后台 | Admin Minimal / Standard | 全页面画布缩放 |
| 后台内容区嵌入大屏 | Admin 路由中的局部 Viewport | 第二个 Router、第二套登录 |
| 多布局和 Widget 编排 | Cockpit Runtime | Designer、地图引擎 |
| 可视化配置编辑 | 按需 Cockpit Designer | 自动保存、业务 HTTP |

项目命令和真实 HTTP 契约见 [项目模板](./project-template-guide.md)。
例如创建有登录和请求的 Screen：

```sh
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal internal-screen --template screen --auth http --data http --router-mode history
cd internal-screen
pnpm install
pnpm check
pnpm dev
```

必须按生成的 `API-CONTRACT.md` 配置真实接口，登录失败不降级为 Demo。
首次 install 生成 lockfile，之后 CI 使用 frozen-lockfile。

## 只有 Vue + Viewport 的静态屏幕

```sh
pnpm --package=create-lumal-admin@0.0.7-beta dlx create-lumal static-screen --template blank
cd static-screen
pnpm add @lumal/viewport@0.0.7-beta
```

`main.ts` 仅安装应用默认，不变换 html/body：

```ts
import { createViewportPlugin } from '@lumal/viewport'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).use(createViewportPlugin({
  mode: 'contain',
  designWidth: 960,
  designHeight: 540,
})).mount('#app')
```

`App.vue`：

```vue
<script setup lang="ts">
import { LumalViewport } from '@lumal/viewport'
import { ref } from 'vue'

/***********************静态数据与页面交互*********************/
const confirmed = ref(0)
</script>

<template>
  <main class="workspace">
    <LumalViewport v-slot="{ size, scale }">
      <section class="canvas">
        <h1>区域运行总览</h1>
        <p>在线节点：128 · 运行指数：98.6</p>
        <output>{{ size.width }} × {{ size.height }} · {{ scale.toFixed(3) }}</output>
        <button type="button" @click="confirmed++">确认 · {{ confirmed }}</button>
      </section>
    </LumalViewport>
  </main>
</template>

<style scoped>
.workspace { position: fixed; inset: 0; }
.canvas { box-sizing: border-box; height: 100%; padding: 32px; background: #123034; color: #eaf8f5; }
button { display: block; margin-top: 24px; padding: 12px; }
</style>
```

无需全局样式、Core 或 UI 框架。容器必须有确定宽高；width 可能产生局部纵向滚动，
responsive 不缩放内容。可读字号下限需要消费页面显式使用 `computeViewportFontSize`，
不是自动修改所有后代。完整三层接线见 [屏幕适配](./screen-viewport-guide.md)。

## Admin 页面与容器级接入

应用只提供默认 responsive；路由为需要适配的页面声明 `meta.viewport`。
系统管理不包画布或传 `policy=false`。本分支 `ViewportView.vue` 演示
`useViewportPolicy`、`resolveViewportPolicy`、`useElementSize` 和 `useViewportScale`：
composable 只测量，DOM transform 由 `LumalViewport` 唯一执行。

Admin Demo 的工作区模式切换是发包后的应用示例，不改变 Core 默认布局：
可选择 responsive、contain、width，只缩放实际内容区。设计尺寸 `1280 × 720`，
比例下限 `.75`、目标物理字号下限 `12px`；文字保护仅适用于显式接入 token 和继承正文，
固定像素、rem、Canvas 字体仍由页面处理。自管理页面显式 responsive，防止双重缩放；
完整边界见 [工作区三模式](./screen-viewport-guide.md#admin-demo-的工作区三模式)。

Admin 的后端菜单 DTO 不透传任意扩展 meta。`src/api/menu.ts` 在规范化后按可信组件标识
为 Viewport 页面补入 `meta.viewport`，不新增路由或放宽权限；其他页面没有此覆盖。
业务项目也可以在本地静态路由中声明策略，不应把布局策略与菜单授权混为一体。

可直接复制的单文件示例：

<<< ../../../lumal-admin/src/views/examples/viewport/ViewportCanvas.vue

在 VitePress 页面中以上源码由文档 include 路径解析；仓库位置为
`apps/lumal-admin/src/views/examples/viewport/ViewportCanvas.vue`。
控件与普通 Admin 表格仍使用框架字号偏好。弹窗放在 transform 树之外，
下拉/Tooltip 需选择局部挂载或独立校准，不能默认认为 Teleport 会继承画布比例。

## DataV 与 Cockpit

DataV 提供边框、装饰、翻牌和滚动榜单；Cockpit 提供编排，不替代图表、地图或业务数据。
DataV 装饰不要求 ECharts，也不要求 Cockpit。代表性源码在
`apps/lumal-admin/src/views/examples/DataVView.vue`。
DataV 全屏容器默认 fixed，嵌入后台时必须在局部宿主明确改为 absolute。

Cockpit Runtime 最小工作示例包含两个文件；安装 Core / Icons / Vue / Element Plus
及对应样式的说明见 [Cockpit 包文档](/packages/cockpit)。
以下应用页未导入 Designer、Cesium 或 OpenLayers：

<<< ../../../lumal-admin/src/views/examples/CockpitView.vue

同目录的 `cockpit/MetricWidget.vue`：

<<< ../../../lumal-admin/src/views/examples/cockpit/MetricWidget.vue

外层 Viewport + 内层 `viewport-mode="external"` 只有一次缩放。
独立屏幕也可使用 `scale` 或 `vwvh`，不要在它们外再包缩放容器。

Designer 仅在编辑入口加载：

```ts
import { defineAsyncComponent } from 'vue'

const LumalCockpitDesigner = defineAsyncComponent(async () =>
  (await import('@lumal/cockpit/designer')).LumalCockpitDesigner,
)
```

传入 `config/registry`，处理 `save({config,layout})` 和 `cancel`。
保存失败要保留草稿并展示 `saveError`；消费方负责权限、持久化和损坏存档的显式恢复。
不要为只读 Runtime 同步导入 Designer 或整个地图中心。

全屏范围与缩放范围也是两回事。`LumalCockpit.enterFullscreen()` 针对组件内部根节点；
Teleport 到 body 的弹窗及外部 Designer 不会因此进入该全屏树。独立 Demo 由应用对
`document.documentElement` 请求全屏，使弹窗、Tooltip 和兄弟 Designer 保持可见、可点击，
但没有把整个页面再做 CSS 缩放。其他应用可选择将浮层挂载到全屏宿主，或打开编辑界面前退出全屏。

## Cesium 构建与部署

Cesium 是独立 Demo 的应用依赖，不是 `@lumal/cockpit` 的运行时要求。
仓库根运行：

```sh
pnpm install --frozen-lockfile
pnpm cockpit:build
pnpm --filter lumal-cockpit preview --port 4180 --strictPort
```

包内 `pnpm build` 等价于根命令。`build:app` 是已有 dist 后的内部步骤，
缺少产物时应先 `pnpm cockpit:deps`。单独运行裸 Vite 不含类型检查和依赖编排。

- `vite-plugin-static-copy` 复制 Cesium `Workers/Assets/Widgets/ThirdParty`，保留各目录内部结构。
- `CESIUM_BASE_URL` 必须对应部署前缀；当前独立站为 `./cesiumStatic/`，不是外部 CDN。
- 部署整个 dist，包括 cesiumStatic；不能只上传 JS/CSS。
- Workers 必须返回 JS，Assets 返回原始资源；SPA fallback 返回 HTML 会使请求看似 200 但无法运行。
- 子路径部署要同时调整 Vite base、CESIUM_BASE_URL 和服务器路径。当前自动化只证明根路径部署。
- Demo 使用椭球地形和公开本地数据，不依赖 Ion Token；接商业底图前单独检查授权、CORS 和凭据。
- 资源/初始化错误必须显示可重试状态，不以空白容器表示成功。

开发模式允许仓库源码 alias，必须包含 viewport；生产构建和 preview 使用发布形态 dist。
Vite 8 分组需要检查依赖递归和执行顺序，不能仅依赖 chunk 文件名推断按需加载。
首屏测量以 `scripts/check-consumer-budgets.mjs` 的静态 import 闭包为准。

## 地图、图表和业务状态

地图留在真实容器，ResizeObserver 只调用现有地图 `updateSize()` / Cesium `resize()`，
ECharts 调 `resize()`，不要重建地图、重复请求或恢复初始中心。
浮层可单独响应式或缩放；小高度场景要局部滚动/折叠，不能靠 vw 解决固定高度相加。
框架不包含业务地图、接口或行政区划规则。

## Demo 入口与版本边界

| 站点 | 公开入口 | 可交互入口 |
| --- | --- | --- |
| Admin | https://lumal-admin.cuteyuchen.top/ | `/#/examples/viewport`、`/#/examples/datav`、`/#/examples/cockpit` |
| Cockpit | https://lumal-cockpit.cuteyuchen.top/ | 顶部视口实验、布局恢复和错误反馈 |
| DataV | https://lumal-datav.cuteyuchen.top/ | 继续使用完整组件指南 |
| 文档 | https://lumal.cuteyuchen.top/ | 此指南和包功能覆盖表 |

上述入口已随 PR #9 合入 master 并完成授权部署；首次生产验收基线为 `e2ac131`。
npm 版本、源码提交、构建产物、Vercel Deployment 和域名别名仍须分别核对，
不能用某一个成功替代全部上线验收。实际证据与未覆盖边界见本版发布记录。
