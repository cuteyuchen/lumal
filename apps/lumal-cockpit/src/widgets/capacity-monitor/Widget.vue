<script setup lang="ts">
import type { DataValueItem } from '@lumal/datav'
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@lumal/cockpit'
import { LumalCapsuleChart, LumalDecoration, LumalDigitalFlop, LumalWaterLevelPond } from '@lumal/datav'
import { computed, onBeforeUnmount, ref } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************区域容量态势（地图联动）*********************/
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

const regions = computed(() => [...demoScene.regions]
  .sort((left, right) => right.value - left.value)
  .slice(0, 6))
const regionItems = computed<DataValueItem[]>(() => regions.value.map(region => ({
  key: region.id,
  label: region.name,
  value: region.value,
  color: statusColors[region.status],
})))
const activeRegionId = ref(regions.value[0]?.id ?? '')
const activeRegion = computed(() => (
  demoScene.regions.find(region => region.id === activeRegionId.value)
  ?? regions.value[0]
))
const selectedPointCount = computed(() => (
  activeRegion.value
    ? demoScene.points.filter(point => point.regionId === activeRegion.value?.id).length
    : 0
))
const waterColors = computed(() => {
  const color = activeRegion.value ? statusColors[activeRegion.value.status] : '#24d8ee'
  return [color, '#24d8ee'] as const
})

function focusRegion(id: string): void {
  activeRegionId.value = id
  context.messages.publish({
    topic: cockpitTopics.sceneRegionFocus,
    sourceId: context.instanceId,
    payload: { id },
  })
}

const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    const entity = getSceneEntity(message.payload?.ids[0])
    if (!entity)
      return
    activeRegionId.value = entity.kind === 'point' ? entity.regionId : entity.id
  },
)

onBeforeUnmount(unsubscribeSelection)
</script>

<template>
  <div class="capacity-monitor">
    <LumalDecoration
      class="capacity-monitor__scan"
      :variant="2"
      :colors="['var(--lumal-cockpit-success)', 'var(--lumal-cockpit-accent)']"
      :duration="5600"
    />

    <section v-if="activeRegion" class="capacity-monitor__focus">
      <div class="capacity-monitor__pond">
        <LumalWaterLevelPond
          :value="activeRegion.value"
          shape="round"
          :colors="waterColors"
          :wave-count="3"
          :wave-height="22"
          :wave-opacity="0.34"
          :duration="5200"
          :formatter="value => `${value}%`"
        />
      </div>
      <div class="capacity-monitor__focus-copy">
        <span>当前区域容量</span>
        <strong>{{ activeRegion.name }}</strong>
        <em :data-status="activeRegion.status">{{ statusLabels[activeRegion.status] }}</em>
        <div>
          <LumalDigitalFlop :value="activeRegion.value" :duration="420" />
          <small>综合利用率</small>
        </div>
        <p>关联节点 {{ selectedPointCount }} 个 · 点击排行可聚焦地图</p>
      </div>
    </section>

    <section class="capacity-monitor__distribution">
      <header>
        <span>区域容量排行</span>
        <small>TOP 6</small>
      </header>
      <LumalCapsuleChart
        class="capacity-monitor__capsule"
        :items="regionItems"
        :max="100"
        :show-value="true"
        unit="%"
        aria-label="区域容量利用率排行"
      />
    </section>

    <div class="capacity-monitor__regions" role="listbox" aria-label="区域容量选择">
      <button
        v-for="region in regions.slice(0, 4)"
        :key="region.id"
        type="button"
        :class="{ 'is-active': activeRegionId === region.id }"
        :aria-selected="activeRegionId === region.id"
        @click="focusRegion(region.id)"
      >
        <span>{{ region.name }}</span>
        <i :data-status="region.status" />
        <strong>{{ region.value }}%</strong>
      </button>
    </div>
  </div>
</template>

<style scoped>
.capacity-monitor {
  position: relative;
  display: grid;
  grid-template-columns: minmax(152px, 0.86fr) minmax(170px, 1.14fr);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px 12px;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.capacity-monitor__scan {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
  height: 8px;
  opacity: 0.42;
  pointer-events: none;
}

.capacity-monitor__focus,
.capacity-monitor__distribution {
  min-width: 0;
  min-height: 0;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 14%);
  border-radius: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--lumal-cockpit-accent), transparent 97%), transparent),
    color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 16%);
  overflow: hidden;
}

.capacity-monitor__focus {
  display: grid;
  grid-template-columns: minmax(90px, 0.9fr) minmax(82px, 1.1fr);
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.capacity-monitor__pond {
  width: 100%;
  aspect-ratio: 1;
  min-height: 96px;
}

.capacity-monitor__pond :deep(.lumal-water-level-pond) {
  width: 100%;
  height: 100%;
}

.capacity-monitor__focus-copy {
  display: grid;
  align-content: center;
  gap: 5px;
  min-width: 0;
}

.capacity-monitor__focus-copy > span {
  color: var(--lumal-cockpit-text-muted);
  font-size: 10px;
}

.capacity-monitor__focus-copy > strong {
  overflow: hidden;
  color: var(--lumal-cockpit-title-text);
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capacity-monitor__focus-copy > em {
  width: max-content;
  padding: 3px 7px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-accent), transparent 58%);
  border-radius: 999px;
  color: var(--lumal-cockpit-accent);
  font-size: 9px;
  font-style: normal;
}

.capacity-monitor__focus-copy > em[data-status='active'] {
  border-color: color-mix(in srgb, var(--lumal-cockpit-success), transparent 58%);
  color: var(--lumal-cockpit-success);
}

.capacity-monitor__focus-copy > em[data-status='watch'] {
  border-color: color-mix(in srgb, var(--lumal-cockpit-warning), transparent 58%);
  color: var(--lumal-cockpit-warning);
}

.capacity-monitor__focus-copy > div {
  display: flex;
  align-items: end;
  gap: 7px;
  margin-top: 2px;
}

.capacity-monitor__focus-copy :deep(.lumal-digital-flop) {
  width: 52px;
  height: 28px;
}

.capacity-monitor__focus-copy small,
.capacity-monitor__focus-copy p {
  color: var(--lumal-cockpit-text-muted);
  font-size: 9px;
}

.capacity-monitor__focus-copy small {
  padding-bottom: 3px;
}

.capacity-monitor__focus-copy p {
  margin: 0;
  line-height: 1.5;
}

.capacity-monitor__distribution {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  padding: 8px 10px 6px;
}

.capacity-monitor__distribution header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px 4px;
}

.capacity-monitor__distribution header span {
  color: var(--lumal-cockpit-text-secondary);
  font-size: 11px;
  font-weight: 650;
}

.capacity-monitor__distribution header small {
  color: var(--lumal-cockpit-accent);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.capacity-monitor__capsule {
  width: 100%;
  height: 100%;
  min-height: 118px;
}

.capacity-monitor__capsule :deep(.dv-capsule-chart) {
  width: 100%;
  height: 100%;
  padding: 4px 0 0;
  color: var(--lumal-cockpit-text-secondary);
}

.capacity-monitor__capsule :deep(.label-column) {
  font-size: 9px;
}

.capacity-monitor__capsule :deep(.label-column div),
.capacity-monitor__capsule :deep(.unit-label) {
  height: 17px;
  color: var(--lumal-cockpit-text-muted);
  font-size: 8px;
  line-height: 17px;
}

.capacity-monitor__capsule :deep(.capsule-item) {
  height: 8px;
  margin: 4px 0;
  box-shadow: none;
  background: color-mix(in srgb, var(--lumal-cockpit-border), transparent 72%);
}

.capacity-monitor__capsule :deep(.capsule-item-column) {
  height: 6px;
}

.capacity-monitor__capsule :deep(.capsule-item-value) {
  color: var(--lumal-cockpit-title-text);
  font-size: 8px;
}

.capacity-monitor__regions {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
}

.capacity-monitor__regions button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 7px auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
  min-height: 34px;
  padding: 5px 8px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 18%);
  border-radius: 9px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 20%);
  color: var(--lumal-cockpit-text-secondary);
  cursor: pointer;
  transition: border-color 160ms ease, background-color 160ms ease, transform 160ms ease;
}

.capacity-monitor__regions button:hover {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 52%);
  transform: translateY(-1px);
}

.capacity-monitor__regions button.is-active {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 44%);
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 92%);
  box-shadow: inset 0 -2px 0 var(--lumal-cockpit-accent);
}

.capacity-monitor__regions span {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.capacity-monitor__regions i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 7px color-mix(in srgb, var(--lumal-cockpit-accent), transparent 24%);
}

.capacity-monitor__regions i[data-status='active'] {
  background: var(--lumal-cockpit-success);
  box-shadow: 0 0 7px color-mix(in srgb, var(--lumal-cockpit-success), transparent 24%);
}

.capacity-monitor__regions i[data-status='watch'] {
  background: var(--lumal-cockpit-warning);
  box-shadow: 0 0 7px color-mix(in srgb, var(--lumal-cockpit-warning), transparent 24%);
}

.capacity-monitor__regions strong {
  color: var(--lumal-cockpit-title-text);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .capacity-monitor__regions button {
    transition: none;
  }
}
</style>
