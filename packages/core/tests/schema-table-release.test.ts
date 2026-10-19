import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { LumalSchemaTable } from '../src/components/schema-table'
import { elementPlusStubs } from './helpers/element-plus-stubs'

enableAutoUnmount(afterEach)

describe('release table accessibility', () => {
  it('真实 Popover 保留菜单角色与展开状态，操作后关闭', async () => {
    const wrapper = mount(LumalSchemaTable, {
      attachTo: document.body,
      global: {
        stubs: {
          ...elementPlusStubs,
          ElPopover: false,
          ElTableColumn: defineComponent({
            setup(_props, { slots }) {
              return () => h('section', slots.default?.({ row: { id: 'one' }, $index: 0 }))
            },
          }),
        },
      },
      props: { columns: [], rows: [{ id: 'one' }] },
      slots: { actions: () => h('button', { 'type': 'button', 'data-action': 'view-row' }, '查看') },
    })
    await flushPromises()
    const trigger = wrapper.get('.lumal-schema-table__mobile-actions')
    expect(trigger.attributes('aria-haspopup')).toBe('menu')
    expect(trigger.attributes('aria-expanded')).toBe('false')
    await trigger.trigger('click')
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('true')
    const action = document.querySelector<HTMLButtonElement>('.lumal-schema-table__mobile-actions-menu [data-action="view-row"]')
    expect(action).not.toBeNull()
    action!.click()
    await flushPromises()
    expect(trigger.attributes('aria-expanded')).toBe('false')
  })
})
