import type {
  LumalPreferences,
  LumalPreferencesDefaults,
  LumalPreferencesVisibility,
  ResolvedPreferenceVisibility,
  ResolvedThemeMode,
  ThemeMode,
  ThemeRuntimeEnvironment,
} from './types'

export interface PreferenceAvailability {
  headerMenuAlign: boolean
  headerMenuMaxWidth: boolean
  sidebarAutoActivateChild: boolean
  sidebarCollapsed: boolean
  sidebarWidth: boolean
  tabbarCache: boolean
}

const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

/***********************默认偏好*********************/
export function createDefaultPreferences(defaults: LumalPreferencesDefaults = {}): LumalPreferences {
  const builtin: LumalPreferences = {
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
    sidebar: {
      autoActivateChild: false,
      collapsed: false,
      enable: true,
      width: 200,
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
    shortcutKeys: {
      globalSearch: true,
    },
    transition: {
      enable: true,
      loading: true,
      name: 'fade-side',
      progress: true,
    },
  }

  return {
    app: mergeSection(builtin.app, defaults.app),
    breadcrumb: mergeSection(builtin.breadcrumb, defaults.breadcrumb),
    header: mergeSection(builtin.header, defaults.header),
    sidebar: mergeSection(builtin.sidebar, defaults.sidebar),
    tabbar: mergeSection(builtin.tabbar, defaults.tabbar),
    theme: normalizeThemePreferences(mergeSection(builtin.theme, defaults.theme)),
    shortcutKeys: mergeSection(builtin.shortcutKeys, defaults.shortcutKeys),
    transition: mergeSection(builtin.transition, defaults.transition),
  }
}

function normalizeThemePreferences(theme: LumalPreferences['theme']): LumalPreferences['theme'] {
  const fontSize = Number.isFinite(theme.fontSize) ? theme.fontSize : 14

  return {
    ...theme,
    fontSize: Math.min(20, Math.max(12, Math.round(fontSize))),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeSection<T extends Record<string, unknown>>(
  base: T,
  next: Partial<T> | undefined,
): T {
  if (!next) {
    return { ...base }
  }

  return Object.entries(next).reduce<T>((result, [key, value]) => {
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T]
    }

    return result
  }, { ...base })
}

/***********************偏好归一化*********************/
export function normalizePreferences(
  input: unknown,
  defaults: LumalPreferencesDefaults = {},
): LumalPreferences {
  const raw = isRecord(input) ? input : {}
  const fallback = createDefaultPreferences(defaults)

  return {
    app: mergeSection(fallback.app, isRecord(raw.app) ? raw.app as Partial<LumalPreferences['app']> : undefined),
    breadcrumb: mergeSection(
      fallback.breadcrumb,
      isRecord(raw.breadcrumb) ? raw.breadcrumb as Partial<LumalPreferences['breadcrumb']> : undefined,
    ),
    header: mergeSection(fallback.header, isRecord(raw.header) ? raw.header as Partial<LumalPreferences['header']> : undefined),
    sidebar: mergeSection(fallback.sidebar, isRecord(raw.sidebar) ? raw.sidebar as Partial<LumalPreferences['sidebar']> : undefined),
    tabbar: mergeSection(fallback.tabbar, isRecord(raw.tabbar) ? raw.tabbar as Partial<LumalPreferences['tabbar']> : undefined),
    theme: normalizeThemePreferences(
      mergeSection(fallback.theme, isRecord(raw.theme) ? raw.theme as Partial<LumalPreferences['theme']> : undefined),
    ),
    shortcutKeys: mergeSection(
      fallback.shortcutKeys,
      isRecord(raw.shortcutKeys) ? raw.shortcutKeys as Partial<LumalPreferences['shortcutKeys']> : undefined,
    ),
    transition: mergeSection(
      fallback.transition,
      isRecord(raw.transition) ? raw.transition as Partial<LumalPreferences['transition']> : undefined,
    ),
  }
}

export function mergePreferences(
  current: unknown,
  next: LumalPreferencesDefaults = {},
  defaults: LumalPreferencesDefaults = {},
): LumalPreferences {
  const normalizedCurrent = normalizePreferences(current, defaults)

  return {
    app: mergeSection(normalizedCurrent.app, next.app),
    breadcrumb: mergeSection(normalizedCurrent.breadcrumb, next.breadcrumb),
    header: mergeSection(normalizedCurrent.header, next.header),
    sidebar: mergeSection(normalizedCurrent.sidebar, next.sidebar),
    tabbar: mergeSection(normalizedCurrent.tabbar, next.tabbar),
    theme: normalizeThemePreferences(mergeSection(normalizedCurrent.theme, next.theme)),
    shortcutKeys: mergeSection(normalizedCurrent.shortcutKeys, next.shortcutKeys),
    transition: mergeSection(normalizedCurrent.transition, next.transition),
  }
}

export function resolvePreferenceAvailability(preferences: LumalPreferences): PreferenceAvailability {
  const headerMenuEnabled = preferences.app.layout !== 'sidebar-nav'
  const sidebarEnabled = preferences.app.layout !== 'top-nav' && preferences.sidebar.enable

  return {
    headerMenuAlign: headerMenuEnabled,
    headerMenuMaxWidth: headerMenuEnabled,
    sidebarAutoActivateChild: preferences.app.layout === 'mixed-nav' && sidebarEnabled,
    sidebarCollapsed: sidebarEnabled,
    sidebarWidth: sidebarEnabled,
    tabbarCache: preferences.tabbar.enable,
  }
}

/***********************设置入口显隐*********************/
export function resolvePreferenceVisibility(
  visibility: LumalPreferencesVisibility = {},
): ResolvedPreferenceVisibility {
  return Object.fromEntries(Object.entries(createDefaultPreferences()).map(([section, preferences]) => {
    const sectionVisibility = visibility[section as keyof LumalPreferences]
    const featureVisibility = typeof sectionVisibility === 'boolean'
      ? undefined
      : sectionVisibility as Record<string, boolean | undefined> | undefined

    return [
      section,
      Object.fromEntries(Object.keys(preferences).map(feature => [
        feature,
        typeof sectionVisibility === 'boolean' ? sectionVisibility : featureVisibility?.[feature] ?? true,
      ])),
    ]
  })) as ResolvedPreferenceVisibility
}

/***********************主题模式解析*********************/
export function resolveThemeMode(
  mode: ThemeMode,
  environment: ThemeRuntimeEnvironment = {},
): ResolvedThemeMode {
  if (mode === 'dark' || mode === 'light') {
    return mode
  }

  return environment.matchMedia?.(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light'
}
