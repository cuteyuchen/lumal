<script setup lang="ts">
import type { LumalLayoutTabItem } from '@lumal/core/layout'
import type { LumalPreferences } from '@lumal/core/theme'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import {
  findMenuItemByPath,
  LumalLayout,
  LumalRouterView,
} from '@lumal/core/layout'
import { ElAlert, ElConfigProvider, ElMessage } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { computed, defineAsyncComponent, onErrorCaptured, reactive, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appConfig } from './app.config'
import AppHeaderActions from './app/components/AppHeaderActions.vue'
import { safeExternalUrl } from './app/menu-policy'
import { createAdminSidebarMenus, createAdminTabs } from './app/router'
import {
  adminPreferenceDefaults,
  adminPreferences,
  adminResolvedThemeMode,
  patchAdminPreferences,
} from './app/services/preferences'
import { adminTabSnapshotStorageKey, application, currentUser, logout } from './app/services/session'

/***********************页面状态*********************/
const AppSettingsDrawer = defineAsyncComponent(() => import('./app/components/AppSettingsDrawer.vue'))
const title = appConfig.title
const settingsVisible = shallowRef(false)
const pageError = shallowRef('')
const routeRefreshKeys = reactive<Record<string, number>>({})
onErrorCaptured((error) => {
  pageError.value = error.message
  return false
})

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()
const isPublicLayout = computed(() => route.meta.layout === 'public')
const allMenus = computed(() => createAdminSidebarMenus())
const fixedTabs = computed<LumalLayoutTabItem[]>(() => createAdminTabs())
// 标签和视图使用相同的 path/version 身份，刷新只替换当前标签的缓存。
function resolveRouteViewKey(path: string): string {
  return `${path}:${routeRefreshKeys[path] ?? 0}`
}
const routeViewKey = computed(() => resolveRouteViewKey(route.path))
const routeViewCache = computed(() => adminPreferences.value.tabbar.enable && adminPreferences.value.tabbar.cache)
const activePath = computed({
  get: () => route.path,
  set: (path: string) => {
    if (path !== route.path) {
      void router.push(path)
    }
  },
})

watch([
  () => route.meta.title,
  () => adminPreferences.value.app.dynamicTitle,
], () => {
  const routeTitle = typeof route.meta.title === 'string' ? route.meta.title.trim() : ''
  document.title = adminPreferences.value.app.dynamicTitle && routeTitle
    ? `${routeTitle} - ${title}`
    : title
}, { immediate: true })

/***********************导航事件*********************/
function handleMenuSelect(path: string): void {
  const item = findMenuItemByPath(allMenus.value, path)

  if (item?.externalLink) {
    const url = safeExternalUrl(item.externalLink)
    if (item.externalTarget === '_self')
      window.location.assign(url)
    else
      window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  activePath.value = path
}

function handleToggleSidebar(): void {
  patchAdminPreferences({
    sidebar: { collapsed: !adminPreferences.value.sidebar.collapsed },
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
  const tabTitle = menu?.title ?? (typeof currentRoute.meta.title === 'string' ? currentRoute.meta.title : undefined)

  if (!tabTitle) {
    return undefined
  }

  return {
    closable: !['/403', '/404'].includes(currentRoute.path),
    icon: menu?.icon ?? (typeof currentRoute.meta.icon === 'string' ? currentRoute.meta.icon : undefined),
    path: currentRoute.path,
    title: tabTitle,
  }
}

async function handleTabRefresh(path: string): Promise<void> {
  if (path !== route.path) {
    await router.push(path)
  }

  routeRefreshKeys[path] = (routeRefreshKeys[path] ?? 0) + 1
}

function handleTabsChange(tabs: LumalLayoutTabItem[]): void {
  const paths = new Set(tabs.map(tab => tab.path))
  for (const path of Object.keys(routeRefreshKeys)) {
    if (!paths.has(path))
      delete routeRefreshKeys[path]
  }
}

function handlePreferencesChange(preferences: LumalPreferences): void {
  patchAdminPreferences(preferences)
}

function toggleTheme(): void {
  patchAdminPreferences({
    theme: {
      mode: adminResolvedThemeMode.value === 'dark' ? 'light' : 'dark',
    },
  })
}

async function handleLogout(): Promise<void> {
  try {
    await logout()
  }
  catch (error) {
    ElMessage.warning(error instanceof Error ? error.message : '远端退出失败，本地会话已清理')
  }
  finally {
    pageError.value = ''
    await router.replace('/login')
  }
}
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <LumalRouterView
      v-if="isPublicLayout"
      :view-key="routeViewKey"
      transition
      transition-name="fade"
    />

    <LumalLayout
      v-else
      :key="`${currentUser?.username}:${application.accessVersion.value}`"
      v-model:active-tab-path="activePath"
      :title="title"
      :menus="allMenus"
      :preferences="adminPreferences"
      route-driven
      :fixed-tabs="fixedTabs"
      :route-tab-resolver="resolveAdminRouteTab"
      tab-fallback-path="/dashboard"
      :tab-storage-key="currentUser ? adminTabSnapshotStorageKey : ''"
      :active-menu-path="activePath"
      @menu-select="handleMenuSelect"
      @toggle-sidebar="handleToggleSidebar"
      @tab-change="handleTabChange"
      @tab-refresh="handleTabRefresh"
      @tabs-change="handleTabsChange"
    >
      <template #headerActions>
        <AppHeaderActions
          :resolved-theme-mode="adminResolvedThemeMode"
          :user-name="currentUser?.name"
          :has-profile="router.hasRoute('Profile')"
          @open-profile="router.push('/profile')"
          @logout="handleLogout"
          @open-settings="settingsVisible = true"
          @toggle-theme="toggleTheme"
        />
      </template>

      <template #default="{ tabs }">
        <ElAlert v-if="pageError" :title="pageError" type="error" role="alert" closable @close="pageError = ''" />
        <LumalRouterView
          :view-key="routeViewKey"
          :cache-keys="tabs.map((tab: LumalLayoutTabItem) => resolveRouteViewKey(tab.path))"
          :progress="adminPreferences.transition.progress"
          :loading="adminPreferences.transition.loading"
          :cache="routeViewCache"
          :cache-max="adminPreferences.tabbar.maxCount"
          :transition="adminPreferences.transition.enable"
          :transition-name="adminPreferences.transition.name"
        />
      </template>
    </LumalLayout>

    <AppSettingsDrawer
      v-if="settingsVisible"
      v-model:visible="settingsVisible"
      :defaults="adminPreferenceDefaults"
      :preferences="adminPreferences"
      @change="handlePreferencesChange"
      @reset="handlePreferencesChange"
      @update:preferences="handlePreferencesChange"
    />
  </ElConfigProvider>
</template>
