<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { LumaCharts } from '@luma/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { getSceneEntity, trendSeries } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'
import { standaloneResolvedThemeMode } from '../../services/preferences'

/***********************运行趋势图（@luma/datav LumaCharts）*********************/

const context = useCockpitContext()
const loading = false
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
  const text = dark ? '#d7eeff' : '#173c4d'
  const muted = dark ? 'rgba(169, 210, 223, 0.72)' : 'rgba(45, 88, 105, 0.72)'
  const grid = dark ? 'rgba(116, 239, 255, 0.12)' : 'rgba(8, 127, 175, 0.14)'
  const colors = {
    stable: dark ? '#20d8ff' : '#087faf',
    active: dark ? '#23df7b' : '#00966d',
    watch: dark ? '#ffc857' : '#b77900',
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
      backgroundColor: dark ? 'rgba(3, 24, 37, 0.96)' : 'rgba(247, 252, 255, 0.98)',
      borderColor: dark ? 'rgba(116, 239, 255, 0.48)' : 'rgba(8, 127, 175, 0.34)',
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
          shadowBlur: emphasized ? 9 : 4,
          shadowColor: colors[item.status],
          width: emphasized ? 3 : 2,
        },
        areaStyle: {
          color: colors[item.status],
          opacity: faded ? 0.01 : emphasized ? 0.18 : 0.07,
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
      <LumaCharts
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
  gap: 6px;
}

.trend-panel__summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 2px 10px;
  padding: 2px 4px 0;
}

.trend-panel__summary span {
  color: var(--luma-cockpit-text-secondary);
  font-size: 12px;
}

.trend-panel__summary strong {
  grid-row: 1 / 3;
  grid-column: 2;
  color: var(--luma-cockpit-title-text);
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: 0 0 12px color-mix(in srgb, var(--luma-cockpit-accent), transparent 52%);
}

.trend-panel__summary em {
  color: var(--luma-cockpit-success);
  font-size: 11px;
  font-style: normal;
}

.trend-panel__chart {
  width: 100%;
  height: 100%;
  min-height: 116px;
}

.trend-panel__legend {
  display: flex;
  gap: 6px;
  align-items: center;
}

.trend-panel__legend button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 44px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 18%);
  border-radius: 2px;
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 24%);
  color: var(--luma-cockpit-text-secondary);
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;
}

.trend-panel__legend span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--luma-cockpit-accent);
  box-shadow: 0 0 8px currentcolor;
}

.trend-panel__legend button[data-status='active'] span {
  background: var(--luma-cockpit-success);
}

.trend-panel__legend button[data-status='watch'] span {
  background: var(--luma-cockpit-warning);
}

.trend-panel__legend button.is-contextual,
.trend-panel__legend button.is-filtered {
  border-color: var(--luma-cockpit-accent);
  background: color-mix(in srgb, var(--luma-cockpit-selected), transparent 12%);
  color: var(--luma-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.trend-panel__legend button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
