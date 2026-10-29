import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LumalFullScreenContainer from '../src/components/LumalFullScreenContainer.vue'

afterEach(() => vi.unstubAllGlobals())

describe('全屏容器的单一宽度契约', () => {
  it.each([1920, 1440])('项目设计宽度 %s 只换算一次，嵌入容器不成为缩放基准', (designWidth) => {
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth })
    const wrapper = mount(LumalFullScreenContainer, {
      props: { width: 192, height: 96, embedded: true },
      slots: { default: '<button>立即可用</button>' },
    })
    const style = (wrapper.get('.lumal-full-screen-container__stage').element as HTMLElement).style
    expect(style.width).toBe(`${Number((192 / designWidth * 100).toFixed(10))}vw`)
    expect(style.height).toBe(`${Number((96 / designWidth * 100).toFixed(10))}vw`)
    expect(style.transform).toBe('')
    expect(style.minHeight).toBe('')
    expect(wrapper.classes()).toContain('is-embedded')
    expect((wrapper.element as HTMLElement).style.overflow).toBe('auto')
    expect(wrapper.get('button').text()).toBe('立即可用')
    expect(wrapper.attributes('data-mode')).toBeUndefined()
    wrapper.unmount()
  })
  it('未启用时保持 px；高度默认自然撑开，裁切只能显式开启', () => {
    const wrapper = mount(LumalFullScreenContainer, { props: { width: 192, overflow: 'hidden' } })
    const style = (wrapper.get('.lumal-full-screen-container__stage').element as HTMLElement).style
    expect(style.width).toBe('192px')
    expect(style.height).toBe('')
    expect(style.minHeight).toBe('100%')
    expect((wrapper.element as HTMLElement).style.overflow).toBe('hidden')
    wrapper.unmount()
  })
})
