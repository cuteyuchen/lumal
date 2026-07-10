export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>
export type LumaLayoutMode = 'mixed-nav' | 'sidebar-nav' | 'top-nav'
export type LumaTransitionName = 'fade' | 'fade-bottom' | 'fade-side' | 'zoom-fade'
export type LumaHeaderMenuAlign = 'center' | 'left' | 'right'

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K]
}

export interface ThemeState {
  colorPrimary: string
  compact: boolean
  mode: ThemeMode
}

export type ThemeOptions = Partial<ThemeState>

export type ThemeTokens = Record<`--luma-${string}`, string>

export interface LumaPreferences {
  app: {
    layout: LumaLayoutMode
  }
  header: {
    menuAlign: LumaHeaderMenuAlign
    menuMaxWidth: number
  }
  sidebar: {
    collapsed: boolean
    enable: boolean
    width: number
  }
  tabbar: {
    cache: boolean
    enable: boolean
    maxCount: number
    showIcon: boolean
    showMaximize: boolean
  }
  theme: {
    colorPrimary: string
    mode: ThemeMode
    radiusScale: number
  }
  transition: {
    enable: boolean
    loading: boolean
    name: LumaTransitionName
    progress: boolean
  }
}

export type LumaPreferencesDefaults = DeepPartial<LumaPreferences>

export interface ThemeRuntimeEnvironment {
  document?: Document
  matchMedia?: (query: string) => MediaQueryList
}

export interface PreferencesStorage {
  getItem: (key: string) => string | null
  removeItem: (key: string) => void
  setItem: (key: string, value: string) => void
}

export interface CreatePreferencesStoreOptions {
  autoApply?: boolean
  defaults?: LumaPreferencesDefaults
  runtime?: ThemeRuntimeEnvironment
  storage: PreferencesStorage
  storageKey: string
}

export interface PreferencesStore {
  readonly resolvedThemeMode: import('vue').Ref<ResolvedThemeMode>
  readonly state: import('vue').Ref<LumaPreferences>
  apply: () => ResolvedThemeMode
  dispose: () => void
  exportCurrent: () => LumaPreferences
  patch: (next?: LumaPreferencesDefaults) => void
  reset: () => void
}

export interface ThemeStore {
  readonly state: ThemeState
  reset: () => void
  setColorPrimary: (color: string) => void
  setCompact: (compact: boolean) => void
  setMode: (mode: ThemeMode) => void
}
