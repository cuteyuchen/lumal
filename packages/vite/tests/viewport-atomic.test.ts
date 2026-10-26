// @vitest-environment node
import type { ViewportTransformOptions } from '../src'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import { createViewportPostcssPlugin } from '../src'
import { createViewportSelectorFilter } from '../src/viewport-selector'

describe('原子化 CSS 视口保护', () => {
  const options: ViewportTransformOptions = {
    enabled: true,
    include: ['src/screen/**'],
    viewportWidth: 1920,
  }
  async function transform(css: string, overrides: Partial<ViewportTransformOptions> = {}) {
    return (await postcss([createViewportPostcssPlugin({ ...options, ...overrides }, 'C:/app')])
      .process(css, { from: 'C:/app/src/screen/atomic.css' })).css
  }

  it.each([
    String.raw`.w-\[192px\]`,
    String.raw`.h-\[96px\]`,
    String.raw`.top-\[20px\]`,
    String.raw`.hover\:w-\[192px\]:hover`,
    String.raw`.\[width\:192px\]`,
    String.raw`.w-\5b 192px\5d`,
    String.raw`.supports-\[display\:grid\]\:w-\[192px\]`,
    String.raw`.\[\&\>div\]\:mt-\[20px\] > div`,
  ])('生成规则 %s 的选择器和尺寸都保持原样', async (selector) => {
    const css = `${selector}{width:192px;height:96px;top:20px}`
    expect(await transform(css)).toBe(css)
    expect(await transform(await transform(css))).toBe(css)
  })

  it('普通属性选择器和属性值中的方括号不会误判成原子化类名', async () => {
    const css = '.panel[data-size="192px"]{width:192px}.panel[data-example="w-[192px]"]{height:96px}[style*="192px"]{top:20px}'
    expect(await transform(css))
      .toBe('.panel[data-size="192px"]{width:10vw}.panel[data-example="w-[192px]"]{height:5vw}[style*="192px"]{top:1.041667vw}')
  })

  it('分组选择器、伪类参数与原生嵌套规则中的任意值类名保护整条规则', async () => {
    const css = String.raw`.ordinary,.w-\[192px\]{width:192px}.panel:is(.h-\[96px\],.ordinary){height:96px}.w-\[192px\]{& .child{padding:24px}}.ordinary{padding:24px}`
    expect(await transform(css)).toBe(css.replace('.ordinary{padding:24px}', '.ordinary{padding:1.25vw}'))
  })

  it('显式属性开关、白名单与第三方依赖白名单不能绕过任意值规则保护', async () => {
    const css = String.raw`.text-\[14px\]{font-size:14px;line-height:20px;min-width:192px;--size:192px}`
    const plugin = createViewportPostcssPlugin({
      ...options,
      fontSize: true,
      minSize: true,
      customProperties: true,
      includeProperties: ['*'],
      dependencies: ['@demo/ui'],
    }, 'C:/app')
    const result = await postcss([plugin]).process(css, {
      from: 'C:/app/node_modules/.pnpm/@demo+ui@1.0.0/node_modules/@demo/ui/style.css',
    })
    expect(result.css).toBe(css)
  })

  it('字符串和正则排除规则与原子化保护协同，且不修改调用方正则状态', async () => {
    const pattern = /\.map\b/gy
    pattern.lastIndex = 2
    const css = String.raw`.map{width:192px}.map{height:96px}.fixed-panel{width:192px}.w-\[192px\]{width:192px}.fluid{width:192px}`
    expect(await transform(css, { excludeSelectors: [pattern, '.fixed-'] }))
      .toBe(css.replace('.fluid{width:192px}', '.fluid{width:10vw}'))
    expect(pattern.lastIndex).toBe(2)
  })

  it('选择器解析失败时保守保护，不把损坏选择器当作普通规则', () => {
    const excluded = createViewportSelectorFilter()
    expect(excluded('.panel[data-size="192px"')).toBe(true)
    expect(excluded(String.raw`.w-\[192px\]`)).toBe(true)
    expect(excluded('.panel[data-size="192px"]')).toBe(false)
  })
})
