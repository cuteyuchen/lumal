# @lumal/datav

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
