<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { LumaLayoutTabItem, LumaTabStyle } from './types'
import { LumaIcon } from '@luma/icons'
import Sortable from 'sortablejs'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'

type TabContextAction
  = | 'close'
    | 'close-all'
    | 'close-left'
    | 'close-others'
    | 'close-right'
    | 'maximize'
    | 'new-window'
    | 'pin'
    | 'refresh'

interface MenuState {
  path: string
  style: CSSProperties
  visible: boolean
}

const props = withDefaults(defineProps<{
  activePath?: string
  draggable?: boolean
  fullscreenTarget?: string
  middleClickToClose?: boolean
  showIcon?: boolean
  showMaximize?: boolean
  showMore?: boolean
  showRefresh?: boolean
  styleType?: LumaTabStyle
  tabs?: LumaLayoutTabItem[]
  visible?: boolean
  wheelable?: boolean
  /** 独立使用 LumaTabs（非 LumaLayout 内嵌）时启用原生 Fullscreen API 最大化。 */
  standaloneMaximize?: boolean
}>(), {
  activePath: '',
  draggable: true,
  fullscreenTarget: '[data-layout-fullscreen-target]',
  middleClickToClose: true,
  showIcon: true,
  showMaximize: true,
  showMore: true,
  showRefresh: true,
  styleType: 'chrome',
  standaloneMaximize: false,
  tabs: () => [],
  visible: true,
  wheelable: true,
})

const emit = defineEmits<{
  change: [path: string]
  closeAll: []
  closeLeft: [path: string]
  closeOthers: [path: string]
  closeRight: [path: string]
  maximize: [maximized: boolean]
  newWindow: [path: string]
  pin: [path: string, pinned: boolean]
  refresh: [path: string]
  remove: [path: string]
  reorder: [from: string, to: string]
}>()

const activePath = defineModel<string>('activePath', { default: '' })

/***********************本地状态*********************/
const tabsViewportRef = useTemplateRef<HTMLElement>('tabsViewportRef')
const contextMenu = shallowRef<MenuState>({ path: '', style: {}, visible: false })
const moreMenu = shallowRef<MenuState>({ path: '', style: {}, visible: false })
const isMaximized = shallowRef(false)
const showScrollButtons = shallowRef(false)
const scrollIsAtLeft = shallowRef(true)
const scrollIsAtRight = shallowRef(false)
let resizeObserver: ResizeObserver | undefined
let sortableInstance: Sortable | undefined
let returnFocusTo: HTMLElement | null = null

const openMenu = computed(() => (contextMenu.value.visible ? contextMenu.value : moreMenu.value))
const menuActivePath = computed(() => openMenu.value.path)

const isDesktop = computed(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true
  }
  return !window.matchMedia('(max-width: 768px)').matches
})

const draggableEnabled = computed(() => props.draggable && isDesktop.value)

const canCloseAny = computed(() => props.tabs.some(tab => tab.closable !== false && tab.pinned !== true))

/***********************标签约束*********************/
function canCloseTab(path: string): boolean {
  return props.tabs.length > 1
    && props.tabs.some(tab => tab.path === path && tab.closable !== false && tab.pinned !== true)
}

function canCloseInDirection(path: string, direction: 'left' | 'right'): boolean {
  const index = props.tabs.findIndex(tab => tab.path === path)
  const candidates = direction === 'left' ? props.tabs.slice(0, index) : props.tabs.slice(index + 1)
  return candidates.some(tab => tab.closable !== false && tab.pinned !== true)
}

function canCloseOthers(path: string): boolean {
  return props.tabs.some(tab => tab.path !== path && tab.closable !== false && tab.pinned !== true)
}

function isTabActive(path: string): boolean {
  return path === activePath.value
}

function canPin(path: string): boolean {
  const tab = props.tabs.find(item => item.path === path)
  return Boolean(tab) && tab!.pinned !== true && tab!.closable !== false
}

function canUnpin(path: string): boolean {
  const tab = props.tabs.find(item => item.path === path)
  return Boolean(tab) && tab!.pinned === true && tab!.closable !== false
}

function isContextActionDisabled(action: TabContextAction): boolean {
  const path = menuActivePath.value

  if (action === 'close') {
    return !canCloseTab(path)
  }
  if (action === 'close-left' || action === 'close-right') {
    if (!path || !isTabActive(path)) {
      return true
    }
    return !canCloseInDirection(path, action === 'close-left' ? 'left' : 'right')
  }
  if (action === 'close-others') {
    if (!path || !isTabActive(path)) {
      return true
    }
    return !canCloseOthers(path)
  }
  if (action === 'close-all') {
    return !canCloseAny.value
  }
  if (action === 'refresh') {
    if (!path || !isTabActive(path)) {
      return true
    }
    return false
  }
  if (action === 'pin') {
    // 当未固定时为“固定”、已固定且可取消时为“取消固定”，不可取消时始终禁用。
    return !canPin(path) && !canUnpin(path)
  }
  if (action === 'new-window') {
    return !path
  }
  if (action === 'maximize') {
    return false
  }
  return false
}

function menuPinLabel(path: string): string {
  return canUnpin(path) ? '取消固定' : '固定'
}

function menuMaximizeLabel(): string {
  return isMaximized.value ? '还原' : '内容最大化'
}

/***********************标签交互*********************/
function activateTab(path: string): void {
  if (path === activePath.value) {
    return
  }
  activePath.value = path
  emit('change', path)
}

function closeTabAction(path: string): void {
  if (canCloseTab(path)) {
    emit('remove', path)
  }
}

function refreshTab(path: string): void {
  if (path && isTabActive(path)) {
    emit('refresh', path)
  }
}

function handleTabMouseDown(event: MouseEvent, tab: LumaLayoutTabItem): void {
  if (event.button !== 1 || !props.middleClickToClose || !canCloseTab(tab.path)) {
    return
  }

  event.preventDefault()
  emit('remove', tab.path)
}

function handleTabKeydown(event: KeyboardEvent, index: number): void {
  const supportedKeys = ['ArrowLeft', 'ArrowRight', 'End', 'Home']
  if (!supportedKeys.includes(event.key) || props.tabs.length === 0) {
    return
  }

  event.preventDefault()
  const nextIndex = event.key === 'Home'
    ? 0
    : event.key === 'End'
      ? props.tabs.length - 1
      : event.key === 'ArrowLeft'
        ? (index - 1 + props.tabs.length) % props.tabs.length
        : (index + 1) % props.tabs.length
  const nextTab = props.tabs[nextIndex]

  if (!nextTab) {
    return
  }

  activateTab(nextTab.path)
  void nextTick(() => {
    tabsViewportRef.value
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      .item(nextIndex)
      .focus()
  })
}

/***********************菜单*********************/
const MENU_WIDTH = 192
const MENU_MIN_HEIGHT = 220

function clampMenuPosition(clientX: number, clientY: number): CSSProperties {
  return {
    left: `${Math.max(8, Math.min(clientX, window.innerWidth - MENU_WIDTH - 8))}px`,
    top: `${Math.max(8, Math.min(clientY, window.innerHeight - MENU_MIN_HEIGHT - 8))}px`,
  }
}

function closeAllMenus(): void {
  contextMenu.value = { ...contextMenu.value, visible: false }
  moreMenu.value = { ...moreMenu.value, visible: false }
}

function openContextMenu(event: MouseEvent, path: string): void {
  event.preventDefault()
  event.stopPropagation()
  returnFocusTo = event.currentTarget as HTMLElement
  contextMenu.value = {
    path,
    style: clampMenuPosition(event.clientX, event.clientY),
    visible: true,
  }
  moreMenu.value = { ...moreMenu.value, visible: false }
}

function openMoreMenu(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  const path = activePath.value || props.tabs[0]?.path || ''
  returnFocusTo = event.currentTarget as HTMLElement
  moreMenu.value = {
    path,
    style: clampMenuPosition(event.clientX, event.clientY),
    visible: true,
  }
  contextMenu.value = { ...contextMenu.value, visible: false }
}

function restoreFocus(): void {
  if (returnFocusTo && document.body.contains(returnFocusTo)) {
    returnFocusTo.focus()
    returnFocusTo = null
  }
}

function handleContextAction(action: TabContextAction): void {
  if (isContextActionDisabled(action)) {
    return
  }

  const path = menuActivePath.value
  closeAllMenus()

  if (action === 'close') {
    emit('remove', path)
  }
  else if (action === 'close-left') {
    emit('closeLeft', path)
  }
  else if (action === 'close-right') {
    emit('closeRight', path)
  }
  else if (action === 'close-others') {
    emit('closeOthers', path)
  }
  else if (action === 'close-all') {
    emit('closeAll')
  }
  else if (action === 'refresh') {
    emit('refresh', path)
  }
  else if (action === 'pin') {
    emit('pin', path, !canUnpin(path))
  }
  else if (action === 'new-window') {
    emit('newWindow', path)
  }
  else if (action === 'maximize') {
    toggleMaximize()
  }

  void nextTick(restoreFocus)
}

function handleMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeAllMenus()
    void nextTick(restoreFocus)
    return
  }

  const items = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-menu-active="true"] [role="menuitem"]:not(:disabled)'),
  )
  if (items.length === 0) {
    return
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    const current = items.findIndex(item => item === document.activeElement)
    let nextIndex: number
    if (event.key === 'ArrowDown') {
      nextIndex = current === -1 ? 0 : (current + 1) % items.length
    }
    else if (event.key === 'ArrowUp') {
      nextIndex = current === -1 ? items.length - 1 : (current - 1 + items.length) % items.length
    }
    else if (event.key === 'Home') {
      nextIndex = 0
    }
    else {
      nextIndex = items.length - 1
    }
    items[nextIndex]?.focus()
  }
}

/***********************滚动状态*********************/
function syncScrollState(): void {
  const viewport = tabsViewportRef.value
  if (!viewport) {
    return
  }

  showScrollButtons.value = viewport.scrollWidth > viewport.clientWidth + 1
  scrollIsAtLeft.value = viewport.scrollLeft <= 1
  scrollIsAtRight.value = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 1
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function scrollTabs(direction: 'left' | 'right'): void {
  const viewport = tabsViewportRef.value
  if (!viewport) {
    return
  }

  viewport.scrollBy({
    behavior: scrollBehavior(),
    left: (direction === 'left' ? -1 : 1) * Math.max(160, viewport.clientWidth - 120),
  })
}

function handleWheel(event: WheelEvent): void {
  if (!props.wheelable) {
    return
  }
  const viewport = tabsViewportRef.value
  if (!viewport || !showScrollButtons.value) {
    return
  }

  event.preventDefault()
  viewport.scrollBy({
    left: Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX,
  })
}

async function scrollActiveTabIntoView(): Promise<void> {
  await nextTick()
  const activeTab = tabsViewportRef.value?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
  activeTab?.scrollIntoView({
    behavior: scrollBehavior(),
    block: 'nearest',
    inline: 'nearest',
  })
  syncScrollState()
}

/***********************拖拽*********************/
function ensureSortable(): void {
  const list = tabsViewportRef.value?.querySelector<HTMLElement>('.luma-tabs__list')
  if (!list || !draggableEnabled.value) {
    destroySortable()
    return
  }
  if (sortableInstance && sortableInstance.el === list) {
    return
  }

  destroySortable()
  sortableInstance = Sortable.create(list, {
    animation: 160,
    draggable: '.luma-tabs__item',
    filter: '.is-not-draggable',
    ghostClass: 'luma-tabs__item--ghost',
    chosenClass: 'luma-tabs__item--chosen',
    onEnd: (event) => {
      if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex) {
        return
      }
      const from = props.tabs[event.oldIndex]?.path
      const to = props.tabs[event.newIndex]?.path
      if (!from || !to) {
        return
      }
      emit('reorder', from, to)
    },
  })
}

function destroySortable(): void {
  sortableInstance?.destroy()
  sortableInstance = undefined
}

watch(draggableEnabled, (enabled) => {
  if (enabled) {
    void nextTick(ensureSortable)
  }
  else {
    destroySortable()
  }
})

/***********************最大化*********************/
/** 应用内内容最大化（LumaLayout 内嵌）：仅由父组件通过事件统一控制 UI 显隐。 */
function toggleMaximize(): void {
  if (props.standaloneMaximize) {
    void toggleStandaloneFullscreen()
    return
  }
  isMaximized.value = !isMaximized.value
  emit('maximize', isMaximized.value)
}

async function toggleStandaloneFullscreen(): Promise<void> {
  const target = document.querySelector(props.fullscreenTarget)
  if (!(target instanceof HTMLElement)) {
    return
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen?.()
  }
  else {
    await target.requestFullscreen?.()
  }
}

function handleFullscreenChange(): void {
  isMaximized.value = Boolean(document.fullscreenElement) && props.standaloneMaximize
  if (props.standaloneMaximize) {
    emit('maximize', isMaximized.value)
  }
}

function setMaximizedState(value: boolean): void {
  if (!props.standaloneMaximize) {
    isMaximized.value = value
  }
}

defineExpose({
  getTabsElement: () => tabsViewportRef.value,
  refreshCurrent: () => refreshTab(activePath.value),
  scrollTabs,
  toggleFullscreen: toggleMaximize,
  setMaximized: setMaximizedState,
})

watch(
  () => [props.activePath, props.tabs.length],
  () => void scrollActiveTabIntoView(),
  { flush: 'post' },
)

watch(
  () => props.tabs,
  () => void nextTick(syncScrollState),
  { flush: 'post' },
)

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (!target) {
    return
  }
  if (target.closest?.('.luma-tabs-context-menu') || target.closest?.('[data-tab-menu-trigger]')) {
    return
  }
  closeAllMenus()
}

function handleDocumentKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && openMenu.value.visible) {
    event.preventDefault()
    closeAllMenus()
    void nextTick(restoreFocus)
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('keydown', handleDocumentKeydown)
  syncScrollState()

  if (typeof ResizeObserver !== 'undefined' && tabsViewportRef.value) {
    resizeObserver = new ResizeObserver(syncScrollState)
    resizeObserver.observe(tabsViewportRef.value)
  }

  if (draggableEnabled.value) {
    void nextTick(ensureSortable)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('keydown', handleDocumentKeydown)
  resizeObserver?.disconnect()
  destroySortable()
})
</script>

<template>
  <div
    v-if="visible && tabs.length"
    class="luma-tabs"
    :class="[`is-style-${styleType}`]"
  >
    <button
      v-show="showScrollButtons"
      class="luma-tabs__tool"
      type="button"
      aria-label="向左滚动标签"
      :disabled="scrollIsAtLeft"
      @click="scrollTabs('left')"
    >
      <LumaIcon name="luma:chevron-left" :size="16" />
    </button>

    <div
      ref="tabsViewportRef"
      class="luma-tabs__viewport"
      @scroll="syncScrollState"
      @wheel="handleWheel"
    >
      <TransitionGroup name="luma-tab" tag="div" class="luma-tabs__list" role="tablist" aria-label="页面标签">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.path"
          class="luma-tabs__item"
          :class="{
            'is-active': tab.path === activePath,
            'is-pinned': tab.pinned === true,
            'is-not-draggable': tab.pinned === true || !draggableEnabled,
          }"
          @contextmenu="openContextMenu($event, tab.path)"
        >
          <button
            class="luma-tabs__tab"
            type="button"
            role="tab"
            :aria-selected="tab.path === activePath"
            :tabindex="tab.path === activePath ? 0 : -1"
            @click="activateTab(tab.path)"
            @keydown="handleTabKeydown($event, index)"
            @mousedown="handleTabMouseDown($event, tab)"
          >
            <LumaIcon
              v-if="tab.pinned === true"
              class="luma-tabs__pin"
              name="luma:pin"
              :size="14"
            />
            <LumaIcon v-else-if="showIcon && tab.icon" :name="tab.icon" :size="14" />
            <span class="luma-tabs__label" :title="tab.title">{{ tab.title }}</span>
          </button>
          <button
            v-if="canCloseTab(tab.path)"
            class="luma-tabs__close"
            type="button"
            :aria-label="`关闭${tab.title}`"
            @click="closeTabAction(tab.path)"
          >
            <LumaIcon name="luma:close" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>

    <button
      v-show="showScrollButtons"
      class="luma-tabs__tool"
      type="button"
      aria-label="向右滚动标签"
      :disabled="scrollIsAtRight"
      @click="scrollTabs('right')"
    >
      <LumaIcon name="luma:chevron-right" :size="16" />
    </button>

    <button
      v-if="showRefresh"
      class="luma-tabs__tool"
      type="button"
      aria-label="刷新当前页面"
      data-action="refresh-current-tab"
      :disabled="!activePath"
      @click="refreshTab(activePath)"
    >
      <LumaIcon name="luma:refresh" :size="16" />
    </button>

    <button
      v-if="showMore"
      class="luma-tabs__tool"
      type="button"
      aria-label="更多操作"
      data-tab-menu-trigger
      @click="openMoreMenu($event)"
    >
      <LumaIcon name="luma:more" :size="16" />
    </button>

    <button
      v-if="showMaximize"
      class="luma-tabs__tool"
      type="button"
      :aria-label="isMaximized ? '退出内容最大化' : '内容最大化'"
      @click="toggleMaximize"
    >
      <LumaIcon :name="isMaximized ? 'luma:restore' : 'luma:maximize'" :size="16" />
    </button>

    <Teleport to="body">
      <div
        v-if="contextMenu.visible || moreMenu.visible"
        class="luma-tabs-context-menu"
        role="menu"
        :data-menu-active="true"
        :style="openMenu.style"
        @click.stop
        @keydown="handleMenuKeydown"
      >
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('refresh')" @click="handleContextAction('refresh')">
          <LumaIcon name="luma:refresh" :size="14" /><span>重新加载</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('pin')" @click="handleContextAction('pin')">
          <LumaIcon :name="canUnpin(menuActivePath) ? 'luma:pin-off' : 'luma:pin'" :size="14" /><span>{{ menuPinLabel(menuActivePath) }}</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('maximize')" @click="handleContextAction('maximize')">
          <LumaIcon :name="isMaximized ? 'luma:restore' : 'luma:maximize'" :size="14" /><span>{{ menuMaximizeLabel() }}</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('new-window')" @click="handleContextAction('new-window')">
          <LumaIcon name="luma:external-link" :size="14" /><span>在新窗口打开</span>
        </button>
        <span class="luma-tabs-context-menu__divider" />
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('close')" @click="handleContextAction('close')">
          <LumaIcon name="luma:close" :size="14" /><span>关闭</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('close-left')" @click="handleContextAction('close-left')">
          <LumaIcon name="luma:chevron-left" :size="14" /><span>关闭左侧</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('close-right')" @click="handleContextAction('close-right')">
          <LumaIcon name="luma:chevron-right" :size="14" /><span>关闭右侧</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('close-others')" @click="handleContextAction('close-others')">
          <LumaIcon name="luma:close" :size="14" /><span>关闭其他</span>
        </button>
        <button type="button" role="menuitem" :disabled="isContextActionDisabled('close-all')" @click="handleContextAction('close-all')">
          <LumaIcon name="luma:close" :size="14" /><span>关闭全部</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.luma-tabs {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  height: var(--luma-tabbar-height);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.luma-tabs__viewport {
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.luma-tabs__viewport::-webkit-scrollbar {
  display: none;
}

.luma-tabs__list {
  display: flex;
  width: max-content;
  min-width: 100%;
  height: 100%;
  align-items: stretch;
  gap: 2px;
  padding: 3px 6px 0;
  box-sizing: border-box;
}

.luma-tabs__item {
  position: relative;
  display: flex;
  min-width: 88px;
  max-width: min(240px, 32vw);
  align-items: center;
  border-radius: var(--luma-radius-small) var(--luma-radius-small) 0 0;
  color: var(--el-text-color-regular);
  transition:
    color var(--luma-motion-duration-fast) var(--luma-easing-standard),
    background-color var(--luma-motion-duration-fast) var(--luma-easing-standard);
}

.luma-tabs__item:hover {
  background: var(--el-fill-color-light);
}

.luma-tabs__tab {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  align-items: center;
  gap: 5px;
  padding: 0 26px 0 10px;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.luma-tabs__tab:focus-visible,
.luma-tabs__tool:focus-visible,
.luma-tabs__close:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.luma-tabs__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-tabs__close {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  width: 18px;
  height: 18px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  background: transparent;
  cursor: pointer;
}

.luma-tabs__close:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color);
}

.luma-tabs__tool {
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 100%;
  place-items: center;
  padding: 0;
  border: 0;
  border-left: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  background: transparent;
  cursor: pointer;
}

.luma-tabs__tool:hover:not(:disabled) {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.luma-tabs__tool:disabled {
  cursor: default;
  opacity: 0.35;
}

.luma-tabs__item--ghost {
  opacity: 0.4;
}

.luma-tabs__item--chosen {
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}

/***********************Chrome 风格*********************/
.luma-tabs.is-style-chrome .luma-tabs__item.is-active {
  position: relative;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 -2px var(--el-color-primary);
}

.luma-tabs.is-style-chrome .luma-tabs__item.is-active::before,
.luma-tabs.is-style-chrome .luma-tabs__item.is-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  width: 8px;
  height: 8px;
  pointer-events: none;
}

.luma-tabs.is-style-chrome .luma-tabs__item.is-active::before {
  left: -8px;
  border-bottom-right-radius: 8px;
  box-shadow: 2px 2px 0 0 var(--el-color-primary-light-9);
}

.luma-tabs.is-style-chrome .luma-tabs__item.is-active::after {
  right: -8px;
  border-bottom-left-radius: 8px;
  box-shadow: -2px 2px 0 0 var(--el-color-primary-light-9);
}

.luma-tabs.is-style-chrome .luma-tabs__list > .luma-tabs__item.is-active + .luma-tabs__item .luma-tabs__tab::before {
  display: none;
}

.luma-tabs.is-style-chrome .luma-tabs__list > .luma-tabs__item + .luma-tabs__item .luma-tabs__tab::before {
  content: '';
  position: absolute;
  top: 12px;
  bottom: 10px;
  left: -3px;
  width: 1px;
  background: var(--el-border-color-light);
}

.luma-tabs.is-style-chrome .luma-tabs__list > .luma-tabs__item.is-active + .luma-tabs__item .luma-tabs__tab::before,
.luma-tabs.is-style-chrome .luma-tabs__list > .luma-tabs__item + .luma-tabs__item.is-active .luma-tabs__tab::before {
  display: none;
}

/***********************Plain 风格*********************/
.luma-tabs.is-style-plain .luma-tabs__item.is-active {
  color: var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
}

.luma-tabs.is-style-plain .luma-tabs__list > .luma-tabs__item + .luma-tabs__item {
  border-left: 1px solid var(--el-border-color-lighter);
}

/***********************Card 风格*********************/
.luma-tabs.is-style-card .luma-tabs__item {
  border: 1px solid transparent;
  border-radius: var(--luma-radius-small);
}

.luma-tabs.is-style-card .luma-tabs__item.is-active {
  border-color: var(--el-border-color-light);
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.luma-tabs.is-style-card .luma-tabs__item:not(.is-active) {
  background: var(--el-fill-color-light);
}

.luma-tabs.is-style-card .luma-tabs__list {
  gap: 4px;
  padding-top: 4px;
}

/***********************Brisk 风格*********************/
.luma-tabs.is-style-brisk .luma-tabs__item.is-active {
  color: var(--el-color-primary);
}

.luma-tabs.is-style-brisk .luma-tabs__item.is-active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 14px;
  right: 14px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-color-primary);
  transform-origin: center;
  animation: luma-tab-brisk-underline 160ms var(--luma-easing-standard);
}

@keyframes luma-tab-brisk-underline {
  from {
    transform: scaleX(0.2);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

/***********************拖拽光标与固定项视觉*********************/
.luma-tabs__item.is-pinned .luma-tabs__tab {
  cursor: default;
}

.luma-tabs__item.is-not-draggable {
  cursor: default;
}

@media (pointer: coarse) {
  .luma-tabs__item.is-not-draggable,
  .luma-tabs__item {
    cursor: default;
  }
}

@media (max-width: 768px) {
  .luma-tabs {
    height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .luma-tabs__item {
    transition: none;
  }
  .luma-tabs.is-style-brisk .luma-tabs__item.is-active::after {
    animation: none;
  }
}

/***********************TransitionGroup 动画*********************/
.luma-tab-enter-active,
.luma-tab-leave-active {
  transition:
    opacity 160ms var(--luma-easing-standard),
    transform 160ms var(--luma-easing-standard);
}

.luma-tab-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.luma-tab-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

.luma-tab-move {
  transition: transform 160ms var(--luma-easing-standard);
}

@media (prefers-reduced-motion: reduce) {
  .luma-tab-enter-active,
  .luma-tab-leave-active,
  .luma-tab-move {
    transition: none;
  }
}
</style>

<style lang="scss">
.luma-tabs-context-menu {
  position: fixed;
  z-index: var(--luma-z-context-menu);
  display: grid;
  min-width: 168px;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--luma-radius-base);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--luma-shadow-base);
  transform-origin: top left;
  animation: luma-tab-menu-in 140ms var(--luma-easing-standard);
}

@keyframes luma-tab-menu-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.luma-tabs-context-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 0;
  border-radius: var(--luma-radius-small);
  color: var(--el-text-color-regular);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.luma-tabs-context-menu button:hover:not(:disabled) {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.luma-tabs-context-menu button:disabled {
  color: var(--el-text-color-placeholder);
  cursor: not-allowed;
}

.luma-tabs-context-menu button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.luma-tabs-context-menu__divider {
  height: 1px;
  margin: 4px 6px;
  background: var(--el-border-color-lighter);
}

@media (prefers-reduced-motion: reduce) {
  .luma-tabs-context-menu {
    animation: none;
  }
}
</style>
