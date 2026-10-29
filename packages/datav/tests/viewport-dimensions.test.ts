import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import LumalConicalColumnChart from '../src/components/LumalConicalColumnChart.vue'
import LumalDigitalFlop from '../src/components/LumalDigitalFlop.vue'
import LumalScrollBoard from '../src/components/LumalScrollBoard.vue'
import LumalWaterLevelPond from '../src/components/LumalWaterLevelPond.vue'

let frames: FrameRequestCallback[]
beforeEach(() => {
  frames = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function flushFrames() {
  const pending = frames
  frames = []
  pending.forEach(callback => callback(performance.now()))
  await nextTick()
}

describe('内部设计数值与测量边界', () => {
  it('数字字号在 resize 的 RAF 提交后更新，不能以已重排的 CSS 作为数值更新完成信号', async () => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1440 })
    vi.stubGlobal('innerWidth', 1280)
    const digital = mount(LumalDigitalFlop, { props: { value: 128, fontSize: 30, duration: 0 } })
    await flushFrames()
    const text = digital.get('text')
    expect(Number(text.attributes('font-size'))).toBeCloseTo(30 * 1280 / 1440)

    vi.stubGlobal('innerWidth', 1366)
    window.dispatchEvent(new Event('resize'))
    await nextTick()
    // 单独等待 Vue 微任务不会执行共享的窗口测量 RAF。
    expect(Number(text.attributes('font-size'))).toBeCloseTo(30 * 1280 / 1440)
    await flushFrames()
    expect(Number(text.attributes('font-size'))).toBeCloseTo(30 * 1366 / 1440)
    expect(text.text()).toBe('128')
    digital.unmount()
  })

  it.each([1920, 1440])('设计宽度 %s 的数字、图形与表格宽度随窗口变化，业务值和实际测量不重复转换', async (designWidth) => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth })
    vi.stubGlobal('innerWidth', 1920)
    const config = { number: [321], style: { fontSize: 24, lineDash: [6, 3], lineDashOffset: 2, shadowOffsetX: 8 } }
    const digital = mount(LumalDigitalFlop, { props: { config, duration: 0 } })
    const conical = mount(LumalConicalColumnChart, {
      props: { items: [{ key: 'a', label: 'A', value: 321 }], fontSize: 18, imageSideLength: 30, images: ['/point.png'] },
    })
    const board = mount(LumalScrollBoard, {
      props: { autoplay: false, config: { columnWidth: [144], data: [['A', 321]], header: ['名称', '值'], headerHeight: 36 } },
    })
    await flushFrames()
    for (const width of [1280, 1920, 2560]) {
      vi.stubGlobal('innerWidth', width)
      window.dispatchEvent(new Event('resize'))
      await flushFrames()
      const ratio = width / designWidth
      const text = digital.get('text')
      expect(Number(text.attributes('font-size'))).toBeCloseTo(24 * ratio)
      const dashes = text.attributes('stroke-dasharray')!.split(',').map(Number)
      expect(dashes[0]).toBeCloseTo(6 * ratio)
      expect(dashes[1]).toBeCloseTo(3 * ratio)
      expect(Number(text.attributes('stroke-dashoffset'))).toBeCloseTo(2 * ratio)
      expect(Number(digital.get('feDropShadow').attributes('dx'))).toBeCloseTo(8 * ratio)
      expect(text.text()).toBe('321')
      expect(Number(conical.get('image').attributes('width'))).toBeCloseTo(30 * ratio)
      expect(Number.parseFloat(conical.get('text').attributes('style')!.split(':')[1]!)).toBeCloseTo(18 * ratio)
      const headers = board.findAll('.header-item')
      expect(Number.parseFloat((headers[0]!.element as HTMLElement).style.width)).toBeCloseTo(144 * ratio)
      // 第二列由 400px 的实际容器剩余空间计算，不能再乘比例。
      expect(Number.parseFloat((headers[1]!.element as HTMLElement).style.width)).toBeCloseTo(400 - 144 * ratio)
    }
    expect(config.number).toEqual([321])
    expect(config.style.fontSize).toBe(24)
    digital.unmount()
    conical.unmount()
    board.unmount()
  })

  it.each([1920, 1440])('设计宽度 %s 的水波振幅换算一次，水位与测量画布不随配置缩放', async (designWidth) => {
    vi.stubGlobal('innerWidth', designWidth / 2)
    const physical = mount(LumalWaterLevelPond, { props: { value: 50, waveHeight: 20 } })
    await flushFrames()
    const path = physical.get('path').attributes('d')
    physical.unmount()
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth })
    const adapted = mount(LumalWaterLevelPond, { props: { value: 50, waveHeight: 40 } })
    await flushFrames()
    expect(adapted.get('path').attributes('d')).toBe(path)
    expect(adapted.get('svg').attributes('viewBox')).toBe('0 0 400 200')
    expect(adapted.get('text').text()).toBe('50%')
    adapted.unmount()
  })
})
