<script setup lang="ts">
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************区域排名模块*********************/

const context = useCockpitContext()
const loading = false
const error = ''
const selectedId = ref('')
const regionButtons = useTemplateRef<HTMLButtonElement[]>('regionButtons')
const regions = computed(() =>
  [...demoScene.regions].sort((a, b) => b.value - a.value),
)
const activeRegionId = computed(() => {
  const entity = getSceneEntity(selectedId.value)
  return entity?.kind === 'point' ? entity.regionId : entity?.id
})

function selectRegion(id: string): void {
  context.messages.publish({
    topic: cockpitTopics.sceneRegionFocus,
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

watch(activeRegionId, async (id) => {
  await nextTick()
  regionButtons.value
    ?.find(button => button.dataset.regionId === id)
    ?.scrollIntoView({ block: 'nearest' })
})

onBeforeUnmount(unsubscribeSelection)
</script>

<template>
  <div class="region-ranking">
    <div v-if="loading" class="region-ranking__state" role="status">
      加载中
    </div>
    <div v-else-if="error" class="region-ranking__state" role="alert">
      {{ error }}
    </div>
    <div v-else-if="regions.length === 0" class="region-ranking__state" role="status">
      暂无数据
    </div>
    <ol v-else class="region-ranking__items">
      <li v-for="(item, index) in regions" :key="item.id">
        <button
          ref="regionButtons"
          type="button"
          :class="{ 'is-active': activeRegionId === item.id }"
          :data-region-id="item.id"
          :aria-pressed="activeRegionId === item.id"
          @click="selectRegion(item.id)"
        >
          <span class="region-ranking__index">{{ index + 1 }}</span>
          <span class="region-ranking__name">{{ item.name }}</span>
          <span class="region-ranking__value">{{ item.value }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.region-ranking {
  height: 100%;
}

.region-ranking__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: auto;
  list-style: none;
}

.region-ranking__items button {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid var(--luma-cockpit-border);
  border-radius: var(--luma-cockpit-radius);
  background: var(--luma-cockpit-floating-bg);
  color: inherit;
  cursor: pointer;
}

.region-ranking__items button.is-active {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent);
}

.region-ranking__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: var(--luma-cockpit-selected);
  color: var(--luma-cockpit-accent);
  font-size: 12px;
  font-weight: 700;
}

.region-ranking__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.region-ranking__value {
  color: var(--luma-cockpit-title-text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.region-ranking__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}
</style>
