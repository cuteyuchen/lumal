# @luma/charts

Luma 可选图表包，基于 ECharts 与 vue-echarts 封装轻量图表组件。ECharts 作为 peer dependency，不进入 `@luma/core` 默认依赖。

## 安装

```bash
pnpm add @luma/charts echarts vue-echarts vue
```

## 用法

```ts
import { LumaChart, LumaChartPanel, useChartResize } from '@luma/charts'
import '@luma/charts/style.css'
```

```vue
<LumaChartPanel title="访问趋势" :options="options" height="320px" />
```

## 导出

- `LumaChart`：基础图表组件，透传 ECharts `options`，容器自适应。
- `LumaChartPanel`：带标题、loading、空状态与操作插槽的面板。
- `useChartResize`：监听容器尺寸变化并触发图表 resize。
- `resolveChartPanelStyle`：图表区/表格区宽度到 CSS 变量的映射。
