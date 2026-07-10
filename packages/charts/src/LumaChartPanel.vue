<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { ChartPanelWidth } from './panel-style'
import { computed } from 'vue'
import LumaChart from './LumaChart.vue'
import { resolveChartPanelStyle } from './panel-style'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  options?: EChartsOption
  loading?: boolean
  noData?: boolean
  emptyText?: string
  height?: string
  chartWidth?: ChartPanelWidth
  tableWidth?: ChartPanelWidth
}>(), {
  chartWidth: undefined,
  emptyText: '暂无数据',
  height: '320px',
  loading: false,
  noData: false,
  options: undefined,
  tableWidth: undefined,
  title: '',
})

/***********************面板尺寸*********************/
const panelStyle = computed(() => resolveChartPanelStyle({
  chartWidth: props.chartWidth,
  tableWidth: props.tableWidth,
}))
</script>

<template>
  <section class="luma-chart-panel" :style="panelStyle">
    <header v-if="title || $slots.actions" class="luma-chart-panel__header">
      <h4 v-if="title" class="luma-chart-panel__title">
        {{ title }}
      </h4>
      <div v-if="$slots.actions" class="luma-chart-panel__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="luma-chart-panel__body" :style="{ height }">
      <div v-if="loading" class="luma-chart-panel__status">
        <slot name="loading">
          加载中…
        </slot>
      </div>
      <div v-else-if="noData" class="luma-chart-panel__status">
        <slot name="empty">
          {{ emptyText }}
        </slot>
      </div>
      <LumaChart v-else-if="options" :options="options" :height="height" />
      <slot v-else />
    </div>
  </section>
</template>

<style scoped lang="scss">
.luma-chart-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  &__body {
    position: relative;
    width: 100%;
  }

  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--el-text-color-secondary, #909399);
  }
}
</style>
