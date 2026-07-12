import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAdminThemeTransition } from '../src/services/theme-transition'

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
})
