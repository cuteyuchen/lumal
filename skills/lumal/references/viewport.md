# 通用视口适配

`@lumal/viewport` 从已发布的 `0.0.6-beta` 提供以下 API；接入时核对 registry 与实际安装声明。
验证未发布源码时使用本地 tarball，不能用历史 registry 包代替新增能力。
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

未发布源码的Screen视口模板把 `viewportDesign/viewportPolicy` 集中到项目根
`viewport.config.ts`。这是不导入Vue/Vite的普通项目配置，不是新公共API，
仅 `--viewport vw` 安装并启用 `@lumal/vite`，其余模式不增加构建依赖。
运行时policy展开同一designWidth/designHeight，Vite用
`viewportWidth: viewportDesign.designWidth`，避免分别维护设计宽度。

全局、页面和局部容器测量继续由现有API决定；构建和测量可独立开启。
默认直接vw输出不能叠加contain/width。可选 `output:'runtime'` 输出
`calc(192 * var(--lumal-viewport-unit, 1px))`，由LumalViewport在vw下提供
`100/designWidth vw`，其余模式恢复1px，无包装器也回退1px，避免画布二次缩放。
vw横纵按浏览器宽度同一比例，不transform、不用容器宽高替代；实际size/resize仍取容器。
slot.scale/--scale/result在vw下取窗口宽度比例，minScale/maxScale只约束画布。
保留旧容器宽高独立单位需使用responsive的x/y-unit；禁用容器重置继承单位。
Vite会保留变量与已有适配表达式，但无法自动推断任意外部/跨组件transform；
应用仍须显式排除画布目录、选择器或声明。详见 [构建辅助](vite.md)。

完整示例见仓库 docs/screen-viewport-guide.md；隔离真实浏览器夹具位于apps/lumal-viewport-lab。

动态数值复用 `useViewportScale({ designWidth, mode:'width' })` 且不传target，
在computed中显式计算；transform画布仍使用设计坐标，不再乘浏览器比例。
Teleport到包装器外使用设计px；外部transform、raw vw仍须显式隔离。

Admin 的 `examples/ViewportView.vue` 演示默认/路由/容器策略与vw，`viewport/ViewportCanvas.vue`
是可复制的组件；路由策略在应用可信映射中补入，后端菜单 DTO 不一定保留扩展 meta。
独立 Cockpit 的 ViewportLab 与主驾驶舱隔离，不能将实验包装器再套在自缩放的 Cockpit 外。
`computeViewportFontSize` 需显式用于目标文字，不会自动改变整个后台字号。
