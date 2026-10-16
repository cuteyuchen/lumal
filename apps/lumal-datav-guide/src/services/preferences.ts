import type {
  LumalPreferences,
  LumalPreferencesDefaults,
  ThemeRuntimeEnvironment,
} from '@lumal/core/theme'
import { createPreferencesStore } from '@lumal/core/theme'
import { createMemoryStorage } from '@lumal/core/utils'

const GUIDE_PREFERENCES_STORAGE_KEY = 'lumal-datav-guide:preferences'

function resolveGuidePreferencesStorage(): Storage {
  return typeof localStorage === 'undefined' ? createMemoryStorage() : localStorage
}

function resolveGuideThemeEnvironment(
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

/**
 * 文档站偏好默认值：侧边栏导航布局、开启全文搜索，不使用页签。
 * 深浅色跟随系统并可手动切换，主色沿用 lumal 品牌蓝。
 */
export const guidePreferenceDefaults: LumalPreferencesDefaults = {
  app: {
    dynamicTitle: true,
    layout: 'sidebar-nav',
  },
  breadcrumb: {
    enable: true,
    hideOnlyOne: true,
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
    enable: false,
  },
  theme: {
    colorPrimary: '#1677ff',
    fontSize: 14,
    mode: 'system',
    radiusScale: 0.75,
  },
  transition: {
    enable: true,
    loading: false,
    name: 'fade',
    progress: true,
  },
}

const guidePreferencesStore = createPreferencesStore({
  defaults: guidePreferenceDefaults,
  runtime: resolveGuideThemeEnvironment(),
  storage: resolveGuidePreferencesStorage(),
  storageKey: GUIDE_PREFERENCES_STORAGE_KEY,
})

export const guidePreferences = guidePreferencesStore.state
export const guideResolvedThemeMode = guidePreferencesStore.resolvedThemeMode

export function patchGuidePreferences(next: LumalPreferencesDefaults): void {
  guidePreferencesStore.patch(next)
}

export function exportGuidePreferences(): LumalPreferences {
  return guidePreferencesStore.exportCurrent()
}

export function resetGuidePreferences(): void {
  guidePreferencesStore.reset()
}
