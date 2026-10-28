// @vitest-environment node
import type { AtRule, Declaration } from 'postcss'
import type { ViewportTransformOptions } from '../src'
import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import postcss from 'postcss'
import { compile } from 'sass-embedded'
import { build, createServer } from 'vite'
import { describe, expect, it } from 'vitest'
import { createViewportPostcssPlugin, createViewportTransformPlugin } from '../src'

describe('受控视口 CSS 转换', () => {
  const options = { enabled: true, include: ['src/screen/**'], viewportWidth: 1920 }
  async function transform(css: string, file = 'C:/app/src/screen/page.vue?vue&type=style&lang.css', overrides: Partial<ViewportTransformOptions> = {}) {
    return (await postcss([createViewportPostcssPlugin({ ...options, ...overrides }, 'C:/app')]).process(css, { from: file })).css
  }
  it('默认关闭，开启必须显式限定范围', async () => {
    expect(await transform('a{width:192px}', undefined, { enabled: false })).toBe('a{width:192px}')
    expect(() => createViewportPostcssPlugin({ enabled: true, include: [] })).toThrow('include')
    expect(() => createViewportPostcssPlugin({ ...options, viewportWidth: 0 })).toThrow('viewportWidth')
    expect(() => createViewportPostcssPlugin({ ...options, minPixelValue: -1 })).toThrow('minPixelValue')
    expect(() => createViewportPostcssPlugin({ ...options, minPixelValue: Number.NaN })).toThrow('minPixelValue')
    expect(() => createViewportPostcssPlugin({ ...options, output: 'rem' as 'vw' })).toThrow('output')
  })
  it('运行时协作输出保留设计坐标，默认直接vw的行为不变', async () => {
    const css = '.panel{width:192px;height:96px;padding:24px 1px;margin-left:-19.23456px;top:calc(100% - 24px);font-size:14px;line-height:20px;min-width:320px;border:1px solid red}'
    const result = await transform(css, undefined, { output: 'runtime', precision: 3 })
    expect(result).toBe('.panel{width:calc(192 * var(--lumal-viewport-unit, 1px));height:calc(96 * var(--lumal-viewport-unit, 1px));padding:calc(24 * var(--lumal-viewport-unit, 1px)) 1px;margin-left:calc(-19.235 * var(--lumal-viewport-unit, 1px));top:calc(100% - calc(24 * var(--lumal-viewport-unit, 1px)));font-size:14px;line-height:20px;min-width:320px;border:1px solid red}')
    expect(await transform('a{width:192px}')).toBe('a{width:10vw}')
    // 二次处理（包括切换输出策略）不能重新转换已包含单位变量的声明。
    expect(await transform(result, undefined, { output: 'runtime' })).toBe(result)
    expect(await transform(result)).toBe(result)
  })
  it('正斜杠绝对 glob 同时命中 Windows 工作区源码和包产物，不扩大相邻包范围', async () => {
    const options = { include: ['F:/lumal/packages/core/**'], output: 'runtime' as const }
    for (const file of [
      'F:\\lumal\\packages\\core\\src\\Page.vue?vue&type=style&lang.css',
      'F:/lumal/packages/core/dist/core.css',
    ]) {
      expect(await transform('.page{width:192px}', file, options))
        .toContain('calc(192 * var(--lumal-viewport-unit, 1px))')
    }
    expect(await transform('.page{width:192px}', 'F:/lumal/packages/core-other/style.css', options))
      .toBe('.page{width:192px}')
  })
  it('协作输出仍服从属性、选择器、忽略标记及已有适配保护', async () => {
    const css = '.panel{width:192px;height:96px;/* lumal-viewport-ignore */padding:24px;min-height:40px;font:14px/20px sans-serif;top:calc(var(--gap) + 24px);--lumal-viewport-unit:192px}.map{width:192px}'
    const result = await transform(css, undefined, {
      output: 'runtime',
      customProperties: true,
      includeProperties: ['*'],
      excludeProperties: ['padding*'],
      excludeSelectors: ['.map'],
    })
    expect(result).toBe(css.replace('width:192px', 'width:calc(192 * var(--lumal-viewport-unit, 1px))'))
  })
  it('默认同时保护字号、font简写与行高，显式开启后一起转换', async () => {
    const css = 'a{font-size:14px;line-height:20px;font:italic 14px/20px sans-serif;width:192px}'
    expect(await transform(css)).toBe(css.replace('width:192px', 'width:10vw'))
    expect(await transform(css, undefined, { fontSize: false })).toBe(css.replace('width:192px', 'width:10vw'))
    expect(await transform(css, undefined, { fontSize: true }))
      .toBe('a{font-size:0.729167vw;line-height:1.041667vw;font:italic 0.729167vw/1.041667vw sans-serif;width:10vw}')
    expect(await transform('a{line-height:1.5;font-size:14px}', undefined, { fontSize: true }))
      .toBe('a{line-height:1.5;font-size:0.729167vw}')
  })
  it('整页 opt-in 转换普通变量 fallback 和尺寸约束，仍保护已有适配、URL 与业务文字', async () => {
    const css = '.ui{font-size:calc(var(--text,14px) + 2px);line-height:20px;min-width:240px;border:1px solid var(--border);width:min(640px,100%);gap:clamp(8px,2%,24px);padding:var(--gap,12px) 24px;--size:192px;top:calc(192px * var(--lumal-viewport-scale));left:calc(10vw + 24px);right:calc(env(safe-area-inset-right) + 24px);background:url("192px.svg");content:"192px"}'
    const options = { output: 'runtime' as const, fontSize: true, minSize: true, customProperties: true, variableFallbacks: true, minPixelValue: 0 }
    const result = await transform(css, undefined, options)
    expect(result).toContain('font-size:calc(var(--text,calc(14 * var(--lumal-viewport-unit, 1px))) + calc(2 * var(--lumal-viewport-unit, 1px)))')
    for (const size of [20, 240, 1, 640, 8, 24, 12, 192])
      expect(result).toContain(`calc(${size} * var(--lumal-viewport-unit, 1px))`)
    expect(result).toContain('top:calc(192px * var(--lumal-viewport-scale))')
    expect(result).toContain('left:calc(10vw + 24px)')
    expect(result).toContain('right:calc(env(safe-area-inset-right) + 24px)')
    expect(result).toContain('background:url("192px.svg");content:"192px"')
    expect(await transform(result, undefined, options)).toBe(result)
    expect(await transform('.ui{font-size:var(--font,14px);line-height:20px;min-width:min(320px,100%)}', undefined, { ...options, fontSize: false, minSize: false }))
      .toBe('.ui{font-size:var(--font,14px);line-height:20px;min-width:min(320px,100%)}')
  })
  it('可选设计稿断点仅在指定根模式下启用，响应式、媒体偏好、原子规则和来源边界不变', async () => {
    const css = '@media (max-width:768px) and (prefers-reduced-motion:reduce){.header{height:44px}:root{--gap:12px}html.dark .content{width:192px}}@media (pointer:coarse){.touch{height:44px}}.normal{width:192px}'
    const options = { output: 'runtime' as const, mediaQueries: { runtimeSelector: 'html[data-app-viewport="vw"]' } }
    const result = await transform(css, undefined, options)
    expect(result).toContain('@media (max-width:40vw) and (prefers-reduced-motion:reduce)')
    expect(result).toContain(':where(html[data-app-viewport="vw"]) .header')
    expect(result).toContain(':where(html:not(html[data-app-viewport="vw"])) .header')
    expect(result).toContain(':where(html[data-app-viewport="vw"]){--gap:12px}')
    expect(result).toContain(':where(html[data-app-viewport="vw"]).dark .content')
    expect(result).toContain('@media (pointer:coarse){.touch{')
    expect(await transform(result, undefined, options)).toBe(result)
    expect(await transform(css, 'C:/app/src/admin.css', options)).toBe(css)
    expect(await transform(css, 'C:/app/node_modules/unknown/styles.css', options)).toBe(css)
    expect(await transform(css)).not.toContain('40vw')
    expect(() => createViewportPostcssPlugin({ ...options, include: ['src/**'], output: 'vw' })).toThrow('runtime')
  })
  it('设计稿断点支持预编译范围语法，混合原子/排除规则、嵌套与其他查询保守保留', async () => {
    const options = { output: 'runtime' as const, excludeSelectors: ['.fixed'], mediaQueries: { runtimeSelector: 'html[data-mode="vw"]' } }
    for (const [query, expected] of [
      ['width<=768px', 'width<=40vw'],
      ['768px >= width', '40vw >= width'],
      ['640px < width < 1920px', '33.333333vw < width < 100vw'],
      ['height > 192px', 'height > 10vw'],
      ['max-width: .5px', 'max-width: 0.026042vw'],
    ]) {
      const result = await transform(`@media (${query}){.plain[data-label="192px"]{width:192px}}`, undefined, options)
      expect(result).toContain(`@media (${expected})`)
      expect(result).toContain(':where(html[data-mode="vw"]) .plain')
      expect(await transform(result, undefined, options)).toBe(result)
    }
    const container = await transform('@container settings (width<=320px){.plain{display:block}}', undefined, options)
    expect(container).toContain('@container settings (width<=16.666667vw)')
    expect(container).toContain(':where(html[data-mode="vw"]) .plain')
    expect(await transform(container, undefined, options)).toBe(container)
    for (const css of [
      '@media (width<768px){.w-\\[192px\\]{width:192px}.plain{color:red}}',
      '@media (width<768px){.fixed{width:192px}.plain{color:red}}',
      '@media (width<768px){@supports (display:grid){.plain{color:red}}}',
      '.host{@media (width<768px){.plain{color:red}}}',
      '@media (width<768px){.host{& .plain{color:red}}}',
      '@media (width < var(--breakpoint)){.plain{color:red}}',
      '@media (width < 40em){.plain{color:red}}',
      '@media (resolution:192dpi){.plain{color:red}}',
    ]) {
      expect(await transform(css, undefined, options)).toBe(css)
    }
    for (const runtimeSelector of ['body[data-mode="vw"]', 'html .screen', 'html,body', 'html:has(.screen)', ':root']) {
      expect(() => createViewportPostcssPlugin({ ...options, include: ['src/**'], mediaQueries: { runtimeSelector } })).toThrow('html')
    }
  })
  it('设计稿断点保留复制声明的 source map，混合范围外来源时不复制整个查询', async () => {
    const file = 'C:/app/src/screen/page.css'
    const plugin = createViewportPostcssPlugin({
      ...options,
      output: 'runtime',
      mediaQueries: { runtimeSelector: 'html[data-mode="vw"]' },
    }, 'C:/app')
    const css = '@media (max-width:768px){.local{width:192px}}'
    const result = await postcss([plugin]).process(css, {
      from: file,
      map: { inline: false, annotation: false },
    })
    const repeated = await postcss([plugin]).process(result.css, {
      from: file,
      map: { prev: result.map!.toJSON(), inline: false, annotation: false },
    })
    expect(repeated.css).toBe(result.css)
    const origins: string[] = []
    repeated.root.walkDecls('width', (declaration) => {
      const source = declaration.source!
      const origin = source.input.origin(source.start!.line, source.start!.column)
      origins.push(origin?.file?.replaceAll('\\', '/') ?? '')
    })
    expect(origins).toEqual([file, file])

    // 同一个查询包含入口外声明时，不能用入口的白名单授权整个媒体规则。
    const root = postcss.parse(css, { from: file })
    const foreign = postcss.parse('.foreign{width:192px}', { from: 'C:/app/src/admin.css' })
    const media = root.first as AtRule
    media.append(foreign.first!)
    const mixed = await postcss([plugin]).process(root, { from: file })
    expect(mixed.css).not.toContain('40vw')
    expect(mixed.css).not.toContain(':where(')
    expect(mixed.css).toContain('.foreign{width:192px}')
    expect(mixed.css).toContain('.local{width:calc(192 * var(--lumal-viewport-unit, 1px))}')
  })
  it('默认保护物理与逻辑最小尺寸，可单独开启而不改变其他旧选项', async () => {
    const css = 'a{min-width:320px;min-height:40px;min-inline-size:320px;min-block-size:40px;width:384px;height:192px}'
    expect(await transform(css)).toBe(css.replace('width:384px;height:192px', 'width:20vw;height:10vw'))
    expect(await transform(css, undefined, { minSize: true }))
      .toBe('a{min-width:16.666667vw;min-height:2.083333vw;min-inline-size:16.666667vw;min-block-size:2.083333vw;width:20vw;height:10vw}')
  })
  it('属性白名单支持通配符和大小写，空白名单不转换，黑名单始终优先', async () => {
    const css = 'a{WIDTH:192px;height:192px;padding:24px;padding-left:12px;min-width:320px;font-size:14px;line-height:20px;--size:192px}'
    expect(await transform(css, undefined, {
      includeProperties: ['width', 'padding*', 'min-*', 'font*', 'line-height', '--*'],
      excludeProperties: ['padding-left'],
    })).toBe('a{WIDTH:10vw;height:192px;padding:1.25vw;padding-left:12px;min-width:320px;font-size:14px;line-height:20px;--size:192px}')
    expect(await transform(css, undefined, { includeProperties: [] })).toBe(css)
    expect(await transform(css, undefined, {
      fontSize: true,
      minSize: true,
      customProperties: true,
      excludeProperties: ['*'],
    })).toBe(css)
  })
  it('边框、间距与负数沿用像素阈值，可按属性保留', async () => {
    const css = 'a{border:1px solid red;border-top-width:2px;padding:24px 1px;margin:-24px;row-gap:12px;column-gap:12px;width:192px}'
    expect(await transform(css))
      .toBe('a{border:1px solid red;border-top-width:0.104167vw;padding:1.25vw 1px;margin:-1.25vw;row-gap:0.625vw;column-gap:0.625vw;width:10vw}')
    expect(await transform(css, undefined, { excludeProperties: ['border*', 'padding*', 'margin*', '*gap'] }))
      .toBe(css.replace('width:192px', 'width:10vw'))
    expect(await transform('a{border-width:2px;padding:-2px 3px}', undefined, { minPixelValue: 2 }))
      .toBe('a{border-width:2px;padding:-2px 0.15625vw}')
  })
  it('选择器排除覆盖分组、嵌套和伪类，不受正则的全局状态影响', async () => {
    const css = '.fixed{width:192px}.fixed{height:192px}.safe,.map{width:192px}.host{.fixed{width:192px}.fluid{width:192px}}.fixed-parent{& .child{width:192px}}.safe:is(.map,.fluid){width:192px}.fluid{width:192px}'
    const pattern = /\.fixed(?:-parent)?\b/g
    pattern.lastIndex = 3
    const result = await transform(css, undefined, { excludeSelectors: [pattern, '.map'] })
    expect(result).toBe(css.replaceAll('.fluid{width:192px}', '.fluid{width:10vw}'))
    expect(pattern.lastIndex).toBe(3)
    expect(await transform('.fixed{color:red;.child{width:192px}}', undefined, { excludeSelectors: ['.fixed'] }))
      .toContain('width:192px')
  })
  it('声明忽略标记方向明确，支持Sass保留注释且不泄漏到相邻声明或规则', async () => {
    const css = '.a{width:192px;/* lumal-viewport-ignore-next */height:192px;margin:192px;/*! lumal-viewport-ignore */padding:192px}.b{width:192px}'
    expect(await transform(css))
      .toBe('.a{width:10vw;/* lumal-viewport-ignore-next */height:192px;margin:192px;/*! lumal-viewport-ignore */padding:10vw}.b{width:10vw}')
    expect(await transform('.a{/* lumal-viewport-ignore-next */}.b{width:192px}')).toContain('.b{width:10vw}')
    expect(await transform('a{width:192px;/* not-lumal-viewport-ignore */height:192px}'))
      .toContain('width:10vw')
  })
  it('整条保护视口变量、动态表达式和尺寸约束，避免局部px二次缩放', async () => {
    const css = 'a{width:calc(192px * var(--lumal-viewport-scale));height:calc(var(--panel) + 24px);padding:var(--gap,24px) 12px;top:calc(env(safe-area-inset-top) + 24px);left:calc(10vw + 24px);right:calc(10cqw + 24px);bottom:calc(1rem + 24px);gap:clamp(8px,2%,24px);max-width:min(960px,100%);min-height:max(40px,10%);--lumal-viewport-x-unit:192px;margin:calc(100% - 192px)}'
    expect(await transform(css, undefined, { minSize: true, customProperties: true }))
      .toBe(css.replace('margin:calc(100% - 192px)', 'margin:calc(100% - 10vw)'))
  })
  it('已有适配单位与阈值留下的px在多插件或重复处理时保持幂等', async () => {
    const css = 'a{padding:24px 1px;width:calc(10vw + 24px);height:clamp(40px,10vw,192px)}'
    const plugin = createViewportPostcssPlugin(options, 'C:/app')
    const first = (await postcss([plugin, createViewportPostcssPlugin(options, 'C:/app')])
      .process(css, { from: 'C:/app/src/screen/page.css' })).css
    expect(first).toBe('a{padding:1.25vw 1px;width:calc(10vw + 24px);height:clamp(40px,10vw,192px)}')
    expect(await transform(first, undefined, { minPixelValue: 0 })).toBe(first)
  })
  it('windows/Unix、SFC样式与query路径一致，排除后台与第三方', async () => {
    expect(await transform('a{width:192px}', 'C:\\app\\src\\screen\\page.vue?vue&type=style&lang.css')).toContain('10vw')
    expect(await transform('a{width:192px}', '/app/src/screen/page.css', { include: ['**/src/screen/**'] })).toContain('10vw')
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
    expect(await transform('a{width:192px}', 'file:///C:/app/node_modules/.pnpm/@demo+ui@1.0.0/node_modules/@demo/ui/style.css', { dependencies: ['@demo/ui'] })).toContain('10vw')
  })
  it('预处理source map按声明原址保护第三方、共享与后台，白名单仍可显式启用', async () => {
    const root = resolve(import.meta.dirname, 'fixtures/viewport')
    const file = resolve(root, 'src/screen/Mixed.scss')
    const compiled = compile(file, { sourceMap: true, loadPaths: [resolve(import.meta.dirname, '../../../node_modules')] })
    async function process(dependencies: string[] = []) {
      return (await postcss([createViewportPostcssPlugin({ ...options, dependencies }, root)])
        .process(compiled.css, { from: file, map: { prev: compiled.sourceMap, inline: false, annotation: false } })).css
    }
    const result = await process()
    expect(result).toMatch(/\.screen-mixed\s*\{\s*width:\s*20vw/)
    expect(result).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
    expect(result).toMatch(/\.admin-scoped-style\s*\{\s*height:\s*192px/)
    expect(result).toContain('height: 32px')
    const whitelisted = await process(['element-plus'])
    expect(whitelisted).toContain('height: 1.666667vw')
    expect(whitelisted).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
  })
  it.each(['expanded', 'compressed'] as const)('%s SCSS混合来源保留精细控制、忽略标记与声明source map', async (style) => {
    const root = resolve(import.meta.dirname, 'fixtures/viewport')
    const file = resolve(root, 'src/screen/Mixed.scss')
    const compiled = compile(file, { style, sourceMap: true, loadPaths: [resolve(import.meta.dirname, '../../../node_modules')] })
    const plugin = createViewportPostcssPlugin({
      ...options,
      excludeProperties: ['border*'],
      excludeSelectors: ['.screen-mixed-fixed'],
    }, root)
    const result = await postcss([plugin]).process(compiled.css, {
      from: file,
      map: { prev: compiled.sourceMap, inline: false, annotation: false },
    })
    const declarations: Record<string, Record<string, string>> = {}
    result.root.walkDecls((declaration) => {
      if (declaration.parent?.type !== 'rule')
        return
      const values = declarations[declaration.parent.selector] ??= {}
      values[declaration.prop] = declaration.value
    })
    expect(declarations['.screen-mixed']).toMatchObject({
      'width': '20vw',
      'min-width': '320px',
      'min-height': '40px',
      'font-size': '14px',
      'line-height': '20px',
      'border': '2px solid red',
      'padding': '1.25vw',
      'height': '192px',
    })
    expect(declarations['.screen-mixed-fixed']!.width).toBe('192px')
    expect(declarations['.screen-mixed-adapted']!.width).toMatch(/192px\s*\*\s*var\(--lumal-viewport-scale\)/)
    expect(declarations['.shared-scoped-style']!.width).toBe('192px')
    expect(declarations['.admin-scoped-style']!.height).toBe('192px')
    const repeated = await postcss([plugin]).process(result.css, {
      from: file,
      map: { prev: result.map!.toJSON(), inline: false, annotation: false },
    })
    expect(repeated.css).toBe(result.css)
    let origin: ReturnType<NonNullable<Declaration['source']>['input']['origin']>
    repeated.root.walkDecls('width', (declaration) => {
      if (declaration.parent?.type === 'rule' && declaration.parent.selector === '.screen-mixed')
        origin = declaration.source!.input.origin(declaration.source!.start!.line, declaration.source!.start!.column)
    })
    expect(origin!).toMatchObject({ line: 6 })
    expect(origin! && origin.file?.replaceAll('\\', '/')).toBe(file.replaceAll('\\', '/'))
  })
  it('source map无法归属的声明保守保留px', async () => {
    const result = await postcss([createViewportPostcssPlugin(options, 'C:/app')]).process('a{width:192px}', {
      from: 'C:/app/src/screen/page.css',
      map: { prev: { version: 3, sources: [], names: [], mappings: '' }, inline: false, annotation: false },
    })
    expect(result.css).toContain('192px')
    expect(await transform('a{width:192px}', 'C:/app/src/screen/page.scss')).toContain('192px')
    expect(await transform('a{width:192px}', 'C:/app/src/screen/page.vue?vue&type=style&lang.scss')).toContain('192px')
  })
  it.each([
    { kind: 'string', additionalData: '@use "../shared/panel.scss" as injected;' },
    { kind: 'function', additionalData: (source: string) => `@use "../shared/panel.scss" as injected;\n${source}` },
  ])('$kind additionalData注入的跨目录Sass样式不会绕过边界', async ({ additionalData }) => {
    const root = resolve(import.meta.dirname, 'fixtures/viewport')
    const config = {
      root,
      configFile: false as const,
      plugins: [vue(), createViewportTransformPlugin(options)],
      css: { preprocessorOptions: { scss: { additionalData } } },
      logLevel: 'silent' as const,
      build: { write: false, minify: false },
    }
    const server = await createServer(config)
    try {
      const style = await server.transformRequest('/src/screen/Panel.vue?vue&type=style&index=0&direct&lang.scss')
      expect(style!.code).toMatch(/\.screen\s*\{\s*width:\s*192px/)
      expect(style!.code).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
      const built = await build(config)
      const outputs = (Array.isArray(built) ? built[0]! : built) as { output: { fileName: string, source?: string }[] }
      const css = outputs.output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
      expect(css).toMatch(/\.screen\s*\{\s*width:\s*192px/)
      expect(css).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
    }
    finally {
      await server.close()
    }
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
      const mixed = await server.transformRequest('/src/screen/Mixed.scss?direct')
      expect(mixed!.code).toContain('height: 32px')
      expect(mixed!.code).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
      expect(mixed!.code).toMatch(/\.admin-scoped-style\s*\{\s*height:\s*192px/)
      // Vite不提供逐声明Sass map时跳过整个混合输出，不把入口自身伪装成已安全转换。
      expect(mixed!.code).toMatch(/\.screen-mixed\s*\{\s*width:\s*384px/)
      const mixedSfc = await server.transformRequest('/src/screen/Panel.vue?vue&type=style&index=1&direct&lang.scss')
      expect(mixedSfc!.code).toMatch(/\.screen-mixed-sfc\s*\{\s*height:\s*384px/)
      expect(mixedSfc!.code).not.toContain('@use')
      const built = await build(config)
      const outputs = (Array.isArray(built) ? built[0]! : built) as { output: { type: string, fileName: string, source?: string, code?: string }[] }
      const css = outputs.output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
      expect(css).toContain('10vw')
      expect(css).toContain('192px')
      expect(css).toContain('--existing: retained')
      expect(css).toContain('height: 32px')
      expect(css).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
      expect(css).toMatch(/\.admin-scoped-style\s*\{\s*height:\s*192px/)
      expect(css).toMatch(/\.screen-mixed\s*\{\s*width:\s*384px/)
      expect(css).toMatch(/\.screen-mixed-sfc\s*\{\s*height:\s*384px/)
      expect(outputs.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')).toContain('coordinate: 192')
    }
    finally {
      await server.close()
    }
  })
  it.each(['file', 'inline'])('%s PostCSS配置下真实Admin/Screen样式在Dev/Build结果一致', async (postcssConfig) => {
    const root = resolve(import.meta.dirname, 'fixtures/viewport')
    const config = {
      root,
      configFile: false as const,
      plugins: [vue(), createViewportTransformPlugin({
        ...options,
        excludeProperties: ['border*', 'margin*'],
        excludeSelectors: [/\.screen-map\b/g],
      })],
      css: {
        postcss: postcssConfig === 'inline'
          ? {
              plugins: [{
                postcssPlugin: 'existing-inline-plugin',
                Declaration(declaration: Declaration) {
                  if (declaration.prop === '--existing')
                    declaration.value = 'retained'
                },
              }],
            }
          : undefined,
      },
      logLevel: 'silent' as const,
      build: { write: false, minify: false, cssMinify: false, rollupOptions: { input: resolve(root, 'controlled.html') } },
    }
    function verify(css: string) {
      expect(css).toMatch(/\.screen-controlled[^{}]*\{[^}]*width:\s*20vw/)
      expect(css).toMatch(/\.screen-controlled[^{}]*\{[^}]*height:\s*10vw/)
      expect(css).toMatch(/min-width:\s*320px/)
      expect(css).toMatch(/min-height:\s*40px/)
      expect(css).toMatch(/font-size:\s*14px;\s*line-height:\s*20px/)
      expect(css).toMatch(/padding:\s*1.25vw/)
      expect(css).toMatch(/margin:\s*24px/)
      expect(css).toMatch(/border:\s*2px solid red/)
      expect(css).toMatch(/\.screen-fixed[^{}]*,\s*\.screen-map[^{}]*\{\s*width:\s*192px/)
      expect(css).toMatch(/\.screen-pinned[^{}]*\{[^}]*width:\s*192px;\s*height:\s*192px/)
      expect(css).toContain('calc(192px * var(--lumal-viewport-scale))')
      expect(css).toContain('calc(var(--panel-height) + 24px)')
      expect(css).toContain('clamp(12px, 2vw, 24px)')
      expect(css).toContain('--existing: retained')
      expect(css).toMatch(/\.screen-css[^{}]*\{\s*width:\s*10vw/)
      expect(css).toMatch(/\.shared-scoped-style\s*\{\s*width:\s*192px/)
      expect(css).toMatch(/\.admin-scoped-style\s*\{\s*height:\s*192px/)
      expect(css).toMatch(/\.screen-mixed-controls\s*\{\s*width:\s*384px/)
    }
    const server = await createServer(config)
    try {
      const styles = []
      for (const [index, language] of ['scss', 'css', 'scss'].entries()) {
        const style = await server.transformRequest(`/src/screen/Controlled.vue?vue&type=style&index=${index}&direct${index < 2 ? '&scoped=controls' : ''}&lang.${language}`)
        styles.push(style!.code)
      }
      verify(styles.join('\n'))
      const built = await build(config)
      const outputs = (Array.isArray(built) ? built[0]! : built) as { output: { type: string, fileName: string, source?: string, code?: string }[] }
      verify(outputs.output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n'))
      const scripts = outputs.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
      expect(scripts).toContain('left: 192')
      expect(scripts).toMatch(/top:\s*"192px"/)
    }
    finally {
      await server.close()
    }
  })
})
