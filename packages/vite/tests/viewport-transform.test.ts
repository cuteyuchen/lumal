// @vitest-environment node
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import postcss from 'postcss'
import { build, createServer } from 'vite'
import { describe, expect, it } from 'vitest'
import { createViewportPostcssPlugin, createViewportTransformPlugin } from '../src'

describe('受控视口 CSS 转换', () => {
  const options = { enabled: true, include: ['src/screen/**'], viewportWidth: 1920 }
  async function transform(css: string, file = 'C:/app/src/screen/page.vue?vue&type=style&lang.scss', overrides = {}) {
    return (await postcss([createViewportPostcssPlugin({ ...options, ...overrides }, 'C:/app')]).process(css, { from: file })).css
  }
  it('默认关闭，开启必须显式限定范围', async () => {
    expect(await transform('a{width:192px}', undefined, { enabled: false })).toBe('a{width:192px}')
    expect(() => createViewportPostcssPlugin({ enabled: true, include: [] })).toThrow('include')
    expect(() => createViewportPostcssPlugin({ ...options, viewportWidth: 0 })).toThrow('viewportWidth')
  })
  it('windows/Unix、SFC样式与query路径一致，排除后台与第三方', async () => {
    expect(await transform('a{width:192px}', 'C:\\app\\src\\screen\\page.vue?vue&type=style')).toContain('10vw')
    expect(await transform('a{width:192px}', '/app/src/screen/page.scss', { include: ['**/src/screen/**'] })).toContain('10vw')
    expect(await transform('a{width:192px}', 'C:/app/src/admin/page.css')).toContain('192px')
    expect(await transform('a{width:192px}', 'C:/app/node_modules/element-plus/theme.css')).toContain('192px')
    expect(await transform('a{width:192px}', 'C:/app/src/screen/map.css', { exclude: ['**/map.css'] })).toContain('192px')
  })
  it('不转换URL、引号字符串、普通数字、已有vw和默认字号/自定义属性', async () => {
    const css = 'a{width:192px;padding:1px -96px;background:url("tile-192px.svg");content:"192px";font-size:14px;--size:192px;opacity:0.5;margin:10vw;left:var(--size,192px)}'
    const result = await transform(css)
    expect(result).toBe('a{width:10vw;padding:1px -5vw;background:url("tile-192px.svg");content:"192px";font-size:14px;--size:192px;opacity:0.5;margin:10vw;left:var(--size,192px)}')
    expect(await transform(result)).toBe(result)
  })
  it('字号、自定义属性与pnpm依赖白名单需要单独选择', async () => {
    expect(await transform('a{font-size:19.2px;--size:192px}', undefined, { fontSize: true, customProperties: true }))
      .toBe('a{font-size:1vw;--size:10vw}')
    const file = 'C:/app/node_modules/.pnpm/@demo+ui@1.0.0/node_modules/@demo/ui/style.css'
    expect(await transform('a{width:192px}', file)).toContain('192px')
    expect(await transform('a{width:192px}', file, { dependencies: ['@demo/ui'] })).toContain('10vw')
    expect(await transform('a{width:192px}', file, { dependencies: ['another'] })).toContain('192px')
  })
  it('真实Vite Dev/Build共用SFC+SCSS流程，并保留外部PostCSS配置', async () => {
    const root = resolve(import.meta.dirname, 'fixtures/viewport')
    const config = {
      root,
      configFile: false as const,
      plugins: [vue(), createViewportTransformPlugin(options)],
      logLevel: 'silent' as const,
      build: { write: false, minify: false },
    }
    const server = await createServer(config)
    try {
      const style = await server.transformRequest('/src/screen/Panel.vue?vue&type=style&index=0&lang.scss')
      expect(style!.code).toContain('10vw')
      expect(style!.code).toContain('--existing: retained')
      const admin = await server.transformRequest('/src/admin.css')
      expect(admin!.code).toContain('192px')
      const built = await build(config)
      const outputs = (Array.isArray(built) ? built[0]! : built) as { output: { type: string, fileName: string, source?: string, code?: string }[] }
      const css = outputs.output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
      expect(css).toContain('10vw')
      expect(css).toContain('192px')
      expect(css).toContain('--existing: retained')
      expect(outputs.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')).toContain('coordinate: 192')
    }
    finally {
      await server.close()
    }
  })
})
