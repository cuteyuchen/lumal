# 通用视口适配

本文按已发布的 `0.0.7-beta` 记录；以下运行时 API 自 `0.0.6-beta` 提供。
接入时核对 registry 与实际安装声明，开发未发布源码时使用精确提交的 tarball，不能用历史包代替新增能力。
仅 Vue peer，不依赖 Core/UI/图表。尺寸优先来自实际容器而不是 window。

- `computeViewportScale`：纯算法，contain/width；可选 minScale/maxScale。
- `useElementSize`：元素或窗口尺寸；RAF合并；KeepAlive、禁用、目标替换和卸载清理。
- `useViewportScale`：响应式比例与尺寸；在 computed 内读取 scale 做数值布局。
- `LumalViewport :policy`：disabled/responsive/contain/width/vw；false 关闭。
- `createViewportPlugin(defaults)`：仅应用默认值，不变换根、不注入路由守卫。
- `useViewportPolicy` / `resolveViewportPolicy`：合并局部策略；包不强制 Router。
- `computeViewportFontSize`：纯字号下限工具，不自动设置后台字号。

全局、路由/页面、容器是作用范围，mode仅表达策略。全局默认由显式包装器使用；
页面从自己的 route.meta读取policy；局部容器直接覆盖。所有CSS变量仅写在包装容器。

地图优先保持实际尺寸，仅在容器变化时updateSize，不重建实例或重请求数据。
图表按实际容器resize。浮层协调宽高，局部滚动；行业尺寸与mapPadding留业务层。
Teleport到body的UI独立于设计画布。Cockpit放入缩放容器时必须使用external。

## 与构建转换协作

`0.0.7-beta` 的Screen视口模板把 `viewportDesign/viewportPolicy` 集中到项目根
`viewport.config.ts`。这是不导入Vue/Vite的普通项目配置，不是新公共API，
也不默认安装或启用 `@lumal/vite`。
运行时policy展开同一designWidth/designHeight，Vite用
`viewportWidth: viewportDesign.designWidth`，避免分别维护设计宽度。

全局、页面和局部容器测量继续由现有API决定；构建和测量可独立开启。
responsive仅测量时可以协作，但contain/width整体缩放画布必须从构建转换范围排除。
构建vw相对浏览器视口，运行时vw模式提供的px单位相对实际容器，不能当成同一坐标系。
Vite会保留变量与已有适配表达式，但无法自动推断任意外部/跨组件transform；
应用仍须显式排除画布目录、选择器或声明。详见 [构建辅助](vite.md)。

完整示例见仓库 docs/screen-viewport-guide.md；隔离真实浏览器夹具位于apps/lumal-viewport-lab。

Admin 的 `examples/ViewportView.vue` 演示默认/路由/容器策略，`viewport/ViewportCanvas.vue`
是可复制的组件；路由策略在应用可信映射中补入，后端菜单 DTO 不一定保留扩展 meta。
独立 Cockpit 的 ViewportLab 与主驾驶舱隔离，不能将实验包装器再套在自缩放的 Cockpit 外。
`computeViewportFontSize` 需显式用于目标文字，不会自动改变整个后台字号。

Admin Demo 的工作区三模式是发包后的应用接线，不是新的公共布局 API；
只适配内容区，默认 responsive，contain/width 使用1280×720、minScale=.75、minFontSize=12。
示例为继承正文与Element Plus变量显式补偿字号，`--lumal-workspace-min-font-size`
仅保护接入的自有小字，不改写第三方固定字体。自管理视口示例和非Teleport的CRUD编辑页
通过应用可信meta覆盖为responsive；复制时保留单层缩放、缓存与浮层边界，不照搬业务权限。
