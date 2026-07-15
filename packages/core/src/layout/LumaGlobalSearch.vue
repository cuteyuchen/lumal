<script setup lang="ts">
import type { LumaLayoutMenuItem } from './types'
import { LumaIcon } from '@luma/icons'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'

interface SearchResult {
  item: LumaLayoutMenuItem
  trail: string[]
}

const props = withDefaults(defineProps<{
  maxResults?: number
  menus?: LumaLayoutMenuItem[]
  placeholder?: string
  shortcut?: boolean
}>(), {
  maxResults: 12,
  menus: () => [],
  placeholder: '搜索菜单',
  shortcut: true,
})

const emit = defineEmits<{
  select: [path: string, item: LumaLayoutMenuItem]
}>()

const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m16.2 16.2 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
const dialogId = `luma-global-search-${useId()}`
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const triggerRef = useTemplateRef<HTMLButtonElement>('triggerRef')
const open = ref(false)
const query = ref('')
const activeIndex = ref(0)

function flattenMenus(menus: LumaLayoutMenuItem[], ancestors: string[] = []): SearchResult[] {
  return menus.flatMap((item) => {
    if (item.hidden) {
      return []
    }

    const trail = [...ancestors, item.title]
    return [
      { item, trail },
      ...flattenMenus(item.children ?? [], trail),
    ]
  })
}

const allResults = computed(() => flattenMenus(props.menus))
const filteredResults = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  const results = keyword
    ? allResults.value.filter(({ item, trail }) => (
        `${trail.join(' ')} ${item.path}`.toLocaleLowerCase().includes(keyword)
      ))
    : allResults.value

  return results.slice(0, Math.max(1, props.maxResults))
})
const activeDescendant = computed(() => filteredResults.value[activeIndex.value]
  ? `${dialogId}-option-${activeIndex.value}`
  : undefined)

function openSearch(): void {
  open.value = true
  query.value = ''
  activeIndex.value = 0
  void nextTick(() => inputRef.value?.focus())
}

function closeSearch(restoreFocus = true): void {
  open.value = false
  if (restoreFocus) {
    void nextTick(() => triggerRef.value?.focus())
  }
}

function selectResult(result?: SearchResult): void {
  if (!result) {
    return
  }

  emit('select', result.item.path, result.item)
  closeSearch()
}

function handleInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
    return
  }

  if (filteredResults.value.length === 0) {
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    const direction = event.key === 'ArrowDown' ? 1 : -1
    activeIndex.value = (activeIndex.value + direction + filteredResults.value.length) % filteredResults.value.length
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectResult(filteredResults.value[activeIndex.value])
  }
}

function handleGlobalShortcut(event: KeyboardEvent): void {
  if (!props.shortcut || event.altKey || event.shiftKey || event.key.toLocaleLowerCase() !== 'k') {
    return
  }
  if (!event.ctrlKey && !event.metaKey) {
    return
  }

  event.preventDefault()
  open.value ? closeSearch(false) : openSearch()
}

watch(filteredResults, () => {
  activeIndex.value = 0
})

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})

defineExpose({ close: closeSearch, open: openSearch })
</script>

<template>
  <div class="luma-global-search">
    <button
      ref="triggerRef"
      class="luma-global-search__trigger"
      type="button"
      aria-label="打开全局搜索"
      title="全局搜索"
      @click="openSearch"
    >
      <LumaIcon :icon="SEARCH_ICON" :size="17" />
      <span class="luma-global-search__trigger-label">搜索</span>
      <kbd v-if="shortcut">Ctrl K</kbd>
    </button>

    <Teleport to="body">
      <div v-if="open" class="luma-global-search__backdrop" @mousedown.self="closeSearch()">
        <section
          class="luma-global-search__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="`${dialogId}-title`"
        >
          <header class="luma-global-search__header">
            <h2 :id="`${dialogId}-title`">
              全局搜索
            </h2>
            <button type="button" aria-label="关闭全局搜索" title="关闭" @click="closeSearch()">
              <LumaIcon name="luma:close" :size="17" />
            </button>
          </header>

          <label class="luma-global-search__input-wrap">
            <span class="luma-global-search__sr-only">搜索菜单</span>
            <LumaIcon :icon="SEARCH_ICON" :size="18" />
            <input
              ref="inputRef"
              v-model="query"
              role="combobox"
              autocomplete="off"
              :aria-activedescendant="activeDescendant"
              aria-autocomplete="list"
              :aria-controls="`${dialogId}-results`"
              aria-expanded="true"
              :placeholder="placeholder"
              @keydown="handleInputKeydown"
            >
          </label>

          <ul :id="`${dialogId}-results`" class="luma-global-search__results" role="listbox">
            <li
              v-for="(result, index) in filteredResults"
              :id="`${dialogId}-option-${index}`"
              :key="result.item.path"
              role="option"
              :aria-selected="index === activeIndex"
            >
              <button
                type="button"
                :class="{ 'is-active': index === activeIndex }"
                @mouseenter="activeIndex = index"
                @click="selectResult(result)"
              >
                <LumaIcon v-if="result.item.icon" :name="result.item.icon" :size="18" />
                <span>
                  <strong>{{ result.item.title }}</strong>
                  <small>{{ result.trail.join(' / ') }}</small>
                </span>
                <code>{{ result.item.path }}</code>
              </button>
            </li>
          </ul>

          <p v-if="filteredResults.length === 0" class="luma-global-search__empty" role="status">
            未找到匹配菜单，请尝试其他关键词
          </p>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.luma-global-search__trigger {
  display: inline-flex;
  min-width: 44px;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 9px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light);
  font: inherit;
}

.luma-global-search__trigger:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.luma-global-search__trigger:focus-visible,
.luma-global-search__dialog button:focus-visible,
.luma-global-search__dialog input:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.luma-global-search__trigger-label {
  font-size: calc(var(--luma-font-size-base, 14px) - 1px);
}

.luma-global-search__trigger kbd {
  padding: 2px 5px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: calc(var(--luma-font-size-base, 14px) - 3px);
  line-height: 1.2;
}

.luma-global-search__backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--luma-z-drawer, 1200) + 20);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: min(14vh, 120px) 16px 24px;
  background: color-mix(in srgb, var(--el-color-black) 48%, transparent);
}

.luma-global-search__dialog {
  display: flex;
  width: min(640px, 100%);
  max-height: min(640px, 76vh);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-dark);
}

.luma-global-search__header {
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.luma-global-search__header h2 {
  margin: 0;
  font-size: calc(var(--luma-font-size-base, 14px) + 2px);
  font-weight: 600;
}

.luma-global-search__header button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
}

.luma-global-search__input-wrap {
  display: flex;
  min-height: 52px;
  align-items: center;
  gap: 10px;
  margin: 14px;
  padding: 0 14px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
}

.luma-global-search__input-wrap:focus-within {
  border-color: var(--el-color-primary);
}

.luma-global-search__input-wrap input {
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--el-text-color-primary);
  background: transparent;
  font: inherit;
}

.luma-global-search__results {
  min-height: 0;
  margin: 0;
  padding: 0 10px 12px;
  overflow-y: auto;
  list-style: none;
}

.luma-global-search__results button {
  display: grid;
  width: 100%;
  min-height: 52px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: transparent;
  text-align: left;
}

.luma-global-search__results button:hover,
.luma-global-search__results button.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.luma-global-search__results button > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.luma-global-search__results strong,
.luma-global-search__results small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-global-search__results strong {
  font-size: var(--luma-font-size-base, 14px);
  font-weight: 600;
}

.luma-global-search__results small,
.luma-global-search__results code {
  color: var(--el-text-color-secondary);
  font-size: calc(var(--luma-font-size-base, 14px) - 2px);
}

.luma-global-search__results code {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-global-search__empty {
  margin: 0;
  padding: 28px 20px 36px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.luma-global-search__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  white-space: nowrap;
}

@media (max-width: 1024px) {
  .luma-global-search__trigger-label,
  .luma-global-search__trigger kbd {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .luma-global-search * {
    scroll-behavior: auto !important;
  }
}
</style>
