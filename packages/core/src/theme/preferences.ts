import type {
  LumaPreferences,
  LumaPreferencesDefaults,
  ResolvedThemeMode,
  ThemeMode,
  ThemeRuntimeEnvironment,
} from './types'

const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

/***********************默认偏好*********************/
export function createDefaultPreferences(defaults: LumaPreferencesDefaults = {}): LumaPreferences {
  const builtin: LumaPreferences = {
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
      enable: true,
      maxCount: 8,
      showIcon: true,
      showMaximize: true,
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

  return {
    app: mergeSection(builtin.app, defaults.app),
    header: mergeSection(builtin.header, defaults.header),
    sidebar: mergeSection(builtin.sidebar, defaults.sidebar),
    tabbar: mergeSection(builtin.tabbar, defaults.tabbar),
    theme: mergeSection(builtin.theme, defaults.theme),
    transition: mergeSection(builtin.transition, defaults.transition),
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
  defaults: LumaPreferencesDefaults = {},
): LumaPreferences {
  const raw = isRecord(input) ? input : {}
  const fallback = createDefaultPreferences(defaults)

  return {
    app: mergeSection(fallback.app, isRecord(raw.app) ? raw.app as Partial<LumaPreferences['app']> : undefined),
    header: mergeSection(fallback.header, isRecord(raw.header) ? raw.header as Partial<LumaPreferences['header']> : undefined),
    sidebar: mergeSection(fallback.sidebar, isRecord(raw.sidebar) ? raw.sidebar as Partial<LumaPreferences['sidebar']> : undefined),
    tabbar: mergeSection(fallback.tabbar, isRecord(raw.tabbar) ? raw.tabbar as Partial<LumaPreferences['tabbar']> : undefined),
    theme: mergeSection(fallback.theme, isRecord(raw.theme) ? raw.theme as Partial<LumaPreferences['theme']> : undefined),
    transition: mergeSection(
      fallback.transition,
      isRecord(raw.transition) ? raw.transition as Partial<LumaPreferences['transition']> : undefined,
    ),
  }
}

export function mergePreferences(
  current: unknown,
  next: LumaPreferencesDefaults = {},
  defaults: LumaPreferencesDefaults = {},
): LumaPreferences {
  const normalizedCurrent = normalizePreferences(current, defaults)

  return {
    app: mergeSection(normalizedCurrent.app, next.app),
    header: mergeSection(normalizedCurrent.header, next.header),
    sidebar: mergeSection(normalizedCurrent.sidebar, next.sidebar),
    tabbar: mergeSection(normalizedCurrent.tabbar, next.tabbar),
    theme: mergeSection(normalizedCurrent.theme, next.theme),
    transition: mergeSection(normalizedCurrent.transition, next.transition),
  }
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
