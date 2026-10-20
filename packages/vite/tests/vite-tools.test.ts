import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { defaultLumalComponents } from '../../core/src/app/default-components'
import {
  createLumalAliases,
  createLumalComponentResolver,
  resolveLumalDevtoolsPlugin,
} from '../src'

describe('@lumal/vite', () => {
  it('默认公开 UI 组件均有 resolver，避免导出和按需映射漂移', () => {
    const resolver = createLumalComponentResolver()
    for (const name of Object.keys(defaultLumalComponents))
      expect(resolver.resolve(name)?.name, name).toBe(name)
  })
  it('按组件所属包生成按需引入结果', () => {
    const resolver = createLumalComponentResolver({ importStyle: true })

    expect(resolver.resolve('LumalSchemaForm')).toEqual({
      from: '@lumal/core/components',
      name: 'LumalSchemaForm',
      sideEffects: '@lumal/core/style.css',
    })
    expect(resolver.resolve('LumalChartPanel')).toEqual({
      from: '@lumal/charts',
      name: 'LumalChartPanel',
      sideEffects: '@lumal/charts/style.css',
    })
    expect(resolver.resolve('LumalIcon')).toEqual({
      from: '@lumal/icons-vue',
      name: 'LumalIcon',
      sideEffects: '@lumal/icons-vue/style.css',
    })
    expect(resolver.resolve('ElButton')).toBeUndefined()
  })

  it('允许扩展应用自有组件映射', () => {
    const resolver = createLumalComponentResolver({
      customComponents: { LumalCompanyPicker: '@/components/company-picker' },
    })

    expect(resolver.resolve('LumalCompanyPicker')).toEqual({
      from: '@/components/company-picker',
      name: 'LumalCompanyPicker',
      sideEffects: undefined,
    })
  })

  it('生成源码或产物 alias，并优先匹配子入口', () => {
    const sourceAliases = createLumalAliases({
      workspaceRoot: 'E:/workspace/lumal',
    })
    const distAliases = createLumalAliases({
      packages: ['icons'],
      target: 'dist',
      workspaceRoot: 'E:/workspace/lumal',
    })

    expect(sourceAliases.findIndex(alias => alias.find === '@lumal/core/components'))
      .toBeLessThan(sourceAliases.findIndex(alias => alias.find === '@lumal/core'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/core')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/core/src/index.ts'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/core/style.css')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/core/src/source-style.css'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/cockpit/designer')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/cockpit/src/designer/index.ts'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/datav')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/datav/src/index.ts'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/datav/style.css')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/datav/src/source-style.css'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/icons-vue')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/icons-vue/src/index.ts'))
    expect(sourceAliases.find(alias => alias.find === '@lumal/icons/morph')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/icons/src/morph/index.ts'))
    expect(sourceAliases.findIndex(alias => alias.find === '@lumal/icons/morph'))
      .toBeLessThan(sourceAliases.findIndex(alias => alias.find === '@lumal/icons'))
    expect(sourceAliases.every(alias => !alias.replacement.replaceAll('\\', '/').includes('/dist/')))
      .toBe(true)
    expect(distAliases.find(alias => alias.find === '@lumal/icons/vite')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/icons/dist/vite.js'))
    expect(distAliases.find(alias => alias.find === '@lumal/icons/morph')?.replacement)
      .toBe(resolve('E:/workspace/lumal', 'packages/icons/dist/morph.js'))

    const datavDistAliases = createLumalAliases({
      packages: ['datav'],
      target: 'dist',
      workspaceRoot: 'E:/workspace/lumal',
    })

    expect(datavDistAliases).toEqual([
      {
        find: '@lumal/datav/style.css',
        replacement: resolve('E:/workspace/lumal', 'packages/datav/dist/datav.css'),
      },
      {
        find: '@lumal/datav',
        replacement: resolve('E:/workspace/lumal', 'packages/datav/dist/index.js'),
      },
    ])
  })

  it('仅在启用时调用外部 Devtools 工厂', () => {
    const factory = vi.fn(() => ({ name: 'devtools' }))

    expect(resolveLumalDevtoolsPlugin({ enabled: false, factory })).toBeUndefined()
    expect(factory).not.toHaveBeenCalled()
    expect(resolveLumalDevtoolsPlugin({ enabled: true, factory })).toEqual({ name: 'devtools' })
    expect(factory).toHaveBeenCalledOnce()
  })
})
