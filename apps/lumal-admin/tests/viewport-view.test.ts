import { viewportLength } from '@lumal/viewport'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import ViewportView from '../src/views/examples/ViewportView.vue'
import { elementPlusStubs } from './helpers/element-plus-stubs'

describe('视口页面与内部演示的适配范围', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('模拟容器不改变表格或弹窗的浏览器宽度基准', async () => {
    vi.stubGlobal('innerWidth', 1280)
    vi.stubGlobal('innerHeight', 720)
    vi.stubGlobal('__LUMAL_VIEWPORT__', { enabled: true, designWidth: 1920 })
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
      expect(host.element.style.width).toBe(viewportLength(480))
      expect(host.element.style.height).toBe(viewportLength(640))
      const columnWidth = () => Number(wrapper.get('[aria-label="测量项"]').attributes('data-width'))
      expect(columnWidth()).toBeCloseTo(180 * 1280 / 1920)
      await wrapper.get('select[aria-label="模拟尺寸"]').setValue('short')
      expect(host.element.style.height).toBe(viewportLength(280))
      expect(columnWidth()).toBeCloseTo(180 * 1280 / 1920)
      await wrapper.get('button').trigger('click')
      expect(wrapper.get('[role="dialog"]').attributes('data-width')).toBe(viewportLength(480))
      expect(wrapper.find('[data-viewport-mode]').exists()).toBe(false)
    }
    finally {
      wrapper.unmount()
    }
  })
})
