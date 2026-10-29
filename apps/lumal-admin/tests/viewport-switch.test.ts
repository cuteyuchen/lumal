import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppViewportSwitch from '../src/components/app/AppViewportSwitch.vue'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('header VW 开关', () => {
  it.each([
    { enabled: true, base: '/', current: '/?source=demo#/examples/viewport?tab=font', target: '/px/?source=demo#/examples/viewport?tab=font' },
    { enabled: false, base: '/px/', current: '/px/?source=demo#/system/users?page=2', target: '/?source=demo#/system/users?page=2' },
  ])('enabled=$enabled 切换同源产物并保留查询与当前路由', async ({ enabled, base, current, target }) => {
    const assign = vi.fn()
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled, designWidth: 1920 })
    vi.stubGlobal('location', { href: `https://admin.example${current}`, assign })
    vi.stubEnv('BASE_URL', base)
    localStorage.setItem('lumal-admin:token', 'existing-session')
    const wrapper = mount(AppViewportSwitch)
    const control = wrapper.get('[role="switch"]')
    expect(control.attributes('aria-checked')).toBe(String(enabled))
    expect(control.attributes('aria-label')).toBe('VW 适配')
    await control.trigger('click')
    expect(assign).toHaveBeenCalledExactlyOnceWith(`https://admin.example${target}`)
    expect(localStorage.getItem('lumal-admin:token')).toBe('existing-session')
    localStorage.removeItem('lumal-admin:token')
    wrapper.unmount()
  })
})
