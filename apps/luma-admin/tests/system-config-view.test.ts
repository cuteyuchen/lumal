import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import {
  adminAppName,
  adminPreferences,
  getAdminSystemConfig,
  resetAdminSystemConfig,
} from '../src/services/preferences'
import ConfigView from '../src/views/system/ConfigView.vue'

const PageStub = defineComponent({
  name: 'LumaPage',
  setup(_, { slots }) {
    return () => h('section', { class: 'page-stub' }, slots.default?.())
  },
})

const FormStub = defineComponent({
  name: 'LumaSchemaForm',
  props: {
    schemas: Array,
  },
  emits: ['submit'],
  setup() {
    return () => h('form', { class: 'form-stub' })
  },
})

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
    resetAdminSystemConfig()
  })

  afterEach(() => {
    resetAdminSystemConfig()
  })

  it('提供应用名称、布局、主题色、标签页和动画配置', () => {
    const wrapper = mountConfigView()
    const form = wrapper.findComponent(FormStub)
    const schemas = form.props('schemas') as { field: string }[]

    expect(schemas.map(schema => schema.field)).toEqual([
      'appName',
      'layout',
      'colorPrimary',
      'tabbarEnable',
      'transitionEnable',
    ])
  })

  it('保存后会立即更新应用壳共享偏好', async () => {
    const wrapper = mountConfigView()
    wrapper.findComponent(FormStub).vm.$emit('submit', {
      appName: '项目运营台',
      colorPrimary: '#0f766e',
      layout: 'sidebar-nav',
      tabbarEnable: false,
      transitionEnable: false,
    })
    await nextTick()

    expect(adminAppName.value).toBe('项目运营台')
    expect(adminPreferences.value).toMatchObject({
      app: { layout: 'sidebar-nav' },
      tabbar: { enable: false },
      theme: { colorPrimary: '#0f766e' },
      transition: { enable: false },
    })
    expect(getAdminSystemConfig()).toMatchObject({
      appName: '项目运营台',
    })
  })
})
