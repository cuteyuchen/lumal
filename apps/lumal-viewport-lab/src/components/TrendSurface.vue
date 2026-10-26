<script setup lang="ts">
import type { EChartsType } from 'echarts/core'
import { useElementSize } from '@lumal/viewport'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { nextFixtureInstanceId } from '../instanceSequence'

/***********************真实 Canvas 与按需引擎*********************/
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])
const chartElement = useTemplateRef<HTMLElement>('chartElement')
const { size } = useElementSize({ target: chartElement })
const renderedSize = shallowRef('')
const resizes = shallowRef(0)
const instance = nextFixtureInstanceId()
let chart: EChartsType | undefined
function resize() {
  if (!chart)
    return
  chart.resize()
  resizes.value++
  renderedSize.value = `${chart.getWidth()},${chart.getHeight()}`
}
onMounted(() => {
  chart = init(chartElement.value!)
  chart.setOption({
    animation: false,
    grid: { left: 34, right: 12, top: 12, bottom: 22 },
    xAxis: { type: 'category', data: ['A', 'B', 'C', 'D', 'E'], axisLabel: { fontSize: 12 } },
    yAxis: { type: 'value', splitNumber: 2, axisLabel: { fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    series: [{ type: 'line', data: [12, 24, 18, 38, 30], lineStyle: { color: '#267b62' } }],
  })
  resize()
})
watch(size, resize, { flush: 'post' })
onBeforeUnmount(() => chart?.dispose())
</script>

<template>
  <div
    ref="chartElement" class="trend-surface" data-testid="chart" :data-rendered-size="renderedSize"
    :data-instance="instance" :data-resizes="resizes"
  />
</template>

<style scoped>
.trend-surface { width: 100%; height: 100%; min-height: 0; }
</style>
