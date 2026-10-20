import type { IconMorphController } from '../src/morph'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerIcons } from '../src'
import { createIconMorph, prepareIconMorph } from '../src/morph'
import * as runtime from '../src/morph/runtime'

const firstSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4L20 20"/></svg>'
const secondSvg = firstSvg.replace('M4 4L20 20', 'M4 20L20 4')

describe('框架无关图标形变', () => {
  let target: HTMLSpanElement
  let frames: Map<number, FrameRequestCallback>
  let sequence: number
  let time: number
  let media: MediaQueryList
  let listeners: Set<() => void>
  let controllers: IconMorphController[]

  function create(source = firstSvg, options: Parameters<typeof createIconMorph>[2] = {}) {
    const controller = createIconMorph(target, source, options)
    controllers.push(controller)
    return controller
  }

  function frame(): void {
    time += 16
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback(time))
  }

  function settle(): void {
    for (let index = 0; index < 300 && frames.size; index++)
      frame()
    expect(frames.size).toBe(0)
  }

  beforeEach(() => {
    target = document.createElement('span')
    frames = new Map()
    controllers = []
    sequence = 0
    time = 0
    listeners = new Set()
    media = {
      matches: false,
      addEventListener: vi.fn((_event, listener) => listeners.add(listener)),
      removeEventListener: vi.fn((_event, listener) => listeners.delete(listener)),
    } as unknown as MediaQueryList
    vi.stubGlobal('matchMedia', vi.fn(() => media))
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.set(++sequence, callback)
      return sequence
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
  })

  afterEach(() => {
    controllers.forEach(controller => controller.destroy())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('同步显示静态图标，首次就绪不播放，后续切换保留路径并抵达终态', async () => {
    const controller = create(firstSvg, { size: 20, color: '#e11d48', title: '切换状态' })
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 4L20 20')
    expect(await controller.ready).toBe(true)
    expect(frames.size).toBe(0)
    expect(target.style.width).toBe('20px')
    expect(target.style.color).toBe('rgb(225, 29, 72)')
    expect(target.title).toBe('切换状态')
    expect(target.getAttribute('aria-hidden')).toBe('true')
    const path = target.querySelector('path')!
    const start = path.getAttribute('d')
    const end = (await prepareIconMorph(secondSvg))!.d
    expect(await controller.update(secondSvg, { spring: 'snappy' })).toBe(true)
    frame()
    frame()
    expect(target.querySelector('path')).toBe(path)
    expect(path.getAttribute('d')).not.toBe(start)
    expect(path.getAttribute('d')).not.toBe(end)
    settle()
    expect(path.getAttribute('d')).toBe(end)
    await controller.update(secondSvg, { size: '2em', color: '#10b981' })
    expect(target.querySelector('path')).toBe(path)
    expect(target.style.width).toBe('2em')
    expect(frames.size).toBe(0)
  })

  it('连续反向切换从当前中间形状转向最新目标', async () => {
    const controller = create(firstSvg, { spring: 'bouncy' })
    await controller.ready
    const path = target.querySelector('path')!
    const start = path.getAttribute('d')
    await controller.update(secondSvg)
    frame()
    frame()
    frame()
    const middle = path.getAttribute('d')
    await controller.update(firstSvg)
    expect(path.getAttribute('d')).toBe(middle)
    frame()
    expect(path.getAttribute('d')).not.toBe(start)
    settle()
    expect(path.getAttribute('d')).toBe(start)
  })

  it('注册名和直接定义共享转换，返回可供其他框架绑定使用的原生输入', async () => {
    const definition = { key: 'native:morph', source: 'local-svg' as const, label: '原生形变', svgText: firstSvg }
    registerIcons([definition])
    const registered = (await prepareIconMorph(definition.key))!
    const direct = (await prepareIconMorph(definition))!
    expect(registered.icon).toEqual(direct.icon)
    expect(registered.d).toBe(direct.d)
    const controller = create(definition.key)
    expect(target.title).toBe('原生形变')
    expect(await controller.ready).toBe(true)
    expect(await controller.update(definition)).toBe(true)
    expect(frames.size).toBe(0)
  })

  it('填充和混合图形等待区域归一化，太阳月亮不丢失填充', async () => {
    const controller = create('lumal:sun')
    expect(target.querySelector('circle')).not.toBeNull()
    expect(await controller.ready).toBe(true)
    const path = target.querySelector('path')!
    const initial = path.getAttribute('d')
    expect(path.getAttribute('fill')).toBe('currentColor')
    expect(initial!.match(/M/g)!.length).toBeGreaterThan(1)
    await controller.update('lumal:moon')
    frame()
    frame()
    expect(path.getAttribute('d')).not.toBe(initial)
    settle()
    expect(path.getAttribute('d')).toBe((await prepareIconMorph('lumal:moon'))!.d)
    await controller.update('lumal:sun')
    settle()
    expect(path.getAttribute('d')).toBe(initial)
  })

  it('系统减少动画时不加载引擎，运行中启用会清理帧并显示静态目标', async () => {
    Object.assign(media, { matches: true })
    const load = vi.spyOn(runtime, 'loadIconMorphRuntime')
    const controller = create()
    expect(await controller.ready).toBe(false)
    expect(load).not.toHaveBeenCalled()
    Object.assign(media, { matches: false })
    listeners.forEach(listener => listener())
    await vi.waitFor(() => expect(load).toHaveBeenCalled())
    await controller.update(secondSvg)
    frame()
    Object.assign(media, { matches: true })
    listeners.forEach(listener => listener())
    expect(frames.size).toBe(0)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 20L20 4')
    controller.destroy()
    expect(listeners.size).toBe(0)
  })

  it('关闭动画和销毁都恢复当前目标的静态资源并取消待执行帧', async () => {
    const controller = create()
    await controller.ready
    await controller.update(secondSvg)
    frame()
    expect(await controller.update(secondSvg, { enabled: false })).toBe(false)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 20L20 4')
    expect(frames.size).toBe(0)
    await controller.update(firstSvg, { enabled: true })
    await controller.update(secondSvg)
    frame()
    controller.destroy()
    expect(frames.size).toBe(0)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 20L20 4')
    expect(await controller.update(firstSvg)).toBe(false)
  })

  it('引擎失败时返回静态，下一次显式更新可以恢复', async () => {
    vi.spyOn(runtime, 'loadIconMorphRuntime').mockRejectedValueOnce(new Error('offline'))
    const controller = create()
    expect(await controller.ready).toBe(false)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 4L20 20')
    expect(await controller.update(secondSvg)).toBe(true)
    expect(frames.size).toBe(0)
  })

  it('异步准备只接受最新目标，销毁后不会创建过期实例', async () => {
    const original = runtime.prepareIconMorph
    let resolve!: (value: Awaited<ReturnType<typeof original>>) => void
    vi.spyOn(runtime, 'prepareIconMorph').mockReturnValueOnce(new Promise((done) => {
      resolve = done
    }))
    const controller = create()
    await controller.update(secondSvg)
    const path = target.querySelector('path')
    resolve(await original(firstSvg))
    expect(await controller.ready).toBe(false)
    expect(target.querySelector('path')).toBe(path)
    expect(path?.getAttribute('d')).toBe((await original(secondSvg))!.d)
    controller.destroy()

    vi.spyOn(runtime, 'prepareIconMorph').mockReturnValueOnce(new Promise((done) => {
      resolve = done
    }))
    const pending = create()
    pending.destroy()
    resolve(await original(firstSvg))
    expect(await pending.ready).toBe(false)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 4L20 20')
    expect(listeners.size).toBe(0)
  })

  it('显式保留 SVG 默认填充，不把未声明 fill 的图形当作纯描边', async () => {
    const prepared = await prepareIconMorph('<svg viewBox="0 0 24 24" stroke="black" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4Z"/></svg>')
    expect(prepared?.filled).toBe(true)
    expect(prepared?.svgText).toContain('fill="black"')
    expect(prepared?.d).toContain('Z')
  })

  it.each([
    firstSvg.replace('stroke="currentColor"', 'stroke="url(#paint)"'),
    firstSvg.replace('<path', '<path opacity="0.4"'),
    firstSvg.replace('<path', '<path stroke-dasharray="2 3"'),
    firstSvg.replace('<path', '<path transform="scale(2)"'),
    firstSvg.replace('<path', '<path class="external-paint"'),
    firstSvg.replace('<path', '<path x="20%"'),
    firstSvg.replace('<path', '<svg viewBox="0 0 48 48"><path').replace('</svg>', '</svg></svg>'),
    '<svg viewBox="0 0 24 24"><text x="2" y="12">A</text></svg>',
    '<svg viewBox="0 0 24 24"><defs><clipPath id="x"/></defs><path d="M4 4h8v8z"/></svg>',
    '<svg><path d="M4 4h8v8z"/></svg>',
    firstSvg.replace('0 0 24 24', '0 0 0 24'),
    '<svg viewBox="0 0 24 24"><path fill="red" d="M4 4h8v8z"/><path fill="blue" d="M12 12h8v8z"/></svg>',
  ])('无法保真时保留原 SVG：%s', async (source) => {
    const controller = create(source)
    expect(await controller.ready).toBe(false)
    expect(target.querySelector('svg')).not.toBeNull()
    expect(frames.size).toBe(0)
  })

  it('组件、Iconify 和未知名称不转换为本地 SVG', async () => {
    for (const source of [
      { key: 'native:component', source: 'component' as const, component: {} },
      { key: 'native:iconify', source: 'iconify' as const, icon: 'mdi:home' },
      'native:unknown',
    ]) {
      expect(await prepareIconMorph(source)).toBeUndefined()
    }
  })

  it('解析 SVG 异常同样静态回退，不阻断更新和清理', async () => {
    vi.stubGlobal('DOMParser', class {
      constructor() {
        throw new Error('parser unavailable')
      }
    })
    const controller = create()
    expect(await controller.ready).toBe(false)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 4L20 20')
    expect(await controller.update(secondSvg)).toBe(false)
    expect(target.querySelector('path')?.getAttribute('d')).toBe('M4 20L20 4')
    expect(await prepareIconMorph(firstSvg)).toBeUndefined()
  })
})
