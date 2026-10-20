<script setup lang="ts">
import type { IconDefinition } from '@lumal/icons'
import type { LumalIconPickerGroupSelectSlotProps } from '../types'
import { computed, shallowRef, watch } from 'vue'
import { useIconRegistry } from '../composables/useIconRegistry'
import LumalIcon from './LumalIcon.vue'

/***********************属性与事件*********************/
const props = withDefaults(defineProps<{
  group?: string
  pageSize?: number
  searchable?: boolean
  showLabels?: boolean
  storageKey?: string
}>(), {
  group: '',
  pageSize: 48,
  searchable: true,
  showLabels: false,
  storageKey: '',
})

const emit = defineEmits<{
  select: [icon: IconDefinition]
}>()

defineSlots<{
  'group-select'?: (props: LumalIconPickerGroupSelectSlotProps) => unknown
}>()

/***********************筛选与分页*********************/
const model = defineModel<string>()
const keyword = shallowRef('')
const activeGroup = shallowRef(props.group)
const page = shallowRef(1)
const effectivePageSize = computed(() => Math.max(1, props.pageSize))
const registry = useIconRegistry()

const icons = registry.icons
const groups = computed(() => {
  const registered = registry.groups.value
  const known = new Set(registered.map(group => group.key))
  const inferred = icons.value
    .map(icon => icon.group)
    .filter((group): group is string => typeof group === 'string' && !known.has(group))
    .filter((group, index, source) => source.indexOf(group) === index)
    .map(group => ({ key: group, label: group }))

  return [...registered, ...inferred]
})
const filteredIcons = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase()

  return icons.value.filter((icon) => {
    const matchesGroup = !activeGroup.value || icon.group === activeGroup.value
    const matchesSearch = !search
      || icon.key.toLocaleLowerCase().includes(search)
      || icon.label?.toLocaleLowerCase().includes(search)
    return matchesGroup && matchesSearch
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredIcons.value.length / effectivePageSize.value)))
const pagedIcons = computed(() => {
  const start = (page.value - 1) * effectivePageSize.value
  return filteredIcons.value.slice(start, start + effectivePageSize.value)
})

function setGroup(group: string): void {
  activeGroup.value = group
}

watch([keyword, activeGroup, effectivePageSize], () => {
  page.value = 1
})

watch(() => props.group, (group) => {
  activeGroup.value = group
})

watch(totalPages, (total) => {
  page.value = Math.min(page.value, total)
})

/***********************选择与持久化*********************/
if (props.storageKey && typeof localStorage !== 'undefined' && !model.value) {
  model.value = localStorage.getItem(props.storageKey) ?? undefined
}

function selectIcon(icon: IconDefinition): void {
  model.value = icon.key
  if (props.storageKey && typeof localStorage !== 'undefined') {
    localStorage.setItem(props.storageKey, icon.key)
  }
  emit('select', icon)
}
</script>

<template>
  <div class="lumal-icon-picker" :class="{ 'lumal-icon-picker--show-labels': showLabels }">
    <div class="lumal-icon-picker__toolbar">
      <label v-if="searchable" class="lumal-icon-picker__field">
        <span class="lumal-icon-picker__field-label">搜索图标</span>
        <input v-model="keyword" type="search" aria-label="搜索图标" placeholder="输入名称或 key">
      </label>
      <!-- 复合控件的选项层可能留在插槽内，不用 label 包裹，避免选择后触发原生二次点击。 -->
      <div v-if="groups.length" class="lumal-icon-picker__field">
        <span class="lumal-icon-picker__field-label">图标分组</span>
        <!-- UI 框架由消费方接入，独立选择器保留原生控件作为默认实现。 -->
        <slot name="group-select" :model-value="activeGroup" :groups="groups" :set-group="setGroup">
          <select v-model="activeGroup" aria-label="图标分组">
            <option value="">
              全部分组
            </option>
            <option v-for="groupItem in groups" :key="groupItem.key" :value="groupItem.key">
              {{ groupItem.label }}
            </option>
          </select>
        </slot>
      </div>
    </div>

    <p class="lumal-icon-picker__summary" role="status">
      共 {{ filteredIcons.length }} 个图标
    </p>

    <div v-if="pagedIcons.length" class="lumal-icon-picker__grid" role="listbox" aria-label="图标列表">
      <button
        v-for="iconItem in pagedIcons"
        :key="iconItem.key"
        class="lumal-icon-picker__item"
        :class="{ 'is-selected': model === iconItem.key }"
        type="button"
        role="option"
        :aria-label="iconItem.label || iconItem.key"
        :aria-selected="model === iconItem.key"
        :title="iconItem.label || iconItem.key"
        @click="selectIcon(iconItem)"
      >
        <LumalIcon :name="iconItem.key" :size="28" />
        <span v-if="showLabels" class="lumal-icon-picker__item-label">{{ iconItem.label || iconItem.key }}</span>
      </button>
    </div>
    <p v-else class="lumal-icon-picker__empty">
      未找到匹配图标
    </p>

    <footer v-if="totalPages > 1" class="lumal-icon-picker__pagination">
      <button type="button" :disabled="page <= 1" @click="page -= 1">
        上一页
      </button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button type="button" :disabled="page >= totalPages" @click="page += 1">
        下一页
      </button>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.lumal-icon-picker {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.lumal-icon-picker__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(140px, 200px);
  align-items: start;
  gap: 12px;
}

.lumal-icon-picker__field {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.lumal-icon-picker__field-label,
.lumal-icon-picker__summary,
.lumal-icon-picker__empty {
  color: var(--el-text-color-secondary, CanvasText);
  font-size: 13px;
}

.lumal-icon-picker__field input,
.lumal-icon-picker__field select,
.lumal-icon-picker__pagination button {
  box-sizing: border-box;
  height: var(--el-component-size, 32px);
  min-height: var(--el-component-size, 32px);
  padding: 0 12px;
  border: 1px solid var(--el-border-color, currentColor);
  border-radius: var(--lumal-radius-base, 8px);
  color: var(--el-text-color-primary, CanvasText);
  background: var(--el-bg-color, Canvas);
  font: inherit;
  font-size: var(--lumal-font-size-base, 14px);
}

.lumal-icon-picker__field input,
.lumal-icon-picker__field select {
  width: 100%;
  min-width: 0;
}

.lumal-icon-picker__summary,
.lumal-icon-picker__empty {
  margin: 0;
}

.lumal-icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: 8px;
}

/* 显示名称时预留文字宽度，完整换行，不再把名称压缩成省略号。 */
.lumal-icon-picker--show-labels .lumal-icon-picker__grid {
  grid-template-columns: repeat(auto-fill, minmax(min(96px, 100%), 1fr));
  grid-auto-rows: minmax(84px, auto);
}

.lumal-icon-picker__item {
  display: inline-flex;
  min-width: 44px;
  min-height: 52px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--el-border-color-lighter, currentColor);
  border-radius: var(--lumal-radius-small, 6px);
  color: var(--el-text-color-regular, CanvasText);
  background: var(--el-bg-color, Canvas);
  cursor: pointer;
  transition: border-color var(--lumal-motion-fast, 160ms), background-color var(--lumal-motion-fast, 160ms);
}

.lumal-icon-picker__item:hover,
.lumal-icon-picker__item.is-selected {
  border-color: var(--el-color-primary, Highlight);
  background: var(--el-color-primary-light-9, Canvas);
}

.lumal-icon-picker__item:focus-visible,
.lumal-icon-picker__field input:focus-visible,
.lumal-icon-picker__field select:focus-visible,
.lumal-icon-picker__pagination button:focus-visible {
  outline: 2px solid var(--el-color-primary, Highlight);
  outline-offset: 2px;
}

.lumal-icon-picker__item-label {
  width: 100%;
  max-width: 100%;
  font-size: calc(var(--lumal-font-size-base, 14px) - 2px);
  line-height: 1.4;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}

.lumal-icon-picker__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.lumal-icon-picker__pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 640px) {
  .lumal-icon-picker__toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lumal-icon-picker__item {
    transition: none;
  }
}
</style>
