import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { setAdminViewportMode } from '../src/services/workspace-viewport'
import DashboardView from '../src/views/dashboard/DashboardView.vue'

const scale = shallowRef(2 / 3)
vi.mock('@lumal/viewport', () => ({ useViewportScale: () => ({ scale }) }))
vi.mock('../src/api/system', () => ({
  fetchDictionaryTypes: async () => [],
  fetchSystemMenus: async () => [],
  fetchSystemRoleOptions: async () => [],
  fetchSystemRoles: async () => ({ total: 0 }),
  fetchSystemUsers: async () => ({ items: [], total: 0 }),
}))

describe('工作台显式数值适配', () => {
  it('列宽跟随窗口比例，普通响应式与 transform 画布保留设计数值', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: DashboardView }] })
    await router.push('/')
    setAdminViewportMode('vw')
    const wrapper = mount(DashboardView, {
      global: {
        plugins: [router],
        stubs: {
          ElButton: true,
          LumalPage: { template: '<section><slot /></section>' },
          LumalSchemaTable: { name: 'LumalSchemaTable', props: ['columns', 'rows'], template: '<table />' },
        },
      },
    })
    try {
      await flushPromises()
      const columns = () => wrapper.getComponent({ name: 'LumalSchemaTable' }).props('columns')
      expect(columns()[0].minWidth).toBeCloseTo(140 * 2 / 3)
      expect(columns()[3].width).toBeCloseTo(100 * 2 / 3)
      scale.value = 1 / 3
      await wrapper.vm.$nextTick()
      expect(columns()[3].width).toBeCloseTo(100 / 3)
      for (const mode of ['responsive', 'contain', 'width'] as const) {
        setAdminViewportMode(mode)
        await wrapper.vm.$nextTick()
        expect(columns()[0].minWidth).toBe(140)
        expect(columns()[3].width).toBe(100)
      }
    }
    finally {
      wrapper.unmount()
      setAdminViewportMode('responsive')
    }
  })
})
