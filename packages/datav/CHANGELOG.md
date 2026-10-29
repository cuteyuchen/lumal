# @lumal/datav

## 0.1.0-beta (2026-10-28)

- Breaking：删除全屏适配模式、`useFullScreenScale`、整画布 transform 和 screen 推断。
- 全屏容器使用设计内容尺寸、自然高度与明确 overflow；数字设计 prop/config 在内部统一换算。
- 保留图表引擎、装饰、动画与局部图形几何。

## 0.0.7-beta (2026-10-26)

### Patch Changes

- 同步 Core、图标与视口依赖至 0.0.7-beta；独立组件、按需图表引擎与全屏容器契约不变。

## 0.0.6-beta (2026-10-25)

### Patch Changes

- 全屏容器与 Cockpit 复用轻量 @lumal/viewport 缩放算法和尺寸生命周期，保留原公开契约。
- ECharts peer 改为可选，无引擎组件不强制安装图表运行时。
- 在首次 setOption 前绑定图表事件，保证静态首帧 rendered/finished 通知。
- 固定视觉夹具的尺寸和动画时点，增加跨加载一致性与三轮视觉门禁，不放宽原快照阈值。

## 0.0.5-beta (2026-10-20)

### Patch Changes

- 与 fixed-group 公共包同步为 0.0.5-beta；独立组件及按需引擎边界保持不变。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 仅统一九包版本，无新增运行时 API；保留独立子入口与图表引擎动态加载边界。

## 0.0.3-beta (2026-10-16)

### Minor Changes

- ECharts 扩展协议升级到 ECharts 6；开发与指南使用 ECharts 6.1.0。
- 通用图表按 config/option 模式异步加载当前引擎，模式切换或卸载会使旧加载失效。

### Patch Changes

- 复用 SVG 动画暂停逻辑，合并同一 tick 的 DOM 同步，KeepAlive 失活时暂停 ActiveRing 轮换。
- FullScreenContainer 改用 useTemplateRef，删除未使用的私有自动播放 helper。
- 增加真实 ECharts SVG 回归和初始静态闭包体积检查。

## 0.0.2-beta (2026-08-01)

### Minor Changes

- Add the Vue 3 cockpit visualization component package and expose source and distribution aliases for its root and stylesheet entries.
