export type ThemeMode = 'dark' | 'light' | 'system'
export type ResolvedThemeMode = Exclude<ThemeMode, 'system'>
export type LumalLayoutMode = 'mixed-nav' | 'sidebar-nav' | 'top-nav'
export type LumalTransitionName = 'fade' | 'fade-bottom' | 'fade-side' | 'zoom-fade'
export type LumalHeaderMenuAlign = 'center' | 'left' | 'right'
export type LumalTabStyle = 'brisk' | 'card' | 'chrome' | 'plain'

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown> ? DeepPartial<T[K]> : T[K]
}

export interface ThemeState {
  colorPrimary: string
  compact: boolean
  mode: ThemeMode
}

export type ThemeOptions = Partial<ThemeState>

export type ThemeTokens = Record<`--lumal-${string}`, string>

export interface LumalPreferences {
  app: {
    dynamicTitle: boolean
    layout: LumalLayoutMode
  }
  breadcrumb: {
    enable: boolean
    hideOnlyOne: boolean
    showHome: boolean
    showIcon: boolean
  }
  header: {
    globalSearch: boolean
    menuAlign: LumalHeaderMenuAlign
    menuMaxWidth: number
  }
  sidebar: {
    autoActivateChild: boolean
    collapsed: boolean
    enable: boolean
    width: number
  }
  tabbar: {
    cache: boolean
    draggable: boolean
    enable: boolean
    maxCount: number
    middleClickToClose: boolean
    persist: boolean
    showIcon: boolean
    showMaximize: boolean
    showMore: boolean
    showRefresh: boolean
    styleType: LumalTabStyle
    visitHistory: boolean
    wheelable: boolean
  }
  theme: {
    colorPrimary: string
    fontSize: number
    mode: ThemeMode
    radiusScale: number
  }
  shortcutKeys: {
    globalSearch: boolean
  }
  transition: {
    enable: boolean
    loading: boolean
    name: LumalTransitionName
    progress: boolean
  }
}

export type LumalPreferencesDefaults = DeepPartial<LumalPreferences>

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
  defaults?: LumalPreferencesDefaults
  runtime?: ThemeRuntimeEnvironment
  storage: PreferencesStorage
  storageKey: string
}

export interface PreferencesStore {
  readonly resolvedThemeMode: import('vue').Ref<ResolvedThemeMode>
  readonly state: import('vue').Ref<LumalPreferences>
  apply: () => ResolvedThemeMode
  dispose: () => void
  exportCurrent: () => LumalPreferences
  patch: (next?: LumalPreferencesDefaults) => void
  reset: () => void
}

export interface ThemeStore {
  readonly state: ThemeState
  reset: () => void
  setColorPrimary: (color: string) => void
  setCompact: (compact: boolean) => void
  setMode: (mode: ThemeMode) => void
}
