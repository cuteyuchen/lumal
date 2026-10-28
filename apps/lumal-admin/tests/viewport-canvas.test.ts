import type { ViewportPolicy } from '@lumal/viewport'
import { createViewportPlugin } from '@lumal/viewport'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, shallowRef } from 'vue'
import AppWorkspaceViewport from '../src/components/app/AppWorkspaceViewport.vue'
import { resolveAdminWorkspacePolicy } from '../src/services/workspace-viewport'
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

  it('外层 vw 与真实内层画布独立使用单位，只由内部 contain 执行一次 transform', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(480)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(270)
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('innerHeight', 720)
    const policy = shallowRef<ViewportPolicy>({ mode: 'contain', designWidth: 960, designHeight: 540, minFontSize: 12 })
    const wrapper = mount(AppWorkspaceViewport, {
      props: { policy: resolveAdminWorkspacePolicy('vw'), fontSize: 14 },
      slots: { default: () => h(ViewportCanvas, { policy: policy.value }) },
    })
    try {
      await nextTick()
      const outer = wrapper.get<HTMLElement>('[data-testid="admin-workspace-viewport"]')
      const canvas = wrapper.get('.viewport-canvas').element.closest<HTMLElement>('[data-viewport-mode]')!
      const stage = canvas.children[0].children[0] as HTMLElement
      expect(outer.attributes('data-viewport-mode')).toBe('vw')
      expect(outer.element.style.getPropertyValue('--lumal-viewport-unit')).toBe(`${100 / 1920}vw`)
      expect(wrapper.get<HTMLElement>('.admin-workspace-viewport__stage').element.style.transform).toBe('')
      expect(canvas.style.getPropertyValue('--lumal-viewport-unit')).toBe('1px')
      expect(stage.style.transform).toContain('scale(0.5)')
      await wrapper.get('.viewport-canvas button').trigger('click')
      expect(wrapper.get('.viewport-canvas button').text()).toBe('确认 · 1')
      for (const mode of ['vw', 'disabled', 'responsive', 'contain'] as const) {
        policy.value = { ...policy.value, mode }
        await nextTick()
        expect(canvas.style.getPropertyValue('--lumal-viewport-unit')).toBe(mode === 'vw' ? `${100 / 960}vw` : '1px')
        expect(stage.style.transform).toBe(mode === 'contain' ? 'translate(0px, 0px) scale(0.5)' : '')
        expect(outer.attributes('data-viewport-mode')).toBe('vw')
        expect(wrapper.get('.viewport-canvas button').text()).toBe('确认 · 1')
      }
    }
    finally {
      wrapper.unmount()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    }
  })
})
