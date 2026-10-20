// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { prepareIconMorph } from '../src/morph'

describe('通用形变 SSR', () => {
  it('入口可以在无 DOM 和无 Vue 环境中导入，准备阶段返回静态回退', async () => {
    expect(await prepareIconMorph('lumal:sun')).toBeUndefined()
    expect(await prepareIconMorph('<svg viewBox="0 0 24 24"><path d="M4 4h16v16z"/></svg>')).toBeUndefined()
  })
})
