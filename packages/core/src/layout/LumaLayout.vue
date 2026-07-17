<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import type { LumaPreferences } from '../theme/types'
import type {
  LumaLayoutMenuItem,
  LumaLayoutRouteTabFilter,
  LumaLayoutRouteTabResolver,
  LumaLayoutTabItem,
} from './types'
import { ElContainer } from 'element-plus'
import { computed, inject, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { routeLocationKey, routerKey } from 'vue-router'
import LumaBreadcrumb from './LumaBreadcrumb.vue'
import LumaContent from './LumaContent.vue'
import LumaGlobalSearch from './LumaGlobalSearch.vue'
import LumaHeader from './LumaHeader.vue'
import LumaSidebar from './LumaSidebar.vue'
import LumaTabs from './LumaTabs.vue'
import LumaTopNav from './LumaTopNav.vue'
import {
  findMenuItemByPath,
  resolveActiveTopMenuPath,
  resolveNavigationTarget,
  splitMenusByLayout,
} from './state/menu-layout'
import {
  clearTabSnapshot,
  readTabSnapshot,
  restoreTabsFromSnapshot,
  serializeTabSnapshot,
  writeTabSnapshot,
} from './state/tab-storage'
import {
  appendTab,
  clampTabCount,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  closeTabsLeft,
  closeTabsRight,
  pinTab,
  pushVisitHistory,
  reorderTab,
  resolveNextActivePath,
  sortTabsByPinned,
  unpinTab,
} from './state/tab-strategy'

/***********************属性定义*********************/
const props = withDefaults(defineProps<{
  title?: string
  menus?: LumaLayoutMenuItem[]
  preferences: LumaPreferences
  tabs?: LumaLayoutTabItem[]
  activeMenuPath?: string
  activeTabPath?: string
  routeDriven?: boolean
  routeTabFilter?: LumaLayoutRouteTabFilter
  routeTabResolver?: LumaLayoutRouteTabResolver
  tabFallbackPath?: string
  tabMaxCount?: number
  fixedTabs?: LumaLayoutTabItem[]
  headerHeight?: string
  /** 是否显示顶部 Header。内嵌到其他壳层时可置为 false 以隐藏。 */
  showHeader?: boolean
  tabStorageKey?: string
  /** 解析当前路由是否应保留为可恢复标签（路由驱动模式下用于持久化恢复过滤）。 */
  isValidTabPath?: (path: string) => boolean
  /** 标签在新窗口打开时生成的地址，默认为路由 fullPath。 */
  resolveTabUrl?: (path: string) => string
}>(), {
  activeMenuPath: '',
  activeTabPath: '',
  headerHeight: '64px',
  showHeader: true,
  menus: () => [],
  fixedTabs: () => [],
  routeDriven: false,
  tabFallbackPath: '',
  tabStorageKey: '',
  tabs: () => [],
})

const emit = defineEmits<{
  menuSelect: [path: string]
  topMenuSelect: [path: string]
  toggleSidebar: []
  tabChange: [path: string]
  tabCloseAll: []
  tabCloseLeft: [path: string]
  tabCloseOthers: [path: string]
  tabCloseRight: [path: string]
  tabRefresh: [path: string]
  tabRemove: [path: string]
  tabPin: [path: string, pinned: boolean]
  tabReorder: [from: string, to: string]
  tabMaximize: [maximized: boolean]
  tabNewWindow: [path: string]
}>()

const activeTabPathModel = defineModel<string>('activeTabPath')
const injectedRoute = inject(routeLocationKey, undefined)
const injectedRouter = inject(routerKey, undefined)

/***********************模板引用*********************/
const layoutRef = useTemplateRef<ComponentPublicInstance>('layoutRef')
const tabsRef = useTemplateRef<InstanceType<typeof LumaTabs>>('tabsRef')
const isMobileViewport = shallowRef(false)
const mobileMenuOpen = shallowRef(false)
const isContentMaximized = shallowRef(false)
const routeTabs = shallowRef<LumaLayoutTabItem[]>([])
const visitHistory = shallowRef<string[]>([])
const resolvedTabMaxCount = computed(() => props.tabMaxCount ?? props.preferences.tabbar.maxCount)
let mobileMediaQuery: MediaQueryList | undefined

/***********************布局状态*********************/
function defaultRouteTabFilter(route: RouteLocationNormalizedLoaded): boolean {
  return route.meta.layout !== 'public' && route.meta.hideInTab !== true && Boolean(route.meta.title)
}

function defaultRouteTabResolver(route: RouteLocationNormalizedLoaded): LumaLayoutTabItem | undefined {
  const title = typeof route.meta.title === 'string' ? route.meta.title : undefined
  if (!title) {
    return undefined
  }

  return {
    closable: route.meta.affixTab !== true,
    icon: typeof route.meta.icon === 'string' ? route.meta.icon : undefined,
    path: route.path,
    title,
  }
}

function normalizeFixedTabs(): LumaLayoutTabItem[] {
  return props.fixedTabs.map(tab => ({ ...tab, closable: false, pinned: true }))
}

function normalizeTabForStore(tab: LumaLayoutTabItem): LumaLayoutTabItem {
  return {
    closable: tab.closable !== false,
    icon: tab.icon,
    path: tab.path,
    pinned: tab.pinned === true,
    title: tab.title,
  }
}

function resolveValidPathFilter(): ((path: string) => boolean) | undefined {
  if (props.isValidTabPath) {
    return props.isValidTabPath
  }
  if (!injectedRouter || !props.routeDriven) {
    return undefined
  }
  return (path: string) => {
    try {
      const resolved = injectedRouter.resolve(path)
      const matched = resolved?.matched ?? []
      const target = matched[matched.length - 1]
      if (!target) {
        return false
      }
      return target.meta?.layout !== 'public' && target.meta?.hideInTab !== true
    }
    catch {
      return false
    }
  }
}

function resolveTabInfo(path: string): Partial<LumaLayoutTabItem> | undefined {
  if (!injectedRouter || !props.routeDriven) {
    return undefined
  }
  try {
    const route = injectedRouter.resolve(path)
    const matched = route?.matched ?? []
    const target = matched[matched.length - 1]
    const title = typeof target?.meta?.title === 'string' ? target.meta.title : undefined
    const icon = typeof target?.meta?.icon === 'string' ? target.meta.icon : undefined
    if (!title && !icon) {
      return undefined
    }
    return { icon, title }
  }
  catch {
    return undefined
  }
}

function syncRouteTabs(route: RouteLocationNormalizedLoaded): void {
  if (!props.routeDriven) {
    return
  }
  const filter = props.routeTabFilter ?? defaultRouteTabFilter
  if (!filter(route)) {
    return
  }

  const resolver = props.routeTabResolver ?? defaultRouteTabResolver
  const tab = resolver(route)
  if (!tab) {
    return
  }

  const fixedTabs = normalizeFixedTabs()
  const fixedPaths = new Set(fixedTabs.map(item => item.path))
  const existingTabs = routeTabs.value.filter(item => !fixedPaths.has(item.path))

  const next = appendTab([...fixedTabs, ...existingTabs], tab, { maxCount: resolvedTabMaxCount.value })
  routeTabs.value = next

  if (props.preferences.tabbar.visitHistory) {
    visitHistory.value = pushVisitHistory(visitHistory.value, route.path)
  }

  maybeWriteSnapshot()
}

function navigateRoute(path: string): void {
  if (props.routeDriven && injectedRouter && path && path !== injectedRoute?.path) {
    void injectedRouter.push(path)
  }
}

function resolveFallbackPath(tabs: LumaLayoutTabItem[]): string {
  if (props.tabFallbackPath) {
    return props.tabFallbackPath
  }
  return tabs[0]?.path ?? ''
}

const currentActiveTabPath = computed({
  get: () => props.routeDriven ? injectedRoute?.path ?? props.activeTabPath : activeTabPathModel.value ?? props.activeTabPath,
  set: (value) => {
    if (props.routeDriven) {
      navigateRoute(value)
    }
    else {
      activeTabPathModel.value = value
    }
  },
})

const currentTabs = computed(() => props.routeDriven ? routeTabs.value : props.tabs)
const hasTabs = computed(() => currentTabs.value.length > 0)
const collapsed = computed(() => props.preferences.sidebar.collapsed)
const routeActiveMenuPath = computed(() => typeof injectedRoute?.meta.activeMenu === 'string'
  ? injectedRoute.meta.activeMenu
  : '')
const resolvedActiveMenuPath = computed(() => {
  const routePath = injectedRoute?.path || currentActiveTabPath.value
  const activeMenu = routeActiveMenuPath.value

  if (activeMenu && findMenuItemByPath(props.menus, activeMenu)) {
    return activeMenu
  }
  if (routePath && findMenuItemByPath(props.menus, routePath)) {
    return routePath
  }
  if (props.activeMenuPath && findMenuItemByPath(props.menus, props.activeMenuPath)) {
    return props.activeMenuPath
  }

  return props.activeMenuPath || routePath
})
const resolvedCurrentPath = computed(() => injectedRoute?.path || currentActiveTabPath.value || resolvedActiveMenuPath.value)
const breadcrumbPreferences = computed(() => ({
  enable: props.preferences.breadcrumb?.enable ?? true,
  hideOnlyOne: props.preferences.breadcrumb?.hideOnlyOne ?? false,
  showHome: props.preferences.breadcrumb?.showHome ?? true,
  showIcon: props.preferences.breadcrumb?.showIcon ?? true,
}))
const globalSearchEnabled = computed(() => props.preferences.header.globalSearch ?? true)
const globalSearchShortcutEnabled = computed(() => props.preferences.shortcutKeys?.globalSearch ?? true)
const resolvedActiveTopMenuPath = computed(() => resolveActiveTopMenuPath(props.menus, resolvedActiveMenuPath.value))
const resolvedMenus = computed(() => {
  const menus = splitMenusByLayout({
    activeTopMenuPath: resolvedActiveTopMenuPath.value,
    layout: props.preferences.app.layout,
    menus: props.menus,
  })

  return {
    ...menus,
    sidebarMenus: props.preferences.sidebar.enable ? menus.sidebarMenus : [],
  }
})
const sidebarMenus = computed(() => resolvedMenus.value.sidebarMenus)
const topMenus = computed(() => resolvedMenus.value.topMenus)
const hasSidebar = computed(() => sidebarMenus.value.length > 0)
const hasTopMenus = computed(() => topMenus.value.length > 0)
const showHeaderBreadcrumb = computed(() => (
  breadcrumbPreferences.value.enable
  && hasSidebar.value
  && !hasTopMenus.value
))
const resolvedTopMenuMode = computed(() => props.preferences.app.layout === 'mixed-nav' ? 'flat' : 'tree')
const resolvedTopMenuActivePath = computed(() => (
  props.preferences.app.layout === 'top-nav'
    ? resolvedActiveMenuPath.value
    : resolvedActiveTopMenuPath.value
))
const mobileMenus = computed(() => hasTopMenus.value ? topMenus.value : sidebarMenus.value)
const hasMobileMenus = computed(() => mobileMenus.value.some(item => !item.hidden))

watch(
  () => [props.preferences.app.dynamicTitle ?? true, injectedRoute?.meta.title, props.title] as const,
  ([enabled, routeTitle, appTitle]) => {
    if (typeof document === 'undefined') {
      return
    }

    const pageTitle = typeof routeTitle === 'string' ? routeTitle.trim() : ''
    const title = appTitle?.trim() ?? ''
    if (!enabled) {
      document.title = title
      return
    }
    if (!pageTitle && !title) {
      return
    }
    document.title = pageTitle && title && pageTitle !== title
      ? `${pageTitle} - ${title}`
      : pageTitle || title
  },
  { immediate: true },
)

/***********************快照持久化*********************/
function resolveSnapshotStorage(): { getItem: (key: string) => string | null, removeItem: (key: string) => void, setItem: (key: string, value: string) => void } | undefined {
  if (!props.tabStorageKey || !props.preferences.tabbar.persist) {
    return undefined
  }
  if (typeof sessionStorage === 'undefined') {
    return undefined
  }
  return {
    getItem: sessionStorage.getItem.bind(sessionStorage),
    removeItem: sessionStorage.removeItem.bind(sessionStorage),
    setItem: sessionStorage.setItem.bind(sessionStorage),
  }
}

function maybeWriteSnapshot(): void {
  const storage = resolveSnapshotStorage()
  if (!storage || !props.tabStorageKey || !props.routeDriven) {
    return
  }
  const snapshot = serializeTabSnapshot({
    tabs: routeTabs.value.map(normalizeTabForStore),
    history: visitHistory.value,
  })
  writeTabSnapshot(storage, props.tabStorageKey, snapshot)
}

function maybeClearSnapshot(): void {
  const storage = resolveSnapshotStorage()
  if (!storage || !props.tabStorageKey) {
    return
  }
  clearTabSnapshot(storage, props.tabStorageKey)
}

function restoreFromSnapshot(): void {
  if (!props.routeDriven) {
    return
  }
  const storage = resolveSnapshotStorage()
  if (!storage || !props.tabStorageKey) {
    return
  }
  const snapshot = readTabSnapshot(storage, props.tabStorageKey)
  const currentPath = injectedRoute?.path ?? ''
  const currentTab = injectedRoute ? (props.routeTabResolver ?? defaultRouteTabResolver)(injectedRoute) : undefined
  const restored = restoreTabsFromSnapshot(snapshot, {
    currentPath,
    currentTab,
    fixedTabs: normalizeFixedTabs(),
    isValidPath: resolveValidPathFilter(),
    resolveTab: resolveTabInfo,
  })

  // 合并固定组稳定性：固定标签路由声明部分应该是固定的；非固定用户固定标签持久化也保留。
  routeTabs.value = restored.tabs
  if (props.preferences.tabbar.visitHistory) {
    if (currentPath) {
      restored.history.unshift(currentPath)
    }
    visitHistory.value = pushVisitHistory(restored.history, currentPath || '')
  }
  else {
    visitHistory.value = []
  }
}

function syncMobileViewport(event?: MediaQueryListEvent): void {
  isMobileViewport.value = event?.matches ?? mobileMediaQuery?.matches ?? false

  if (isMobileViewport.value) {
    mobileMenuOpen.value = false
  }
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  mobileMediaQuery = window.matchMedia('(max-width: 768px)')
  syncMobileViewport()
  mobileMediaQuery.addEventListener?.('change', syncMobileViewport)
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener?.('change', syncMobileViewport)
})

watch(
  () => [props.routeDriven, resolvedTabMaxCount.value, props.fixedTabs] as const,
  () => {
    if (!props.routeDriven) {
      routeTabs.value = []
      return
    }

    const fixedTabs = normalizeFixedTabs()
    const fixedPaths = new Set(fixedTabs.map(tab => tab.path))
    let nextTabs = [...fixedTabs]

    for (const tab of routeTabs.value.filter(tab => !fixedPaths.has(tab.path))) {
      nextTabs = appendTab(nextTabs, tab, { maxCount: resolvedTabMaxCount.value })
    }

    routeTabs.value = clampTabCount(sortTabsByPinned(nextTabs), resolvedTabMaxCount.value, currentActiveTabPath.value)
    maybeWriteSnapshot()
  },
  { deep: true, immediate: true },
)

watch(
  () => injectedRoute?.fullPath,
  () => {
    if (injectedRoute) {
      syncRouteTabs(injectedRoute)
    }
  },
  { immediate: true },
)

watch(
  () => [props.routeDriven, props.tabStorageKey, props.preferences.tabbar.persist] as const,
  (value, prev) => {
    const driven = value[0]
    const persist = value[2]
    const wasPersist = prev?.[1] && prev?.[2]
    if (driven && persist && !wasPersist) {
      restoreFromSnapshot()
    }
    if (!persist && wasPersist) {
      maybeClearSnapshot()
    }
  },
  { immediate: false },
)

onBeforeUnmount(() => {
  maybeWriteSnapshot()
})

/***********************事件处理*********************/
function handleToggleCollapse(): void {
  if (isMobileViewport.value) {
    mobileMenuOpen.value = !mobileMenuOpen.value
    return
  }

  emit('toggleSidebar')
}

function handleMenuSelect(path: string): void {
  mobileMenuOpen.value = false
  emit('menuSelect', path)
}

function handleTopMenuSelect(path: string): void {
  const item = findMenuItemByPath(props.menus, path)
  const target = resolveNavigationTarget(item) || path

  emit('topMenuSelect', path)
  handleMenuSelect(target)
}

function handleDiscoverySelect(path: string): void {
  const item = findMenuItemByPath(props.menus, path)
  handleMenuSelect(resolveNavigationTarget(item) || path)
}

function handleTabChange(path: string): void {
  emit('tabChange', path)
}

function handleTabRemove(path: string): void {
  if (props.routeDriven) {
    const priorClosedIndex = routeTabs.value.findIndex(tab => tab.path === path)
    const nextTabs = closeTab(routeTabs.value, path)
    routeTabs.value = nextTabs
    if (currentActiveTabPath.value === path) {
      const useHistory = props.preferences.tabbar.visitHistory
      const next = resolveNextActivePath(nextTabs, path, visitHistory.value, { useHistory, priorClosedIndex })
      navigateRoute(next || resolveFallbackPath(nextTabs))
    }
    maybeWriteSnapshot()
  }
  emit('tabRemove', path)
}

function handleTabCloseLeft(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeTabsLeft(routeTabs.value, path)
    navigateRoute(path)
    maybeWriteSnapshot()
  }
  emit('tabCloseLeft', path)
}

function handleTabCloseRight(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeTabsRight(routeTabs.value, path)
    navigateRoute(path)
    maybeWriteSnapshot()
  }
  emit('tabCloseRight', path)
}

function handleTabCloseOthers(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeOtherTabs(routeTabs.value, path)
    navigateRoute(path)
    maybeWriteSnapshot()
  }
  emit('tabCloseOthers', path)
}

function handleTabCloseAll(): void {
  if (props.routeDriven) {
    routeTabs.value = closeAllTabs(routeTabs.value)
    navigateRoute(resolveFallbackPath(routeTabs.value))
    maybeWriteSnapshot()
  }
  emit('tabCloseAll')
}

function handleTabPin(path: string, pinned: boolean): void {
  if (props.routeDriven) {
    routeTabs.value = pinned ? pinTab(routeTabs.value, path) : unpinTab(routeTabs.value, path)
    maybeWriteSnapshot()
  }
  emit('tabPin', path, pinned)
}

function handleTabReorder(from: string, to: string): void {
  if (props.routeDriven) {
    routeTabs.value = reorderTab(routeTabs.value, from, to)
    maybeWriteSnapshot()
  }
  emit('tabReorder', from, to)
}

function handleTabNewWindow(path: string): void {
  const url = props.resolveTabUrl
    ? props.resolveTabUrl(path)
    : (() => {
        if (injectedRouter) {
          try {
            return injectedRouter.resolve(path)?.fullPath ?? path
          }
          catch {
            return path
          }
        }
        return path
      })()

  const feature = 'noopener,noreferrer'
  window.open(url, '_blank', feature)
  emit('tabNewWindow', path)
}

function handleTabMaximize(maximized: boolean): void {
  isContentMaximized.value = maximized
  emit('tabMaximize', maximized)
}

function handleEscRestoreMaximize(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isContentMaximized.value) {
    event.preventDefault()
    tabsRef.value?.setMaximized(false)
    emit('tabMaximize', false)
  }
}

watch(isContentMaximized, (maximized) => {
  if (typeof document === 'undefined') {
    return
  }
  if (maximized) {
    document.addEventListener('keydown', handleEscRestoreMaximize)
  }
  else {
    document.removeEventListener('keydown', handleEscRestoreMaximize)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', handleEscRestoreMaximize)
  }
})

/***********************公开方法*********************/
defineExpose({
  getLayoutElement: () => layoutRef.value?.$el as HTMLElement | undefined,
  getLayoutInstance: () => layoutRef.value,
  getTabs: () => [...currentTabs.value],
  getVisitHistory: () => [...visitHistory.value],
  resetTabs: () => {
    routeTabs.value = closeAllTabs(routeTabs.value)
    visitHistory.value = []
    navigateRoute(resolveFallbackPath(routeTabs.value))
    maybeWriteSnapshot()
  },
  resetTabSnapshot: () => {
    maybeClearSnapshot()
  },
})
</script>

<template>
  <ElContainer
    ref="layoutRef"
    class="luma-layout"
    :data-layout="preferences.app.layout"
    :class="{
      'is-sidebar-collapsed': collapsed,
      'is-sidebar-hidden': !hasSidebar,
      'is-mobile-menu-hidden': !mobileMenuOpen,
      'is-content-maximized': isContentMaximized,
    }"
    direction="vertical"
  >
    <LumaHeader
      v-if="showHeader"
      v-show="!isContentMaximized"
      :title="title"
      :collapsed="isMobileViewport ? !mobileMenuOpen : collapsed"
      :height="headerHeight"
      :mobile-only-toggle="!hasSidebar && hasTopMenus"
      :sidebar-enabled="hasSidebar || hasTopMenus"
      :toggle-after-title="hasSidebar && !isMobileViewport"
      @toggle-collapse="handleToggleCollapse"
    >
      <template v-if="$slots.logo" #logo>
        <slot name="logo" />
      </template>

      <template v-if="hasTopMenus" #navigation>
        <LumaTopNav
          :menus="topMenus"
          :active-path="resolvedTopMenuActivePath"
          :align="preferences.header.menuAlign"
          :max-width="preferences.header.menuMaxWidth"
          :mode="resolvedTopMenuMode"
          @select="handleTopMenuSelect"
        />
      </template>

      <template v-if="showHeaderBreadcrumb" #breadcrumb>
        <LumaBreadcrumb
          class="luma-layout__header-breadcrumb"
          :active-menu-path="resolvedActiveMenuPath"
          :active-path="resolvedCurrentPath"
          :hide-only-one="breadcrumbPreferences.hideOnlyOne"
          :menus="menus"
          :show-home="breadcrumbPreferences.showHome"
          :show-icon="breadcrumbPreferences.showIcon"
          @select="handleDiscoverySelect"
        />
      </template>

      <template v-if="globalSearchEnabled || $slots.headerActions" #actions>
        <LumaGlobalSearch
          v-if="globalSearchEnabled"
          :menus="menus"
          :shortcut="globalSearchShortcutEnabled"
          @select="handleDiscoverySelect"
        />
        <slot name="headerActions" />
      </template>
    </LumaHeader>

    <ElContainer class="luma-layout__body">
      <button
        v-if="hasMobileMenus && !isContentMaximized"
        class="luma-layout__sidebar-scrim"
        type="button"
        aria-label="关闭侧边栏"
        @click="mobileMenuOpen = false"
      />

      <Transition v-if="!isContentMaximized" name="luma-layout-sidebar" appear>
        <LumaSidebar
          v-if="hasSidebar"
          class="luma-layout__desktop-sidebar"
          aria-label="主菜单"
          :menus="sidebarMenus"
          :active-path="resolvedActiveMenuPath"
          :collapsed="collapsed"
          :width="`${preferences.sidebar.width}px`"
          collapsed-width="64px"
          @select="handleMenuSelect"
        />
      </Transition>

      <LumaSidebar
        v-if="hasMobileMenus && !isContentMaximized"
        class="luma-layout__mobile-sidebar"
        aria-label="移动菜单"
        :aria-hidden="!mobileMenuOpen"
        :inert="!mobileMenuOpen ? true : undefined"
        :menus="mobileMenus"
        :active-path="resolvedActiveMenuPath"
        :collapsed="false"
        :width="`${preferences.sidebar.width}px`"
        collapsed-width="64px"
        @select="handleMenuSelect"
      />

      <ElContainer class="luma-layout__main" direction="vertical" data-layout-fullscreen-target>
        <LumaBreadcrumb
          v-if="breadcrumbPreferences.enable && !showHeaderBreadcrumb && !isContentMaximized"
          :active-menu-path="resolvedActiveMenuPath"
          :active-path="resolvedCurrentPath"
          :hide-only-one="breadcrumbPreferences.hideOnlyOne"
          :menus="menus"
          :show-home="breadcrumbPreferences.showHome"
          :show-icon="breadcrumbPreferences.showIcon"
          @select="handleDiscoverySelect"
        />

        <LumaTabs
          v-if="hasTabs && preferences.tabbar.enable"
          ref="tabsRef"
          v-model:active-path="currentActiveTabPath"
          :tabs="currentTabs"
          :show-icon="preferences.tabbar.showIcon"
          :show-maximize="preferences.tabbar.showMaximize"
          :show-more="preferences.tabbar.showMore"
          :show-refresh="preferences.tabbar.showRefresh"
          :draggable="preferences.tabbar.draggable"
          :wheelable="preferences.tabbar.wheelable"
          :middle-click-to-close="preferences.tabbar.middleClickToClose"
          :style-type="preferences.tabbar.styleType"
          @change="handleTabChange"
          @close-all="handleTabCloseAll"
          @close-left="handleTabCloseLeft"
          @close-others="handleTabCloseOthers"
          @close-right="handleTabCloseRight"
          @maximize="handleTabMaximize"
          @new-window="handleTabNewWindow"
          @pin="handleTabPin"
          @refresh="emit('tabRefresh', $event)"
          @remove="handleTabRemove"
          @reorder="handleTabReorder"
        />

        <LumaContent>
          <slot />
        </LumaContent>
      </ElContainer>
    </ElContainer>
  </ElContainer>
</template>

<style scoped lang="scss">
.luma-layout {
  position: relative;
  min-width: 0;
  height: 100vh;
  min-height: 100vh;
  height: 100dvh;
  min-height: 100dvh;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.luma-layout__body {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.luma-layout__main {
  flex: 1 1 auto;
  width: 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.luma-layout__sidebar-scrim {
  display: none;
}

.luma-layout__mobile-sidebar {
  display: none;
}

.luma-layout__header-breadcrumb {
  width: 100%;
  min-height: 0;
  padding: 0;
  border-bottom: 0;
  background: transparent;
}

.luma-layout.is-content-maximized .luma-layout__main {
  position: absolute;
  inset: 0;
  z-index: var(--luma-z-scrim);
  background: var(--el-bg-color-page);
}

.luma-layout-sidebar-enter-active,
.luma-layout-sidebar-leave-active {
  overflow: hidden;
  transition:
    width var(--luma-motion-duration-base) var(--luma-easing-standard),
    opacity var(--luma-motion-duration-fast) ease,
    transform var(--luma-motion-duration-base) var(--luma-easing-standard),
    border-color var(--luma-motion-duration-fast) ease;
}

.luma-layout-sidebar-leave-active {
  pointer-events: none;
}

.luma-layout-sidebar-enter-from,
.luma-layout-sidebar-leave-to {
  width: 0 !important;
  opacity: 0;
  border-right-color: transparent;
  transform: translateX(-12px);
}

@media (max-width: 768px) {
  .luma-layout__desktop-sidebar {
    display: none;
  }

  .luma-layout__mobile-sidebar {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: var(--luma-z-drawer);
    display: block;
    width: min(var(--luma-sidebar-width, 248px), 84vw) !important;
    box-shadow: var(--luma-shadow-base);
    transform: translateX(0);
  }

  .luma-layout.is-mobile-menu-hidden .luma-layout__mobile-sidebar {
    pointer-events: none;
    transform: translateX(-100%);
  }

  .luma-layout__sidebar-scrim {
    position: absolute;
    inset: 0;
    z-index: var(--luma-z-scrim);
    display: block;
    padding: 0;
    border: 0;
    background: color-mix(in srgb, var(--luma-color-text-primary) 42%, transparent);
    cursor: pointer;
  }

  .luma-layout.is-mobile-menu-hidden .luma-layout__sidebar-scrim {
    display: none;
  }

  .luma-layout__main {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .luma-layout__body :deep(.luma-sidebar),
  .luma-layout-sidebar-enter-active,
  .luma-layout-sidebar-leave-active {
    transition: none;
  }
}
</style>
