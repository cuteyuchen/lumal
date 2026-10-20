// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { LumalIcon } from '../src'
import * as morphRuntime from '../src/runtime/morph'

describe('lumalIcon morph SSR', () => {
  it('sSR 只输出原始 SVG，不加载动画引擎', async () => {
    const load = vi.spyOn(morphRuntime, 'loadMorphRuntime')
    const html = await renderToString(createSSRApp({
      render: () => h(LumalIcon, { name: 'lumal:sun', morph: true, size: 20, title: '主题切换' }),
    }))
    expect(html).toContain('<circle')
    expect(html).toContain('主题切换')
    expect(html).toContain('--lumal-icon-size:20px')
    expect(load).not.toHaveBeenCalled()
  })
})
