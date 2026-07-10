import { describe, expect, it } from 'vitest'
import { createAuthorityDirective, registerAuthorityDirectives } from '../src/directives'
import { createPermissionStore } from '../src/permission'

describe('authority directive', () => {
  it('无权限时隐藏元素，有权限时恢复显示', () => {
    const store = createPermissionStore({ permissions: ['system:user:list'] })
    const directive = createAuthorityDirective(store)
    const element = document.createElement('button')

    directive.mounted?.(element, { value: 'system:user:delete' } as never, null as never, null as never)
    expect(element.style.display).toBe('none')

    directive.updated?.(element, { value: 'system:user:list' } as never, null as never, null as never)
    expect(element.style.display).toBe('')
  })

  it('registerAuthorityDirectives 会同时注册 v-authority 与 v-permission', () => {
    const store = createPermissionStore({ permissions: [] })
    const registered: Record<string, unknown> = {}
    const app = {
      directive(name: string, directive: unknown) {
        registered[name] = directive
      },
    }

    registerAuthorityDirectives(app as never, store)

    expect(registered.authority).toBeDefined()
    expect(registered.permission).toBe(registered.authority)
  })
})
