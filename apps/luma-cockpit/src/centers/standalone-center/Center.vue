<script setup lang="ts">
import type { CockpitCenterContext } from '@luma/cockpit'
import type { SceneFocusPayload, SceneSelectionPayload } from '../../messages/topics'
import { computed, onBeforeUnmount, ref } from 'vue'
import { demoScene } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************独立应用中性中央组件*********************/
// ECharts 地图组件落地前的场景预览，业务 topic 和数据模型保持一致。

const props = defineProps<{ context: CockpitCenterContext }>()
const context = props.context
const selectedIds = ref<string[]>([])
const focusedId = ref<string>('')

const regions = computed(() => demoScene.regions)
const points = computed(() => demoScene.points)

function polygonPoints(regionId: string): string {
  const feature = demoScene.geoJson.features.find(item => item.properties.id === regionId)
  const geometry = feature?.geometry
  const coordinates = geometry?.type === 'MultiPolygon'
    ? geometry.coordinates[0]?.[0] ?? []
    : geometry?.coordinates[0] ?? []
  return coordinates.map(([x, y]) => `${x},${-y}`).join(' ')
}

function select(id: string): void {
  selectedIds.value = [id]
  focusedId.value = id
  context.messages.publish<SceneSelectionPayload>({
    topic: cockpitTopics.sceneSelectionChange,
    sourceId: context.instanceId,
    payload: { ids: [id] },
  })
}

const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    selectedIds.value = message.payload?.ids ?? []
  },
)

const unsubscribeRegionFocus = context.messages.subscribe<SceneFocusPayload>(
  cockpitTopics.sceneRegionFocus,
  (message) => {
    focusedId.value = message.payload?.id ?? ''
    if (focusedId.value)
      selectedIds.value = [focusedId.value]
  },
)

const unsubscribePointFocus = context.messages.subscribe<SceneFocusPayload>(
  cockpitTopics.scenePointFocus,
  (message) => {
    focusedId.value = message.payload?.id ?? ''
    if (focusedId.value)
      selectedIds.value = [focusedId.value]
  },
)

// 通知模块中央已就绪
context.messages.publish({
  topic: cockpitTopics.centerReady,
  sourceId: context.instanceId,
})

onBeforeUnmount(() => {
  unsubscribeSelection()
  unsubscribeRegionFocus()
  unsubscribePointFocus()
})
</script>

<template>
  <div class="standalone-center">
    <svg class="standalone-center__map" viewBox="-12 -70 136 140" role="img" aria-label="中性场景区域预览">
      <g>
        <g
          v-for="region in regions"
          :key="region.id"
          class="standalone-center__region-button"
          role="button"
          tabindex="0"
          @click="select(region.id)"
          @keydown.enter.prevent="select(region.id)"
          @keydown.space.prevent="select(region.id)"
        >
          <polygon
            class="standalone-center__region"
            :class="{ 'is-active': selectedIds.includes(region.id), 'is-focused': focusedId === region.id }"
            :points="polygonPoints(region.id)"
          />
        </g>
      </g>
      <g>
        <g
          v-for="point in points"
          :key="point.id"
          class="standalone-center__point-button"
          role="button"
          tabindex="0"
          @click="select(point.id)"
          @keydown.enter.prevent="select(point.id)"
          @keydown.space.prevent="select(point.id)"
        >
          <circle
            class="standalone-center__point"
            :class="{ 'is-active': selectedIds.includes(point.id), 'is-focused': focusedId === point.id }"
            :cx="point.coordinate[0]"
            :cy="-point.coordinate[1]"
            r="2.8"
          />
        </g>
      </g>
    </svg>
    <div class="standalone-center__status">
      <span>场景预览</span>
      <strong>{{ focusedId || selectedIds[0] || '未选择' }}</strong>
    </div>
  </div>
</template>

<style scoped>
.standalone-center {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
}

.standalone-center__map {
  width: 100%;
  height: 100%;
}

.standalone-center__region-button,
.standalone-center__point-button {
  color: inherit;
  cursor: pointer;
}

.standalone-center__region-button:focus-visible .standalone-center__region,
.standalone-center__point-button:focus-visible .standalone-center__point {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: 3px;
}

.standalone-center__region {
  fill: color-mix(in srgb, var(--luma-cockpit-accent), transparent 84%);
  stroke: color-mix(in srgb, var(--luma-cockpit-accent), white 18%);
  stroke-width: 1.2;
  transition: fill 160ms ease, stroke 160ms ease;
}

.standalone-center__region.is-active,
.standalone-center__region.is-focused {
  fill: color-mix(in srgb, var(--luma-cockpit-accent), transparent 58%);
  stroke: var(--luma-cockpit-accent);
  stroke-width: 2;
}

.standalone-center__point {
  fill: var(--luma-cockpit-warning);
  stroke: var(--luma-cockpit-title-text);
  stroke-width: 0.8;
}

.standalone-center__point.is-active,
.standalone-center__point.is-focused {
  fill: var(--luma-cockpit-success);
  stroke-width: 1.4;
}

.standalone-center__status {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: var(--luma-cockpit-text-secondary);
}

.standalone-center__status strong {
  color: var(--luma-cockpit-title-text);
  font-weight: 650;
}
</style>
