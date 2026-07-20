import type {
  LumalPreferences,
  LumalPreferencesDefaults,
  ResolvedThemeMode,
  ThemeRuntimeEnvironment,
} from '@lumal/core/theme'
import {
  applyThemePreferences,
  createDefaultPreferences,
  createPreferencesStore,
} from '@lumal/core/theme'
import { readonly, shallowRef } from 'vue'

export interface AdminSystemConfig {
  appName: string
  colorPrimary: string
  layout: LumalPreferences['app']['layout']
  tabbarEnable: boolean
  transitionEnable: boolean
}

const initialAdminSystemConfig: AdminSystemConfig = {
  appName: 'Lumal Admin',
  colorPrimary: '#1677ff',
  layout: 'mixed-nav',
  tabbarEnable: true,
  transitionEnable: true,
}

const ADMIN_PREFERENCES_STORAGE_KEY = 'lumal-admin:preferences'

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear() {
      values.clear()
    },
    getItem(key) {
      return values.get(key) ?? null
    },
    key(index) {
      return Array.from(values.keys())[index] ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}

function resolveAdminPreferencesStorage(): Storage {
  return typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage
}

/***********************默认偏好*********************/
export const adminPreferenceDefaults: LumalPreferencesDefaults = {
  app: {
    dynamicTitle: true,
    layout: 'mixed-nav',
  },
  breadcrumb: {
    enable: true,
    hideOnlyOne: false,
    showHome: true,
    showIcon: true,
  },
  header: {
    globalSearch: true,
    menuAlign: 'center',
    menuMaxWidth: 1120,
  },
  shortcutKeys: {
    globalSearch: true,
  },
  sidebar: {
    collapsed: false,
    enable: true,
    width: 280,
  },
  tabbar: {
    cache: true,
    draggable: true,
    enable: true,
    maxCount: 0,
    middleClickToClose: true,
    persist: true,
    showIcon: true,
    showMaximize: true,
    showMore: true,
    showRefresh: true,
    styleType: 'chrome',
    visitHistory: true,
    wheelable: true,
  },
  theme: {
    colorPrimary: '#1677ff',
    fontSize: 14,
    mode: 'system',
    radiusScale: 0.75,
  },
  transition: {
    enable: true,
    loading: true,
    name: 'fade-side',
    progress: true,
  },
}

/***********************偏好创建*********************/
export function createAdminPreferences(): LumalPreferences {
  return createDefaultPreferences(adminPreferenceDefaults)
}

/***********************应用级偏好状态*********************/
const adminPreferencesStore = createPreferencesStore({
  defaults: adminPreferenceDefaults,
  runtime: resolveAdminThemeEnvironment(),
  storage: resolveAdminPreferencesStorage(),
  storageKey: ADMIN_PREFERENCES_STORAGE_KEY,
})
const adminAppNameState = shallowRef(initialAdminSystemConfig.appName)

export const adminPreferences = adminPreferencesStore.state
export const adminAppName = readonly(adminAppNameState)
export const adminResolvedThemeMode = adminPreferencesStore.resolvedThemeMode

export function patchAdminPreferences(next: LumalPreferencesDefaults): void {
  adminPreferencesStore.patch(next)
}

export function exportAdminPreferences(): LumalPreferences {
  return adminPreferencesStore.exportCurrent()
}

export function getAdminSystemConfig(): AdminSystemConfig {
  return {
    appName: adminAppNameState.value,
    colorPrimary: adminPreferences.value.theme.colorPrimary,
    layout: adminPreferences.value.app.layout,
    tabbarEnable: adminPreferences.value.tabbar.enable,
    transitionEnable: adminPreferences.value.transition.enable,
  }
}

export function updateAdminSystemConfig(config: AdminSystemConfig): AdminSystemConfig {
  const appName = config.appName.trim() || initialAdminSystemConfig.appName
  const colorPrimary = config.colorPrimary.trim() || initialAdminSystemConfig.colorPrimary

  adminAppNameState.value = appName
  adminPreferencesStore.patch({
    app: { layout: config.layout },
    tabbar: { enable: config.tabbarEnable },
    theme: { colorPrimary },
    transition: { enable: config.transitionEnable },
  })

  return getAdminSystemConfig()
}

export function resetAdminSystemConfig(): void {
  adminAppNameState.value = initialAdminSystemConfig.appName
  adminPreferencesStore.reset()
}

/***********************主题运行环境*********************/
export function resolveAdminThemeEnvironment(
  documentRef: Document | null | undefined = typeof document === 'undefined' ? undefined : document,
  windowRef: Window | null | undefined = typeof window === 'undefined' ? undefined : window,
): ThemeRuntimeEnvironment {
  if (!documentRef) {
    return {}
  }

  return {
    document: documentRef,
    matchMedia: typeof windowRef?.matchMedia === 'function'
      ? windowRef.matchMedia.bind(windowRef)
      : undefined,
  }
}

/***********************主题应用*********************/
export function applyAdminPreferences(preferences: LumalPreferences): ResolvedThemeMode {
  return applyThemePreferences(preferences, resolveAdminThemeEnvironment())
}
