# @lumal/charts

可选 ECharts 图表包。ECharts 不进入 `@lumal/core` 默认依赖。

| 项 | 值 |
| --- | --- |
| 包名 | `@lumal/charts` |
| 本地路径 | `packages/charts` |
| 在线文档 | https://luma-docs-seven.vercel.app/packages/charts |
| 正式地址（上线后） | `https://www.npmjs.com/package/@lumal/charts` |

## 安装

下列命令对应工作区版本；registry 可用性与源码接入见 [安装说明](/guide/essentials/installation)。

```bash
pnpm add @lumal/charts@0.0.5-beta echarts@^6 vue-echarts@^8 vue
```

## 公开入口

| 入口 | 用途 |
| --- | --- |
| `@lumal/charts` | `LumalChart`、`LumalChartPanel`、`useChartResize` 等 |
| `@lumal/charts/style.css` | 样式 |

## 用法

```ts
import { LumalChart, LumalChartPanel, useChartResize } from '@lumal/charts'
import '@lumal/charts/style.css'
```

```vue
<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumalChartPanel } from '@lumal/charts'
import { shallowRef } from 'vue'
import '@lumal/charts/style.css'

const view = shallowRef<'chart' | 'table'>('chart')
const options = shallowRef<EChartsOption>({
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [120, 200, 150] }],
})
</script>

<template>
  <LumalChartPanel
    v-model:view="view"
    title="访问趋势"
    :options="options"
    summary="最近七天访问趋势"
    show-view-toggle
    show-export
    height="320px"
    @retry="reload"
    @export="handleExport"
  >
    <template #query>
      查询条件
    </template>
    <template #table>
      可访问的数据表格
    </template>
  </LumalChartPanel>
</template>
```

## 导出说明

| 导出 | 说明 |
| --- | --- |
| `LumalChart` | 透传 ECharts `options`，容器自适应，响应 `prefers-reduced-motion` |
| `LumalChartPanel` | 查询区、图表/表格切换、导出、重试、loading/empty/error、无障碍摘要 |
| `useChartResize` | 监听容器尺寸并 `resize` |
| `resolveChartPanelStyle` | 图表区/表格区宽度 → CSS 变量 |

## Peer

`LumalChart` 外层保留 class/style，其余 attrs 与事件传递给 VChart，`@click` 接收 ECharts 参数。动画优先级为显式 prop > `options.animation` > reduced-motion 默认值。只保留 VChart 一套 autoresize，关闭 `autoResize` 不额外监听 window。

`chartWidth` / `tableWidth` 实际控制面板对应视图宽度，支持数字 px 或 CSS 字符串，并以父容器宽度为上限。

- `vue`
- `echarts`：`^6.0.0`
- `vue-echarts`：`^8.0.0`

ECharts 6 的默认配色、图例位置和标签布局与 5.x 不同。本包不强制恢复旧主题；
需要保留旧外观时，请在应用侧按 [ECharts 6 迁移指南](https://echarts.apache.org/handbook/en/basics/release-note/v6-upgrade-guide/) 配置。

## 与 DataV 区别

- `@lumal/charts`：后台场景的图表工作流面板
- `@lumal/datav` 的 `LumalCharts`：大屏场景 DataV 原生 Charts，并保留 ECharts 扩展，见 [datav](./datav)
