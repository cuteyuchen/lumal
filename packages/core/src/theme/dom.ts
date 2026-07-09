import type { ThemeState } from './types'
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
