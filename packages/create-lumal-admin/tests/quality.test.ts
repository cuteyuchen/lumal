// @vitest-environment node
import { extname } from 'node:path'
import { format } from 'prettier'
import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/presets'
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
})
