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
import LumaContent from './LumaContent.vue'
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
  appendTab,
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  closeTabsLeft,
  closeTabsRight,
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
}>(), {
  activeMenuPath: '',
  activeTabPath: '',
  headerHeight: '50px',
  menus: () => [],
  fixedTabs: () => [],
  routeDriven: false,
  tabFallbackPath: '',
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
}>()

const activeTabPathModel = defineModel<string>('activeTabPath')
const injectedRoute = inject(routeLocationKey, undefined)
const injectedRouter = inject(routerKey, undefined)

/***********************模板引用*********************/
const layoutRef = useTemplateRef<ComponentPublicInstance>('layoutRef')
const isMobileViewport = shallowRef(false)
const mobileMenuOpen = shallowRef(false)
const routeTabs = shallowRef<LumaLayoutTabItem[]>([])
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
  return props.fixedTabs.map(tab => ({ ...tab, closable: false }))
}

function syncRouteTabs(route: RouteLocationNormalizedLoaded): void {
  if (!props.routeDriven || !(props.routeTabFilter ?? defaultRouteTabFilter)(route)) {
    return
  }

  const tab = (props.routeTabResolver ?? defaultRouteTabResolver)(route)
  if (!tab) {
    return
  }

  routeTabs.value = appendTab(
    [...normalizeFixedTabs(), ...routeTabs.value.filter(item => !props.fixedTabs.some(tab => tab.path === item.path))],
    tab,
    { maxCount: resolvedTabMaxCount.value },
  )
}

function navigateRoute(path: string): void {
  if (props.routeDriven && injectedRouter && path && path !== injectedRoute?.path) {
    void injectedRouter.push(path)
  }
}

function resolveFallbackPath(tabs: LumaLayoutTabItem[]): string {
  return props.tabFallbackPath || tabs[0]?.path || ''
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
const resolvedActiveMenuPath = computed(() => props.activeMenuPath || injectedRoute?.path || currentActiveTabPath.value)
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
const resolvedTopMenuMode = computed(() => props.preferences.app.layout === 'mixed-nav' ? 'flat' : 'tree')
const resolvedTopMenuActivePath = computed(() => (
  props.preferences.app.layout === 'top-nav'
    ? resolvedActiveMenuPath.value
    : resolvedActiveTopMenuPath.value
))
const mobileMenus = computed(() => hasTopMenus.value ? topMenus.value : sidebarMenus.value)
const hasMobileMenus = computed(() => mobileMenus.value.some(item => !item.hidden))

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

    routeTabs.value = nextTabs
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

function handleTabChange(path: string): void {
  emit('tabChange', path)
}

function handleTabRemove(path: string): void {
  if (props.routeDriven) {
    const nextTabs = closeTab(routeTabs.value, path)
    routeTabs.value = nextTabs
    if (currentActiveTabPath.value === path) {
      navigateRoute(resolveFallbackPath(nextTabs))
    }
  }
  emit('tabRemove', path)
}

function handleTabCloseLeft(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeTabsLeft(routeTabs.value, path)
    navigateRoute(path)
  }
  emit('tabCloseLeft', path)
}

function handleTabCloseRight(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeTabsRight(routeTabs.value, path)
    navigateRoute(path)
  }
  emit('tabCloseRight', path)
}

function handleTabCloseOthers(path: string): void {
  if (props.routeDriven) {
    routeTabs.value = closeOtherTabs(routeTabs.value, path)
    navigateRoute(path)
  }
  emit('tabCloseOthers', path)
}

function handleTabCloseAll(): void {
  if (props.routeDriven) {
    routeTabs.value = closeAllTabs(routeTabs.value)
    navigateRoute(resolveFallbackPath(routeTabs.value))
  }
  emit('tabCloseAll')
}

/***********************公开方法*********************/
defineExpose({
  getLayoutElement: () => layoutRef.value?.$el as HTMLElement | undefined,
  getLayoutInstance: () => layoutRef.value,
  getTabs: () => [...currentTabs.value],
  resetTabs: () => {
    routeTabs.value = normalizeFixedTabs()
    navigateRoute(resolveFallbackPath(routeTabs.value))
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
    }"
    direction="vertical"
  >
    <LumaHeader
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

      <template v-if="$slots.headerActions" #actions>
        <slot name="headerActions" />
      </template>
    </LumaHeader>

    <ElContainer class="luma-layout__body">
      <button
        v-if="hasMobileMenus"
        class="luma-layout__sidebar-scrim"
        type="button"
        aria-label="关闭侧边栏"
        @click="mobileMenuOpen = false"
      />

      <Transition name="luma-layout-sidebar" appear>
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
        v-if="hasMobileMenus"
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
        <LumaTabs
          v-if="hasTabs && preferences.tabbar.enable"
          v-model:active-path="currentActiveTabPath"
          :tabs="currentTabs"
          :show-icon="preferences.tabbar.showIcon"
          :show-maximize="preferences.tabbar.showMaximize"
          @change="handleTabChange"
          @close-all="handleTabCloseAll"
          @close-left="handleTabCloseLeft"
          @close-others="handleTabCloseOthers"
          @close-right="handleTabCloseRight"
          @refresh="emit('tabRefresh', $event)"
          @remove="handleTabRemove"
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

.luma-layout-sidebar-enter-active,
.luma-layout-sidebar-leave-active {
  overflow: hidden;
  transition:
    width var(--luma-motion-duration-base) var(--luma-easing-standard),
    flex-basis var(--luma-motion-duration-base) var(--luma-easing-standard),
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
  flex-basis: 0 !important;
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
