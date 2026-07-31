import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { LumalScrollBoard, LumalScrollRankingBoard } from '../src'

class ResizeObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
  constructor(public callback: ResizeObserverCallback) {}
}

class IntersectionObserverMock {
  disconnect = vi.fn()
  observe = vi.fn()
}

let frames: FrameRequestCallback[] = []

async function flushFrames(): Promise<void> {
  const callbacks = frames
  frames = []
  callbacks.forEach(callback => callback(performance.now()))
  await nextTick()
}

beforeEach(() => {
  frames = []
  vi.useFakeTimers()
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.push(callback)
    return frames.length
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(400)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200)
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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('dataV scrollBoard config fidelity', () => {
  it('复原 header、index、列宽、奇偶背景与安全事件 payload', async () => {
    const onClick = vi.fn()
    const onMouseover = vi.fn()
    const wrapper = mount(LumalScrollBoard, {
      props: {
        autoplay: false,
        config: {
          align: ['center', 'left', 'right'],
          carousel: 'page',
          columnWidth: [50, 150],
          data: [
            ['<b>甲</b>', 10],
            ['乙', 20],
            ['丙', 30],
          ],
          evenRowBGC: '#010203',
          header: ['名称', '数值'],
          headerBGC: '#123456',
          headerHeight: 40,
          index: true,
          indexHeader: '序号',
          oddRowBGC: '#040506',
          rowNum: 2,
        },
        onClick,
        onMouseover,
      },
    })
    await flushFrames()

    expect(wrapper.classes()).toContain('dv-scroll-board')
    expect(wrapper.findAll('.header-item').map(item => item.text())).toEqual(['序号', '名称', '数值'])
    expect(wrapper.find('.header-item').attributes('style')).toContain('width: 50px')
    expect(wrapper.findAll('.row-item')).toHaveLength(4)
    expect(wrapper.find('.row-item').attributes('style')).toContain('background-color: rgb(1, 2, 3)')
    expect(wrapper.findAll('.row-item')[1]!.attributes('style')).toContain('background-color: rgb(4, 5, 6)')
    expect(wrapper.find('.index').text()).toBe('1')
    expect(wrapper.text()).toContain('<b>甲</b>')
    expect(wrapper.find('b').exists()).toBe(false)

    const cells = wrapper.find('.row-item').findAll('.ceil')
    await cells[1]!.trigger('mouseenter')
    await cells[1]!.trigger('click')
    const payload = {
      ceil: '<b>甲</b>',
      columnIndex: 1,
      row: [1, '<b>甲</b>', 10],
      rowIndex: 0,
    }
    expect(onMouseover).toHaveBeenCalledWith(payload)
    expect(onClick).toHaveBeenCalledWith(payload)
    wrapper.unmount()
  })

  it('按 waitTime 与 300ms 高度折叠推进，并支持 updateRows', async () => {
    const wrapper = mount(LumalScrollBoard, {
      props: {
        config: {
          data: [['A'], ['B'], ['C']],
          rowNum: 2,
          waitTime: 1000,
        },
      },
    })
    await flushFrames()
    expect(wrapper.find('.row-item').text()).toBe('A')

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.find('.row-item').attributes('style')).toContain('height: 100px')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.find('.row-item').attributes('style')).toContain('height: 0px')
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.find('.row-item').text()).toBe('B')

    const exposed = wrapper.vm as unknown as {
      updateRows: (rows: readonly (readonly unknown[])[], animationIndex?: number) => void
    }
    exposed.updateRows([['X'], ['Y'], ['Z']], 1)
    await nextTick()
    expect(wrapper.find('.row-item').text()).toBe('Y')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('dataV scrollRankingBoard config fidelity', () => {
  it('复原负数百分比、排名、formatter、DOM 与两阶段滚动', async () => {
    const valueFormatter = vi.fn(item => `第${item.ranking}名 ${item.value}`)
    const wrapper = mount(LumalScrollRankingBoard, {
      props: {
        config: {
          data: [
            { name: '<i>低</i>', value: -10 },
            { name: '高', value: 30 },
            { name: '中', value: 10 },
          ],
          rowNum: 2,
          valueFormatter,
          waitTime: 1000,
        },
      },
    })

    expect(wrapper.classes()).toContain('dv-scroll-ranking-board')
    expect(wrapper.find('.info-name').text()).toBe('高')
    expect(wrapper.find('.rank').text()).toBe('No.1')
    expect(wrapper.find('.inside-column').attributes('style')).toContain('width: 100%')
    expect(wrapper.findAll('.inside-column')[1]!.attributes('style')).toContain('width: 50%')
    expect(wrapper.find('.ranking-value').text()).toBe('第1名 30')
    expect(valueFormatter.mock.calls[0]![0]).toMatchObject({ percent: 100, ranking: 1, scroll: 0 })

    await vi.advanceTimersByTimeAsync(1300)
    expect(wrapper.find('.row-item').attributes('style')).toContain('height: 0%')
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.find('.info-name').text()).toBe('中')

    await vi.advanceTimersByTimeAsync(1000)
    await vi.advanceTimersByTimeAsync(300)
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.text()).toContain('<i>低</i>')
    expect(wrapper.find('i').exists()).toBe(false)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
