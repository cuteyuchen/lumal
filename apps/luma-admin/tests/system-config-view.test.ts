import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { adminSettingsVisible, closeAdminSettings } from '../src/services/settings'
import ConfigView from '../src/views/system/ConfigView.vue'

const systemConfigMocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  reset: vi.fn(),
  save: vi.fn(),
}))

vi.mock('../src/services/system-config', () => ({
  fetchAdminSystemConfig: systemConfigMocks.fetch,
  restoreAdminSystemConfig: systemConfigMocks.reset,
  saveAdminSystemConfig: systemConfigMocks.save,
}))

const sampleConfig = {
  appName: 'Luma Admin',
  colorPrimary: '#1677ff',
  layout: 'mixed-nav',
  tabbarEnable: true,
  transitionEnable: true,
}

const PageStub = defineComponent({
  name: 'LumaPage',
  setup(_, { slots }) {
    return () => h('section', { class: 'page-stub' }, [slots.actions?.(), slots.default?.()])
  },
})

const FormStub = defineComponent({
  name: 'LumaSchemaForm',
  props: { schemas: Array },
  setup() {
    return () => h('form', { class: 'form-stub' })
  },
})

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await nextTick()
}

function mountConfigView() {
  return mount(ConfigView, {
    global: {
      stubs: {
        LumaPage: PageStub,
        LumaSchemaForm: FormStub,
      },
    },
  })
}

describe('system config view', () => {
  beforeEach(() => {
    systemConfigMocks.fetch.mockReset().mockResolvedValue(sampleConfig)
    systemConfigMocks.reset.mockReset().mockResolvedValue(sampleConfig)
    systemConfigMocks.save.mockReset().mockResolvedValue(sampleConfig)
  })

  afterEach(() => {
    closeAdminSettings()
  })

  it('共享全局偏好状态并打开设置抽屉', async () => {
    const wrapper = mountConfigView()
    await flushPromises()

    expect((wrapper.findComponent(FormStub).props('schemas') as { field: string }[]).map(schema => schema.field)).toEqual([
      'appName',
      'colorPrimary',
      'layout',
      'tabbarEnable',
      'transitionEnable',
    ])
    await wrapper.get('[data-action="open-global-settings"]').trigger('click')
    expect(adminSettingsVisible.value).toBe(true)
  })

  it('加载失败时显示错误并允许重新加载', async () => {
    systemConfigMocks.fetch
      .mockRejectedValueOnce(new Error('配置服务暂不可用'))
      .mockResolvedValueOnce(sampleConfig)
    const wrapper = mountConfigView()
    await flushPromises()

    expect(wrapper.text()).toContain('配置服务暂不可用')
    await wrapper.get('[data-action="retry-system-config"]').trigger('click')
    await flushPromises()

    expect(systemConfigMocks.fetch).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('配置服务暂不可用')
  })
})
