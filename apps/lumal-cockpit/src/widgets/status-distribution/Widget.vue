<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@lumal/cockpit'
import { LumalCharts } from '@lumal/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { useDemoRefresh } from '../../composables/useDemoRefresh'
import { demoScene, getSceneEntity, statusDistribution } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'
import { standaloneResolvedThemeMode } from '../../services/preferences'

/***********************区域状态分布图（@lumal/datav LumalCharts）*********************/
const context = useCockpitContext()
const { loading } = useDemoRefresh()
const error = ''
const filterStatus = ref<SceneFilterPayload['status']>()
const selectedId = ref('')
const updateOptions: SetOptionOpts = { notMerge: false }

const items = computed(() => statusDistribution)
const selectedStatus = computed(() => getSceneEntity(selectedId.value)?.status)
const activeStatus = computed(() => filterStatus.value ?? selectedStatus.value)
const activeCount = computed(() => (
  items.value.find(item => item.status === filterStatus.value)?.count ?? demoScene.regions.length
))
const activeLabel = computed(() => (
  items.value.find(item => item.status === filterStatus.value)?.label ?? '省级区域'
))

const chartOption = computed<EChartsOption>(() => {
  const dark = standaloneResolvedThemeMode.value === 'dark'
  const text = dark ? '#dceef4' : '#173c4d'
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
      label: { description: '全国省级区域运行状态分布环形图，可点击状态筛选中央地图。' },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}<br/>{c} 个区域（{d}%）',
      backgroundColor: dark ? 'rgba(7, 27, 42, 0.97)' : 'rgba(250, 253, 254, 0.98)',
      borderColor: dark ? 'rgba(72, 187, 211, 0.34)' : 'rgba(8, 127, 168, 0.26)',
      textStyle: { color: text },
    },
    series: [
      {
        name: '运行状态',
        type: 'pie',
        radius: ['54%', '76%'],
        center: ['50%', '50%'],
        minAngle: 8,
        selectedMode: 'single',
        selectedOffset: 4,
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: dark ? '#071b2a' : '#edf7fb',
          borderWidth: 3,
          shadowBlur: dark ? 5 : 1,
        },
        label: { show: false },
        emphasis: {
          scaleSize: 4,
          label: { show: false },
        },
        data: items.value.map(item => ({
          name: item.label,
          value: item.count,
          status: item.status,
          selected: activeStatus.value === item.status,
          itemStyle: {
            color: colors[item.status],
            opacity: filterStatus.value && filterStatus.value !== item.status ? 0.22 : 1,
            shadowColor: colors[item.status],
          },
        })),
      },
    ],
  }
})

function filter(status: string): void {
  const nextStatus = filterStatus.value === status ? undefined : status
  context.messages.publish({
    topic: cockpitTopics.sceneFilterChange,
    sourceId: context.instanceId,
    payload: { status: nextStatus },
  })
}

const chartEvents = {
  click: (params: unknown): void => {
    const event = params as { data?: { status?: string } }
    if (event.data?.status)
      filter(event.data.status)
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
  <div class="status-distribution">
    <WidgetState :loading="loading" :error="error" :empty="items.length === 0" />
    <div v-if="!loading && !error && items.length > 0" class="status-distribution__content">
      <div class="status-distribution__chart-wrap">
        <LumalCharts
          class="status-distribution__chart"
          :option="chartOption"
          :set-option-options="updateOptions"
          :events="chartEvents"
          aria-label="区域状态分布环形图"
        />
        <div class="status-distribution__center" aria-hidden="true">
          <strong>{{ activeCount }}</strong>
          <span>{{ activeLabel }}</span>
        </div>
      </div>
      <div class="status-distribution__items" role="group" aria-label="区域状态筛选">
        <button
          v-for="item in items"
          :key="item.status"
          type="button"
          :class="{
            'is-filtered': filterStatus === item.status,
            'is-contextual': !filterStatus && selectedStatus === item.status,
          }"
          :data-status="item.status"
          :aria-pressed="filterStatus === item.status"
          :aria-current="!filterStatus && selectedStatus === item.status ? 'true' : undefined"
          @click="filter(item.status)"
        >
          <span class="status-distribution__marker" />
          <span class="status-distribution__label">{{ item.label }}</span>
          <strong>{{ item.count }}</strong>
          <small>{{ item.value }}%</small>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.status-distribution,
.status-distribution__content {
  height: 100%;
  min-height: 0;
}

.status-distribution__content {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(120px, 0.92fr);
  align-items: center;
  gap: 10px;
}

.status-distribution__chart-wrap {
  position: relative;
  height: 100%;
  min-height: 150px;
}

.status-distribution__chart {
  width: 100%;
  height: 100%;
}

.status-distribution__center {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  gap: 3px;
  width: 78px;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.status-distribution__center strong {
  color: var(--lumal-cockpit-title-text);
  font-size: 29px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.status-distribution__center span {
  overflow: hidden;
  color: var(--lumal-cockpit-text-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-distribution__items {
  display: grid;
  gap: 8px;
}

.status-distribution__items button {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px 8px;
  min-height: 48px;
  padding: 7px 9px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 12%);
  border-radius: 9px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 20%);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.status-distribution__items button:hover {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  transform: translateX(1px);
}

.status-distribution__marker {
  grid-row: 1 / 3;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 7px var(--lumal-cockpit-accent);
}

.status-distribution__items button[data-status='active'] .status-distribution__marker {
  background: var(--lumal-cockpit-success);
  box-shadow: 0 0 7px var(--lumal-cockpit-success);
}

.status-distribution__items button[data-status='watch'] .status-distribution__marker {
  background: var(--lumal-cockpit-warning);
  box-shadow: 0 0 7px var(--lumal-cockpit-warning);
}

.status-distribution__label {
  overflow: hidden;
  color: var(--lumal-cockpit-text-secondary);
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-distribution__items strong {
  color: var(--lumal-cockpit-title-text);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.status-distribution__items small {
  grid-column: 2 / 4;
  color: var(--lumal-cockpit-text-muted);
  font-size: 10px;
}

.status-distribution__items button.is-contextual,
.status-distribution__items button.is-filtered {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 50%);
  background: color-mix(in srgb, var(--lumal-cockpit-selected), transparent 14%);
  box-shadow: inset 3px 0 0 var(--lumal-cockpit-accent);
}

.status-distribution__items button:focus-visible {
  outline: 2px solid var(--lumal-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
