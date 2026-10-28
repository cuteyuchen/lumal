import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyAdminPreferences, createAdminPreferences } from '../src/services/preferences'

describe('整页 vw 的唯一项目配置', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('顶部与 body 浮层共享直接 vw token，不安装运行时根单位或模式补丁', () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1920 })
    const root = document.documentElement
    applyAdminPreferences(createAdminPreferences())
    expect(root.style.getPropertyValue('--el-font-size-base')).toBe('0.7291666667vw')
    expect(root.style.getPropertyValue('--lumal-header-height')).toBe('2.6041666667vw')
    expect(root.style.getPropertyValue('--lumal-viewport-unit')).toBe('')
    expect(root.dataset.adminViewport).toBeUndefined()
    expect(root.style.transform).toBe('')
  })
})
