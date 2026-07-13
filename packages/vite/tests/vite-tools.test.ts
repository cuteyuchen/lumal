import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import {
  createLumaAliases,
  createLumaComponentResolver,
  resolveLumaDevtoolsPlugin,
} from '../src'

describe('@luma/vite', () => {
  it('按组件所属包生成按需引入结果', () => {
    const resolver = createLumaComponentResolver({ importStyle: true })

    expect(resolver.resolve('LumaSchemaForm')).toEqual({
      from: '@luma/core/components',
      name: 'LumaSchemaForm',
      sideEffects: '@luma/core/style.css',
    })
    expect(resolver.resolve('LumaChartPanel')).toEqual({
      from: '@luma/charts',
      name: 'LumaChartPanel',
      sideEffects: '@luma/charts/style.css',
    })
    expect(resolver.resolve('ElButton')).toBeUndefined()
  })

  it('允许扩展应用自有组件映射', () => {
    const resolver = createLumaComponentResolver({
      customComponents: { LumaCompanyPicker: '@/components/company-picker' },
    })

    expect(resolver.resolve('LumaCompanyPicker')).toEqual({
      from: '@/components/company-picker',
      name: 'LumaCompanyPicker',
      sideEffects: undefined,
    })
  })

  it('生成源码或产物 alias，并优先匹配子入口', () => {
    const sourceAliases = createLumaAliases({
      workspaceRoot: 'E:/workspace/luma',
    })
    const distAliases = createLumaAliases({
      packages: ['icons'],
      target: 'dist',
      workspaceRoot: 'E:/workspace/luma',
    })

    expect(sourceAliases.findIndex(alias => alias.find === '@luma/core/components'))
      .toBeLessThan(sourceAliases.findIndex(alias => alias.find === '@luma/core'))
    expect(sourceAliases.find(alias => alias.find === '@luma/core')?.replacement)
      .toBe(resolve('E:/workspace/luma', 'packages/core/src/index.ts'))
    expect(sourceAliases.find(alias => alias.find === '@luma/core/style.css')?.replacement)
      .toBe(resolve('E:/workspace/luma', 'packages/core/src/source-style.css'))
    expect(sourceAliases.find(alias => alias.find === '@luma/cockpit/designer')?.replacement)
      .toBe(resolve('E:/workspace/luma', 'packages/cockpit/src/designer/index.ts'))
    expect(sourceAliases.every(alias => !alias.replacement.replaceAll('\\', '/').includes('/dist/')))
      .toBe(true)
    expect(distAliases.find(alias => alias.find === '@luma/icons/vite')?.replacement)
      .toBe(resolve('E:/workspace/luma', 'packages/icons/dist/vite.js'))
  })

  it('仅在启用时调用外部 Devtools 工厂', () => {
    const factory = vi.fn(() => ({ name: 'devtools' }))

    expect(resolveLumaDevtoolsPlugin({ enabled: false, factory })).toBeUndefined()
    expect(factory).not.toHaveBeenCalled()
    expect(resolveLumaDevtoolsPlugin({ enabled: true, factory })).toEqual({ name: 'devtools' })
    expect(factory).toHaveBeenCalledOnce()
  })
})
