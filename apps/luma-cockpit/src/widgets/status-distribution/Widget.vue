<script setup lang="ts">
import type { EChartsOption, SetOptionOpts } from 'echarts'
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { LumaCharts } from '@luma/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { demoScene, getSceneEntity, statusDistribution } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'
import { standaloneResolvedThemeMode } from '../../services/preferences'

/***********************区域状态分布图（@luma/datav LumaCharts）*********************/

const context = useCockpitContext()
const loading = false
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
  const text = dark ? '#d7eeff' : '#173c4d'
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
      label: { description: '全国省级区域运行状态分布环形图，可点击状态筛选中央地图。' },
    },
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}<br/>{c} 个区域（{d}%）',
      backgroundColor: dark ? 'rgba(3, 24, 37, 0.96)' : 'rgba(247, 252, 255, 0.98)',
      borderColor: dark ? 'rgba(116, 239, 255, 0.48)' : 'rgba(8, 127, 175, 0.34)',
      textStyle: { color: text },
    },
    series: [
      {
        name: '运行状态',
        type: 'pie',
        radius: ['53%', '76%'],
        center: ['50%', '50%'],
        minAngle: 8,
        selectedMode: 'single',
        selectedOffset: 5,
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: dark ? '#052234' : '#edf7fb',
          borderWidth: 3,
          shadowBlur: dark ? 8 : 2,
        },
        label: { show: false },
        emphasis: {
          scaleSize: 5,
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
        <LumaCharts
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
  grid-template-columns: minmax(0, 1.15fr) minmax(116px, 0.85fr);
  gap: 8px;
  align-items: center;
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
  gap: 2px;
  width: 76px;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.status-distribution__center strong {
  color: var(--luma-cockpit-title-text);
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-shadow: 0 0 12px color-mix(in srgb, var(--luma-cockpit-accent), transparent 48%);
}

.status-distribution__center span {
  overflow: hidden;
  color: var(--luma-cockpit-text-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-distribution__items {
  display: grid;
  gap: 7px;
}

.status-distribution__items button {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 3px 7px;
  min-height: 46px;
  padding: 6px 8px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 18%);
  border-radius: 2px;
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 24%);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
}

.status-distribution__marker {
  grid-row: 1 / 3;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--luma-cockpit-accent);
  box-shadow: 0 0 8px var(--luma-cockpit-accent);
}

.status-distribution__items button[data-status='active'] .status-distribution__marker {
  background: var(--luma-cockpit-success);
  box-shadow: 0 0 8px var(--luma-cockpit-success);
}

.status-distribution__items button[data-status='watch'] .status-distribution__marker {
  background: var(--luma-cockpit-warning);
  box-shadow: 0 0 8px var(--luma-cockpit-warning);
}

.status-distribution__label {
  overflow: hidden;
  color: var(--luma-cockpit-text-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-distribution__items strong {
  color: var(--luma-cockpit-title-text);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.status-distribution__items small {
  grid-column: 2 / 4;
  color: var(--luma-cockpit-text-muted);
  font-size: 10px;
}

.status-distribution__items button.is-contextual,
.status-distribution__items button.is-filtered {
  border-color: var(--luma-cockpit-accent);
  background: color-mix(in srgb, var(--luma-cockpit-selected), transparent 12%);
  box-shadow: inset 2px 0 0 var(--luma-cockpit-accent);
}

.status-distribution__items button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 2px;
}
</style>
