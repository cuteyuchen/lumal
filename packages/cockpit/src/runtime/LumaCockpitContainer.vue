<script setup lang="ts">
import type { CockpitGridColumnConfig, CockpitGridRowConfig, CockpitSide } from '../types'
import { ElButton } from 'element-plus'
import { computed, ref, watch } from 'vue'
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

function resolveActiveTab(): string | undefined {
  const requested = activeTabId.value ?? props.row.activeWidgetId
  return props.row.widgets.some(widget => widget.id === requested) ? requested : props.row.widgets[0]?.id
}

watch(() => [props.row.id, props.row.widgets.map(widget => widget.id).join(',')], () => {
  activeTabId.value = resolveActiveTab()
}, { immediate: true })

function onTabKeydown(event: KeyboardEvent, index: number): void {
  const widgets = props.row.widgets
  if (!widgets.length)
    return
  const byKey: Record<string, number> = {
    ArrowRight: (index + 1) % widgets.length,
    ArrowDown: (index + 1) % widgets.length,
    ArrowLeft: (index - 1 + widgets.length) % widgets.length,
    ArrowUp: (index - 1 + widgets.length) % widgets.length,
    Home: 0,
    End: widgets.length - 1,
  }
  if (event.key in byKey) {
    event.preventDefault()
    activeTabId.value = widgets[byKey[event.key]].id
  }
}
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
      <div v-if="row.widgets.length" class="luma-cockpit-container__tabs">
        <div class="luma-cockpit-container__tablist" role="tablist">
          <ElButton
            v-for="(widget, index) in row.widgets"
            :id="`tab-${widget.id}`"
            :key="widget.id"
            role="tab"
            class="luma-cockpit-container__tab"
            :class="{ 'is-active': widget.id === activeTabId }"
            :aria-selected="widget.id === activeTabId"
            :tabindex="widget.id === activeTabId ? 0 : -1"
            @click="activeTabId = widget.id"
            @keydown="onTabKeydown($event, index)"
          >
            {{ widget.title ?? widget.type }}
          </ElButton>
        </div>
        <div v-for="widget in row.widgets" v-show="widget.id === activeTabId" :key="widget.id" class="luma-cockpit-container__tabpanel" role="tabpanel">
          <LumaCockpitWidgetHost :layout-id="layoutId" :side="side" :widget="widget" />
        </div>
      </div>
      <div v-else class="luma-cockpit-container__empty" role="status">
        空 Tab 行
      </div>
    </template>
  </section>
</template>
