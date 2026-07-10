import type {
  LumaPreferences,
  LumaPreferencesDefaults,
  ResolvedThemeMode,
  ThemeRuntimeEnvironment,
} from '@luma/core/theme'
import {
  applyThemePreferences,
  createDefaultPreferences,
  createPreferencesStore,
} from '@luma/core/theme'
import { readonly, shallowRef } from 'vue'

export interface AdminSystemConfig {
  appName: string
  colorPrimary: string
  layout: LumaPreferences['app']['layout']
  tabbarEnable: boolean
  transitionEnable: boolean
}

const initialAdminSystemConfig: AdminSystemConfig = {
  appName: 'Luma Admin',
  colorPrimary: '#1677ff',
  layout: 'mixed-nav',
  tabbarEnable: true,
  transitionEnable: true,
}

const ADMIN_PREFERENCES_STORAGE_KEY = 'luma-admin:preferences'

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
export const adminPreferenceDefaults: LumaPreferencesDefaults = {
  app: {
    layout: 'mixed-nav',
  },
  sidebar: {
    collapsed: false,
    enable: true,
    width: 248,
  },
  tabbar: {
    cache: true,
    enable: true,
    maxCount: 8,
    showIcon: true,
    showMaximize: true,
  },
  theme: {
    colorPrimary: '#1677ff',
    mode: 'system',
    radiusScale: 0.5,
  },
  transition: {
    enable: true,
    loading: true,
    name: 'fade-side',
    progress: true,
  },
}

/***********************偏好创建*********************/
export function createAdminPreferences(): LumaPreferences {
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

export function patchAdminPreferences(next: LumaPreferencesDefaults): void {
  adminPreferencesStore.patch(next)
}

export function exportAdminPreferences(): LumaPreferences {
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

  adminPreferenceDefaults.app = { layout: config.layout }
  adminPreferenceDefaults.tabbar = {
    ...adminPreferenceDefaults.tabbar,
    enable: config.tabbarEnable,
  }
  adminPreferenceDefaults.theme = {
    ...adminPreferenceDefaults.theme,
    colorPrimary,
  }
  adminPreferenceDefaults.transition = {
    ...adminPreferenceDefaults.transition,
    enable: config.transitionEnable,
  }

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
  adminPreferenceDefaults.app = { layout: initialAdminSystemConfig.layout }
  adminPreferenceDefaults.tabbar = {
    ...adminPreferenceDefaults.tabbar,
    enable: initialAdminSystemConfig.tabbarEnable,
  }
  adminPreferenceDefaults.theme = {
    ...adminPreferenceDefaults.theme,
    colorPrimary: initialAdminSystemConfig.colorPrimary,
  }
  adminPreferenceDefaults.transition = {
    ...adminPreferenceDefaults.transition,
    enable: initialAdminSystemConfig.transitionEnable,
  }
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
export function applyAdminPreferences(preferences: LumaPreferences): ResolvedThemeMode {
  return applyThemePreferences(preferences, resolveAdminThemeEnvironment())
}
