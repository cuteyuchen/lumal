# Changelog

## 0.0.6-beta (2026-10-25)

### Minor Changes

- 首次版本：提供纯缩放算法、响应式元素尺寸监听和 useViewportScale，不依赖 Admin、Element Plus 或图表引擎。
- LumalViewport 和应用插件支持全局默认、页面覆盖及局部容器，作用范围与缩放策略独立。
- 支持 disabled/responsive/contain/width/vw 与显式设计尺寸、缩放上下限、字号下限。
- ResizeObserver/RAF 合并更新并正确清理，支持 KeepAlive 恢复；不默认 transform 地图或 DOM 根节点。
