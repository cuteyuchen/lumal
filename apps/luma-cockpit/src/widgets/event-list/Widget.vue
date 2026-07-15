<script setup lang="ts">
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { computed, onBeforeUnmount, ref } from 'vue'
import { demoEvents } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************事件列表模块*********************/

const context = useCockpitContext()
const loading = false
const error = ''
const selectedId = ref('')
const events = computed(() => demoEvents)

function focusTarget(id: string): void {
  context.messages.publish({
    topic: id.startsWith('p-') ? cockpitTopics.scenePointFocus : cockpitTopics.sceneRegionFocus,
    sourceId: context.instanceId,
    payload: { id },
  })
}

const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    selectedId.value = message.payload?.ids[0] ?? ''
  },
)

onBeforeUnmount(unsubscribeSelection)
</script>

<template>
  <div class="event-list">
    <div v-if="loading" class="event-list__state" role="status">
      加载中
    </div>
    <div v-else-if="error" class="event-list__state" role="alert">
      {{ error }}
    </div>
    <div v-else-if="events.length === 0" class="event-list__state" role="status">
      暂无数据
    </div>
    <ol v-else class="event-list__items">
      <li v-for="item in events" :key="item.id">
        <button
          type="button"
          :class="{ 'is-active': selectedId === item.targetId }"
          :data-level="item.level"
          :aria-pressed="selectedId === item.targetId"
          @click="focusTarget(item.targetId)"
        >
          <span class="event-list__time">{{ item.time }}</span>
          <span class="event-list__title">{{ item.title }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.event-list {
  height: 100%;
}

.event-list__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: auto;
  list-style: none;
}

.event-list__items button {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.event-list__items button[data-level='warning'] {
  border-color: color-mix(in srgb, var(--luma-cockpit-warning), transparent 58%);
}

.event-list__items button[data-level='success'] {
  border-color: color-mix(in srgb, var(--luma-cockpit-success), transparent 58%);
}

.event-list__items button.is-active {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent);
}

.event-list__time {
  color: var(--luma-cockpit-text-muted);
  font-variant-numeric: tabular-nums;
}

.event-list__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-list__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}
</style>
