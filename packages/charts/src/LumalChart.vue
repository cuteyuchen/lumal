<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { ComponentPublicInstance, StyleValue } from 'vue'
import { viewportLength } from '@lumal/viewport'
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, useAttrs, useTemplateRef } from 'vue'
import VChart from 'vue-echarts'

defineOptions({ inheritAttrs: false })

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  options: EChartsOption
  updateOptions?: SetOptionOpts
  autoResize?: boolean
  animation?: boolean
  ariaLabel?: string
  /** 数字为设计 px，显式单位字符串保持原义。 */
  width?: string | number
  height?: string | number
}>(), {
  autoResize: true,
  animation: undefined,
  ariaLabel: '数据图表',
  height: '100%',
  updateOptions: undefined,
  width: '100%',
})

/***********************渲染状态*********************/
const dimensions = computed(() => ({
  height: typeof props.height === 'number' ? viewportLength(props.height) : props.height,
  width: typeof props.width === 'number' ? viewportLength(props.width) : props.width,
}))
// 延迟到挂载后渲染，规避容器尺寸为 0 时的初始布局问题
const renderChart = shallowRef(false)
const prefersReducedMotion = shallowRef(false)
const resolvedOptions = computed<EChartsOption>(() => ({
  ...props.options,
  animation: props.animation ?? props.options.animation ?? !prefersReducedMotion.value,
}))
let motionQuery: MediaQueryList | undefined

function syncReducedMotion(event: MediaQueryListEvent | MediaQueryList): void {
  prefersReducedMotion.value = event.matches
}

/***********************模板引用*********************/
const chartRef = useTemplateRef<ComponentPublicInstance & { resize: () => void }>('chartRef')

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncReducedMotion(motionQuery)
    motionQuery.addEventListener?.('change', syncReducedMotion)
  }

  void nextTick(() => {
    renderChart.value = true
  })
})

onBeforeUnmount(() => {
  motionQuery?.removeEventListener?.('change', syncReducedMotion)
})

/***********************属性与图表事件透传*********************/
const attrs = useAttrs()
// attrs 本身不具备可追踪的响应性，在渲染期间读取，确保更新后的事件不会被 computed 缓存。
function getChartAttrs(): Record<string, unknown> {
  return Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'))
}

/***********************公开方法*********************/
defineExpose({
  resize: () => chartRef.value?.resize(),
})
</script>

<template>
  <div class="lumal-chart" :class="$attrs.class" role="img" :aria-label="ariaLabel" :style="[$attrs.style as StyleValue, dimensions]">
    <VChart
      v-if="renderChart"
      ref="chartRef"
      v-bind="getChartAttrs()"
      class="lumal-chart__canvas"
      :option="resolvedOptions"
      :update-options="updateOptions"
      :autoresize="autoResize"
    />
  </div>
</template>

<style scoped lang="scss">
.lumal-chart {
  width: 100%;
  height: 100%;
}

.lumal-chart__canvas {
  width: 100%;
  height: 100%;
}
</style>
