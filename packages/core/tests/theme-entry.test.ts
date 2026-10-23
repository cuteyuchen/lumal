// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { expect, it } from 'vitest'

it('主题入口仅引用有效样式，不依赖 Element Plus 已删除的空占位文件', async () => {
  const require = createRequire(import.meta.url)
  const root = dirname(require.resolve('element-plus/package.json'))
  const source = await readFile(new URL('../theme-chalk/index.scss', import.meta.url), 'utf8')
  const imports = [...source.matchAll(/@use "element-plus\/([^"]+)"/g)]
  expect(imports.length).toBeGreaterThan(20)
  for (const [, path] of imports)
    expect((await readFile(resolve(root, path!), 'utf8')).trim(), path).not.toBe('')
})
