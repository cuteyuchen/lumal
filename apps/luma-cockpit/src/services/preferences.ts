import type {
  LumaPreferences,
  LumaPreferencesDefaults,
  ThemeMode,
  ThemeRuntimeEnvironment,
} from '@luma/core/theme'
import {
  createDefaultPreferences,
  createPreferencesStore,
} from '@luma/core/theme'

/***********************独立应用主题偏好*********************/

export const STANDALONE_PREFERENCES_STORAGE_KEY = 'luma-cockpit:preferences'

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

export const standalonePreferenceDefaults: LumaPreferencesDefaults = {
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
    colorPrimary: '#1677ff',
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

const preferencesStore = createPreferencesStore({
  defaults: standalonePreferenceDefaults,
  runtime: resolveThemeEnvironment(),
  storage: resolvePreferencesStorage(),
  storageKey: STANDALONE_PREFERENCES_STORAGE_KEY,
})

export const standalonePreferences = preferencesStore.state
export const standaloneResolvedThemeMode = preferencesStore.resolvedThemeMode

export function createStandalonePreferences(): LumaPreferences {
  return createDefaultPreferences(standalonePreferenceDefaults)
}

export function setStandaloneThemeMode(mode: ThemeMode): void {
  preferencesStore.patch({ theme: { mode } })
}

export function resetStandalonePreferences(): void {
  preferencesStore.reset()
}
