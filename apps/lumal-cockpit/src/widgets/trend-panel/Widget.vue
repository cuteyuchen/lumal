<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@lumal/cockpit'
import { LumalCharts } from '@lumal/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { useDemoRefresh } from '../../composables/useDemoRefresh'
import { getSceneEntity, trendSeries } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'
import { standaloneResolvedThemeMode } from '../../services/preferences'

/***********************运行趋势图（@lumal/datav LumalCharts）*********************/
const context = useCockpitContext()
const { loading } = useDemoRefresh()
const error = ''
const filterStatus = ref<SceneFilterPayload['status']>()
const selectedId = ref('')
const updateOptions: SetOptionOpts = { notMerge: false }
const timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '今日']

const series = computed(() => trendSeries)
const selectedEntity = computed(() => getSceneEntity(selectedId.value))
const selectedStatus = computed(() => selectedEntity.value?.status)
const selectedName = computed(() => selectedEntity.value?.name ?? '全国')
const latestIndex = computed(() => selectedEntity.value?.value ?? Math.round(
  series.value.reduce((sum, item) => sum + (item.values.at(-1) ?? 0), 0) / Math.max(series.value.length, 1),
))

const chartOption = computed<EChartsOption>(() => {
  const dark = standaloneResolvedThemeMode.value === 'dark'
  const text = dark ? '#dceef4' : '#173c4d'
  const muted = dark ? 'rgba(162, 193, 204, 0.72)' : 'rgba(45, 88, 105, 0.72)'
  const grid = dark ? 'rgba(86, 211, 236, 0.10)' : 'rgba(8, 127, 168, 0.12)'
  const colors = {
    stable: dark ? '#24d8ee' : '#087fa8',
    active: dark ? '#2de2b8' : '#008c70',
    watch: dark ? '#ffc45e' : '#b67800',
  }

  return {
    animationDuration: 420,
    animationDurationUpdate: 220,
    aria: {
      enabled: true,
      label: { description: '近七日全国运行态势趋势，包含运行平稳、高负载和待关注三类指数。' },
    },
    color: series.value.map(item => colors[item.status]),
    grid: { top: 14, right: 10, bottom: 24, left: 34, containLabel: false },
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: dark ? 'rgba(7, 27, 42, 0.97)' : 'rgba(250, 253, 254, 0.98)',
      borderColor: dark ? 'rgba(72, 187, 211, 0.34)' : 'rgba(8, 127, 168, 0.26)',
      textStyle: { color: text },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeLabels,
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 20,
      max: 100,
      splitNumber: 4,
      axisLabel: { color: muted, fontSize: 10 },
      splitLine: { lineStyle: { color: grid, type: 'dashed' } },
    },
    series: series.value.map((item) => {
      const emphasized = filterStatus.value === item.status || (!filterStatus.value && selectedStatus.value === item.status)
      const faded = filterStatus.value && filterStatus.value !== item.status
      return {
        name: item.label,
        type: 'line',
        smooth: 0.36,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 7,
        data: item.values,
        lineStyle: {
          color: colors[item.status],
          opacity: faded ? 0.18 : 1,
          shadowBlur: emphasized ? 7 : 2,
          shadowColor: colors[item.status],
          width: emphasized ? 3 : 2,
        },
        areaStyle: {
          color: colors[item.status],
          opacity: faded ? 0.01 : emphasized ? 0.16 : 0.06,
        },
        emphasis: { focus: 'series', lineStyle: { width: 3 } },
      }
    }),
  }
})

function filterByStatus(status: string): void {
  const nextStatus = filterStatus.value === status ? undefined : status
  context.messages.publish({
    topic: cockpitTopics.sceneFilterChange,
    sourceId: context.instanceId,
    payload: { status: nextStatus },
  })
}

const chartEvents = {
  click: (params: unknown): void => {
    const event = params as { seriesName?: string }
    const item = series.value.find(seriesItem => seriesItem.label === event.seriesName)
    if (item)
      filterByStatus(item.status)
  },
}

const unsubscribeFilter = context.messages.subscribe<SceneFilterPayload>(
  cockpitTopics.sceneFilterChange,
  (message) => {
    filterStatus.value = message.payload?.status
  },
)
const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    selectedId.value = message.payload?.ids[0] ?? ''
  },
)

onBeforeUnmount(() => {
  unsubscribeFilter()
  unsubscribeSelection()
})
</script>

<template>
  <div class="trend-panel">
    <WidgetState :loading="loading" :error="error" :empty="series.length === 0" />
    <div v-if="!loading && !error && series.length > 0" class="trend-panel__content">
      <div class="trend-panel__summary">
        <span>{{ selectedName }}运行指数</span>
        <strong>{{ latestIndex }}</strong>
        <em>近 7 日 +2.8%</em>
      </div>
      <LumalCharts
        class="trend-panel__chart"
        :option="chartOption"
        :set-option-options="updateOptions"
        :events="chartEvents"
        aria-label="近七日运行态势趋势图"
      />
      <div class="trend-panel__legend" role="group" aria-label="运行状态筛选">
        <button
          v-for="item in series"
          :key="item.status"
          type="button"
          :class="{
            'is-filtered': filterStatus === item.status,
            'is-contextual': !filterStatus && selectedStatus === item.status,
          }"
          :data-status="item.status"
          :aria-pressed="filterStatus === item.status"
          :aria-current="!filterStatus && selectedStatus === item.status ? 'true' : undefined"
          @click="filterByStatus(item.status)"
        >
          <span />
          {{ item.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trend-panel,
.trend-panel__content {
  height: 100%;
  min-height: 0;
}

.trend-panel__content {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 8px;
}

.trend-panel__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 3px 12px;
  padding: 2px 4px 0;
}

.trend-panel__summary span {
  color: var(--lumal-cockpit-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.trend-panel__summary strong {
  grid-row: 1 / 3;
  grid-column: 2;
  color: var(--lumal-cockpit-title-text);
  font-size: 30px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.trend-panel__summary em {
  color: var(--lumal-cockpit-success);
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
}

.trend-panel__chart {
  width: 100%;
  height: 100%;
  min-height: 116px;
}

.trend-panel__legend {
  display: flex;
  align-items: center;
  gap: 7px;
}

.trend-panel__legend button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 12%);
  border-radius: 9px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 20%);
  color: var(--lumal-cockpit-text-secondary);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.trend-panel__legend span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 7px currentcolor;
}

.trend-panel__legend button[data-status='active'] span {
  background: var(--lumal-cockpit-success);
}

.trend-panel__legend button[data-status='watch'] span {
  background: var(--lumal-cockpit-warning);
}

.trend-panel__legend button:hover {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  color: var(--lumal-cockpit-title-text);
}

.trend-panel__legend button.is-contextual,
.trend-panel__legend button.is-filtered {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 50%);
  background: color-mix(in srgb, var(--lumal-cockpit-selected), transparent 14%);
  color: var(--lumal-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--lumal-cockpit-accent);
}

.trend-panel__legend button:focus-visible {
  outline: 2px solid var(--lumal-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
