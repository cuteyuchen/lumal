import { createDictionaryStore, dictionaryContextKey } from '@luma/core/dictionary'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import DictionaryView from '../src/views/examples/DictionaryView.vue'

const PageStub = defineComponent({
  name: 'LumaPage',
  props: {
    description: String,
    title: String,
  },
  template: '<section class="page-stub"><slot /></section>',
})

const InfoTableStub = defineComponent({
  name: 'LumaInfoTable',
  props: {
    items: Array,
  },
  template: `
    <dl class="info-table-stub">
      <template v-for="item in items" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </template>
    </dl>
  `,
})

describe('dictionary example view', () => {
  it('会按 useDictionary 的字典名称返回值展示选项和回显', async () => {
    const store = createDictionaryStore({
      fetcher: async dictionary => ({
        items: dictionary === 'status'
          ? [
              { color: '#16a34a', label: '启用', value: 'enabled' },
              { color: '#94a3b8', label: '停用', value: 'disabled' },
            ]
          : [],
      }),
    })
    const wrapper = mount(DictionaryView, {
      global: {
        provide: {
          [dictionaryContextKey as symbol]: { store },
        },
        stubs: {
          LumaInfoTable: InfoTableStub,
          LumaPage: PageStub,
          LumaSchemaForm: true,
          LumaSchemaTable: true,
        },
      },
    })

    await Promise.resolve()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('选项数量2')
    expect(wrapper.text()).toContain('启用回显启用')
  })
})
