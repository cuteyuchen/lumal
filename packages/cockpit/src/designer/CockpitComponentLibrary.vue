<script setup lang="ts">
import type {
  CockpitCenterDefinition,
  CockpitRegistry,
  CockpitWidgetDefinition,
} from '../registry/types'
import { computed, ref } from 'vue'

/***********************组件库面板*********************/
// 展示应用已注册的中央组件与业务模块，支持按 group 过滤。
// 中央组件可选中应用到当前页面；模块类型供布局编辑器添加。

const props = defineProps<{
  registry: CockpitRegistry
  currentCenterType?: string
}>()

const emit = defineEmits<{
  selectCenter: [type: string | undefined]
}>()

const centers = computed(() => props.registry.listCenters())
const widgets = computed(() => props.registry.listWidgets())

const centerGroup = ref<string>('')
const widgetGroup = ref<string>('')

function groupsOf(list: readonly { group?: string }[]): string[] {
  const set = new Set<string>()
  list.forEach(item => item.group && set.add(item.group))
  return [...set]
}

const centerGroups = computed(() => groupsOf(centers.value))
const widgetGroups = computed(() => groupsOf(widgets.value))

const filteredCenters = computed<readonly CockpitCenterDefinition[]>(() =>
  centerGroup.value ? centers.value.filter(c => c.group === centerGroup.value) : centers.value,
)
const filteredWidgets = computed<readonly CockpitWidgetDefinition[]>(() =>
  widgetGroup.value ? widgets.value.filter(w => w.group === widgetGroup.value) : widgets.value,
)
</script>

<template>
  <div class="luma-cockpit-designer__library">
    <section class="luma-cockpit-designer__library-section">
      <header class="luma-cockpit-designer__library-title">
        <span>中央组件</span>
        <select
          v-if="centerGroups.length"
          v-model="centerGroup"
          aria-label="中央组件分组过滤"
        >
          <option value="">
            全部分组
          </option>
          <option v-for="g in centerGroups" :key="g" :value="g">
            {{ g }}
          </option>
        </select>
      </header>
      <ul class="luma-cockpit-designer__library-list">
        <li>
          <button
            type="button"
            class="luma-cockpit-designer__library-item"
            :class="{ 'is-active': !currentCenterType }"
            @click="emit('selectCenter', undefined)"
          >
            无中央组件
          </button>
        </li>
        <li v-for="center in filteredCenters" :key="center.type">
          <button
            type="button"
            class="luma-cockpit-designer__library-item"
            :class="{ 'is-active': center.type === currentCenterType }"
            :aria-pressed="center.type === currentCenterType"
            @click="emit('selectCenter', center.type)"
          >
            {{ center.label }}
          </button>
        </li>
      </ul>
    </section>

    <section class="luma-cockpit-designer__library-section">
      <header class="luma-cockpit-designer__library-title">
        <span>业务模块</span>
        <select
          v-if="widgetGroups.length"
          v-model="widgetGroup"
          aria-label="业务模块分组过滤"
        >
          <option value="">
            全部分组
          </option>
          <option v-for="g in widgetGroups" :key="g" :value="g">
            {{ g }}
          </option>
        </select>
      </header>
      <ul class="luma-cockpit-designer__library-list">
        <li v-for="widget in filteredWidgets" :key="widget.type">
          <span class="luma-cockpit-designer__library-item is-static">
            {{ widget.label }}
          </span>
        </li>
        <li v-if="!filteredWidgets.length" class="luma-cockpit-designer__library-empty">
          无可用模块
        </li>
      </ul>
    </section>
  </div>
</template>
