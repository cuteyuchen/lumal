import { registerAuthorityDirectives } from '@luma/core/directives'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { adminCockpitRepository } from '../src/cockpit/api/cockpit'
import AppHeaderActions from '../src/components/app/AppHeaderActions.vue'
import { createAdminRouter } from '../src/router'
import { permissionStore } from '../src/services/permission'
import { login, logout } from '../src/services/session'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const IconStub = defineComponent({ name: 'LumaIcon', template: '<i class="luma-icon-stub" />' })

describe('cockpit 集成', () => {
  afterEach(async () => {
    await logout()
  })

  /***********************配置持久化*********************/
  it('能从 Mock API 加载标准配置', async () => {
    await login('admin')
    const config = await adminCockpitRepository.load('admin-demo-cockpit')
    expect(config.schemaVersion).toBe(1)
    expect(config.categories.length).toBeGreaterThan(0)
  })

  it('保存后返回服务端配置用于更新运行态', async () => {
    await login('admin')
    const config = await adminCockpitRepository.load('admin-demo-cockpit')
    const next = { ...config, title: '已更新标题' }
    const saved = await adminCockpitRepository.save(next)
    expect(saved.title).toBe('已更新标题')
    // 再次加载确认持久化生效
    const reloaded = await adminCockpitRepository.load('admin-demo-cockpit')
    expect(reloaded.title).toBe('已更新标题')
  })

  it('无编辑权限时保存失败，不影响已加载配置', async () => {
    await login('operator')
    const original = await adminCockpitRepository.load('admin-demo-cockpit')
    await expect(adminCockpitRepository.save({ ...original, title: '越权修改' })).rejects.toBeTruthy()
    // 正式配置未被污染
    const reloaded = await adminCockpitRepository.load('admin-demo-cockpit')
    expect(reloaded.title).not.toBe('越权修改')
  })

  /***********************路由守卫*********************/
  it('未登录访问驾驶舱跳转登录并带回跳地址', async () => {
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/cockpit')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.query.redirect).toBe('/cockpit')
  })

  it('有查看权限时可进入驾驶舱路由', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/cockpit')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/cockpit')
  })

  it('无查看权限时进入 403', async () => {
    await login('guest')
    // guest 无 cockpit:view
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/cockpit')
    await router.isReady()
    expect(router.currentRoute.value.path).toBe('/403')
  })

  it('驾驶舱路由使用 public layout 绕过 Admin 壳层', async () => {
    await login('admin')
    const router = createAdminRouter(createMemoryHistory())
    await router.push('/cockpit')
    await router.isReady()
    expect(router.currentRoute.value.meta.layout).toBe('public')
  })

  it('查看权限与编辑权限相互独立', async () => {
    await login('operator')
    // operator 有 view 无 edit
    expect(permissionStore.hasPermission('cockpit:view')).toBe(true)
    expect(permissionStore.hasPermission('cockpit:edit')).toBe(false)
  })

  /***********************Header 入口*********************/
  it('有查看权限用户看到 Header 驾驶舱入口', async () => {
    await login('admin')
    const wrapper = mount(AppHeaderActions, {
      props: { resolvedThemeMode: 'light' as const },
      global: {
        stubs: { ...elementPlusStubs, LumaIcon: IconStub },
        directives: { authority: makeAuthorityDirective() },
      },
    })
    await flushPromises()
    expect(wrapper.find('[data-action="open-cockpit"]').exists()).toBe(true)
  })

  it('无查看权限用户看不到 Header 驾驶舱入口', async () => {
    await login('guest')
    const wrapper = mount(AppHeaderActions, {
      props: { resolvedThemeMode: 'light' as const },
      global: {
        stubs: { ...elementPlusStubs, LumaIcon: IconStub },
        directives: { authority: makeAuthorityDirective() },
      },
    })
    await flushPromises()
    const button = wrapper.find('[data-action="open-cockpit"]')
    // 指令通过 display:none 隐藏
    const hidden = !button.exists() || (button.element as HTMLElement).style.display === 'none'
    expect(hidden).toBe(true)
  })
})

/** 从 core 提取 authority 指令，供组件测试注册 */
function makeAuthorityDirective() {
  const captured: Record<string, unknown> = {}
  const fakeApp = {
    directive(name: string, def: unknown) {
      captured[name] = def
      return fakeApp
    },
  }
  registerAuthorityDirectives(fakeApp as never, permissionStore)
  return captured.authority as never
}
