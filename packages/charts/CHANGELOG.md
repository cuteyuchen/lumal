# @lumal/charts

## 0.0.6-beta (2026-10-25)

### Patch Changes

- 与十包 fixed-group 同步为 0.0.6-beta；保持 ECharts / vue-echarts peer 和现有公开 API。

## 0.0.5-beta (2026-10-20)

### Patch Changes

- 与 fixed-group 公共包同步为 0.0.5-beta；本轮无图表运行时 API 变化。

## 0.0.4-beta (2026-10-20)

### Patch Changes

- 仅统一九包版本，无新增运行时 API；继续使用 ECharts 6 / vue-echarts 8 peer。

## 0.0.3-beta (2026-10-16)

### Minor Changes

- 图表 peer 依赖升级为 ECharts 6 / vue-echarts 8，开发与示例使用 ECharts 6.1.0 / vue-echarts 8.3.2。
- 不再声明兼容 ECharts 5 / vue-echarts 7；默认主题、图例及标签布局遵循 ECharts 6。

### Patch Changes

- 正确转发 VChart 图表事件，动画优先级调整为显式 prop、option、reduced-motion 默认值。
- 移除重复 resize 监听，接通 chartWidth/tableWidth 布局样式。
- 增加真实 SVG 引擎的更新、系列删除与销毁回归。

## 0.0.2-beta (2026-08-01)

- Version bump only, to stay in lockstep with the other @lumal packages.
