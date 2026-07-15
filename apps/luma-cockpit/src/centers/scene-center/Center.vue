<script setup lang="ts">
import type { CockpitCenterContext } from '@luma/cockpit'
import type { Component } from 'vue'
import type { SceneFilterPayload, SceneFocusPayload, SceneSelectionPayload } from '../../messages/topics'
import type { CenterEngine, CenterTheme } from '../types'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { demoScene, getSceneEntity } from '../../data/demo-scene'
import { cockpitTopics } from '../../messages/topics'
import EchartsGeoCenter from '../echarts-geo-center/Center.vue'

/***********************中央地图引擎编排*********************/

const props = defineProps<{ context: CockpitCenterContext }>()
const context = props.context
const OpenLayersCenter = defineAsyncComponent(() => import('../openlayers-center/Center.vue'))
const CesiumCenter = defineAsyncComponent(() => import('../cesium-center/Center.vue'))

const engines: Array<{ id: CenterEngine, label: string }> = [
  { id: 'echarts', label: 'ECharts' },
  { id: 'openlayers', label: 'OpenLayers' },
  { id: 'cesium', label: 'Cesium' },
]

const renderers: Record<CenterEngine, Component> = {
  echarts: EchartsGeoCenter,
  openlayers: OpenLayersCenter,
  cesium: CesiumCenter,
}

const activeEngine = ref<CenterEngine>('echarts')
const engineSwitchRef = useTemplateRef<HTMLDivElement>('engineSwitchRef')
const selectedIds = ref<string[]>([...demoScene.selectedIds])
const focusedId = ref('')
const filterStatus = ref<SceneFilterPayload['status']>()
const theme = shallowRef<CenterTheme>('dark')
const reducedMotion = ref(false)

const activeRenderer = computed(() => renderers[activeEngine.value])
const activeEntity = computed(() => getSceneEntity(focusedId.value || selectedIds.value[0]))
const statusLabels = {
  active: '活跃',
  stable: '稳定',
  watch: '观察',
} as const

function syncTheme(): void {
  theme.value = document.documentElement.dataset.lumaTheme === 'light' ? 'light' : 'dark'
}

function publishSelection(ids: string[]): void {
  selectedIds.value = ids
  focusedId.value = ids[0] ?? ''
  context.messages.publish<SceneSelectionPayload>({
    topic: cockpitTopics.sceneSelectionChange,
    sourceId: context.instanceId,
    payload: { ids },
  })
}

function selectEngine(engine: CenterEngine): void {
  activeEngine.value = engine
}

function handleEngineKeydown(event: KeyboardEvent, index: number): void {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key))
    return
  event.preventDefault()
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? engines.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + engines.length) % engines.length
  activeEngine.value = engines[nextIndex].id
  void nextTick(() => {
    requestAnimationFrame(() => {
      engineSwitchRef.value
        ?.querySelector<HTMLButtonElement>(`button[data-center-engine="${activeEngine.value}"]`)
        ?.focus()
    })
  })
}

const unsubscribeSelection = context.messages.subscribe<SceneSelectionPayload>(
  cockpitTopics.sceneSelectionChange,
  (message) => {
    selectedIds.value = message.payload?.ids ?? []
    focusedId.value = selectedIds.value[0] ?? ''
  },
)

const unsubscribeRegionFocus = context.messages.subscribe<SceneFocusPayload>(
  cockpitTopics.sceneRegionFocus,
  (message) => {
    const id = message.payload?.id ?? ''
    if (id)
      publishSelection([id])
  },
)

const unsubscribePointFocus = context.messages.subscribe<SceneFocusPayload>(
  cockpitTopics.scenePointFocus,
  (message) => {
    const id = message.payload?.id ?? ''
    if (id)
      publishSelection([id])
  },
)

const unsubscribeFilter = context.messages.subscribe<SceneFilterPayload>(
  cockpitTopics.sceneFilterChange,
  (message) => {
    filterStatus.value = message.payload?.status
  },
)

let themeObserver: MutationObserver | undefined
let motionMedia: MediaQueryList | undefined
let syncMotion: ((event: MediaQueryListEvent) => void) | undefined

onMounted(() => {
  syncTheme()
  themeObserver = new MutationObserver(syncTheme)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-luma-theme'],
  })

  motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionMedia.matches
  syncMotion = event => reducedMotion.value = event.matches
  motionMedia.addEventListener('change', syncMotion)

  context.messages.publish({
    topic: cockpitTopics.centerReady,
    sourceId: context.instanceId,
  })
})

onBeforeUnmount(() => {
  unsubscribeSelection()
  unsubscribeRegionFocus()
  unsubscribePointFocus()
  unsubscribeFilter()
  themeObserver?.disconnect()
  if (motionMedia && syncMotion)
    motionMedia.removeEventListener('change', syncMotion)
})
</script>

<template>
  <section class="scene-center" :data-center-engine="activeEngine">
    <Suspense>
      <component
        :is="activeRenderer"
        :selected-ids="selectedIds"
        :focused-id="focusedId"
        :filter-status="filterStatus"
        :theme="theme"
        :reduced-motion="reducedMotion"
        @select="publishSelection([$event])"
      />
      <template #fallback>
        <div class="scene-center__loading" role="status">
          地图载入中
        </div>
      </template>
    </Suspense>

    <div ref="engineSwitchRef" class="scene-center__engine-switch" role="tablist" aria-label="地图引擎">
      <button
        v-for="(engine, index) in engines"
        :key="engine.id"
        type="button"
        role="tab"
        :class="{ 'is-active': activeEngine === engine.id }"
        :aria-selected="activeEngine === engine.id"
        :tabindex="activeEngine === engine.id ? 0 : -1"
        :data-center-engine="engine.id"
        @click="selectEngine(engine.id)"
        @keydown="handleEngineKeydown($event, index)"
      >
        {{ engine.label }}
      </button>
    </div>

    <div class="scene-center__status" aria-live="polite">
      <span class="scene-center__status-dot" :data-status="activeEntity?.status ?? 'stable'" />
      <span>{{ activeEntity ? statusLabels[activeEntity.status] : '全国态势' }}</span>
      <strong>{{ activeEntity?.name ?? '实时运行中' }}</strong>
      <span v-if="activeEntity" class="scene-center__status-value">{{ activeEntity.value }}</span>
    </div>
  </section>
</template>

<style scoped>
.scene-center {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--luma-cockpit-bg), #020817 28%);
}

.scene-center__loading {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--luma-cockpit-text-secondary);
}

.scene-center__engine-switch {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(3, 112px);
  min-height: 44px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 12%);
  border-radius: var(--luma-cockpit-radius);
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 6%);
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
  backdrop-filter: blur(8px);
}

.scene-center__engine-switch button {
  min-width: 0;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 2px;
  background: transparent;
  color: var(--luma-cockpit-text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}

.scene-center__engine-switch button:hover {
  color: var(--luma-cockpit-title-text);
  background: color-mix(in srgb, var(--luma-cockpit-accent), transparent 90%);
}

.scene-center__engine-switch button.is-active {
  background: color-mix(in srgb, var(--luma-cockpit-selected), var(--luma-cockpit-floating-bg) 42%);
  color: var(--luma-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--luma-cockpit-accent);
}

.scene-center__engine-switch button:focus-visible {
  outline: 2px solid var(--luma-cockpit-focus-ring);
  outline-offset: -2px;
}

.scene-center__status {
  position: absolute;
  bottom: 16px;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: 8px auto minmax(80px, auto) auto;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--luma-cockpit-border), transparent 18%);
  border-radius: var(--luma-cockpit-radius);
  transform: translateX(-50%);
  background: color-mix(in srgb, var(--luma-cockpit-floating-bg), transparent 6%);
  color: var(--luma-cockpit-text-secondary);
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  backdrop-filter: blur(8px);
}

.scene-center__status strong,
.scene-center__status-value {
  color: var(--luma-cockpit-title-text);
  font-variant-numeric: tabular-nums;
}

.scene-center__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--luma-cockpit-accent);
  box-shadow: 0 0 8px currentcolor;
}

.scene-center__status-dot[data-status='active'] {
  background: var(--luma-cockpit-success);
}

.scene-center__status-dot[data-status='watch'] {
  background: var(--luma-cockpit-warning);
}

@media (max-width: 900px) {
  .scene-center__engine-switch {
    grid-template-columns: repeat(3, minmax(92px, 1fr));
    width: min(348px, calc(100% - 32px));
  }

  .scene-center__status {
    max-width: calc(100% - 32px);
  }
}
</style>
