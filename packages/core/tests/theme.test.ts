import { describe, expect, it } from 'vitest'
import {
  applyThemeToElement,
  createThemeStore,
  resolveThemeTokens,
} from '../src/theme'

describe('theme runtime', () => {
  it('会创建默认主题状态并生成 CSS 变量 token', () => {
    const store = createThemeStore()
    const tokens = resolveThemeTokens(store.state)

    expect(store.state).toEqual({
      colorPrimary: '#1677ff',
      compact: false,
      mode: 'light',
    })
    expect(tokens['--luma-color-primary']).toBe('#1677ff')
    expect(tokens['--luma-density-padding']).toBe('16px')
  })

  it('会更新主题色、明暗模式和紧凑模式', () => {
    const store = createThemeStore()

    store.setColorPrimary('#22c55e')
    store.setMode('dark')
    store.setCompact(true)

    expect(store.state).toEqual({
      colorPrimary: '#22c55e',
      compact: true,
      mode: 'dark',
    })
  })

  it('会把主题状态应用到 DOM 元素', () => {
    const element = document.createElement('div')
    const store = createThemeStore({
      colorPrimary: '#22c55e',
      compact: true,
      mode: 'dark',
    })

    applyThemeToElement(element, store.state)

    expect(element.dataset.lumaTheme).toBe('dark')
    expect(element.dataset.lumaCompact).toBe('true')
    expect(element.style.getPropertyValue('--luma-color-primary')).toBe('#22c55e')
    expect(element.style.getPropertyValue('--luma-density-padding')).toBe('12px')
  })
})
