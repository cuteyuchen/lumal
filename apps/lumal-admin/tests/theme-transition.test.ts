import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAdminThemeTransition, waitForAdminThemeTransition } from '../src/services/theme-transition'

describe('admin theme transition', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
    Reflect.deleteProperty(document, 'startViewTransition')
    Reflect.deleteProperty(document.documentElement, 'animate')
    vi.restoreAllMocks()
  })

  it('浏览器不支持 View Transition 时直接切换', async () => {
    const update = vi.fn()

    await runAdminThemeTransition(update, undefined, {
      document,
      matchMedia: () => ({ matches: false }),
      viewport: { innerHeight: 800, innerWidth: 1200 },
    })

    expect(update).toHaveBeenCalledOnce()
  })

  it('减少动态效果时不创建动画', async () => {
    const update = vi.fn()
    const startViewTransition = vi.fn()

    await runAdminThemeTransition(update, { clientX: 20, clientY: 30 }, {
      document: Object.assign(document, { startViewTransition }),
      matchMedia: () => ({ matches: true }),
      viewport: { innerHeight: 800, innerWidth: 1200 },
    })

    expect(update).toHaveBeenCalledOnce()
    expect(startViewTransition).not.toHaveBeenCalled()
  })

  it('从点击位置创建圆形扩散动画', async () => {
    const update = vi.fn(() => document.documentElement.classList.add('dark'))
    const finished = Promise.resolve()
    const animate = vi.fn(() => ({ finished }))
    const skipTransition = vi.fn()
    const startViewTransition = vi.fn((callback: () => void) => {
      callback()
      return { finished, ready: Promise.resolve(), skipTransition }
    })
    Object.defineProperty(document.documentElement, 'animate', {
      configurable: true,
      value: animate,
    })

    await runAdminThemeTransition(update, { clientX: 100, clientY: 120 }, {
      document: Object.assign(document, { startViewTransition }),
      matchMedia: () => ({ matches: false }),
      viewport: { innerHeight: 800, innerWidth: 1200 },
    })

    expect(startViewTransition).toHaveBeenCalledOnce()
    expect(animate).toHaveBeenCalledWith(
      { clipPath: [expect.stringContaining('at 100px 120px'), 'circle(0px at 100px 120px)'] },
      expect.objectContaining({
        duration: 400,
        easing: 'ease-in',
        pseudoElement: '::view-transition-old(root)',
      }),
    )
    expect(skipTransition).toHaveBeenCalledOnce()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('同步主题更新即可等待本次动画，页面快照释放后才完成', async () => {
    let finishAnimation!: () => void
    let finishTransition!: () => void
    const animationFinished = new Promise<void>((resolve) => {
      finishAnimation = resolve
    })
    const finished = new Promise<void>((resolve) => {
      finishTransition = resolve
    })
    const completed = vi.fn()
    const skipTransition = vi.fn()
    Object.defineProperty(document.documentElement, 'animate', {
      configurable: true,
      value: () => ({ finished: animationFinished }),
    })
    const startViewTransition = (callback: () => void) => {
      callback()
      return { finished, ready: Promise.resolve(), skipTransition }
    }
    const running = runAdminThemeTransition(() => {
      void waitForAdminThemeTransition().then(completed)
    }, undefined, {
      document: Object.assign(document, { startViewTransition }),
      matchMedia: () => ({ matches: false }),
      viewport: { innerHeight: 800, innerWidth: 1200 },
    })
    await flushPromises()
    expect(completed).not.toHaveBeenCalled()
    // 过渡期间的重复点击仍被原有业务锁丢弃。
    const repeatedUpdate = vi.fn()
    await runAdminThemeTransition(repeatedUpdate)
    expect(repeatedUpdate).not.toHaveBeenCalled()
    finishAnimation()
    await flushPromises()
    expect(skipTransition).toHaveBeenCalledOnce()
    expect(completed).not.toHaveBeenCalled()
    finishTransition()
    await running
    await flushPromises()
    expect(completed).toHaveBeenCalledOnce()
  })

  it('过渡失败也释放等待任务和业务锁', async () => {
    const skipTransition = vi.fn()
    Object.defineProperty(document.documentElement, 'animate', { configurable: true, value: vi.fn() })
    const startViewTransition = (callback: () => void) => {
      callback()
      return { finished: Promise.resolve(), ready: Promise.reject(new Error('interrupted')), skipTransition }
    }
    await expect(runAdminThemeTransition(vi.fn(), undefined, {
      document: Object.assign(document, { startViewTransition }),
      matchMedia: () => ({ matches: false }),
      viewport: { innerHeight: 800, innerWidth: 1200 },
    })).rejects.toThrow('interrupted')
    await waitForAdminThemeTransition()
    expect(skipTransition).toHaveBeenCalledOnce()
    const update = vi.fn()
    await runAdminThemeTransition(update, undefined, {})
    expect(update).toHaveBeenCalledOnce()
  })
})
