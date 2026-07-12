<script setup lang="ts">
import type { CockpitRegistry } from '../registry/types'
import type { CockpitContainerMode } from '../types'
import type { UseCockpitDraftReturn } from './useCockpitDraft'
import { computed } from 'vue'

/***********************左右区域布局编辑器*********************/
// 编辑单个区域的列 / 容器 / 模块结构。
// 排序全部提供按钮替代，满足无拖拽的键盘可达要求。

const props = defineProps<{
  draft: UseCockpitDraftReturn
  registry: CockpitRegistry
  side: 'left' | 'right'
}>()

const page = computed(() => props.draft.activePage.value)
const columns = computed(() => {
  const p = page.value
  if (!p)
    return []
  return props.side === 'left' ? p.left.columns : p.right.columns
})

const widgetOptions = computed(() => props.registry.listWidgets())

const modes: { value: CockpitContainerMode, label: string }[] = [
  { value: 'single', label: '单一' },
  { value: 'combined', label: '组合' },
  { value: 'tabs', label: '标签' },
]

function addWidgetFromSelect(columnId: string, containerId: string, event: Event): void {
  const select = event.target as HTMLSelectElement
  const type = select.value
  if (!type)
    return
  const def = widgetOptions.value.find(w => w.type === type)
  props.draft.addWidget(props.side, columnId, containerId, type, def?.label)
  select.value = ''
}
</script>

<template>
  <div class="luma-cockpit-designer__region" :data-side="side">
    <header class="luma-cockpit-designer__region-head">
      <span>{{ side === 'left' ? '左侧区域' : '右侧区域' }}</span>
      <button type="button" @click="draft.addColumn(side)">
        新增列
      </button>
    </header>

    <div v-if="!columns.length" class="luma-cockpit-designer__region-empty">
      暂无列
    </div>

    <div
      v-for="(column, ci) in columns"
      :key="column.id"
      class="luma-cockpit-designer__column"
    >
      <header class="luma-cockpit-designer__column-head">
        <span>列 {{ ci + 1 }}</span>
        <label>
          宽
          <input
            type="number"
            min="1"
            :value="column.width"
            :aria-label="`列 ${ci + 1} 宽度权重`"
            @change="draft.setColumnWidth(side, column.id, Number(($event.target as HTMLInputElement).value))"
          >
        </label>
        <label>
          高
          <input
            type="number"
            min="0"
            :value="column.height ?? ''"
            :aria-label="`列 ${ci + 1} 高度权重`"
            @change="draft.setColumnHeight(side, column.id, Number(($event.target as HTMLInputElement).value) || undefined)"
          >
        </label>
        <span class="luma-cockpit-designer__ops">
          <button type="button" :disabled="ci === 0" :aria-label="`左移列 ${ci + 1}`" @click="draft.moveColumn(side, column.id, -1)">←</button>
          <button type="button" :disabled="ci === columns.length - 1" :aria-label="`右移列 ${ci + 1}`" @click="draft.moveColumn(side, column.id, 1)">→</button>
          <button type="button" :aria-label="`删除列 ${ci + 1}`" @click="draft.removeColumn(side, column.id)">删除</button>
          <button type="button" @click="draft.addContainer(side, column.id)">加容器</button>
        </span>
      </header>

      <div
        v-for="(container, ti) in column.containers"
        :key="container.id"
        class="luma-cockpit-designer__container"
      >
        <header class="luma-cockpit-designer__container-head">
          <label>
            模式
            <select
              :value="container.mode"
              :aria-label="`容器 ${ti + 1} 模式`"
              @change="draft.setContainerMode(side, column.id, container.id, ($event.target as HTMLSelectElement).value as CockpitContainerMode)"
            >
              <option v-for="m in modes" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </label>
          <label v-if="container.mode === 'combined'">
            方向
            <select
              :value="container.direction ?? 'horizontal'"
              :aria-label="`容器 ${ti + 1} 排列方向`"
              @change="draft.setContainerDirection(side, column.id, container.id, ($event.target as HTMLSelectElement).value as 'horizontal' | 'vertical')"
            >
              <option value="horizontal">横向</option>
              <option value="vertical">纵向</option>
            </select>
          </label>
          <label>
            高
            <input
              type="number"
              min="1"
              :value="container.height"
              :aria-label="`容器 ${ti + 1} 高度权重`"
              @change="draft.setContainerHeight(side, column.id, container.id, Number(($event.target as HTMLInputElement).value))"
            >
          </label>
          <span class="luma-cockpit-designer__ops">
            <button type="button" :disabled="ti === 0" :aria-label="`上移容器 ${ti + 1}`" @click="draft.moveContainer(side, column.id, container.id, -1)">↑</button>
            <button type="button" :disabled="ti === column.containers.length - 1" :aria-label="`下移容器 ${ti + 1}`" @click="draft.moveContainer(side, column.id, container.id, 1)">↓</button>
            <button type="button" @click="draft.duplicateContainer(side, column.id, container.id)">复制</button>
            <button type="button" :aria-label="`删除容器 ${ti + 1}`" @click="draft.removeContainer(side, column.id, container.id)">删除</button>
          </span>
        </header>

        <ul class="luma-cockpit-designer__widgets">
          <li
            v-for="(widget, wi) in container.widgets"
            :key="widget.id"
            class="luma-cockpit-designer__widget"
          >
            <input
              v-if="container.mode === 'tabs'"
              type="radio"
              :name="`active-${container.id}`"
              :checked="container.activeWidgetId === widget.id"
              :aria-label="`设为默认标签：${widget.title ?? widget.type}`"
              @change="draft.setContainerActiveWidget(side, column.id, container.id, widget.id)"
            >
            <input
              v-else-if="container.mode === 'combined'"
              type="checkbox"
              disabled
              checked
              aria-hidden="true"
            >
            <span class="luma-cockpit-designer__widget-label">{{ widget.title ?? widget.type }}</span>
            <span class="luma-cockpit-designer__ops">
              <button type="button" :disabled="wi === 0" aria-label="上移模块" @click="draft.moveWidget(side, column.id, container.id, widget.id, -1)">↑</button>
              <button type="button" :disabled="wi === container.widgets.length - 1" aria-label="下移模块" @click="draft.moveWidget(side, column.id, container.id, widget.id, 1)">↓</button>
              <button type="button" @click="draft.duplicateWidget(side, column.id, container.id, widget.id)">复制</button>
              <button type="button" aria-label="删除模块" @click="draft.removeWidget(side, column.id, container.id, widget.id)">删除</button>
            </span>
          </li>
          <li v-if="!container.widgets.length" class="luma-cockpit-designer__widget-empty">
            空容器
          </li>
        </ul>

        <label class="luma-cockpit-designer__add-widget">
          添加模块
          <select :aria-label="`向容器 ${ti + 1} 添加模块`" @change="addWidgetFromSelect(column.id, container.id, $event)">
            <option value="">选择模块类型…</option>
            <option v-for="w in widgetOptions" :key="w.type" :value="w.type">{{ w.label }}</option>
          </select>
        </label>
      </div>
    </div>
  </div>
</template>
