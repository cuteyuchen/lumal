<script setup lang="ts">
import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { ResolvedThemeMode } from '@luma/core/theme'
import {
  appendTab,
  closeTab,
  LumaLayout,
  LumaRouterView,
  resolveActiveTopMenuPath,
  resolveNavigationTarget,
  splitMenusByLayout,
} from '@luma/core/layout'
import { mergePreferences } from '@luma/core/theme'
import { computed, onMounted, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeaderActions from './components/app/AppHeaderActions.vue'
import AppSettingsDrawer from './components/app/AppSettingsDrawer.vue'
import {
  createAdminSidebarMenus,
  createAdminTabs,
} from './router'
import {
  adminAppName,
  adminPreferences,
  applyAdminPreferences,
} from './services/preferences'
import { currentUser, logout } from './services/session'

/***********************基础状态*********************/
const title = adminAppName
const preferences = adminPreferences
const settingsVisible = shallowRef(false)
const resolvedThemeMode = shallowRef<ResolvedThemeMode>('light')
const visitedTabs = shallowRef<LumaLayoutTabItem[]>([])

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()
const isPublicLayout = computed(() => route.meta.layout === 'public')

/***********************偏好状态*********************/
watch(
  preferences,
  (value) => {
    resolvedThemeMode.value = applyAdminPreferences(value)
  },
  { immediate: true },
)

const collapsed = computed({
  get: () => preferences.value.sidebar.collapsed,
  set: (collapsed: boolean) => {
    preferences.value = mergePreferences(preferences.value, {
      sidebar: { collapsed },
    })
  },
})

/***********************菜单状态*********************/
const allMenus = computed(() => currentUser.value ? createAdminSidebarMenus() : [])
const activeTopMenuPath = computed(() => resolveActiveTopMenuPath(allMenus.value, route.path))
const layoutMenus = computed(() => splitMenusByLayout({
  activeTopMenuPath: activeTopMenuPath.value,
  layout: preferences.value.app.layout,
  menus: allMenus.value,
}))
const menus = computed(() => preferences.value.sidebar.enable ? layoutMenus.value.sidebarMenus : [])
const topMenus = computed(() => layoutMenus.value.topMenus)
const tabs = computed(() => preferences.value.tabbar.enable ? visitedTabs.value : [])
const topMenuMode = computed(() => preferences.value.app.layout === 'mixed-nav' ? 'flat' : 'tree')
const routeViewKey = computed(() => route.fullPath)
const sidebarWidth = computed(() => `${preferences.value.sidebar.width}px`)
const routeViewCache = computed(() => preferences.value.tabbar.enable && preferences.value.tabbar.cache)
const userName = computed(() => currentUser.value?.name ?? '未登录')
const activePath = computed({
  get: () => route.path,
  set: (path: string) => {
    if (path !== route.path) {
      void router.push(path)
    }
  },
})

function isMobileViewport(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(max-width: 768px)').matches
}

watch(
  () => route.path,
  (path) => {
    if (route.meta.layout === 'public') {
      return
    }

    const routeTabs = createAdminTabs(path)
    const currentTab = routeTabs.find(tab => tab.path === path)

    if (visitedTabs.value.length === 0) {
      visitedTabs.value = routeTabs
      return
    }

    if (currentTab) {
      visitedTabs.value = appendTab(visitedTabs.value, currentTab, {
        maxCount: preferences.value.tabbar.maxCount,
      })
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (isMobileViewport()) {
    collapsed.value = true
  }
})

/***********************偏好事件*********************/
function handleToggleTheme(): void {
  preferences.value = mergePreferences(preferences.value, {
    theme: {
      mode: resolvedThemeMode.value === 'dark' ? 'light' : 'dark',
    },
  })
}

function handleOpenSettings(): void {
  settingsVisible.value = true
}

function handlePreferencesChange(): void {
  // 偏好变化由 watch 统一应用到 DOM，这里保留事件入口便于后续持久化。
}

async function handleLogout(): Promise<void> {
  await logout()

  if (route.path !== '/login') {
    await router.push('/login')
  }
}

/***********************导航事件*********************/
function handleMenuSelect(path: string): void {
  activePath.value = path

  if (isMobileViewport()) {
    collapsed.value = true
  }
}

function handleTopMenuSelect(path: string): void {
  const topMenu = allMenus.value.find(menu => menu.path === path)
  activePath.value = resolveNavigationTarget(topMenu) || path
}

function handleTabChange(path: string): void {
  activePath.value = path
}

function handleTabRemove(path: string): void {
  const currentTabs = visitedTabs.value
  const closingIndex = currentTabs.findIndex(tab => tab.path === path)
  const nextTabs = closeTab(currentTabs, path)

  if (nextTabs.length === currentTabs.length) {
    return
  }

  visitedTabs.value = nextTabs

  if (route.path === path) {
    const nextTab = nextTabs[Math.min(closingIndex, nextTabs.length - 1)] ?? nextTabs.at(-1)

    if (nextTab) {
      activePath.value = nextTab.path
    }
  }
}
</script>

<template>
  <LumaRouterView
    v-if="isPublicLayout"
    :view-key="routeViewKey"
    :progress="preferences.transition.progress"
    :loading="preferences.transition.loading"
    :cache="false"
    :cache-max="preferences.tabbar.maxCount"
    :transition="preferences.transition.enable"
    :transition-name="preferences.transition.name"
  />

  <LumaLayout
    v-else
    v-model:collapsed="collapsed"
    v-model:active-tab-path="activePath"
    :title="title"
    :menus="menus"
    :top-menus="topMenus"
    :top-menu-mode="topMenuMode"
    :tabs="tabs"
    :active-menu-path="activePath"
    :active-top-menu-path="activeTopMenuPath"
    :sidebar-width="sidebarWidth"
    @menu-select="handleMenuSelect"
    @top-menu-select="handleTopMenuSelect"
    @tab-change="handleTabChange"
    @tab-remove="handleTabRemove"
  >
    <template #headerActions>
      <AppHeaderActions
        :resolved-theme-mode="resolvedThemeMode"
        :user-name="userName"
        @logout="handleLogout"
        @open-settings="handleOpenSettings"
        @toggle-theme="handleToggleTheme"
      />
    </template>

    <LumaRouterView
      :view-key="routeViewKey"
      :progress="preferences.transition.progress"
      :loading="preferences.transition.loading"
      :cache="routeViewCache"
      :cache-max="preferences.tabbar.maxCount"
      :transition="preferences.transition.enable"
      :transition-name="preferences.transition.name"
    />

    <AppSettingsDrawer
      v-model:visible="settingsVisible"
      v-model:preferences="preferences"
      @change="handlePreferencesChange"
    />
  </LumaLayout>
</template>
