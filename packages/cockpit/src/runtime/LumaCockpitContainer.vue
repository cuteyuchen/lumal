<script setup lang="ts">
import type { CockpitGridColumnConfig, CockpitGridRowConfig, CockpitSide } from '../types'
import type { CockpitCardTab } from './card'
import { computed, reactive, ref, watch } from 'vue'
import { useCockpitRuntimeEnv } from './context'
import LumaCockpitWidgetHost from './LumaCockpitWidgetHost.vue'

/***********************网格行运行时*********************/

const props = defineProps<{
  columns: CockpitGridColumnConfig[]
  layoutId: string
  row: CockpitGridRowConfig
  side: CockpitSide
}>()

const rowStyle = computed(() => ({ height: `${props.row.height}%` }))
const gridStyle = computed(() => ({ gridTemplateColumns: props.columns.map(column => `calc(${column.width} * var(--luma-cockpit-x-unit, 1px))`).join(' ') }))
const activeTabId = ref<string | undefined>()
const visitedTabIds = reactive(new Set<string>())
const env = useCockpitRuntimeEnv()
const tabs = computed<CockpitCardTab[]>(() => props.row.widgets.map(widget => ({
  id: widget.id,
  title: widget.title ?? env.registry.resolveWidget(widget.type)?.label ?? widget.type,
  widget,
})))

function resolveConfiguredActiveTab(): string | undefined {
  const requested = props.row.activeWidgetId
  return props.row.widgets.some(widget => widget.id === requested) ? requested : props.row.widgets[0]?.id
}

watch(() => [props.row.id, props.row.activeWidgetId], () => {
  activeTabId.value = resolveConfiguredActiveTab()
}, { immediate: true })

watch(() => props.row.widgets.map(widget => widget.id).join(','), () => {
  const widgetIds = new Set(props.row.widgets.map(widget => widget.id))
  visitedTabIds.forEach((id) => {
    if (!widgetIds.has(id))
      visitedTabIds.delete(id)
  })
  if (!props.row.widgets.some(widget => widget.id === activeTabId.value))
    activeTabId.value = resolveConfiguredActiveTab()
})

watch(activeTabId, (id) => {
  if (id)
    visitedTabIds.add(id)
}, { immediate: true })
</script>

<template>
  <section
    class="luma-cockpit-container"
    :class="{ 'is-tabs': row.mode === 'tabs' }"
    :style="rowStyle"
    data-cockpit-node="row"
    :data-cockpit-node-id="row.id"
    :data-cockpit-side="side"
  >
    <div v-if="row.mode === 'grid'" class="luma-cockpit-container__grid" :style="gridStyle">
      <div
        v-for="cell in row.cells"
        :key="cell.id"
        class="luma-cockpit-container__cell"
        data-cockpit-node="cell"
        :data-cockpit-node-id="cell.id"
        :data-cockpit-side="side"
      >
        <LumaCockpitWidgetHost
          v-if="cell.widget"
          :key="cell.widget.id"
          :layout-id="layoutId"
          :side="side"
          :widget="cell.widget"
        />
        <div v-else class="luma-cockpit-container__empty" role="status">
          空模块槽
        </div>
      </div>
    </div>

    <template v-else>
      <component
        :is="env.cardComponent"
        v-if="row.widgets.length"
        v-model:active-tab-id="activeTabId"
        :tabs="tabs"
      >
        <template v-if="env.slots['widget-title']" #title="{ title, widget }">
          <component :is="env.slots['widget-title']" :widget="widget" :title="title" />
        </template>
        <template v-if="env.slots['widget-title']" #tab="{ tab }">
          <component :is="env.slots['widget-title']" :widget="tab.widget" :title="tab.title" />
        </template>
        <template v-for="widget in row.widgets" :key="widget.id">
          <div v-if="visitedTabIds.has(widget.id)" v-show="widget.id === activeTabId" class="luma-cockpit-container__tabpanel">
            <LumaCockpitWidgetHost embedded :layout-id="layoutId" :side="side" :widget="widget" />
          </div>
        </template>
      </component>
      <div v-else class="luma-cockpit-container__empty" role="status">
        空 Tab 行
      </div>
    </template>
  </section>
</template>
