<script setup lang="ts">
import type { CockpitContainerConfig } from '../types'
import { computed, ref, watch } from 'vue'
import { useCockpitRuntimeEnv } from './context'
import LumaCockpitWidgetHost from './LumaCockpitWidgetHost.vue'

/***********************模块容器*********************/
// 三种展示模式：single / combined / tabs。

const props = defineProps<{
  categoryId: string
  pageId: string
  side: 'left' | 'right'
  container: CockpitContainerConfig
}>()

const env = useCockpitRuntimeEnv()

const visibleWidgets = computed(() =>
  props.container.widgets.filter(widget => widget.visible !== false),
)

/***********************tabs 模式激活项*********************/
const activeTabId = ref<string | undefined>()

function resolveActiveTab(): string | undefined {
  const widgets = visibleWidgets.value
  if (widgets.length === 0)
    return undefined
  const requested = activeTabId.value ?? props.container.activeWidgetId
  return widgets.some(w => w.id === requested) ? requested : widgets[0].id
}

watch(
  () => [props.container.id, visibleWidgets.value.map(w => w.id).join(',')],
  () => {
    activeTabId.value = resolveActiveTab()
  },
  { immediate: true },
)

function selectTab(id: string): void {
  activeTabId.value = id
}

function onTabKeydown(event: KeyboardEvent, index: number): void {
  const widgets = visibleWidgets.value
  if (widgets.length === 0)
    return
  let next = -1
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
    next = (index + 1) % widgets.length
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    next = (index - 1 + widgets.length) % widgets.length
  else if (event.key === 'Home')
    next = 0
  else if (event.key === 'End')
    next = widgets.length - 1
  if (next >= 0) {
    event.preventDefault()
    selectTab(widgets[next].id)
  }
}

const combinedDirection = computed(() => props.container.direction ?? 'horizontal')
const isEmpty = computed(() => visibleWidgets.value.length === 0)
</script>

<template>
  <div
    class="luma-cockpit-container"
    :data-mode="container.mode"
    :data-container-id="container.id"
    data-cockpit-node="container"
    :data-cockpit-node-id="container.id"
    :data-cockpit-side="side"
  >
    <!-- 空容器降级 -->
    <template v-if="isEmpty">
      <component
        :is="env.slots['empty-container']"
        v-if="env.slots['empty-container']"
        :container="container"
      />
      <div v-else class="luma-cockpit-container__empty" role="status">
        空容器
      </div>
    </template>

    <!-- single：仅一个可见模块 -->
    <template v-else-if="container.mode === 'single'">
      <LumaCockpitWidgetHost
        :category-id="categoryId"
        :page-id="pageId"
        :side="side"
        :widget="visibleWidgets[0]"
      />
    </template>

    <!-- combined：横向或纵向同时展示 -->
    <template v-else-if="container.mode === 'combined'">
      <div
        class="luma-cockpit-container__combined"
        :data-direction="combinedDirection"
      >
        <LumaCockpitWidgetHost
          v-for="widget in visibleWidgets"
          :key="widget.id"
          class="luma-cockpit-container__combined-item"
          :category-id="categoryId"
          :page-id="pageId"
          :side="side"
          :widget="widget"
        />
      </div>
    </template>

    <!-- tabs：共用容器，Tab 切换，符合 TabList/TabPanel 键盘交互 -->
    <template v-else>
      <div class="luma-cockpit-container__tabs">
        <div class="luma-cockpit-container__tablist" role="tablist">
          <button
            v-for="(widget, index) in visibleWidgets"
            :id="`tab-${widget.id}`"
            :key="widget.id"
            type="button"
            role="tab"
            class="luma-cockpit-container__tab"
            :class="{ 'is-active': widget.id === activeTabId }"
            :aria-selected="widget.id === activeTabId"
            :tabindex="widget.id === activeTabId ? 0 : -1"
            :aria-controls="`tabpanel-${widget.id}`"
            @click="selectTab(widget.id)"
            @keydown="onTabKeydown($event, index)"
          >
            {{ widget.title ?? widget.type }}
          </button>
        </div>
        <div
          v-for="widget in visibleWidgets"
          v-show="widget.id === activeTabId"
          :id="`tabpanel-${widget.id}`"
          :key="widget.id"
          role="tabpanel"
          :aria-labelledby="`tab-${widget.id}`"
          class="luma-cockpit-container__tabpanel"
        >
          <!-- v-show 而非 v-if：切换默认保留已挂载模块状态 -->
          <LumaCockpitWidgetHost
            :category-id="categoryId"
            :page-id="pageId"
            :side="side"
            :widget="widget"
          />
        </div>
      </div>
    </template>
  </div>
</template>
