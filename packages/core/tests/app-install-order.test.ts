import type { CreateLumalAdminOptions } from '../src/app'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { createLumalAdmin } from '../src/app'

describe('createLumalAdmin plugin order', () => {
  it('先安装 Pinia，再安装 Router 和 Element Plus', () => {
    const order: string[] = []
    const createPlugin = (name: string) => ({
      install: vi.fn(() => order.push(name)),
    })

    createLumalAdmin({
      components: false,
      dictionary: false,
      elementPlus: createPlugin('element-plus'),
      pinia: createPlugin('pinia') as unknown as CreateLumalAdminOptions['pinia'],
      rootComponent: defineComponent({ render: () => null }),
      router: createPlugin('router') as unknown as CreateLumalAdminOptions['router'],
    })

    expect(order).toEqual(['pinia', 'router', 'element-plus'])
  })
})
