<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import { LumalChart } from '@lumal/charts';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import '@lumal/charts/style.css';

/***********************只注册示例实际使用的图表能力*********************/
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
const options: EChartsOption = {
  grid: { top: 20, right: 20, left: 44, bottom: 24 },
  xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', data: [12, 24, 18, 36, 30] }],
};
</script>

<template>
  <LumalChart :options="options" height="240px" />
</template>
