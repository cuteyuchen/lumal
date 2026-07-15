<script setup lang="ts">
import type { SceneFilterPayload, SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { computed, onBeforeUnmount, ref } from 'vue'
import { getSceneEntity, statusDistribution } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************状态分布模块*********************/

const context = useCockpitContext()
const loading = false
const error = ''
const filterStatus = ref<SceneFilterPayload['status']>()
const selectedId = ref('')
const items = computed(() => statusDistribution)
const selectedStatus = computed(() => getSceneEntity(selectedId.value)?.status)

function filter(status: string): void {
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
  <div class="status-distribution">
    <div v-if="loading" class="status-distribution__state" role="status">
      加载中
    </div>
    <div v-else-if="error" class="status-distribution__state" role="alert">
      {{ error }}
    </div>
    <div v-else-if="items.length === 0" class="status-distribution__state" role="status">
      暂无数据
    </div>
    <div v-else class="status-distribution__items">
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
        <span class="status-distribution__value">{{ item.value }}%</span>
        <span class="status-distribution__label">{{ item.label }}</span>
        <span class="status-distribution__bar"><span :style="{ width: `${item.value}%` }" /></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.status-distribution {
  height: 100%;
}

.status-distribution__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-distribution__items button {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 6px 10px;
  width: 100%;
  min-height: 54px;
  padding: 10px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.status-distribution__value {
  color: var(--luma-cockpit-title-text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.status-distribution__label {
  color: var(--luma-cockpit-text-secondary);
}

.status-distribution__bar {
  grid-column: 1 / -1;
  height: 5px;
  border-radius: 999px;
  background: var(--luma-cockpit-selected);
  overflow: hidden;
}

.status-distribution__bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--luma-cockpit-accent);
}

.status-distribution__items button[data-status='active'] .status-distribution__bar span {
  background: var(--luma-cockpit-success);
}

.status-distribution__items button[data-status='watch'] .status-distribution__bar span {
  background: var(--luma-cockpit-warning);
}

.status-distribution__items button.is-contextual {
  border-color: color-mix(in srgb, var(--luma-cockpit-accent), transparent 28%);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent);
}

.status-distribution__items button.is-filtered {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent);
}

.status-distribution__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}
</style>
