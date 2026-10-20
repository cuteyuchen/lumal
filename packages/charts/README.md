# @lumal/charts

Lumal 可选图表包，基于 ECharts 与 vue-echarts 封装轻量图表组件。ECharts 作为 peer dependency，不进入 `@lumal/core` 默认依赖。

## 安装

```bash
pnpm add @lumal/charts@0.0.4-beta echarts@^6 vue-echarts@^8 vue
```

支持 ECharts 6、vue-echarts 8 和 Vue 3.5+。应用仍需按需注册图表、组件和渲染器。
ECharts 6 调整了默认配色、图例位置和标签布局，本包不会强制恢复旧主题；需要保持原有外观时，
请按 [ECharts 6 迁移指南](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/) 在应用侧配置。

## 用法

```ts
import { LumalChart, LumalChartPanel, useChartResize } from '@lumal/charts'
import '@lumal/charts/style.css'
```

```vue
<LumalChartPanel
  v-model:view="view"
  title="访问趋势"
  :options="options"
  :error="error"
  summary="最近七天访问趋势"
  show-view-toggle
  show-export
  height="320px"
  @retry="reload"
  @export="handleExport"
>
  <template #query>查询条件</template>
  <template #table>可访问的数据表格</template>
</LumalChartPanel>
```

## 导出

- `LumalChart`：基础图表组件，透传 ECharts `options`，容器自适应，并默认响应 reduced-motion。
- `LumalChartPanel`：支持查询区、图表/表格切换、导出、重试、loading/empty/error 和无障碍摘要的工作流面板。
- `useChartResize`：监听容器尺寸变化并触发图表 resize。
- `resolveChartPanelStyle`：图表区/表格区宽度到 CSS 变量的映射。

`LumalChart` 的 class/style 保留在外层，其他 attrs 和事件传给 VChart；`@click` 接收 ECharts 参数，DOM 事件可使用 vue-echarts 的 `native:` 事件前缀。动画优先级为显式 `animation` prop > `options.animation` > reduced-motion 默认值。容器自适应只由 VChart 管理，`autoResize: false` 不安装额外尺寸监听。

`LumalChartPanel.chartWidth` / `tableWidth` 分别控制图表与表格视图的实际宽度，数字按 px 处理、字符串保留 CSS 单位，均受父容器 `max-width: 100%` 约束。
