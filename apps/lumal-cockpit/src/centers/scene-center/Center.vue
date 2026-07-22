<script setup lang="ts">
import type { CockpitCenterContext } from '@lumal/cockpit'
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
  theme.value = document.documentElement.dataset.lumalTheme === 'light' ? 'light' : 'dark'
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
    attributeFilter: ['data-lumal-theme'],
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
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 46%, color-mix(in srgb, var(--lumal-cockpit-accent), transparent 93%), transparent 58%),
    transparent;
}

.scene-center::before {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  background:
    linear-gradient(rgb(86 211 236 / 1.2%) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(90deg, rgb(86 211 236 / 1.2%) 1px, transparent 1px) 0 0 / 48px 48px;
  content: '';
  pointer-events: none;
}

.scene-center__loading {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--lumal-cockpit-text-secondary);
}

.scene-center__engine-switch {
  position: absolute;
  top: 18px;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(3, 108px);
  min-height: 42px;
  padding: 4px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 12%);
  border-radius: 13px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 5%);
  box-shadow:
    0 14px 32px rgb(0 0 0 / 22%),
    inset 0 1px 0 rgb(255 255 255 / 4%);
  transform: translateX(-50%);
  backdrop-filter: blur(14px);
}

.scene-center__engine-switch button {
  min-width: 0;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--lumal-cockpit-text-muted);
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.scene-center__engine-switch button:hover {
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 93%);
  color: var(--lumal-cockpit-title-text);
}

.scene-center__engine-switch button.is-active {
  border-color: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 72%);
  background: color-mix(in srgb, var(--lumal-cockpit-accent), transparent 90%);
  color: var(--lumal-cockpit-title-text);
  box-shadow: inset 0 -2px 0 var(--lumal-cockpit-accent);
}

.scene-center__engine-switch button:focus-visible {
  outline: 2px solid var(--lumal-cockpit-focus-ring);
  outline-offset: -2px;
}

.scene-center__status {
  position: absolute;
  bottom: 18px;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: 8px auto minmax(80px, auto) auto;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid color-mix(in srgb, var(--lumal-cockpit-border), transparent 12%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--lumal-cockpit-floating-bg), transparent 5%);
  color: var(--lumal-cockpit-text-muted);
  box-shadow:
    0 14px 32px rgb(0 0 0 / 20%),
    inset 0 1px 0 rgb(255 255 255 / 4%);
  transform: translateX(-50%);
  backdrop-filter: blur(14px);
}

.scene-center__status strong,
.scene-center__status-value {
  color: var(--lumal-cockpit-title-text);
  font-variant-numeric: tabular-nums;
}

.scene-center__status-value {
  padding-left: 4px;
  color: var(--lumal-cockpit-accent);
  font-size: 17px;
  font-weight: 700;
}

.scene-center__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--lumal-cockpit-accent);
  box-shadow: 0 0 9px currentcolor;
}

.scene-center__status-dot[data-status='active'] {
  background: var(--lumal-cockpit-success);
}

.scene-center__status-dot[data-status='watch'] {
  background: var(--lumal-cockpit-warning);
}

@media (max-width: 900px) {
  .scene-center__engine-switch {
    grid-template-columns: repeat(3, minmax(88px, 1fr));
    width: min(340px, calc(100% - 32px));
  }

  .scene-center__status {
    max-width: calc(100% - 32px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene-center__engine-switch button {
    transition: none;
  }
}
</style>
