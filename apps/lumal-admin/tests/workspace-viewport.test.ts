import type { DOMWrapper } from '@vue/test-utils'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, onMounted, shallowRef } from 'vue'
import AppWorkspaceViewport from '../src/components/app/AppWorkspaceViewport.vue'
import {
  adminViewportDefaults,
  adminViewportMode,
  adminViewportStorageKey,
  readAdminViewportMode,
  resolveAdminWorkspacePolicy,
  setAdminViewportMode,
} from '../src/services/workspace-viewport'

/***********************偏好与应用侧策略*********************/
describe('工作区视口偏好', () => {
  beforeEach(() => {
    localStorage.clear()
    setAdminViewportMode('responsive')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each(['responsive', 'contain', 'width'] as const)('读取和持久化 %s，供刷新恢复', (mode) => {
    setAdminViewportMode(mode)
    expect(adminViewportMode.value).toBe(mode)
    expect(localStorage.getItem(adminViewportStorageKey)).toBe(mode)
    expect(readAdminViewportMode()).toBe(mode)
  })

  it.each([null, '', 'invalid', '{"mode":"contain"}', 'disabled'])('无效存储 %s 回退普通响应式', (value) => {
    if (value === null)
      localStorage.removeItem(adminViewportStorageKey)
    else
      localStorage.setItem(adminViewportStorageKey, value)
    expect(readAdminViewportMode()).toBe('responsive')
  })

  it('非法写入不会改变当前模式或持久化值', () => {
    setAdminViewportMode('width')
    for (const value of [undefined, null, {}, 'contain ', 'disabled'])
      setAdminViewportMode(value)
    expect(adminViewportMode.value).toBe('width')
    expect(localStorage.getItem(adminViewportStorageKey)).toBe('width')
  })

  it('存储读写被禁用时保留安全默认和当前会话切换', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError')
    })
    expect(readAdminViewportMode()).toBe('responsive')
    expect(() => setAdminViewportMode('contain')).not.toThrow()
    expect(adminViewportMode.value).toBe('contain')
  })

  it('无法访问 storage 对象时也能切换，不修改认证或授权存储', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readAdminViewportMode()).toBe('responsive')
    expect(() => setAdminViewportMode('width')).not.toThrow()
    expect(adminViewportMode.value).toBe('width')
  })

  it.each(['responsive', 'contain', 'width'] as const)('自管理页面覆盖 %s，普通页面保留用户选择', (mode) => {
    expect(resolveAdminWorkspacePolicy(mode)).toEqual({ ...adminViewportDefaults, mode })
    expect(resolveAdminWorkspacePolicy(mode, true)).toEqual({ ...adminViewportDefaults, mode: 'responsive' })
  })
})

/***********************实际容器测量与稳定页面*********************/
describe('工作区视口包装器', () => {
  const mounted: ReturnType<typeof mount>[] = []
  const observers: {
    callback: () => void
    disconnect: ReturnType<typeof vi.fn>
    observe: ReturnType<typeof vi.fn>
  }[] = []
  let width = 960
  let height = 540

  beforeEach(() => {
    vi.useFakeTimers()
    observers.length = 0
    width = 960
    height = 540
    // jsdom 不计算布局；尺寸来自被观察的实际 host，而不是 window。
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(() => width)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(() => height)
    vi.stubGlobal('ResizeObserver', class {
      callback: () => void
      disconnect = vi.fn()
      observe = vi.fn()

      constructor(callback: () => void) {
        this.callback = callback
        observers.push(this)
      }
    })
  })

  afterEach(() => {
    mounted.splice(0).forEach(wrapper => wrapper.unmount())
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function createWrapper(mode: 'responsive' | 'contain' | 'width' = 'contain', slot?: ReturnType<typeof defineComponent>) {
    const wrapper = mount(AppWorkspaceViewport, {
      props: { fontSize: 14, policy: resolveAdminWorkspacePolicy(mode) },
      slots: { default: slot ?? '<p data-testid="workspace-body">正文</p>' },
    })
    mounted.push(wrapper)
    await nextTick()
    return wrapper
  }

  function styleOf(element: DOMWrapper<Element>): CSSStyleDeclaration {
    return (element.element as HTMLElement).style
  }

  it('首测使用实际内容容器，暴露比例并将字号下限限制在画布内', async () => {
    const rootFont = document.documentElement.style.fontSize
    const rootMinimum = document.documentElement.style.getPropertyValue('--lumal-workspace-min-font-size')
    const wrapper = await createWrapper()
    const stage = styleOf(wrapper.get('.admin-workspace-viewport__stage'))

    expect(observers).toHaveLength(1)
    expect(observers[0]!.observe).toHaveBeenCalledWith(wrapper.element)
    expect(wrapper.attributes()).toMatchObject({
      'data-container-height': '540',
      'data-container-width': '960',
      'data-scale': '0.75',
      'data-viewport-mode': 'contain',
    })
    expect(stage.transform).toContain('scale(0.75)')
    expect(Number.parseFloat(stage.fontSize) * 0.75).toBeGreaterThanOrEqual(12)
    expect(Number.parseFloat(stage.getPropertyValue('--el-font-size-extra-small')) * 0.75).toBeGreaterThanOrEqual(12)
    expect(Number.parseFloat(stage.getPropertyValue('--lumal-workspace-min-font-size')) * 0.75).toBeGreaterThanOrEqual(12)
    expect(document.documentElement.style.fontSize).toBe(rootFont)
    expect(document.documentElement.style.getPropertyValue('--lumal-workspace-min-font-size')).toBe(rootMinimum)
  })

  it('容器观察通知在同一帧合并，卸载取消待处理帧并断开观察', async () => {
    const wrapper = await createWrapper()
    width = 1280
    height = 720
    observers[0]!.callback()
    observers[0]!.callback()
    observers[0]!.callback()
    expect(vi.getTimerCount()).toBe(1)
    expect(wrapper.attributes('data-container-width')).toBe('960')

    vi.runOnlyPendingTimers()
    await nextTick()
    expect(wrapper.attributes('data-container-width')).toBe('1280')
    expect(wrapper.attributes('data-scale')).toBe('1')

    width = 800
    observers[0]!.callback()
    wrapper.unmount()
    mounted.splice(mounted.indexOf(wrapper), 1)
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
    observers[0]!.callback()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('三模式只更新样式，保留输入与子组件实例，responsive 清除缩放和局部字号', async () => {
    const setups = vi.fn()
    const Page = defineComponent({
      setup() {
        const draft = shallowRef('')
        onMounted(setups)
        return () => h('input', {
          'aria-label': '缓存草稿',
          'onInput': (event: Event) => draft.value = (event.target as HTMLInputElement).value,
          'value': draft.value,
        })
      },
    })
    const wrapper = await createWrapper('contain', Page)
    const input = wrapper.get('input').element
    await wrapper.get('input').setValue('保留草稿')

    for (const mode of ['width', 'responsive', 'contain', 'responsive'] as const) {
      await wrapper.setProps({ policy: resolveAdminWorkspacePolicy(mode) })
      expect(wrapper.get('input').element).toBe(input)
      expect((input as HTMLInputElement).value).toBe('保留草稿')
      expect(wrapper.attributes('data-viewport-mode')).toBe(mode)
    }
    expect(setups).toHaveBeenCalledOnce()
    const stage = styleOf(wrapper.get('.admin-workspace-viewport__stage'))
    expect(stage.transform).toBe('')
    expect(stage.fontSize).toBe('')
    expect(stage.getPropertyValue('--lumal-workspace-min-font-size')).toBe('')
    expect(stage.getPropertyValue('--el-font-size-base')).toBe('')
    expect(observers).toHaveLength(1)
  })

  it('高度不足时 contain 遵守下限，width 按宽度计算且保留可滚动占位', async () => {
    height = 400
    const wrapper = await createWrapper()
    expect(wrapper.attributes('data-scale')).toBe('0.75')
    let extent = styleOf(wrapper.get('.admin-workspace-viewport__extent'))
    expect(Number.parseFloat(extent.height)).toBeGreaterThan(height)
    expect(Number.parseFloat(extent.width)).toBeGreaterThanOrEqual(width)

    width = 1280
    observers[0]!.callback()
    vi.runOnlyPendingTimers()
    await wrapper.setProps({ policy: resolveAdminWorkspacePolicy('width') })
    expect(wrapper.attributes('data-scale')).toBe('1')
    extent = styleOf(wrapper.get('.admin-workspace-viewport__extent'))
    expect(Number.parseFloat(extent.height)).toBe(720)
  })
})
