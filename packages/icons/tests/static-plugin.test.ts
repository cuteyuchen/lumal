import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'
import { createStaticLocalSvgIconsPlugin } from '../src/vite/static-local-svg-icons'

describe('static svg plugin build', () => {
  it('真实 Vite 构建可以代理并重新导出原包，不会循环引用自身', async () => {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      plugins: [
        createStaticLocalSvgIconsPlugin({ localSvg: 'virtual:test-manifest' }),
        {
          name: 'test-entries',
          resolveId(id) {
            if (id === 'virtual:test-entry' || id === 'virtual:test-manifest')
              return `\0${id}`
            // 测试按包或从仓库根运行时，都使用同一个绝对源码入口。
            if (id === '@lumal/icons')
              return fileURLToPath(new URL('../src/index.ts', import.meta.url))
          },
          load(id) {
            if (id === '\0virtual:test-entry')
              return 'export { registerIcons, resolveIconDefinition } from "@lumal/icons"'
            if (id === '\0virtual:test-manifest')
              return 'export default [{key:"test:static",source:"local-svg",svgText:"<svg/>"}]'
          },
        },
      ],
      build: { write: false, rollupOptions: { input: 'virtual:test-entry', preserveEntrySignatures: 'strict', output: { format: 'es' } } },
    })
    const bundle = Array.isArray(result) ? result[0]! : result
    const code = bundle.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
    expect(code).toContain('test:static')
    expect(code).toContain('resolveIconDefinition')
    expect(code).toContain('registerIcons')
  })
})
