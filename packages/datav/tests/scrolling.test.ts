import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { LumalActiveRingChart, LumalBorderBox, LumalScrollBoard, LumalScrollRankingBoard } from '../src'

vi.mock('echarts', () => ({
  init: vi.fn(() => ({
    dispose: vi.fn(),
    group: '',
    hideLoading: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    resize: vi.fn(),
    setOption: vi.fn(),
    showLoading: vi.fn(),
  })),
}))

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  disconnect = vi.fn()
  observe = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this)
  }

  emit(isIntersecting: boolean): void {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

beforeEach(() => {
  IntersectionObserverMock.instances = []
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
    }),
  })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('scroll board', () => {
  const rows = Array.from({ length: 7 }, (_, index) => ({ id: index, label: `第 ${index} 行`, value: index * 10 }))

  it('最多渲染 visibleRows + 1，按稳定 key 滚动并暴露 slot 参数', async () => {
    const wrapper = mount(LumalScrollBoard, {
      props: { ariaLabel: '事件列表', interval: 300, rowKey: 'id', rows, visibleRows: 2 },
      slots: {
        default: ({ row, index }: { row: typeof rows[number], index: number }) => h('span', `${index}:${row.label}`),
      },
    })
    expect(wrapper.attributes('aria-label')).toBe('事件列表')
    expect(wrapper.findAll('.lumal-scroll-board__row')).toHaveLength(3)
    expect(wrapper.text()).toContain('0:第 0 行')
    await vi.advanceTimersByTimeAsync(601)
    expect(wrapper.find('.lumal-scroll-board__row').text()).toContain('1:第 1 行')
    expect(wrapper.text()).not.toContain('0:第 0 行')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('悬停时暂停，离开后恢复，并支持分页步长', async () => {
    const wrapper = mount(LumalScrollBoard, {
      props: { interval: 300, rowKey: 'id', rows, step: 'page', visibleRows: 2 },
      slots: { default: ({ row }: { row: typeof rows[number] }) => row.label },
    })
    await wrapper.trigger('mouseenter')
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.text()).toContain('第 0 行')
    await wrapper.trigger('mouseleave')
    await vi.advanceTimersByTimeAsync(601)
    expect(wrapper.find('.lumal-scroll-board__row').text()).toContain('第 2 行')
    wrapper.unmount()
  })

  it('无 slot 时按显式列定义格式化并发出 rowClick', async () => {
    const onRowClick = vi.fn()
    const wrapper = mount(LumalScrollBoard, {
      props: {
        autoplay: false,
        columns: [
          { key: 'label', label: '名称' },
          { formatter: value => `${value} 次`, key: 'value', label: '数量' },
        ],
        onRowClick,
        rowKey: row => row.id as number,
        rows: rows.slice(0, 2),
      },
    })
    expect(wrapper.text()).toContain('名称')
    expect(wrapper.text()).toContain('10 次')
    await wrapper.findAll('.lumal-scroll-board__row')[1]!.trigger('click')
    expect(onRowClick).toHaveBeenCalledWith(rows[1], 1)

    await wrapper.findAll('.lumal-scroll-board__row')[0]!.trigger('keydown', { key: 'Enter' })
    await wrapper.findAll('.lumal-scroll-board__row')[0]!.trigger('keydown', { key: ' ' })
    expect(onRowClick).toHaveBeenNthCalledWith(2, rows[0], 0)
    expect(onRowClick).toHaveBeenNthCalledWith(3, rows[0], 0)
    expect(wrapper.attributes('role')).toBe('table')
    expect(wrapper.findAll('[role="row"]')).toHaveLength(3)
    wrapper.unmount()
  })

  it('自定义行使用 list 语义，键盘焦点进入时暂停自动滚动', async () => {
    const wrapper = mount(LumalScrollBoard, {
      props: { interval: 300, rowKey: 'id', rows, visibleRows: 2 },
      slots: { default: ({ row }: { row: typeof rows[number] }) => row.label },
    })
    expect(wrapper.attributes('role')).toBe('list')
    expect(wrapper.findAll('[role="listitem"]')).toHaveLength(3)
    expect(wrapper.find('.lumal-scroll-board__row').attributes('tabindex')).toBeUndefined()

    await wrapper.trigger('focusin')
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.text()).toContain('第 0 行')
    await wrapper.trigger('focusout')
    await vi.advanceTimersByTimeAsync(601)
    expect(wrapper.find('.lumal-scroll-board__row').text()).toContain('第 1 行')
    wrapper.unmount()
  })
})

describe('ranking and autoplay lifecycle', () => {
  const items = [
    { key: 'a', label: '甲', value: 10 },
    { key: 'b', label: '乙', value: 40 },
    { key: 'c', label: '丙', value: 30 },
    { key: 'd', label: '丁', value: 20 },
  ]

  it('ranking 默认降序、限制渲染数量并暴露 ratio', async () => {
    const wrapper = mount(LumalScrollRankingBoard, {
      props: { interval: 300, items, unit: '件', visibleRows: 2 },
      slots: {
        default: ({ item, index, ratio }: { item: typeof items[number], index: number, ratio: number }) => h('span', `${index}:${item.label}:${ratio}`),
      },
    })
    expect(wrapper.findAll('.lumal-scroll-ranking-board__row')).toHaveLength(3)
    expect(wrapper.text()).toContain('0:乙:1')
    await vi.advanceTimersByTimeAsync(601)
    expect(wrapper.find('.lumal-scroll-ranking-board__row').text()).toContain('1:丙:0.75')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ranking 支持 formatter、关闭 autoplay，并保持排名颜色稳定', async () => {
    const formatter = vi.fn((value: number, item: typeof items[number], index: number) => `${index + 1}-${item.key}-${value}台`)
    const wrapper = mount(LumalScrollRankingBoard, {
      props: { autoplay: false, formatter, interval: 300, items, visibleRows: 2 },
    })
    const firstRow = wrapper.find('.lumal-scroll-ranking-board__row')
    expect(firstRow.text()).toContain('1-b-40台')
    expect(firstRow.attributes('style')).toContain('--lumal-ranking-color: hsl(196 82% 58%)')
    await vi.advanceTimersByTimeAsync(900)
    expect(wrapper.find('.lumal-scroll-ranking-board__row').text()).toContain('乙')
    expect(formatter).toHaveBeenCalledWith(40, items[1], 0)
    wrapper.unmount()

    const scrollingWrapper = mount(LumalScrollRankingBoard, {
      props: { interval: 300, items, visibleRows: 2 },
    })
    const initialColor = scrollingWrapper.findAll('.lumal-scroll-ranking-board__row')
      .find(row => row.text().includes('乙'))!
      .attributes('style')
    await vi.advanceTimersByTimeAsync(1202)
    const scrolledColor = scrollingWrapper.findAll('.lumal-scroll-ranking-board__row')
      .find(row => row.text().includes('乙'))!
      .attributes('style')
    expect(scrolledColor).toBe(initialColor)
    scrollingWrapper.unmount()
  })

  it('reduced-motion 下不启动自动轮换', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      addEventListener: vi.fn(),
      matches: true,
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    const onUpdate = vi.fn()
    const wrapper = mount(LumalActiveRingChart, {
      props: { 'activeKey': 'a', 'interval': 300, items, 'onUpdate:activeKey': onUpdate },
    })
    await vi.advanceTimersByTimeAsync(900)
    expect(onUpdate).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('页面隐藏、离开视口时暂停，并在卸载时断开观察器', async () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const wrapper = mount(LumalScrollRankingBoard, {
      props: { interval: 300, items, visibleRows: 2 },
    })
    const observer = IntersectionObserverMock.instances.at(-1)!

    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.find('.lumal-scroll-ranking-board__label').text()).toBe('乙')

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    observer.emit(false)
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.find('.lumal-scroll-ranking-board__label').text()).toBe('乙')

    observer.emit(true)
    await vi.advanceTimersByTimeAsync(601)
    expect(wrapper.find('.lumal-scroll-ranking-board__label').text()).toBe('丙')
    wrapper.unmount()
    expect(observer.disconnect).toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('cSS 动画在页面隐藏或离开视口时暂停并清理观察器', async () => {
    let hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    const wrapper = mount(LumalBorderBox)
    const observer = IntersectionObserverMock.instances.at(-1)!

    observer.emit(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('is-animation-paused')

    observer.emit(true)
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).toContain('is-animation-paused')

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    await wrapper.vm.$nextTick()
    expect(wrapper.classes()).not.toContain('is-animation-paused')
    wrapper.unmount()
    expect(observer.disconnect).toHaveBeenCalled()
  })
})
