import type { ThemeState, ThemeTokens } from './types'

export const defaultThemeState: ThemeState = {
  colorPrimary: '#1677ff',
  compact: false,
  mode: 'light',
}

/***********************主题变量*********************/
export function resolveThemeTokens(state: ThemeState, length = (pixels: number) => `${pixels}px`): ThemeTokens {
  const isDark = state.mode === 'dark'

  return {
    '--lumal-color-bg': isDark ? '#0a0a0a' : '#f5f7fa',
    '--lumal-color-bg-elevated': isDark ? '#1d1e1f' : '#ffffff',
    '--lumal-color-bg-page': isDark ? '#0a0a0a' : '#f5f7fa',
    '--lumal-color-bg-surface': isDark ? '#141414' : '#ffffff',
    '--lumal-color-border': isDark ? '#414243' : '#dcdfe6',
    '--lumal-color-border-light': isDark ? '#363637' : '#e4e7ed',
    '--lumal-color-danger': '#f56c6c',
    '--lumal-color-primary': state.colorPrimary,
    '--lumal-color-success': '#67c23a',
    '--lumal-color-text': isDark ? '#e5eaf3' : '#303133',
    '--lumal-color-text-muted': isDark ? '#8d9095' : '#909399',
    '--lumal-color-text-primary': isDark ? '#e5eaf3' : '#303133',
    '--lumal-color-text-regular': isDark ? '#cfd3dc' : '#606266',
    '--lumal-color-warning': '#e6a23c',
    '--lumal-density-padding': length(state.compact ? 12 : 16),
    '--lumal-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    '--lumal-motion-duration-base': '220ms',
    '--lumal-motion-duration-fast': '160ms',
    '--lumal-motion-duration-slow': '280ms',
    '--lumal-page-gutter': length(state.compact ? 16 : 20),
    '--lumal-radius-base': length(8),
    '--lumal-radius-large': length(12),
    '--lumal-radius-small': length(6),
    '--lumal-shadow-base': isDark
      ? `0 ${length(8)} ${length(24)} rgb(0 0 0 / 32%)`
      : `0 ${length(8)} ${length(24)} rgb(15 23 42 / 8%)`,
    '--lumal-shadow-light': isDark
      ? `0 ${length(2)} ${length(8)} rgb(0 0 0 / 24%)`
      : `0 ${length(2)} ${length(8)} rgb(15 23 42 / 6%)`,
    '--lumal-spacing-lg': length(24),
    '--lumal-spacing-md': length(16),
    '--lumal-spacing-sm': length(12),
    '--lumal-spacing-xl': length(32),
    '--lumal-spacing-xs': length(8),
    '--lumal-z-context-menu': '2100',
    '--lumal-z-dialog': '2050',
    '--lumal-z-drawer': '2040',
    '--lumal-z-dropdown': '2000',
    '--lumal-z-header': '100',
    '--lumal-z-scrim': '1800',
    '--lumal-z-sidebar': '90',
  }
}
