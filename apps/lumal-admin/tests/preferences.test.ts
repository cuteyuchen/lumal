import { afterEach, describe, expect, it } from 'vitest'
import {
  adminAppName,
  adminPreferenceDefaults,
  adminPreferences,
  adminResolvedThemeMode,
  applyAdminPreferences,
  createAdminPreferences,
  exportAdminPreferences,
  getAdminSystemConfig,
  patchAdminPreferences,
  resetAdminSystemConfig,
  resolveAdminThemeEnvironment,
  updateAdminSystemConfig,
} from '../src/services/preferences'

describe('lumal admin preferences', () => {
  afterEach(() => {
    resetAdminSystemConfig()
  })

  it('会创建后台基座默认偏好', () => {
    const preferences = createAdminPreferences()

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
        menuAlign: 'center',
        menuMaxWidth: 1120,
      },
      sidebar: {
        collapsed: false,
        enable: true,
        width: 280,
      },
      tabbar: {
        cache: true,
        enable: true,
        maxCount: 0,
      },
      theme: {
        colorPrimary: '#1677ff',
        fontSize: 14,
        mode: 'system',
        radiusScale: 0.75,
      },
      transition: {
        enable: true,
        loading: true,
        name: 'fade-side',
        progress: true,
      },
    })
    expect(adminPreferenceDefaults.app?.layout).toBe('mixed-nav')
  })

  it('会在无 DOM 环境下安全返回空主题运行时环境', () => {
    expect(resolveAdminThemeEnvironment(null, null)).toEqual({})
  })

  it('会容忍没有 matchMedia 的 DOM 环境', () => {
    const environment = resolveAdminThemeEnvironment(document, null)

    expect(environment.document).toBe(document)
    expect(environment.matchMedia).toBeUndefined()
  })

  it('会在默认 jsdom 环境中安全应用主题偏好', () => {
    expect(() => applyAdminPreferences(createAdminPreferences())).not.toThrow()
    expect(document.documentElement.dataset.lumalTheme).toBeTruthy()
  })

  it('系统配置只更新当前会话，不污染默认偏好', () => {
    const config = updateAdminSystemConfig({
      appName: '运营后台',
      colorPrimary: '#7c3aed',
      layout: 'top-nav',
      tabbarEnable: false,
      transitionEnable: false,
    })

    expect(config).toEqual({
      appName: '运营后台',
      colorPrimary: '#7c3aed',
      layout: 'top-nav',
      tabbarEnable: false,
      transitionEnable: false,
    })
    expect(adminAppName.value).toBe('运营后台')
    expect(adminPreferences.value).toMatchObject({
      app: { layout: 'top-nav' },
      tabbar: { enable: false },
      theme: { colorPrimary: '#7c3aed' },
      transition: { enable: false },
    })
    expect(createAdminPreferences()).toMatchObject({
      app: { layout: 'mixed-nav' },
      tabbar: { enable: true },
      theme: { colorPrimary: '#1677ff' },
      transition: { enable: true },
    })
    expect(getAdminSystemConfig()).toEqual(config)
  })

  it('会持久化偏好并导出归一化快照', () => {
    patchAdminPreferences({
      sidebar: { collapsed: true },
      theme: { fontSize: 18, mode: 'dark' },
    })

    expect(exportAdminPreferences()).toMatchObject({
      sidebar: { collapsed: true },
      theme: { fontSize: 18, mode: 'dark' },
    })
    expect(JSON.parse(localStorage.getItem('lumal-admin:preferences') ?? '{}')).toMatchObject({
      sidebar: { collapsed: true },
      theme: { fontSize: 18, mode: 'dark' },
    })
    expect(adminResolvedThemeMode.value).toBe('dark')
    expect(document.documentElement.style.getPropertyValue('--lumal-font-size-base')).toBe('18px')
  })
})
