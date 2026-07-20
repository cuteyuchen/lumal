<script setup lang="ts">
import type { LumalLayoutTabItem } from '@lumal/core/layout'
import type { LumalPreferences } from '@lumal/core/theme'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  findMenuItemByPath,
  LumalLayout,
  LumalRouterView,
} from '@lumal/core/layout'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeaderActions from './components/app/AppHeaderActions.vue'
import AppSettingsDrawer from './components/app/AppSettingsDrawer.vue'
import LumalBrand from './components/app/LumalBrand.vue'
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
import { adminTabSnapshotStorageKey, currentUser, logout } from './services/session'
import { adminSettingsVisible, openAdminSettings } from './services/settings'
import { runAdminThemeTransition } from './services/theme-transition'

/***********************基础状态*********************/
const title = adminAppName
const preferences = adminPreferences
const settingsVisible = adminSettingsVisible
const resolvedThemeMode = adminResolvedThemeMode
const routeRefreshKey = shallowRef(0)
const cockpitUrl = import.meta.env.VITE_COCKPIT_URL?.trim() || 'http://localhost:5180/'

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()
const isPublicLayout = computed(() => route.meta.layout === 'public')

/***********************菜单状态*********************/
const allMenus = computed(() => currentUser.value ? createAdminSidebarMenus(router) : [])
const fixedTabs = computed<LumalLayoutTabItem[]>(() => createAdminTabs(undefined, router))
const routeViewKey = computed(() => `${route.fullPath}:${routeRefreshKey.value}`)
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

watch([
  title,
  () => route.meta.title,
  () => preferences.value.app.dynamicTitle,
], () => {
  if (typeof document === 'undefined') {
    return
  }

  const routeTitle = typeof route.meta.title === 'string' ? route.meta.title.trim() : ''
  document.title = preferences.value.app.dynamicTitle && routeTitle
    ? `${routeTitle} - ${title.value}`
    : title.value
}, { immediate: true })

watch(currentUser, async (user) => {
  if (!user) {
    return
  }

  await ensureAdminRoutes(router)
}, { immediate: true })

/***********************偏好事件*********************/
function handleToggleTheme(event: MouseEvent): void {
  void runAdminThemeTransition(() => {
    patchAdminPreferences({
      theme: {
        mode: resolvedThemeMode.value === 'dark' ? 'light' : 'dark',
      },
    })
  }, event)
}

function handleOpenSettings(): void {
  openAdminSettings()
}

function handleOpenProfile(): void {
  if (route.path !== '/profile') {
    void router.push('/profile')
  }
}

function handlePreferencesChange(nextPreferences: LumalPreferences): void {
  if (nextPreferences.theme.mode !== preferences.value.theme.mode) {
    void runAdminThemeTransition(() => patchAdminPreferences(nextPreferences))
    return
  }

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

function handleToggleSidebar(): void {
  patchAdminPreferences({
    sidebar: { collapsed: !preferences.value.sidebar.collapsed },
  })
}

function handleTabChange(path: string): void {
  activePath.value = path
}

function resolveAdminRouteTab(currentRoute: RouteLocationNormalizedLoaded): LumalLayoutTabItem | undefined {
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
  <ElConfigProvider :locale="zhCn">
    <LumalRouterView
      v-if="isPublicLayout"
      :view-key="routeViewKey"
      :progress="preferences.transition.progress"
      :loading="preferences.transition.loading"
      :cache="false"
      :cache-max="preferences.tabbar.maxCount"
      :transition="preferences.transition.enable"
      :transition-name="preferences.transition.name"
    />

    <LumalLayout
      v-else
      v-model:active-tab-path="activePath"
      :title="title"
      :menus="allMenus"
      :preferences="preferences"
      route-driven
      :fixed-tabs="fixedTabs"
      :route-tab-resolver="resolveAdminRouteTab"
      tab-fallback-path="/dashboard"
      :tab-storage-key="adminTabSnapshotStorageKey"
      :active-menu-path="activePath"
      @menu-select="handleMenuSelect"
      @toggle-sidebar="handleToggleSidebar"
      @tab-change="handleTabChange"
      @tab-refresh="handleTabRefresh"
    >
      <template #logo>
        <LumalBrand compact />
      </template>

      <template #headerActions>
        <AppHeaderActions
          :cockpit-url="cockpitUrl"
          :resolved-theme-mode="resolvedThemeMode"
          :user-name="userName"
          @logout="handleLogout"
          @open-profile="handleOpenProfile"
          @open-settings="handleOpenSettings"
          @toggle-theme="handleToggleTheme"
        />
      </template>

      <LumalRouterView
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
    </LumalLayout>
  </ElConfigProvider>
</template>
