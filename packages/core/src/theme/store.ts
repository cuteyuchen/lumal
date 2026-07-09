import type { ThemeMode, ThemeOptions, ThemeState, ThemeStore } from './types'
import { defaultThemeState } from './tokens'

/***********************主题状态*********************/
function createThemeState(options: ThemeOptions = {}): ThemeState {
  return {
    ...defaultThemeState,
    ...options,
  }
}

export function createThemeStore(options: ThemeOptions = {}): ThemeStore {
  let state = createThemeState(options)

  return {
    get state() {
      return { ...state }
    },
    reset() {
      state = createThemeState(options)
    },
    setColorPrimary(color: string) {
      state = {
        ...state,
        colorPrimary: color,
      }
    },
    setCompact(compact: boolean) {
      state = {
        ...state,
        compact,
      }
    },
    setMode(mode: ThemeMode) {
      state = {
        ...state,
        mode,
      }
    },
  }
}
