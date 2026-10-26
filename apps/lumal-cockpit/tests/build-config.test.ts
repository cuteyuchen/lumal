// @vitest-environment node
import { describe, expect, it } from 'vitest'
import config from '../vite.config'

describe('驾驶舱开发与生产边界', () => {
  it('干净开发包含 viewport 源码，生产构建和 preview 只消费 dist', async () => {
    expect(typeof config).toBe('function')
    if (typeof config !== 'function')
      throw new TypeError('预期 Vite 配置工厂')
    const dev = await config({ command: 'serve', mode: 'development', isPreview: false })
    const preview = await config({ command: 'serve', mode: 'production', isPreview: true })
    const build = await config({ command: 'build', mode: 'production' })
    expect(JSON.stringify(dev.resolve?.alias)).toContain('viewport')
    for (const production of [preview, build])
      expect(JSON.stringify(production.resolve?.alias)).not.toContain('/packages/')
  })
})
