// @vitest-environment node
import { extname } from 'node:path'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/presets'
import { composeProjectTemplates, resolveProjectOptions } from '../src/projects'
import { composeTemplates } from '../src/templates'

const config = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 120,
  trailingComma: 'all' as const,
  endOfLine: 'lf' as const,
}

describe('生成工程的格式契约', () => {
  it.each([
    ['Admin Minimal', { template: 'admin', preset: 'minimal' }],
    ['Admin Standard', { template: 'admin', preset: 'standard' }],
    ['Admin Vben Compatible', { template: 'admin', preset: 'vben-compatible' }],
    ['Blank', { template: 'blank' }],
    ['Screen 能力组合', { template: 'screen', auth: 'http', data: 'http', routerMode: 'history', visualization: 'cockpit', viewport: 'contain' }],
  ] as const)('%s 合并后的运行时和开发依赖均有序', async (_label, input) => {
    const options = resolveProjectOptions({ ...input, name: 'quality-test', targetDir: 'unused' })
    const files = options.template === 'admin'
      ? await composeTemplates(options)
      : await composeProjectTemplates(options)
    const manifest = JSON.parse(files.find(file => file.path === 'package.json')!.content)
    for (const field of ['dependencies', 'devDependencies']) {
      const names = Object.keys(manifest[field])
      expect(names, field).toEqual([...names].sort((left, right) => left.localeCompare(right)))
    }
  })

  it.each([
    { template: 'blank' },
    { template: 'screen' },
    { template: 'screen', viewport: 'contain' },
    { template: 'screen', viewport: 'vw' },
  ] as const)('%j 输出符合公共格式且无 Admin 规范', async (input) => {
    const options = resolveProjectOptions({ ...input, name: 'quality-test', targetDir: 'unused' })
    if (options.template === 'admin')
      throw new Error('预期非 Admin 模板')
    for (const file of await composeProjectTemplates(options)) {
      if (!['.vue', '.ts', '.mjs', '.json', '.css', '.html', '.md'].includes(extname(file.path)))
        continue
      expect(await format(file.content, { ...config, filepath: file.path }), file.path).toBe(file.content)
    }
  })
  it.each(['minimal', 'standard', 'vben-compatible'] as const)('%s 初始输出已经格式化且重复格式化无变化', async (preset) => {
    const files = await composeTemplates(resolveOptions({ preset, name: 'quality-test', targetDir: 'unused' }))
    for (const file of files) {
      if (!['.vue', '.ts', '.mjs', '.json', '.scss', '.html', '.md'].includes(extname(file.path)))
        continue
      const formatted = await format(file.content, { ...config, filepath: file.path })
      expect(formatted, file.path).toBe(file.content)
      expect(await format(formatted, { ...config, filepath: file.path }), file.path).toBe(formatted)
    }
  })
  it.each([
    { auth: 'local-demo', data: 'local' },
    { auth: 'http', data: 'none' },
    { auth: 'http', data: 'http' },
  ] as const)('screen 能力层 %j 初始格式一致', async (capabilities) => {
    const options = resolveProjectOptions({ template: 'screen', ...capabilities, name: 'quality-test', targetDir: 'unused' })
    if (options.template === 'admin')
      throw new Error('预期 Screen')
    for (const file of await composeProjectTemplates(options)) {
      if (['.vue', '.ts', '.mjs', '.json', '.css', '.html', '.md'].includes(extname(file.path)))
        expect(await format(file.content, { ...config, filepath: file.path }), file.path).toBe(file.content)
    }
  })
})
