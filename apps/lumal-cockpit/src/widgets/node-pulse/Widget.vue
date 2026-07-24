<script setup lang="ts">
import type { DataValueItem, DataValueKey } from '@lumal/datav'
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@lumal/cockpit'
import { LumalActiveRingChart, LumalDecoration, LumalDigitalFlop } from '@lumal/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************重点节点脉冲（地图联动）*********************/
const context = useCockpitContext()
const statusColors = {
  active: '#2de2b8',
  stable: '#24d8ee',
  watch: '#ffc45e',
} as const
const statusLabels = {
  active: '高负载',
  stable: '运行平稳',
  watch: '待关注',
} as const
const scanColors = ['var(--lumal-cockpit-accent)', 'var(--lumal-cockpit-success)'] as const

const nodeItems = computed<DataValueItem[]>(() => [...demoScene.points]
  .sort((left, right) => right.value - left.value)
  .slice(0, 6)
  .map(point => ({
    key: point.id,
    label: point.name,
    value: point.value,
    color: statusColors[point.status],
  })))

const activeKey = ref<DataValueKey>(nodeItems.value[0]?.key ?? '')
const activePoint = computed(() => (
  demoScene.points.find(point => point.id === activeKey.value)
  ?? demoScene.points[0]
))
const activeRank = computed(() => nodeItems.value.findIndex(item => item.key === activeKey.value) + 1)
const ringConfig = {
  activeRadius: '62%',
  activeTimeGap: 3200,
  digitalFlopStyle: { fill: '#eefbff', fontSize: 24 },
  lineWidth: 13,
  radius: '51%',
  showOriginValue: true,
} as const

function focusPoint(id: string): void {
  activeKey.value = id
  context.messages.publish({
    topic: cockpitTopics.scenePointFocus,
    sourceId: context.instanceId,
    payload: { id },
  })
}

function handleRingSelect(item: DataValueItem): void {
  focusPoint(String(item.key))
}

const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    const entity = getSceneEntity(message.payload?.ids[0])
    if (!entity)
      return
    const point = entity.kind === 'point'
      ? entity
      : demoScene.points.find(item => item.regionId === entity.id)
    if (point)
      activeKey.value = point.id
  },
)

onBeforeUnmount(unsubscribeSelection)
</script>

<template>
  <div class="node-pulse">
    <LumalDecoration
      class="node-pulse__scan"
      :variant="2"
      :colors="scanColors"
      :duration="5200"
    />

    <div class="node-pulse__visual">
      <LumalActiveRingChart
        v-model:active-key="activeKey"
        :items="nodeItems"
        :config="ringConfig"
        :interval="3200"
        aria-label="重点节点运行指数轮播"
        @select="handleRingSelect"
      />
      <div class="node-pulse__rank" aria-hidden="true">
        TOP {{ String(activeRank).padStart(2, '0') }}
      </div>
    </div>

    <div v-if="activePoint" class="node-pulse__detail">
      <header>
        <div>
          <span>当前焦点节点</span>
          <strong>{{ activePoint.name }}</strong>
        </div>
        <em :data-status="activePoint.status">{{ statusLabels[activePoint.status] }}</em>
      </header>

      <div class="node-pulse__score">
        <LumalDigitalFlop :value="activePoint.value" :duration="420" />
        <span>运行指数</span>
      </div>

      <div class="node-pulse__list" role="listbox" aria-label="重点节点列表">
        <button
          v-for="item in nodeItems.slice(0, 4)"
          :key="item.key"
          type="button"
          :class="{ 'is-active': activeKey === item.key }"
          :aria-selected="activeKey === item.key"
          @click="focusPoint(String(item.key))"
        >
          <i :style="{ background: item.color }" />
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-pulse {
  position: relative;
  display: grid;
  grid-template-columns: minmax(142px, 0.86fr) minmax(150px, 1.14fr);
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.node-pulse__scan {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
  height: 8px;
  opacity: 0.42;
  pointer-events: none;
}

.node-pulse__visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 12%);
  border-radius: 12px;
  background:
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--lumal-cockpit-accent), transparent 91%), transparent 64%),
    color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 14%);
  overflow: hidden;
}

.node-pulse__visual :deep(.dv-active-ring-chart) {
  padding: 6px;
}

.node-pulse__visual :deep(.active-ring-name) {
  color: var(--lumal-cockpit-text-secondary);
  font-size: 11px !important;
}

.node-pulse__rank {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 4px 7px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-accent), transparent 66%);
  border-radius: 999px;
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 94%);
  color: var(--lumal-cockpit-accent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.node-pulse__detail {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 9px;
  min-width: 0;
  min-height: 0;
}

.node-pulse__detail header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 2px 0;
}

.node-pulse__detail header > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.node-pulse__detail header span {
  color: var(--lumal-cockpit-text-muted);
  font-size: 10px;
}

.node-pulse__detail header strong {
  overflow: hidden;
  color: var(--lumal-cockpit-title-text);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-pulse__detail header em {
  flex: none;
  padding: 4px 7px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  border-radius: 999px;
  color: var(--lumal-cockpit-accent);
  font-size: 9px;
  font-style: normal;
}

.node-pulse__detail header em[data-status='active'] {
  border-color: color-mix(in srgb, var(--lumal-cockpit-success), transparent 58%);
  color: var(--lumal-cockpit-success);
}

.node-pulse__detail header em[data-status='watch'] {
  border-color: color-mix(in srgb, var(--lumal-cockpit-warning), transparent 58%);
  color: var(--lumal-cockpit-warning);
}

.node-pulse__score {
  display: flex;
  align-items: end;
  gap: 8px;
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 22%);
  border-radius: 10px;
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 96%);
}

.node-pulse__score :deep(.lumal-digital-flop) {
  width: 58px;
  height: 28px;
  color: var(--lumal-cockpit-accent);
}

.node-pulse__score span {
  padding-bottom: 3px;
  color: var(--lumal-cockpit-text-muted);
  font-size: 10px;
}

.node-pulse__list {
  display: grid;
  gap: 6px;
  min-height: 0;
  overflow: auto;
}

.node-pulse__list button {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 5px 9px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 20%);
  border-radius: 9px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 22%);
  color: var(--lumal-cockpit-text-secondary);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.node-pulse__list button:hover {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 52%);
  transform: translateX(1px);
}

.node-pulse__list button.is-active {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 44%);
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 92%);
  color: var(--lumal-cockpit-title-text);
  box-shadow: inset 2px 0 0 var(--lumal-cockpit-accent);
}

.node-pulse__list i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  box-shadow: 0 0 7px currentcolor;
}

.node-pulse__list span {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-pulse__list strong {
  color: var(--lumal-cockpit-title-text);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .node-pulse__list button {
    transition: none;
  }
}
</style>
