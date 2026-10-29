import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileStyle, parse } from '@vue/compiler-sfc'
import { compileString } from 'sass-embedded'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyThemePreferences,
  applyThemeToElement,
  createDefaultPreferences,
  createPreferencesStore,
  createThemeStore,
  mergePreferences,
  resolvePreferenceAvailability,
  resolvePreferenceVisibility,
  resolveThemeMode,
  resolveThemeTokens,
} from '../src/theme'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

describe('theme runtime', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('项目设计宽度贯通动态 token、主题切换和恢复，不在运行时写回固定 px', () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1440 })
    const targetDocument = document.implementation.createHTMLDocument()
    const preferences = createDefaultPreferences({ theme: { fontSize: 14 }, sidebar: { width: 248 } })
    const style = targetDocument.documentElement.style
    applyThemePreferences(preferences, { document: targetDocument })
    expect(style.getPropertyValue('--lumal-header-height')).toBe('3.4722222222vw')
    expect(style.getPropertyValue('--lumal-sidebar-width')).toBe('17.2222222222vw')
    expect(style.getPropertyValue('--el-font-size-base')).toBe('0.9722222222vw')
    expect(style.getPropertyValue('--lumal-page-gutter')).toBe('1.3888888889vw')

    preferences.theme.mode = 'dark'
    preferences.theme.fontSize = 18
    applyThemePreferences(preferences, { document: targetDocument })
    expect(targetDocument.documentElement.classList.contains('dark')).toBe(true)
    expect(style.fontSize).toBe('1.25vw')
    expect(style.getPropertyValue('--el-font-size-medium')).toBe('1.3888888889vw')

    applyThemePreferences(createDefaultPreferences(), { document: targetDocument })
    expect(style.fontSize).toBe('0.9722222222vw')
    expect(style.getPropertyValue('--lumal-header-height')).toBe('3.4722222222vw')
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: false, designWidth: 1440 })
    applyThemePreferences(preferences, { document: targetDocument })
    expect(style.fontSize).toBe('18px')
    expect(style.getPropertyValue('--lumal-header-height')).toBe('50px')
  })

  it('主题入口包含单选按钮样式，保留处理方式的标签和选中态', () => {
    const themeEntry = readFileSync(resolve(import.meta.dirname, '../theme-chalk/index.scss'), 'utf8')

    expect(themeEntry).toContain('@import "element-plus/theme-chalk/el-radio-button.css"')
  })

  it('偏好面板保留数字输入框的组件默认宽度', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../src/theme/LumalThemeSettingsPanel.vue'), 'utf8')
    const { descriptor } = parse(source)
    const { errors, rawResult } = compileStyle({
      id: 'theme-settings-panel',
      source: compileString(descriptor.styles[0]!.content).css,
    })
    expect(errors).toEqual([])

    // 检查样式约束，不使用 jsdom 推断实际数字的绘制宽度。
    const inputWidths: string[] = []
    rawResult!.root.walkRules(/\.el-input-number\b/, (rule) => {
      rule.walkDecls('width', (declaration) => {
        inputWidths.push(declaration.value)
      })
    })
    expect(inputWidths).toEqual([])
  })

  it('会创建默认主题状态并生成 CSS 变量 token', () => {
    const store = createThemeStore()
    const tokens = resolveThemeTokens(store.state)

    expect(store.state).toEqual({
      colorPrimary: '#1677ff',
      compact: false,
      mode: 'light',
    })
    expect(tokens['--lumal-color-primary']).toBe('#1677ff')
    expect(tokens['--lumal-density-padding']).toBe('16px')
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

    expect(element.dataset.lumalTheme).toBe('dark')
    expect(element.dataset.lumalCompact).toBe('true')
    expect(element.style.getPropertyValue('--lumal-color-primary')).toBe('#22c55e')
    expect(element.style.getPropertyValue('--lumal-density-padding')).toBe('12px')
  })

  it('会创建并合并 Lumal 偏好配置', () => {
    const preferences = createDefaultPreferences({
      theme: {
        colorPrimary: '#22c55e',
        mode: 'dark',
      },
      transition: {
        loading: false,
      },
    })
    const merged = mergePreferences(preferences, {
      sidebar: {
        collapsed: true,
      },
      tabbar: {
        cache: false,
      },
    })

    expect(preferences).toMatchObject({
      app: {
        dynamicTitle: true,
        layout: 'mixed-nav',
      },
      breadcrumb: {
        enable: true,
        hideOnlyOne: false,
        showHome: true,
        showIcon: true,
      },
      header: {
        globalSearch: true,
      },
      sidebar: {
        autoActivateChild: false,
        width: 200,
      },
      shortcutKeys: {
        globalSearch: true,
      },
      theme: {
        colorPrimary: '#22c55e',
        fontSize: 14,
        mode: 'dark',
        radiusScale: 0.75,
      },
      transition: {
        enable: true,
        loading: false,
        name: 'fade-side',
        progress: true,
      },
    })
    expect(merged.sidebar.collapsed).toBe(true)
    expect(merged.tabbar.cache).toBe(false)
    expect(merged.theme.colorPrimary).toBe('#22c55e')
  })

  it('默认标签偏好对齐 Vben：持久化、访问历史、拖拽、滚轮、中键、更多、刷新、最大化均开启', () => {
    const preferences = createDefaultPreferences()
    expect(preferences.tabbar).toMatchObject({
      cache: true,
      draggable: true,
      enable: true,
      maxCount: 0,
      middleClickToClose: true,
      persist: true,
      showIcon: true,
      showMaximize: true,
      showMore: true,
      showRefresh: true,
      styleType: 'chrome',
      visitHistory: true,
      wheelable: true,
    })
  })

  it('旧存储缺少新字段时会以默认值补齐', () => {
    // 模拟旧存储只包含部分 tabbar 字段。
    const legacyPreferences = {
      tabbar: {
        cache: false,
        enable: true,
        maxCount: 8,
        showIcon: true,
        showMaximize: true,
      },
    }
    const merged = mergePreferences(legacyPreferences, {}, {})
    expect(merged.tabbar.cache).toBe(false)
    expect(merged.tabbar.maxCount).toBe(8)
    // 缺失字段以 Vben 默认补齐。
    expect(merged.tabbar.persist).toBe(true)
    expect(merged.tabbar.visitHistory).toBe(true)
    expect(merged.tabbar.draggable).toBe(true)
    expect(merged.tabbar.wheelable).toBe(true)
    expect(merged.tabbar.middleClickToClose).toBe(true)
    expect(merged.tabbar.showMore).toBe(true)
    expect(merged.tabbar.showRefresh).toBe(true)
    expect(merged.tabbar.styleType).toBe('chrome')
    expect(merged.app.dynamicTitle).toBe(true)
    expect(merged.breadcrumb.enable).toBe(true)
    expect(merged.header.globalSearch).toBe(true)
    expect(merged.sidebar.autoActivateChild).toBe(false)
    expect(merged.shortcutKeys.globalSearch).toBe(true)
    expect(merged.theme.fontSize).toBe(14)
  })

  it('会把全局字号限制在 12 到 20 之间', () => {
    expect(createDefaultPreferences({ theme: { fontSize: 100 } }).theme.fontSize).toBe(20)
    expect(mergePreferences(createDefaultPreferences(), { theme: { fontSize: 8 } }).theme.fontSize).toBe(12)
    expect(mergePreferences(createDefaultPreferences(), { theme: { fontSize: 16.7 } }).theme.fontSize).toBe(17)
  })

  it('会解析 system 主题并把偏好应用到 DOM', () => {
    const element = document.createElement('html')
    const matchMedia = () => ({ matches: true }) as MediaQueryList
    const preferences = createDefaultPreferences({
      theme: {
        colorPrimary: '#16a34a',
        fontSize: 18,
        mode: 'system',
        radiusScale: 0.75,
      },
    })

    const resolvedMode = applyThemePreferences(preferences, {
      document: { documentElement: element } as Document,
      matchMedia,
    })

    expect(resolveThemeMode('system', { matchMedia })).toBe('dark')
    expect(resolvedMode).toBe('dark')
    expect(element.classList.contains('dark')).toBe(true)
    expect(element.dataset.lumalTheme).toBe('dark')
    expect(element.style.getPropertyValue('--lumal-color-primary')).toBe('#16a34a')
    expect(element.style.getPropertyValue('--el-color-primary')).toBe('#16a34a')
    expect(element.style.getPropertyValue('--lumal-radius-scale')).toBe('0.75')
    expect(element.style.getPropertyValue('--lumal-header-height')).toBe('50px')
    expect(element.style.getPropertyValue('--lumal-tabbar-height')).toBe('40px')
    expect(element.style.getPropertyValue('--lumal-sidebar-width')).toBe('200px')
    expect(element.style.getPropertyValue('--lumal-font-size-base')).toBe('18px')
    expect(element.style.getPropertyValue('--el-font-size-base')).toBe('18px')
    expect(element.style.getPropertyValue('--el-font-size-small')).toBe('17px')
    expect(element.style.getPropertyValue('--el-font-size-extra-small')).toBe('16px')
    expect(element.style.getPropertyValue('--el-font-size-medium')).toBe('20px')
    expect(element.style.getPropertyValue('--el-font-size-large')).toBe('22px')
    expect(element.style.fontSize).toBe('18px')
  })

  it('核心布局与业务组件会消费全局字号变量', () => {
    const sources = [
      '../src/layout/LumalHeader.vue',
      '../src/components/page/LumalPage.vue',
      '../src/components/info-table/LumalInfoTable.vue',
      '../src/components/schema-form/LumalSchemaForm.vue',
      '../src/components/schema-table/LumalSchemaTable.vue',
    ].map(path => readFileSync(new URL(path, import.meta.url), 'utf8'))

    expect(sources.every(source => source.includes('var(--lumal-font-size-base, 14px)'))).toBe(true)
    expect(sources.some(source => /font-size:\s*(?:12|13|14|16|18)px/.test(source))).toBe(false)
  })
  it('设计宽度也覆盖圆角、阴影与间距，不需要主题长度回调', () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1920 })
    const element = document.createElement('html')
    applyThemePreferences(createDefaultPreferences({ theme: { fontSize: 18 }, sidebar: { width: 256 } }), {
      document: { documentElement: element } as Document,
    })
    expect(element.style.getPropertyValue('--lumal-font-size-base')).toBe('0.9375vw')
    expect(element.style.getPropertyValue('--el-border-radius-base')).toBe('0.3125vw')
    expect(element.style.getPropertyValue('--lumal-shadow-base')).toBe('0 0.4166666667vw 1.25vw rgb(15 23 42 / 8%)')
    expect(element.style.getPropertyValue('--lumal-spacing-md')).toBe('0.8333333333vw')
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: false, designWidth: 1920 })
    applyThemePreferences(createDefaultPreferences(), { document: { documentElement: element } as Document })
    expect(element.style.getPropertyValue('--lumal-font-size-base')).toBe('14px')
    expect(element.style.getPropertyValue('--lumal-shadow-base')).toBe('0 8px 24px rgb(15 23 42 / 8%)')
  })

  it('会按布局模式统一解析设置项可用性', () => {
    expect(resolvePreferenceAvailability(createDefaultPreferences({
      app: { layout: 'sidebar-nav' },
    }))).toMatchObject({
      headerMenuAlign: false,
      headerMenuMaxWidth: false,
      sidebarAutoActivateChild: false,
      sidebarCollapsed: true,
      sidebarWidth: true,
      tabbarCache: true,
    })

    expect(resolvePreferenceAvailability(createDefaultPreferences({
      app: { layout: 'top-nav' },
    }))).toMatchObject({
      headerMenuAlign: true,
      sidebarAutoActivateChild: false,
      sidebarCollapsed: false,
      sidebarWidth: false,
    })

    expect(resolvePreferenceAvailability(createDefaultPreferences({
      app: { layout: 'mixed-nav' },
    }))).toMatchObject({
      sidebarAutoActivateChild: true,
    })
  })

  it('显隐未配置时会显示所有已知偏好项', () => {
    const visibility = resolvePreferenceVisibility()
    const preferences = createDefaultPreferences()

    expect(Object.keys(visibility)).toEqual(Object.keys(preferences))
    for (const section of Object.values(visibility)) {
      expect(Object.values(section).every(visible => visible)).toBe(true)
    }
    expect(Object.keys(visibility.theme)).toEqual(Object.keys(preferences.theme))
    expect(Object.keys(visibility.tabbar)).toEqual(Object.keys(preferences.tabbar))
  })

  it('显隐支持整组和单项配置，undefined 保持默认显示', () => {
    const visibility = resolvePreferenceVisibility({
      header: true,
      sidebar: undefined,
      tabbar: false,
      theme: { fontSize: undefined, mode: false },
    })

    expect(Object.values(visibility.header).every(visible => visible)).toBe(true)
    expect(Object.values(visibility.sidebar).every(visible => visible)).toBe(true)
    expect(Object.values(visibility.tabbar).every(visible => !visible)).toBe(true)
    expect(visibility.theme).toEqual({
      colorPrimary: true,
      fontSize: true,
      mode: false,
      radiusScale: true,
    })
    expect(visibility.app.dynamicTitle).toBe(true)
  })

  it('隐藏主题模式不会修改默认值或缓存中的实际偏好', () => {
    const storage = new MemoryStorage()
    storage.setItem('preferences', JSON.stringify({ theme: { mode: 'light' } }))
    const store = createPreferencesStore({
      autoApply: false,
      defaults: { theme: { mode: 'dark' } },
      storage,
      storageKey: 'preferences',
    })
    const config = Object.freeze({ theme: Object.freeze({ mode: false }) })
    const visibility = resolvePreferenceVisibility(config)

    expect(visibility.theme.mode).toBe(false)
    expect(config).toEqual({ theme: { mode: false } })
    expect(store.exportCurrent().theme.mode).toBe('light')
    store.reset()
    expect(store.exportCurrent().theme.mode).toBe('dark')
  })

  it('偏好 Store 会持久化、重置并清理损坏缓存', () => {
    const storage = new MemoryStorage()
    storage.setItem('preferences', '{invalid-json')
    const store = createPreferencesStore({
      autoApply: false,
      defaults: {
        app: { layout: 'mixed-nav' },
        theme: { mode: 'dark' },
      },
      storage,
      storageKey: 'preferences',
    })

    expect(store.state.value.app.layout).toBe('mixed-nav')
    expect(store.state.value.theme.mode).toBe('dark')
    expect(storage.getItem('preferences')).toBeNull()

    store.patch({ theme: { colorPrimary: '#7c3aed' } })
    expect(JSON.parse(storage.getItem('preferences') ?? '{}')).toMatchObject({
      theme: { colorPrimary: '#7c3aed', mode: 'dark' },
    })

    store.reset()
    expect(store.exportCurrent()).toMatchObject({
      app: { layout: 'mixed-nav' },
      theme: { colorPrimary: '#1677ff', mode: 'dark' },
    })
  })

  it('偏好 Store 只在 system 模式监听系统主题并可释放监听', () => {
    const listeners = new Set<() => void>()
    const media = {
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      matches: false,
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    } as unknown as MediaQueryList
    const store = createPreferencesStore({
      defaults: { theme: { mode: 'system' } },
      runtime: {
        document,
        matchMedia: () => media,
      },
      storage: new MemoryStorage(),
      storageKey: 'preferences',
    })

    expect(listeners.size).toBe(1)
    store.patch({ theme: { mode: 'light' } })
    expect(listeners.size).toBe(0)
    store.patch({ theme: { mode: 'system' } })
    expect(listeners.size).toBe(1)

    store.dispose()
    expect(listeners.size).toBe(0)
  })
})
