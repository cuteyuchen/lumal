import type {
  LumalPreferences,
  LumalPreferencesDefaults,
  ThemeRuntimeEnvironment,
} from '@lumal/core/theme'
import {
  createDefaultPreferences,
  createPreferencesStore,
} from '@lumal/core/theme'

/***********************独立应用主题偏好*********************/

export const STANDALONE_PREFERENCES_STORAGE_KEY = 'lumal-cockpit:preferences'

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

function resolvePreferencesStorage(): Storage {
  return typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage
}

function resolveThemeEnvironment(
  documentRef: Document | null | undefined = typeof document === 'undefined' ? undefined : document,
  windowRef: Window | null | undefined = typeof window === 'undefined' ? undefined : window,
): ThemeRuntimeEnvironment {
  if (!documentRef)
    return {}

  return {
    document: documentRef,
    matchMedia: typeof windowRef?.matchMedia === 'function'
      ? windowRef.matchMedia.bind(windowRef)
      : undefined,
  }
}

export const standalonePreferenceDefaults: LumalPreferencesDefaults = {
  app: {
    layout: 'mixed-nav',
  },
  header: {
    menuAlign: 'center',
    menuMaxWidth: 1120,
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
    colorPrimary: '#00d7ff',
    mode: 'dark',
    radiusScale: 0.75,
  },
  transition: {
    enable: true,
    loading: true,
    name: 'fade-side',
    progress: true,
  },
}

const preferencesStore = createPreferencesStore({
  defaults: standalonePreferenceDefaults,
  runtime: resolveThemeEnvironment(),
  storage: resolvePreferencesStorage(),
  storageKey: STANDALONE_PREFERENCES_STORAGE_KEY,
})

export const standalonePreferences = preferencesStore.state
export const standaloneResolvedThemeMode = preferencesStore.resolvedThemeMode

/**
 * 本应用只做暗色大屏：历史存档里可能留有浅色/跟随系统的取值，
 * 启动时强制回到深色，避免旧 localStorage 把界面拉回浅色。
 */
export function enforceDarkThemeMode(): void {
  if (standalonePreferences.value.theme.mode !== 'dark')
    preferencesStore.patch({ theme: { mode: 'dark' } })
}

export function createStandalonePreferences(): LumalPreferences {
  return createDefaultPreferences(standalonePreferenceDefaults)
}

export function resetStandalonePreferences(): void {
  preferencesStore.reset()
}
