export type ThemeMode = 'dark' | 'light'

export interface ThemeState {
  colorPrimary: string
  compact: boolean
  mode: ThemeMode
}

export type ThemeOptions = Partial<ThemeState>

export type ThemeTokens = Record<`--luma-${string}`, string>

export interface ThemeStore {
  readonly state: ThemeState
  reset: () => void
  setColorPrimary: (color: string) => void
  setCompact: (compact: boolean) => void
  setMode: (mode: ThemeMode) => void
}
