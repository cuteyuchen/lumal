<script setup lang="ts">
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { computed, onBeforeUnmount, ref } from 'vue'
import { getSceneEntity, trendSeries } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************趋势模块*********************/

const context = useCockpitContext()
const loading = false
const error = ''
const filterStatus = ref<SceneFilterPayload['status']>()
const selectedId = ref('')
const series = computed(() => trendSeries)
const selectedStatus = computed(() => getSceneEntity(selectedId.value)?.status)

function toPoints(values: number[]): string {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = Math.max(max - min, 1)
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100
      const y = 70 - ((value - min) / span) * 52
      return `${x},${y}`
    })
    .join(' ')
}

function filterByStatus(status: string): void {
  const nextStatus = filterStatus.value === status ? undefined : status
  context.messages.publish({
    topic: cockpitTopics.sceneFilterChange,
    sourceId: context.instanceId,
    payload: { status: nextStatus },
  })
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
    <div v-if="loading" class="trend-panel__state" role="status">
      加载中
    </div>
    <div v-else-if="error" class="trend-panel__state" role="alert">
      {{ error }}
    </div>
    <div v-else-if="series.length === 0" class="trend-panel__state" role="status">
      暂无数据
    </div>
    <div v-else class="trend-panel__content">
      <svg class="trend-panel__chart" viewBox="0 0 100 76" role="img" aria-label="趋势对比">
        <polyline
          v-for="item in series"
          :key="item.status"
          :points="toPoints(item.values)"
          :data-status="item.status"
        />
      </svg>
      <div class="trend-panel__legend" role="list">
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
.trend-panel {
  height: 100%;
}

.trend-panel__content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.trend-panel__chart {
  flex: 1 1 auto;
  width: 100%;
  min-height: 110px;
}

.trend-panel__chart polyline {
  fill: none;
  stroke: var(--luma-cockpit-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.trend-panel__chart polyline[data-status='active'] {
  stroke: var(--luma-cockpit-success);
}

.trend-panel__chart polyline[data-status='watch'] {
  stroke: var(--luma-cockpit-warning);
}

.trend-panel__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.trend-panel__legend button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  cursor: pointer;
}

.trend-panel__legend span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--luma-cockpit-accent);
}

.trend-panel__legend button[data-status='active'] span {
  background: var(--luma-cockpit-success);
}

.trend-panel__legend button[data-status='watch'] span {
  background: var(--luma-cockpit-warning);
}

.trend-panel__legend button.is-contextual {
  border-color: color-mix(in srgb, var(--luma-cockpit-accent), transparent 28%);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.trend-panel__legend button.is-filtered {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.trend-panel__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}
</style>
