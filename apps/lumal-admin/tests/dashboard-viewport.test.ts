import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import DashboardView from '../src/views/dashboard/DashboardView.vue'

vi.mock('../src/api/system', () => ({
  fetchDictionaryTypes: async () => [],
  fetchSystemMenus: async () => [],
  fetchSystemRoleOptions: async () => [],
  fetchSystemRoles: async () => ({ total: 0 }),
  fetchSystemUsers: async () => ({ items: [], total: 0 }),
}))

describe('工作台设计数值所有权', () => {
  it('应用始终传设计列宽，交给 SchemaTable 内部换算一次', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: DashboardView }] })
    await router.push('/')
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
      expect(columns()[0].minWidth).toBe(140)
      expect(columns()[3].width).toBe(100)
      window.dispatchEvent(new Event('resize'))
      await wrapper.vm.$nextTick()
      expect(columns()[0].minWidth).toBe(140)
      expect(columns()[3].width).toBe(100)
    }
    finally {
      wrapper.unmount()
    }
  })
})
