import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, shallowRef } from 'vue'
import { useAdminViewport } from '../src/composables/use-admin-viewport'
import { applyAdminPreferences, createAdminPreferences } from '../src/services/preferences'

describe('整页 vw 的唯一单位与生命周期', () => {
  it('顶部导航与 body 浮层共用根单位，切换恢复 px，卸载恢复宿主原值', () => {
    const root = document.documentElement
    const previous = root.getAttribute('style')
    root.dataset.adminViewport = 'host'
    root.style.setProperty('--lumal-viewport-unit', '2px', 'important')
    const enabled = shallowRef(true)
    const wrapper = mount(defineComponent({
      setup() {
        useAdminViewport(enabled)
        return () => h('div')
      },
    }))
    try {
      expect(root.dataset.adminViewport).toBe('vw')
      expect(root.style.getPropertyValue('--lumal-viewport-unit')).toBe(`${100 / 1920}vw`)
      applyAdminPreferences(createAdminPreferences())
      expect(root.style.getPropertyValue('--el-font-size-base')).toBe('calc(14 * var(--lumal-viewport-unit, 1px))')
      expect(root.style.getPropertyValue('--lumal-header-height')).toBe('calc(50 * var(--lumal-viewport-unit, 1px))')
      enabled.value = false
      expect(root.dataset.adminViewport).toBe('responsive')
      expect(root.style.getPropertyValue('--lumal-viewport-unit')).toBe('1px')
    }
    finally {
      wrapper.unmount()
      expect(root.dataset.adminViewport).toBe('host')
      expect(root.style.getPropertyValue('--lumal-viewport-unit')).toBe('2px')
      expect(root.style.getPropertyPriority('--lumal-viewport-unit')).toBe('important')
      root.removeAttribute('data-admin-viewport')
      if (previous === null)
        root.removeAttribute('style')
      else
        root.setAttribute('style', previous)
    }
  })
})
