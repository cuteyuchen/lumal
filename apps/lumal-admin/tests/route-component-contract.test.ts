import type { LumalMenuRecord, LumalStaticMenuRecord } from '@lumal/core/router'
import { describe, expect, it } from 'vitest'
import { adminMenuSeed, staticAdminMenuSeed } from '../../lumal-mock-api/domain/menu-seed'
import { resolveRouteComponent } from '../src/router/components'

function collectComponents(records: readonly (LumalMenuRecord | LumalStaticMenuRecord)[]): string[] {
  return records.flatMap(record => [
    ...(typeof record.component === 'string' ? [record.component] : []),
    ...collectComponents(record.children ?? []),
  ])
}

// 直接检查后端种子与前端白名单，不发登录请求，也不复制一份可能失效的菜单夹具。
const components = [...new Set(collectComponents([...staticAdminMenuSeed, ...adminMenuSeed]))]

describe('admin menu component contract', () => {
  it('契约包含静态壳层与远程图标页，避免空集合误通过', () => {
    expect(components).toEqual(expect.arrayContaining(['dashboard/index', 'examples/icons']))
  })

  it.each(components)('菜单组件 %s 必须存在于前端懒加载白名单', (component) => {
    expect(resolveRouteComponent(component)).toBeTypeOf('function')
  })

  it('未知远程组件仍由白名单拒绝，不用兜底页面掩盖部署差异', () => {
    expect(resolveRouteComponent('examples/unregistered')).toBeUndefined()
  })
})
