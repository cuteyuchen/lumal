<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import type { ComponentPublicInstance } from 'vue'
import type { ChartPanelWidth } from './panel-style'
import { computed, useId, useTemplateRef } from 'vue'
import LumalChart from './LumalChart.vue'
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
  error?: boolean | Error | string
  errorText?: string
  retryText?: string
  summary?: string
  showExport?: boolean
  showViewToggle?: boolean
  animation?: boolean
}>(), {
  animation: undefined,
  chartWidth: undefined,
  emptyText: '暂无数据',
  error: false,
  errorText: '数据加载失败',
  height: '320px',
  loading: false,
  noData: false,
  options: undefined,
  retryText: '重新加载',
  showExport: false,
  showViewToggle: false,
  summary: '',
  tableWidth: undefined,
  title: '',
})

const emit = defineEmits<{
  export: [view: 'chart' | 'table']
  retry: []
}>()

const view = defineModel<'chart' | 'table'>('view', { default: 'chart' })
const chartRef = useTemplateRef<ComponentPublicInstance & { resize: () => void }>('chartRef')
const summaryId = `lumal-chart-summary-${useId()}`
const resolvedErrorText = computed(() => props.error instanceof Error
  ? props.error.message || props.errorText
  : typeof props.error === 'string' ? props.error : props.errorText)

/***********************面板尺寸*********************/
const panelStyle = computed(() => resolveChartPanelStyle({
  chartWidth: props.chartWidth,
  tableWidth: props.tableWidth,
}))

defineExpose({
  resize: () => chartRef.value?.resize(),
})
</script>

<template>
  <section class="lumal-chart-panel" :style="panelStyle">
    <div v-if="$slots.query" class="lumal-chart-panel__query">
      <slot name="query" />
    </div>

    <header v-if="title || $slots.actions || showExport || showViewToggle" class="lumal-chart-panel__header">
      <h4 v-if="title" class="lumal-chart-panel__title">
        {{ title }}
      </h4>
      <div class="lumal-chart-panel__actions">
        <slot name="actions" />
        <div v-if="showViewToggle" class="lumal-chart-panel__view-toggle" aria-label="图表展示方式">
          <button type="button" :aria-pressed="view === 'chart'" @click="view = 'chart'">
            图表
          </button>
          <button type="button" :aria-pressed="view === 'table'" @click="view = 'table'">
            表格
          </button>
        </div>
        <button v-if="showExport" type="button" @click="emit('export', view)">
          导出
        </button>
      </div>
    </header>

    <p v-if="summary" :id="summaryId" class="lumal-chart-panel__summary">
      {{ summary }}
    </p>

    <div
      class="lumal-chart-panel__body"
      :class="`is-${view}`"
      :style="{ height }"
      :aria-busy="loading"
      :aria-describedby="summary ? summaryId : undefined"
    >
      <div v-if="loading" class="lumal-chart-panel__status" role="status">
        <slot name="loading">
          加载中…
        </slot>
      </div>
      <div v-else-if="error" class="lumal-chart-panel__status is-error" role="alert">
        <slot name="error" :message="resolvedErrorText" :retry="() => emit('retry')">
          <span>{{ resolvedErrorText }}</span>
          <button type="button" @click="emit('retry')">
            {{ retryText }}
          </button>
        </slot>
      </div>
      <div v-else-if="noData" class="lumal-chart-panel__status" role="status">
        <slot name="empty">
          {{ emptyText }}
        </slot>
      </div>
      <slot v-else-if="view === 'table'" name="table" />
      <LumalChart
        v-else-if="options"
        ref="chartRef"
        :options="options"
        :height="height"
        :animation="animation"
        :aria-label="title || '数据图表'"
      />
      <slot v-else name="chart" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.lumal-chart-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__query {
    padding: 12px;
    border-radius: var(--lumal-radius-base, 8px);
    background: var(--el-fill-color-light, Canvas);
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }

  &__body {
    position: relative;
    width: 100%;
    min-height: 160px;
    overflow: hidden;
  }

  &__body.is-table {
    width: var(--lumal-chart-panel-table-width, 100%);
    max-width: 100%;
    overflow: auto;
  }

  &__body.is-chart {
    width: var(--lumal-chart-panel-chart-width, 100%);
    max-width: 100%;
  }

  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--el-text-color-secondary, CanvasText);
    gap: 12px;
    flex-direction: column;
    text-align: center;
  }

  &__status button,
  &__actions button {
    min-width: 44px;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--el-border-color, currentColor);
    border-radius: var(--lumal-radius-base, 8px);
    color: var(--el-text-color-primary, CanvasText);
    background: var(--el-bg-color, Canvas);
    cursor: pointer;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__view-toggle {
    display: inline-flex;
  }

  &__view-toggle button[aria-pressed='true'] {
    border-color: var(--el-color-primary, Highlight);
    color: var(--el-color-primary, Highlight);
    background: var(--el-color-primary-light-9, Canvas);
  }

  &__summary {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  button:focus-visible {
    outline: 2px solid var(--el-color-primary, Highlight);
    outline-offset: 2px;
  }
}

@media (max-width: 640px) {
  .lumal-chart-panel {
    &__header {
      align-items: flex-start;
      flex-direction: column;
    }

    &__actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
