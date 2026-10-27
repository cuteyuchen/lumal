import { createViewportPlugin } from '@lumal/viewport'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import ViewportCanvas from '../src/views/examples/viewport/ViewportCanvas.vue'

// 固定比例只验证策略到字号样式的转换，真实容器缩放由 Playwright 验收。
const ViewportStub = defineComponent({
  name: 'LumalViewport',
  setup(_, { slots }) {
    return () => h('div', slots.default?.({ scale: 0.5, size: { width: 480, height: 270 } }))
  },
})

describe('viewport 示例字号策略', () => {
  it('继承应用最小字号，并响应局部覆盖和恢复', async () => {
    const wrapper = mount(ViewportCanvas, {
      props: { policy: { mode: 'contain' } },
      global: {
        plugins: [createViewportPlugin({ minFontSize: 12 })],
        stubs: { LumalViewport: ViewportStub },
      },
    })
    const fontSize = () => (wrapper.get('footer').element as HTMLElement).style.fontSize

    expect(fontSize()).toBe('24px')
    await wrapper.setProps({ policy: { mode: 'contain', minFontSize: 20 } })
    expect(fontSize()).toBe('40px')
    await wrapper.setProps({ policy: { mode: 'contain' } })
    expect(fontSize()).toBe('24px')
    wrapper.unmount()
  })
  it('vw流式模式保留字号，不执行画布的反向补偿', async () => {
    const wrapper = mount(ViewportCanvas, {
      props: { policy: { mode: 'vw', minFontSize: 12 } },
      global: { stubs: { LumalViewport: ViewportStub } },
    })
    const fontSize = () => (wrapper.get('footer').element as HTMLElement).style.fontSize
    expect(fontSize()).toBe('16px')
    await wrapper.setProps({ policy: { mode: 'responsive', minFontSize: 20 } })
    expect(fontSize()).toBe('20px')
    await wrapper.setProps({ policy: { mode: 'contain', minFontSize: 12 } })
    expect(fontSize()).toBe('24px')
    wrapper.unmount()
  })
})
