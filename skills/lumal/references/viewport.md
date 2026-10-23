# 通用视口适配

开发分支新增 `@lumal/viewport`，未发布，不能用现有 registry 版本验证这些 API。
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

完整示例见仓库 docs/screen-viewport-guide.md；隔离真实浏览器夹具位于apps/lumal-viewport-lab。
