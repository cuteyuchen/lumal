<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumaChart } from '@luma/charts'
import { LumaPage } from '@luma/core/components'
import { computed } from 'vue'
import { chartRows } from './example-data'

/***********************图表配置*********************/
const options = computed<EChartsOption>(() => ({
  grid: { bottom: 32, left: 48, right: 16, top: 24 },
  series: [
    {
      data: chartRows.map(row => ({
        itemStyle: { color: row.color },
        value: row.value,
      })),
      type: 'bar',
    },
  ],
  tooltip: { trigger: 'axis' },
  xAxis: {
    data: chartRows.map(row => row.label),
    type: 'category',
  },
  yAxis: { type: 'value' },
}))
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Chart" description="消费 @luma/charts 的 LumaChart，ECharts 作为可选 peer 不进 core。">
      <div class="luma-admin-example__chart-echarts">
        <LumaChart :options="options" height="320px" />
      </div>
    </LumaPage>
  </main>
</template>

<style scoped lang="scss">
.luma-admin-example__chart-echarts {
  width: 100%;
  height: 320px;
}
</style>
