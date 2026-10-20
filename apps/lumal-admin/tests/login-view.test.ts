import { LumalIcon } from '@lumal/icons-vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from 'vue-router'
import { createAdminRouter } from '../src/router'
import { currentUser, logout } from '../src/services/session'
import LoginView from '../src/views/login/LoginView.vue'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('login view', () => {
  afterEach(async () => {
    await logout()
    localStorage.removeItem('lumal-admin:login-layout')
  })

  it('会使用账号预设登录并按 redirect 回跳', async () => {
    const router = createAdminRouter(createMemoryHistory())

    await router.push('/login?redirect=/project')
    await router.isReady()

    const wrapper = mount(LoginView, {
      global: {
        plugins: [router],
        stubs: elementPlusStubs,
      },
    })

    expect(wrapper.text()).toContain('Lumal Admin')
    expect(wrapper.find('img[src*="lumal-logo.svg"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="toggle-theme"]').attributes('aria-label')).toContain('切换')
    expect(wrapper.find('[data-action="toggle-theme"]').findComponent(LumalIcon).props('morph')).toBe(true)
    expect(wrapper.find('[data-testid="login-username"] input').element).toHaveProperty('value', 'admin')

    await wrapper.find('button[aria-label="表单居左"]').trigger('click')
    expect(wrapper.classes()).toContain('is-form-left')
    expect(localStorage.getItem('lumal-admin:login-layout')).toBe('left')

    await wrapper.find('[data-testid="login-account"]').setValue('operator')
    expect(wrapper.find('[data-testid="login-username"] input').element).toHaveProperty('value', 'operator')

    await wrapper.find('[data-testid="login-form"]').trigger('submit')
    await vi.waitFor(() => {
      expect(currentUser.value?.username).toBe('operator')
      expect(router.currentRoute.value.path).toBe('/project')
    })
  })
})
