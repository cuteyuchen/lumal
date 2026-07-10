import type { LumaPreferences, ResolvedThemeMode, ThemeRuntimeEnvironment, ThemeState } from './types'
import { normalizePreferences, resolveThemeMode } from './preferences'
import { resolveThemeTokens } from './tokens'

/***********************DOM 应用*********************/
export function applyThemeToElement(element: HTMLElement, state: ThemeState): void {
  const tokens = resolveThemeTokens(state)

  element.dataset.lumaTheme = state.mode
  element.dataset.lumaCompact = String(state.compact)

  Object.entries(tokens).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

export function applyThemePreferences(
  preferences: unknown,
  environment: ThemeRuntimeEnvironment = {},
): ResolvedThemeMode {
  const normalizedPreferences = normalizePreferences(preferences)
  const resolvedMode = resolveThemeMode(normalizedPreferences.theme.mode, environment)
  const element = environment.document?.documentElement

  if (!element) {
    return resolvedMode
  }

  element.classList.toggle('dark', resolvedMode === 'dark')
  applyThemeToElement(element, {
    colorPrimary: normalizedPreferences.theme.colorPrimary,
    compact: false,
    mode: resolvedMode,
  })
  applyElementPlusThemeVariables(element, normalizedPreferences, resolvedMode)
  applyLayoutThemeVariables(element, normalizedPreferences)

  return resolvedMode
}

export function watchSystemTheme(
  preferences: unknown,
  onChange: (mode: ResolvedThemeMode) => void,
  environment: ThemeRuntimeEnvironment = {},
): () => void {
  const normalizedPreferences = normalizePreferences(preferences)

  if (normalizedPreferences.theme.mode !== 'system' || !environment.matchMedia) {
    return () => undefined
  }

  const mediaQueryList = environment.matchMedia('(prefers-color-scheme: dark)')
  const listener = () => onChange(mediaQueryList.matches ? 'dark' : 'light')
  mediaQueryList.addEventListener('change', listener)

  return () => mediaQueryList.removeEventListener('change', listener)
}

/***********************Element Plus 变量*********************/
function applyElementPlusThemeVariables(
  element: HTMLElement,
  preferences: LumaPreferences,
  mode: ResolvedThemeMode,
): void {
  const color = preferences.theme.colorPrimary

  element.style.setProperty('--el-color-primary', color)
  element.style.setProperty('--el-color-primary-light-3', mixHexColor(color, mode === 'dark' ? '#000000' : '#ffffff', 0.3))
  element.style.setProperty('--el-color-primary-light-5', mixHexColor(color, mode === 'dark' ? '#000000' : '#ffffff', 0.5))
  element.style.setProperty('--el-color-primary-light-7', mixHexColor(color, mode === 'dark' ? '#000000' : '#ffffff', 0.7))
  element.style.setProperty('--el-color-primary-light-9', mixHexColor(color, mode === 'dark' ? '#000000' : '#ffffff', 0.9))
  element.style.setProperty('--el-color-primary-dark-2', mixHexColor(color, mode === 'dark' ? '#ffffff' : '#000000', 0.2))
  element.style.setProperty('--luma-radius-scale', String(preferences.theme.radiusScale))
  element.style.setProperty('--el-border-radius-base', `${Math.round(8 * preferences.theme.radiusScale)}px`)
  element.style.setProperty('--el-border-radius-small', `${Math.round(6 * preferences.theme.radiusScale)}px`)
}

/***********************布局变量*********************/
function applyLayoutThemeVariables(element: HTMLElement, preferences: LumaPreferences): void {
  element.style.setProperty('--luma-sidebar-width', `${preferences.sidebar.width}px`)
  element.style.setProperty('--luma-header-height', '56px')
  element.style.setProperty('--luma-tabbar-height', '40px')
  element.style.setProperty('--luma-page-gutter', '20px')
}

function normalizeHexColor(value: string): string {
  const normalized = value.trim().replace('#', '')

  if (normalized.length === 3) {
    return `#${normalized.split('').map(item => `${item}${item}`).join('')}`.toLowerCase()
  }

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return '#1677ff'
  }

  return `#${normalized}`.toLowerCase()
}

function hexToRgbChannels(value: string): [number, number, number] {
  const normalized = normalizeHexColor(value)

  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ]
}

function mixHexColor(color: string, target: string, weight: number): string {
  const [red, green, blue] = hexToRgbChannels(color)
  const [targetRed, targetGreen, targetBlue] = hexToRgbChannels(target)
  const mixChannel = (source: number, next: number) =>
    Math.round(source * (1 - weight) + next * weight)
      .toString(16)
      .padStart(2, '0')

  return `#${mixChannel(red, targetRed)}${mixChannel(green, targetGreen)}${mixChannel(blue, targetBlue)}`
}
