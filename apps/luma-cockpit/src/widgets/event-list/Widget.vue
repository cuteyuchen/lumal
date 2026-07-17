<script setup lang="ts">
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { LumaScrollBoard } from '@luma/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { demoEvents } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************实时告警动态模块*********************/

type DemoEvent = typeof demoEvents[number]

const context = useCockpitContext()
const loading = false
const error = ''
const selectedId = ref('')
const events = computed(() => demoEvents)
const levelLabels: Record<string, string> = {
  danger: '告警',
  warning: '关注',
  success: '恢复',
  info: '信息',
}

function eventItem(item: unknown): DemoEvent {
  return item as DemoEvent
}

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
    <WidgetState :loading="loading" :error="error" :empty="events.length === 0" />
    <div v-if="!loading && !error && events.length > 0" class="event-list__table">
      <div class="event-list__head" aria-hidden="true">
        <span>时间</span>
        <span>等级</span>
        <span>运行动态</span>
      </div>
      <LumaScrollBoard
        class="event-list__scroll"
        :rows="events"
        row-key="id"
        :visible-rows="4"
        :interval="2600"
        aria-label="实时告警动态自动滚动列表"
      >
        <template #default="{ row }">
          <button
            type="button"
            class="event-list__row"
            :class="{ 'is-active': selectedId === eventItem(row).targetId }"
            :data-level="eventItem(row).level"
            :aria-pressed="selectedId === eventItem(row).targetId"
            @click.stop="focusTarget(eventItem(row).targetId)"
          >
            <span class="event-list__time">{{ eventItem(row).time }}</span>
            <span class="event-list__level">{{ levelLabels[eventItem(row).level] ?? '信息' }}</span>
            <span class="event-list__title">{{ eventItem(row).title }}</span>
            <span v-if="selectedId === eventItem(row).targetId" class="event-list__sr-only">当前选中</span>
          </button>
        </template>
      </LumaScrollBoard>
    </div>
  </div>
</template>

<style scoped>
.event-list,
.event-list__table {
  height: 100%;
  min-height: 0;
}

.event-list__table {
  display: grid;
  grid-template-rows: 30px minmax(0, 1fr);
  gap: 5px;
}

.event-list__head,
.event-list__row {
  display: grid;
  grid-template-columns: 52px 50px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
}

.event-list__head {
  padding: 0 9px;
  border-bottom: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 42%);
  background: linear-gradient(90deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 88%), transparent);
  color: var(--luma-cockpit-text-muted);
  font-size: 11px;
}

.event-list__scroll {
  min-height: 0;
}

.event-list__scroll :deep(.luma-scroll-board__row) {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
}

.event-list__row {
  position: relative;
  width: 100%;
  min-height: 42px;
  padding: 6px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 28%);
  border-radius: 2px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 92%), transparent 48%),
    color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 22%);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
}

.event-list__row:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: -2px;
}

.event-list__row::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--luma-cockpit-accent);
  opacity: 0.36;
  content: '';
}

.event-list__row[data-level='danger'] {
  border-color: color-mix(in srgb, var(--luma-cockpit-danger), transparent 52%);
}

.event-list__row[data-level='warning'] {
  border-color: color-mix(in srgb, var(--luma-cockpit-warning), transparent 58%);
}

.event-list__row[data-level='success'] {
  border-color: color-mix(in srgb, var(--luma-cockpit-success), transparent 62%);
}

.event-list__row.is-active {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent), 0 0 10px color-mix(in srgb, var(--luma-cockpit-accent), transparent 78%);
}

.event-list__time {
  color: var(--luma-cockpit-text-muted);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.event-list__level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-accent), transparent 46%);
  color: var(--luma-cockpit-accent);
  font-size: 10px;
}

.event-list__row[data-level='danger'] .event-list__level {
  border-color: color-mix(in srgb, var(--luma-cockpit-danger), transparent 36%);
  color: var(--luma-cockpit-danger);
}

.event-list__row[data-level='warning'] .event-list__level {
  border-color: color-mix(in srgb, var(--luma-cockpit-warning), transparent 36%);
  color: var(--luma-cockpit-warning);
}

.event-list__row[data-level='success'] .event-list__level {
  border-color: color-mix(in srgb, var(--luma-cockpit-success), transparent 36%);
  color: var(--luma-cockpit-success);
}

.event-list__title {
  overflow: hidden;
  color: var(--luma-cockpit-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-list__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
