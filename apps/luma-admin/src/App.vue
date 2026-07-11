<script setup lang="ts">
import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { LumaPreferences } from '@luma/core/theme'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  findMenuItemByPath,
  LumaLayout,
  LumaRouterView,
  resolveActiveTopMenuPath,
  resolveNavigationTarget,
  splitMenusByLayout,
} from '@luma/core/layout'
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeaderActions from './components/app/AppHeaderActions.vue'
import AppSettingsDrawer from './components/app/AppSettingsDrawer.vue'
import {
  createAdminSidebarMenus,
  createAdminTabs,
  ensureAdminRoutes,
} from './router'
import {
  adminAppName,
  adminPreferenceDefaults,
  adminPreferences,
  adminResolvedThemeMode,
  patchAdminPreferences,
} from './services/preferences'
import { currentUser, logout } from './services/session'
import { adminSettingsVisible, openAdminSettings } from './services/settings'

/***********************基础状态*********************/
const title = adminAppName
const preferences = adminPreferences
const settingsVisible = adminSettingsVisible
const resolvedThemeMode = adminResolvedThemeMode
const routeRefreshKey = shallowRef(0)

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()
const isPublicLayout = computed(() => route.meta.layout === 'public')

const collapsed = computed({
  get: () => preferences.value.sidebar.collapsed,
  set: (collapsed: boolean) => {
    patchAdminPreferences({
      sidebar: { collapsed },
    })
  },
})

/***********************菜单状态*********************/
const allMenus = computed(() => currentUser.value ? createAdminSidebarMenus(router) : [])
const activeTopMenuPath = computed(() => resolveActiveTopMenuPath(allMenus.value, route.path))
const layoutMenus = computed(() => splitMenusByLayout({
  activeTopMenuPath: activeTopMenuPath.value,
  layout: preferences.value.app.layout,
  menus: allMenus.value,
}))
const menus = computed(() => preferences.value.sidebar.enable ? layoutMenus.value.sidebarMenus : [])
const topMenus = computed(() => layoutMenus.value.topMenus)
const fixedTabs = computed<LumaLayoutTabItem[]>(() => createAdminTabs(undefined, router))
const topMenuMode = computed(() => preferences.value.app.layout === 'mixed-nav' ? 'flat' : 'tree')
const routeViewKey = computed(() => `${route.fullPath}:${routeRefreshKey.value}`)
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

watch(currentUser, async (user) => {
  if (!user) {
    return
  }

  await ensureAdminRoutes(router)
}, { immediate: true })

/***********************偏好事件*********************/
function handleToggleTheme(): void {
  patchAdminPreferences({
    theme: {
      mode: resolvedThemeMode.value === 'dark' ? 'light' : 'dark',
    },
  })
}

function handleOpenSettings(): void {
  openAdminSettings()
}

function handlePreferencesChange(nextPreferences: LumaPreferences): void {
  patchAdminPreferences(nextPreferences)
}

async function handleLogout(): Promise<void> {
  await logout()

  if (route.path !== '/login') {
    await router.push('/login')
  }
}

/***********************导航事件*********************/
function handleMenuSelect(path: string): void {
  const item = findMenuItemByPath(allMenus.value, path)

  if (item?.externalLink && item.externalTarget !== '_self') {
    window.open(item.externalLink, item.externalTarget ?? '_blank', 'noopener,noreferrer')
    return
  }

  activePath.value = path
}

function handleTopMenuSelect(path: string): void {
  const topMenu = allMenus.value.find(menu => menu.path === path)
  handleMenuSelect(resolveNavigationTarget(topMenu) || path)
}

function handleTabChange(path: string): void {
  activePath.value = path
}

function resolveAdminRouteTab(currentRoute: RouteLocationNormalizedLoaded): LumaLayoutTabItem | undefined {
  if (currentRoute.meta.layout === 'public' || currentRoute.meta.hideInTab === true) {
    return undefined
  }

  const menu = findMenuItemByPath(allMenus.value, currentRoute.path)
  const title = menu?.title ?? (typeof currentRoute.meta.title === 'string' ? currentRoute.meta.title : undefined)

  if (!title) {
    return undefined
  }

  return {
    closable: !['/403', '/404'].includes(currentRoute.path) && currentRoute.meta.affixTab !== true,
    icon: menu?.icon ?? (typeof currentRoute.meta.icon === 'string' ? currentRoute.meta.icon : undefined),
    path: currentRoute.path,
    title,
  }
}

async function handleTabRefresh(path: string): Promise<void> {
  if (path !== route.path) {
    await router.push(path)
  }

  routeRefreshKey.value += 1
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
    :header-menu-align="preferences.header.menuAlign"
    :header-menu-max-width="preferences.header.menuMaxWidth"
    :show-tab-icons="preferences.tabbar.showIcon"
    :show-tab-maximize="preferences.tabbar.showMaximize"
    route-driven
    :fixed-tabs="fixedTabs"
    :route-tab-resolver="resolveAdminRouteTab"
    tab-fallback-path="/dashboard"
    :tab-max-count="preferences.tabbar.maxCount"
    :tabs-visible="preferences.tabbar.enable"
    :active-menu-path="activePath"
    :active-top-menu-path="activeTopMenuPath"
    :sidebar-width="sidebarWidth"
    @menu-select="handleMenuSelect"
    @top-menu-select="handleTopMenuSelect"
    @tab-change="handleTabChange"
    @tab-refresh="handleTabRefresh"
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
      :defaults="adminPreferenceDefaults"
      :preferences="preferences"
      @update:preferences="handlePreferencesChange"
    />
  </LumaLayout>
</template>
