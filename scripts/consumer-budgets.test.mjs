import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { measureApplication, staticImports } from './check-consumer-budgets.mjs'

describe('consumer budget graph', () => {
  it('统计静态 import/re-export，排除动态 import 和字符串中的伪引用', () => {
    expect(staticImports(`
      import './side-effect.js';
      import value from './static.js';
      export { value } from './re-export.js';
      export * from './all.js';
      const lazy = () => import('./lazy.js');
      const text = "import './fake.js'";
    `)).toEqual(['./side-effect.js', './static.js', './re-export.js', './all.js'])
  })

  it('跨平台解析站点绝对路径，去重静态闭包且不累计动态引擎', () => {
    const dist = mkdtempSync(join(tmpdir(), 'lumal-budget-test-'))
    const entry = 'import "./shared.js"; export const load = () => import("./engine.js");'
    const shared = 'export const value = 1;'
    const css = 'body { color: red; }'
    try {
      mkdirSync(join(dist, 'assets'))
      writeFileSync(join(dist, 'index.html'), '<script type="module" src="/assets/main.js"></script><link rel="modulepreload" href="/assets/shared.js"><link rel="stylesheet" href="/assets/main.css">')
      writeFileSync(join(dist, 'assets/main.js'), entry)
      writeFileSync(join(dist, 'assets/shared.js'), shared)
      writeFileSync(join(dist, 'assets/main.css'), css)
      expect(measureApplication(dist)).toEqual({
        jsGzip: gzipSync(entry).length + gzipSync(shared).length,
        cssGzip: gzipSync(css).length,
      })
    }
    finally {
      rmSync(dist, { recursive: true, force: true })
    }
  })
})
