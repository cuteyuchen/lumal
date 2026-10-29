# @lumal/charts

## 什么时候用

后台统计图、带查询/导出/错误重试的图表面板，或需要图表与可访问表格替代视图时使用。

只做 DataV 边框/滚动数字不用此包；驾驶舱布局编排属于 [Cockpit](cockpit.md)，装饰型大屏组件属于 [DataV](datav.md)。

## 接入

peer 为 Vue 3.5+、ECharts 6、vue-echarts 8。按应用当前版本选择兼容版本，不强制升级无关依赖。

公开导出：`LumalChart`、`LumalChartPanel`、`useChartResize`、`resolveChartPanelStyle` 及对应类型。统一引入 `@lumal/charts/style.css`。

ECharts 的按需图形、组件和 renderer 由应用注册；仅导入 Lumal 组件不会注册所有图表。

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumalChart } from '@lumal/charts'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import '@lumal/charts/style.css'

/***********************图表引擎*********************/
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

/***********************图表配置*********************/
const options: EChartsOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: ['周一', '周二'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [12, 18] }],
}
</script>

<template>
  <LumalChart :options="options" :height="320" />
</template>
```

## 选择组件

- `LumalChart`：基础图表，传 `options`，提供高度和必要容器约束。
- `LumalChartPanel`：已有业务查询、loading/empty/error、重试、图表/表格切换或导出需求时使用。`v-model:view` 控制视图，`#query/#table` 放应用内容，`@retry/@export` 执行业务逻辑。
- `useChartResize`：只有直接管理其他图表实例时再使用；不要和 VChart 内置 autoresize 对同一实例重复监听。

## 重要契约

- 容器 width/height、面板 chartWidth/tableWidth 的数字为设计 px，内部按项目配置输出普通 vw，未启用时为 px；字符串保持 CSS 原义。动态 ECharts 设计尺寸显式用 `useViewportWidth().pixels()`，业务数据和 Canvas 测量不转换。

- 此包的 prop 是 `options`；DataV `LumalCharts` 的 ECharts prop 是 `option`，不要混用。
- `LumalChart` 的 class/style 留在外层，其余 attrs 和事件交给 VChart。`@click` 是 ECharts 事件，原生 DOM 事件用 vue-echarts 的 `native:` 前缀。
- `animation` 优先级：显式 prop > `options.animation` > reduced-motion 默认值；不要为恢复动画绕过用户的减少动态效果偏好。
- `autoResize: false` 不额外安装尺寸监听。不要手工增加第二套轮询 resize。
- ECharts 6 默认视觉与旧版不同，保留旧外观应在应用 option/theme 明确配置，不往通用包硬编码旧主题。
- 面板中的“导出”事件不是自动调用业务后端；表格替代视图也由应用提供真实数据。

仓库核对位置：`packages/charts/src/LumalChart.vue`、`LumalChartPanel.vue`、`useChartResize.ts` 与 `tests`。
