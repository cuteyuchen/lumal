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
    '--luma-color-bg': isDark ? '#0a0a0a' : '#f5f7fa',
    '--luma-color-bg-elevated': isDark ? '#1d1e1f' : '#ffffff',
    '--luma-color-bg-page': isDark ? '#0a0a0a' : '#f5f7fa',
    '--luma-color-bg-surface': isDark ? '#141414' : '#ffffff',
    '--luma-color-border': isDark ? '#414243' : '#dcdfe6',
    '--luma-color-border-light': isDark ? '#363637' : '#e4e7ed',
    '--luma-color-danger': '#f56c6c',
    '--luma-color-primary': state.colorPrimary,
    '--luma-color-success': '#67c23a',
    '--luma-color-text': isDark ? '#e5eaf3' : '#303133',
    '--luma-color-text-muted': isDark ? '#8d9095' : '#909399',
    '--luma-color-text-primary': isDark ? '#e5eaf3' : '#303133',
    '--luma-color-text-regular': isDark ? '#cfd3dc' : '#606266',
    '--luma-color-warning': '#e6a23c',
    '--luma-density-padding': state.compact ? '12px' : '16px',
    '--luma-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
    '--luma-motion-duration-base': '220ms',
    '--luma-motion-duration-fast': '160ms',
    '--luma-motion-duration-slow': '280ms',
    '--luma-page-gutter': state.compact ? '16px' : '20px',
    '--luma-radius-base': '8px',
    '--luma-radius-large': '12px',
    '--luma-radius-small': '6px',
    '--luma-shadow-base': isDark
      ? '0 8px 24px rgb(0 0 0 / 32%)'
      : '0 8px 24px rgb(15 23 42 / 8%)',
    '--luma-shadow-light': isDark
      ? '0 2px 8px rgb(0 0 0 / 24%)'
      : '0 2px 8px rgb(15 23 42 / 6%)',
    '--luma-spacing-lg': '24px',
    '--luma-spacing-md': '16px',
    '--luma-spacing-sm': '12px',
    '--luma-spacing-xl': '32px',
    '--luma-spacing-xs': '8px',
    '--luma-z-context-menu': '2100',
    '--luma-z-dialog': '2050',
    '--luma-z-drawer': '2040',
    '--luma-z-dropdown': '2000',
    '--luma-z-header': '100',
    '--luma-z-scrim': '1800',
    '--luma-z-sidebar': '90',
  }
}
