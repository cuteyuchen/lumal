<script setup lang="ts">
import type { SceneRegion, SceneStatus } from '../../data/demo-scene'
import type { SceneSelectionPayload } from '../../messages/topics'
import { useCockpitContext } from '@luma/cockpit'
import { LumaScrollRankingBoard } from '@luma/datav'
import { computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import WidgetState from '../../components/WidgetState.vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'

/***********************区域运行指数模块*********************/

const context = useCockpitContext()
const loading = false
const error = ''
const selectedId = ref('')
const root = useTemplateRef<HTMLElement>('root')
const regions = computed(() =>
  [...demoScene.regions]
    .sort((a, b) => b.value - a.value)
    .map(region => ({ ...region, key: region.id, label: region.name })),
)
const statusLabels: Record<SceneStatus, string> = {
  stable: '平稳',
  active: '高载',
  watch: '关注',
}
const activeRegionId = computed(() => {
  const entity = getSceneEntity(selectedId.value)
  return entity?.kind === 'point' ? entity.regionId : entity?.id
})

function regionItem(item: unknown): SceneRegion & { key: string, label: string } {
  return item as SceneRegion & { key: string, label: string }
}

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
  if (!id)
    return
  root.value
    ?.querySelector<HTMLButtonElement>(`button[data-region-id="${id}"]`)
    ?.scrollIntoView({ block: 'nearest' })
})

onBeforeUnmount(unsubscribeSelection)
</script>

<template>
  <div ref="root" class="region-ranking">
    <WidgetState :loading="loading" :error="error" :empty="regions.length === 0" />
    <div v-if="!loading && !error && regions.length > 0" class="region-ranking__table">
      <div class="region-ranking__head" aria-hidden="true">
        <span>排名</span>
        <span>区域</span>
        <span>状态</span>
        <span>指数</span>
      </div>
      <LumaScrollRankingBoard
        class="region-ranking__scroll"
        :items="regions"
        :visible-rows="5"
        :interval="3000"
        aria-label="区域运行指数自动滚动排名"
      >
        <template #default="{ item, index, ratio }">
          <button
            type="button"
            :class="{ 'is-active': activeRegionId === regionItem(item).id, 'is-top': index < 3 }"
            :data-region-id="regionItem(item).id"
            :data-status="regionItem(item).status"
            :aria-pressed="activeRegionId === regionItem(item).id"
            @click="selectRegion(regionItem(item).id)"
          >
            <span class="region-ranking__index">{{ index + 1 }}</span>
            <span class="region-ranking__name">{{ regionItem(item).name }}</span>
            <span class="region-ranking__status">{{ statusLabels[regionItem(item).status] }}</span>
            <span class="region-ranking__value">{{ regionItem(item).value }}</span>
            <span class="region-ranking__bar" aria-hidden="true">
              <span :style="{ width: `${ratio * 100}%` }" />
            </span>
          </button>
        </template>
      </LumaScrollRankingBoard>
    </div>
  </div>
</template>

<style scoped>
.region-ranking,
.region-ranking__table {
  height: 100%;
  min-height: 0;
}

.region-ranking__table {
  display: grid;
  grid-template-rows: 30px minmax(0, 1fr);
  gap: 5px;
}

.region-ranking__head,
.region-ranking__scroll :deep(button) {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 52px 46px;
  align-items: center;
  gap: 7px;
}

.region-ranking__head {
  padding: 0 9px;
  border-bottom: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 42%);
  background: linear-gradient(90deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 88%), transparent);
  color: var(--luma-cockpit-text-muted);
  font-size: 11px;
}

.region-ranking__head span:last-child {
  text-align: right;
}

.region-ranking__scroll {
  min-height: 0;
}

.region-ranking__scroll :deep(button) {
  position: relative;
  width: 100%;
  min-height: 42px;
  padding: 6px 9px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 28%);
  border-radius: 2px;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--luma-cockpit-accent), transparent 93%), transparent 52%),
    color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 22%);
  color: inherit;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease;
}

.region-ranking__scroll :deep(button.is-active) {
  border-color: var(--luma-cockpit-accent);
  background: var(--luma-cockpit-selected);
  box-shadow: inset 3px 0 0 var(--luma-cockpit-accent), 0 0 10px color-mix(in srgb, var(--luma-cockpit-accent), transparent 78%);
}

.region-ranking__scroll :deep(button:focus-visible) {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: -2px;
}

.region-ranking__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-accent), transparent 48%);
  background: color-mix(in srgb, var(--luma-cockpit-selected), transparent 26%);
  color: var(--luma-cockpit-accent);
  font-size: 11px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  transform: skewX(-8deg);
}

.region-ranking__scroll :deep(button.is-top) .region-ranking__index {
  border-color: var(--luma-cockpit-warning);
  color: var(--luma-cockpit-warning);
  box-shadow: 0 0 8px color-mix(in srgb, var(--luma-cockpit-warning), transparent 54%);
}

.region-ranking__name {
  overflow: hidden;
  color: var(--luma-cockpit-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.region-ranking__status {
  color: var(--luma-cockpit-text-secondary);
  font-size: 10px;
  text-align: center;
}

button[data-status='active'] .region-ranking__status {
  color: var(--luma-cockpit-success);
}

button[data-status='watch'] .region-ranking__status {
  color: var(--luma-cockpit-warning);
}

.region-ranking__value {
  color: var(--luma-cockpit-title-text);
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.region-ranking__bar {
  position: absolute;
  right: 9px;
  bottom: 4px;
  left: 50px;
  height: 2px;
  overflow: hidden;
  background: color-mix(in srgb, var(--luma-cockpit-accent), transparent 90%);
}

.region-ranking__bar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--luma-cockpit-accent), transparent);
}
</style>
