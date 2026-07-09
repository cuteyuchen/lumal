import type { ThemeState, ThemeTokens } from './types'

export const defaultThemeState: ThemeState = {
  colorPrimary: '#1677ff',
  compact: false,
  mode: 'light',
}

/***********************主题变量*********************/
export function resolveThemeTokens(state: ThemeState): ThemeTokens {
  const isDark = state.mode === 'dark'

  return {
    '--luma-color-bg': isDark ? '#111827' : '#ffffff',
    '--luma-color-border': isDark ? '#374151' : '#e5e7eb',
    '--luma-color-primary': state.colorPrimary,
    '--luma-color-text': isDark ? '#f9fafb' : '#111827',
    '--luma-density-padding': state.compact ? '12px' : '16px',
    '--luma-radius-base': '8px',
  }
}
