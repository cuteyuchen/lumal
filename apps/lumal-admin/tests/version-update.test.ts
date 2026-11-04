import type { CreateVersionCheckOptions, LumalVersionInfo } from '@lumal/core/composables'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import AppVersionUpdate from '../src/components/app/AppVersionUpdate.vue'
import {
  adminVersionCheckOptions,
  registerVersionReloadGuard,
  runVersionReloadGuards,
} from '../src/services/version-check'
import { elementPlusStubs } from './helpers/element-plus-stubs'

const current: LumalVersionInfo = {
  buildId: 'abc1234-2026-11-04T08:00:00.000Z',
  builtAt: '2026-11-04T08:00:00.000Z',
  commit: 'abc1234',
  version: '0.1.1-beta',
}

const next: LumalVersionInfo = {
  buildId: 'def5678-2026-11-04T09:00:00.000Z',
  builtAt: '2026-11-04T09:00:00.000Z',
  commit: 'def5678',
  version: '0.1.2-beta',
}

const DialogStub = defineComponent({
  name: 'ElDialog',
  props: {
    modelValue: Boolean,
    title: String,
    width: [String, Number],
  },
  emits: ['update:modelValue'],
  template: `
    <section v-if="modelValue" class="el-dialog" role="dialog" :aria-label="title">
      <h2>{{ title }}</h2>
      <slot />
      <footer><slot name="footer" /></footer>
    </section>
  `,
})

function createEnvironment(response: () => Promise<unknown>, reload = vi.fn()) {
  const documentListeners = new Map<string, Set<() => void>>()
  const windowListeners = new Map<string, Set<() => void>>()
  const documentRef = {
    hidden: false,
    visibilityState: 'visible',
    addEventListener(type: string, listener: () => void) {
      const listeners = documentListeners.get(type) ?? new Set()
      listeners.add(listener)
      documentListeners.set(type, listeners)
    },
    removeEventListener(type: string, listener: () => void) {
      documentListeners.get(type)?.delete(listener)
    },
  }
  const windowRef = {
    addEventListener() {},
    removeEventListener() {},
  }
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: response,
  }))

  return {
    environment: {
      document: documentRef,
      window: windowRef,
      location: { reload },
      fetch: fetchMock,
      setTimeout: (handler: () => void, timeout: number) => setTimeout(handler, timeout),
      clearTimeout: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
    fetchMock,
    reload,
    listenerCounts: () => ({
      document: [...documentListeners.values()].reduce((total, listeners) => total + listeners.size, 0),
      window: [...windowListeners.values()].reduce((total, listeners) => total + listeners.size, 0),
    }),
  }
}

function mountVersionUpdate(options: Partial<CreateVersionCheckOptions>) {
  return mount(AppVersionUpdate, {
    global: {
      stubs: {
        ElButton: elementPlusStubs.ElButton,
        ElDialog: DialogStub,
      },
    },
    props: { options },
  })
}

function buttonByText(wrapper: ReturnType<typeof mountVersionUpdate>, text: string) {
  const button = wrapper.findAll('button').find(item => item.text() === text)
  if (!button)
    throw new Error(`缺少按钮：${text}`)
  return button
}

describe('app version update', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('发现新构建时展示版本、提交与未保存内容风险', async () => {
    const testEnvironment = createEnvironment(async () => next)
    const wrapper = mountVersionUpdate({
      current,
      enabled: true,
      environment: testEnvironment.environment,
      initialDelay: 0,
      interval: 0,
      url: '/version.json',
    })

    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('发现新版本')
    expect(dialog.text()).toContain('当前页面仍在运行旧版本')
    expect(dialog.text()).toContain('v0.1.2-beta')
    expect(dialog.text()).toContain('def5678')
    expect(dialog.text()).toContain('未保存的内容将丢失')
    expect(wrapper.findAll('button').map(button => button.text())).toEqual(['稍后', '立即刷新'])

    wrapper.unmount()
    expect(testEnvironment.listenerCounts()).toEqual({ document: 0, window: 0 })
  })

  it('当前构建与远端一致时不展示提示', async () => {
    const testEnvironment = createEnvironment(async () => current)
    const wrapper = mountVersionUpdate({
      current,
      enabled: true,
      environment: testEnvironment.environment,
      initialDelay: 0,
      interval: 0,
      url: '/version.json',
    })

    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(testEnvironment.fetchMock).toHaveBeenCalledOnce()
  })

  it('稍后关闭提示且同一次挂载内不重复弹出', async () => {
    const testEnvironment = createEnvironment(async () => next)
    const wrapper = mountVersionUpdate({
      current,
      enabled: true,
      environment: testEnvironment.environment,
      initialDelay: 0,
      interval: 10,
      url: '/version.json',
    })

    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)

    await buttonByText(wrapper, '稍后').trigger('click')
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    await vi.advanceTimersByTimeAsync(50)
    await flushPromises()
    expect(testEnvironment.fetchMock.mock.calls.length).toBeGreaterThan(1)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('立即刷新触发一次 reload，守卫拒绝时保留对话框', async () => {
    const reload = vi.fn()
    const testEnvironment = createEnvironment(async () => next, reload)
    const blocked = vi.fn(async () => false)
    const wrapper = mountVersionUpdate({
      beforeReload: blocked,
      current,
      enabled: true,
      environment: testEnvironment.environment,
      initialDelay: 0,
      interval: 0,
      url: '/version.json',
    })

    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()

    await buttonByText(wrapper, '立即刷新').trigger('click')
    await flushPromises()
    expect(blocked).toHaveBeenCalledOnce()
    expect(reload).not.toHaveBeenCalled()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('守卫通过后刷新一次，重复点击不会再次 reload', async () => {
    const reload = vi.fn()
    const testEnvironment = createEnvironment(async () => next, reload)
    const wrapper = mountVersionUpdate({
      beforeReload: async () => true,
      current,
      enabled: true,
      environment: testEnvironment.environment,
      initialDelay: 0,
      interval: 0,
      url: '/version.json',
    })

    await vi.advanceTimersByTimeAsync(0)
    await flushPromises()

    await buttonByText(wrapper, '立即刷新').trigger('click')
    await flushPromises()
    await buttonByText(wrapper, '立即刷新').trigger('click')
    await flushPromises()

    expect(reload).toHaveBeenCalledOnce()
  })
})

describe('version check configuration', () => {
  it('开发环境默认关闭，默认间隔 5 分钟并从 BASE_URL 取 manifest', () => {
    expect(adminVersionCheckOptions.enabled).toBe(false)
    expect(adminVersionCheckOptions.interval).toBe(5 * 60 * 1000)
    expect(adminVersionCheckOptions.url).toBe('/version.json')
    expect(adminVersionCheckOptions.initialDelay).toBe(1_500)
  })

  it('刷新守卫支持注销、阻断与异常保护', async () => {
    const first = vi.fn(async () => true)
    const second = vi.fn(async () => true)
    const unregisterFirst = registerVersionReloadGuard(first)
    const unregisterSecond = registerVersionReloadGuard(second)

    await expect(runVersionReloadGuards()).resolves.toBe(true)
    unregisterFirst()
    await expect(runVersionReloadGuards()).resolves.toBe(true)
    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledTimes(2)
    unregisterSecond()

    const unregisterBlocked = registerVersionReloadGuard(() => false)
    await expect(runVersionReloadGuards()).resolves.toBe(false)
    unregisterBlocked()

    const unregisterBroken = registerVersionReloadGuard(() => {
      throw new Error('未保存')
    })
    await expect(runVersionReloadGuards()).resolves.toBe(false)
    unregisterBroken()

    await expect(runVersionReloadGuards()).resolves.toBe(true)
  })
})
