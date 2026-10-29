# Changelog

## 0.1.0-beta.0 (2026-10-28)

- Breaking：删除多模式策略、画布包装器、缩放/居中/字号下限 API。
- 仅保留元素测量与 `getViewportConfig`、`getViewportWidth`、`viewportLength`、`viewportPixels`、`useViewportWidth`。
- 共享窗口监听及生命周期清理，数字尺寸与 CSS vw 使用同一浏览器宽度。

## 0.0.7-beta (2026-10-26)

### Patch Changes

- 与十包 fixed-group 同步为 0.0.7-beta；本轮无新增运行时 API，保留容器测量、三级策略与纯 Vue 消费边界。
- Vite/Screen 共享设计配置属于应用级普通 TypeScript 文件，不增加 Viewport 的构建工具依赖。

## 0.0.6-beta (2026-10-25)

### Minor Changes

- 首次版本：提供纯缩放算法、响应式元素尺寸监听和 useViewportScale，不依赖 Admin、Element Plus 或图表引擎。
- LumalViewport 和应用插件支持全局默认、页面覆盖及局部容器，作用范围与缩放策略独立。
- 支持 disabled/responsive/contain/width/vw 与显式设计尺寸、缩放上下限、字号下限。
- ResizeObserver/RAF 合并更新并正确清理，支持 KeepAlive 恢复；不默认 transform 地图或 DOM 根节点。
