<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import { LumaChartPanel } from '@luma/charts'
import { LumaPage } from '@luma/core/components'
import { computed, shallowRef } from 'vue'
import { chartRows } from './example-data'

/***********************面板状态*********************/
const loading = shallowRef(false)

const options = computed<EChartsOption>(() => ({
  grid: { bottom: 32, left: 48, right: 16, top: 24 },
  series: [
    {
      areaStyle: {},
      data: chartRows.map(row => row.value),
      smooth: true,
      type: 'line',
    },
  ],
  tooltip: { trigger: 'axis' },
  xAxis: {
    boundaryGap: false,
    data: chartRows.map(row => row.label),
    type: 'category',
  },
  yAxis: { type: 'value' },
}))

/***********************事件处理*********************/
function refresh(): void {
  loading.value = true
  window.setTimeout(() => {
    loading.value = false
  }, 600)
}
</script>

<template>
  <main class="luma-admin-example">
    <LumaPage title="Chart Panel" description="消费 @luma/charts 的 LumaChartPanel，演示标题、loading 与操作插槽。">
      <LumaChartPanel title="模块完成度趋势" :options="options" :loading="loading" height="320px">
        <template #actions>
          <button class="luma-admin-example__button" type="button" @click="refresh">
            刷新
          </button>
        </template>
      </LumaChartPanel>
    </LumaPage>
  </main>
</template>
