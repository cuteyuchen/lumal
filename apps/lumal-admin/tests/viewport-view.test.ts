import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { adminViewportLength, setAdminViewportMode } from '../src/services/workspace-viewport'
import ViewportView from '../src/views/examples/ViewportView.vue'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('视口页面与内部演示的适配范围', () => {
  it('模拟容器、表格和弹窗跟随 Admin vw，修改内部设计宽不影响外层比例', async () => {
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('innerHeight', 720)
    setAdminViewportMode('vw')
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/examples/viewport', component: ViewportView }],
    })
    await router.push('/examples/viewport')
    const wrapper = mount(ViewportView, {
      global: {
        plugins: [router],
        stubs: {
          ...elementPlusStubs,
          LumalPage: { template: '<section><slot /></section>' },
          ViewportCanvas: true,
          ElTooltip: { template: '<span><slot /></span>' },
          ElDialog: defineComponent({
            props: { modelValue: Boolean, width: String },
            template: '<section v-if="modelValue" role="dialog" :data-width="width"><slot /></section>',
          }),
          ElTable: { template: '<section><slot /></section>' },
          ElTableColumn: defineComponent({
            props: { label: String, width: Number },
            template: '<span :aria-label="label" :data-width="width" />',
          }),
        },
      },
    })
    try {
      await nextTick()
      await wrapper.get('select[aria-label="模拟尺寸"]').setValue('narrow')
      const host = wrapper.get<HTMLElement>('.viewport-host')
      expect(host.element.style.width).toBe(adminViewportLength(480))
      expect(host.element.style.height).toBe(adminViewportLength(420))
      const columnWidth = () => Number(wrapper.get('[aria-label="测量项"]').attributes('data-width'))
      expect(columnWidth()).toBeCloseTo(140 * 1280 / 1920)
      await wrapper.get('input[aria-label="设计宽"]').setValue('960')
      expect(columnWidth()).toBeCloseTo(140 * 1280 / 1920)
      await wrapper.get('button').trigger('click')
      expect(wrapper.get('[role="dialog"]').attributes('data-width')).toBe(`min(${adminViewportLength(480)}, 90vw)`)
      setAdminViewportMode('responsive')
      await nextTick()
      expect(columnWidth()).toBe(140)
    }
    finally {
      wrapper.unmount()
      setAdminViewportMode('responsive')
      vi.unstubAllGlobals()
    }
  })
})
