<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { ComponentPublicInstance } from 'vue'
import { nextTick, onMounted, shallowRef, useTemplateRef } from 'vue'
import VChart from 'vue-echarts'
import { useChartResize } from './useChartResize'

/***********************属性定义*********************/
withDefaults(defineProps<{
  options: EChartsOption
  updateOptions?: SetOptionOpts
  autoResize?: boolean
  width?: string
  height?: string
}>(), {
  autoResize: true,
  height: '100%',
  updateOptions: undefined,
  width: '100%',
})

/***********************渲染状态*********************/
// 延迟到挂载后渲染，规避容器尺寸为 0 时的初始布局问题
const renderChart = shallowRef(false)

/***********************模板引用*********************/
const chartRef = useTemplateRef<ComponentPublicInstance & { resize: () => void }>('chartRef')

onMounted(() => {
  void nextTick(() => {
    renderChart.value = true
  })
})

/***********************尺寸自适应*********************/
useChartResize(chartRef)

/***********************公开方法*********************/
defineExpose({
  resize: () => chartRef.value?.resize(),
})
</script>

<template>
  <VChart
    v-if="renderChart"
    ref="chartRef"
    class="luma-chart"
    :option="options"
    :update-options="updateOptions"
    :autoresize="autoResize"
    :style="{ height, width }"
  />
</template>

<style scoped lang="scss">
.luma-chart {
  width: 100%;
  height: 100%;
}
</style>
