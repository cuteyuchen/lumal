import assert from 'node:assert/strict'
import { realpath, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve, sep } from 'node:path'
import process from 'node:process'
import { getViewportConfig, viewportLength, viewportPixels } from '@lumal/viewport'
import { createViewportPostcssPlugin, createViewportTransformPlugin } from '@lumal/vite'
import postcss from 'postcss'
import { compile } from 'sass-embedded'
import { build, createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const root = process.cwd()
const require = createRequire(import.meta.url)
const designWidth = Number(process.env.CONSUMER_DESIGN_WIDTH ?? 1920)
const options = { enabled: true, include: ['src/screen/**'], viewportWidth: designWidth, fontSize: false, minSize: false }
const length = value => `${Number((value / designWidth * 100).toFixed(6))}vw`

function ruleValues(css, selector) {
  const values = {}
  let found = false
  postcss.parse(css).walkRules((rule) => {
    if (!rule.selector.includes(selector))
      return
    found = true
    for (const node of rule.nodes) {
      if (node.type === 'decl')
        values[node.prop] = node.value
    }
  })
  assert.ok(found, `缺少规则 ${selector}`)
  return values
}

function verifyCss(css) {
  const panel = ruleValues(css, '.screen-panel')
  assert.deepEqual(panel, {
    'width': length(384),
    'font-size': '14px',
    'line-height': '20px',
    'min-width': '320px',
    'min-height': '40px',
    'border': '2px solid red',
    'margin': '24px',
    'padding': length(24),
    '--existing': 'retained',
  })
  assert.equal(ruleValues(css, '.ordinary').width, length(192))
  assert.equal(ruleValues(css, '.map-panel').width, '192px')
  assert.deepEqual(ruleValues(css, '.ignored-size'), { width: '192px', height: '96px', padding: length(24) })
  assert.equal(ruleValues(css, '.w-\\[192px\\]').width, '192px')
  assert.equal(ruleValues(css, '.hover\\:top-\\[20px\\]').top, '20px')
  assert.match(ruleValues(css, '.variable-size').width, /192px\s*\*\s*var\(--lumal-viewport-scale\)/)
  assert.equal(ruleValues(css, '.variable-size').height, 'clamp(40px, 10vw, 192px)')
  assert.equal(ruleValues(css, '.shared-panel').width, '192px')
  assert.equal(ruleValues(css, '.mixed-screen').width, '384px')
  assert.equal(ruleValues(css, '.consumer-admin').width, '192px')
  assert.deepEqual(ruleValues(css, '.runtime-canvas'), { width: '192px', height: '96px' })
  assert.equal(ruleValues(css, '.third-party-width').width, '192px')
  return { panel, atomicWidth: '192px', ordinaryAttributeWidth: length(192), excludedWidth: '192px' }
}

function verifyCooperativeCss(css) {
  const panel = ruleValues(css, '.cooperative-panel')
  assert.deepEqual(panel, {
    'width': length(384),
    'height': length(192),
    'padding': length(24),
    'margin': length(12),
    'font-size': '14px',
    'line-height': '20px',
    'min-width': '320px',
    'min-height': '40px',
    'border': '2px solid red',
  })
  assert.equal(ruleValues(css, '.cooperative-map').width, '192px')
  assert.equal(ruleValues(css, '.cooperative-normal').width, length(192))
  assert.equal(ruleValues(css, '.cooperative-atomic').width, '192px')
  assert.deepEqual(ruleValues(css, '.cooperative-ignored-size'), {
    width: '192px',
    height: '96px',
    padding: length(24),
  })
  assert.match(ruleValues(css, '.cooperative-variable').width, /192px\s*\*\s*var\(--lumal-viewport-scale\)/)
  assert.equal(ruleValues(css, '.cooperative-variable').height, 'clamp(40px, 10vw, 192px)')
  return { panel, atomicWidth: '192px', ordinaryAttributeWidth: length(192) }
}

function verifyFullPageCss(css) {
  const panel = ruleValues(css, '.consumer-full-page')
  assert.equal(panel['--gap'], length(24))
  assert.equal(panel['font-size'], `calc(var(--text, ${length(14)}) + ${length(2)})`)
  assert.equal(panel['line-height'], length(20))
  assert.equal(panel['min-height'], length(40))
  assert.equal(panel['grid-template-columns'], `minmax(${length(280)}, 1fr) 2fr`)
  assert.equal(panel.border, `${length(1)} solid var(--border)`)
  assert.match(css, /@media\s*\(max-width:\s*768px\)/)
  assert.match(css, /@media\s*\(width\s*<=\s*768px\)/)
  assert.match(css, /@container settings\s*\(width\s*<=\s*320px\)/)
  assert.doesNotMatch(css, /@(?:media|container)[^{]*vw/, '断点不是设计尺寸')
  return panel
}

function inlineValues(html, className) {
  const tag = html.match(new RegExp(`<[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`))?.[0]
  assert.ok(tag, `SSR 缺少元素 ${className}`)
  const style = tag.match(/\bstyle="([^"]*)"/)?.[1]
  assert.ok(style, `SSR 缺少行内样式 ${className}`)
  return ruleValues(`.inline{${style}}`, '.inline')
}

async function main() {
  const commonjs = require('@lumal/vite')
  assert.equal(typeof commonjs.createViewportTransformPlugin, 'function')
  assert.equal(typeof createViewportTransformPlugin, 'function')
  const resolved = await realpath(require.resolve('@lumal/vite'))
  assert.ok(resolved.startsWith(`${resolve(root)}${sep}`), '消费者必须从自己的 node_modules 解析 tarball')
  for (const [format, api] of [['esm', { createViewportPostcssPlugin }], ['cjs', commonjs]]) {
    const result = await postcss([api.createViewportPostcssPlugin(options, root)])
      .process('.format{width:192px;font-size:14px;line-height:20px;min-height:40px}', { from: resolve(root, 'src/screen/format.css') })
    assert.equal(result.css, `.format{width:${length(192)};font-size:14px;line-height:20px;min-height:40px}`, format)
    const repeated = await postcss([api.createViewportPostcssPlugin(options, root)])
      .process(result.css, { from: resolve(root, 'src/screen/format.css') })
    assert.equal(repeated.css, result.css, `${format} vw 输出必须幂等`)
    const uniform = await postcss([api.createViewportPostcssPlugin({ ...options, fontSize: true, minSize: true }, root)])
      .process('.format{width:192px;font-size:14px;line-height:20px;min-height:40px;border:1px solid red}', { from: resolve(root, 'src/screen/format.css') })
    assert.equal(uniform.css, `.format{width:${length(192)};font-size:${length(14)};line-height:${length(20)};min-height:${length(40)};border:1px solid red}`)
  }
  const dependency = require.resolve('viewport-widget')
  for (const [dependencies, expected] of [[[], '192px'], [['viewport-widget'], length(192)]]) {
    const result = await postcss([createViewportPostcssPlugin({ ...options, dependencies }, root)])
      .process('.dependency{width:192px}', { from: dependency })
    assert.equal(ruleValues(result.css, '.dependency').width, expected)
  }
  const mixedFile = resolve(root, 'src/screen/mixed.scss')
  const compiled = compile(mixedFile, { sourceMap: true })
  const mapped = await postcss([createViewportPostcssPlugin(options, root)]).process(compiled.css, {
    from: mixedFile,
    map: { prev: compiled.sourceMap, inline: false, annotation: false },
  })
  assert.equal(ruleValues(mapped.css, '.mixed-screen').width, length(384))
  assert.equal(ruleValues(mapped.css, '.shared-panel').width, '192px')
  assert.ok(mapped.map.toJSON().sources.some(source => source.endsWith('mixed.scss')))
  const repeated = await postcss([createViewportPostcssPlugin(options, root)]).process(mapped.css, {
    from: mixedFile,
    map: { prev: mapped.map.toJSON(), inline: false, annotation: false },
  })
  assert.equal(repeated.css, mapped.css)

  const server = await createServer({ root, logLevel: 'silent', server: { port: 0 } })
  try {
    const styles = []
    for (const [index, language] of ['scss', 'css'].entries()) {
      const style = await server.transformRequest(`/src/screen/ScreenPanel.vue?vue&type=style&index=${index}&direct${index === 0 ? '&scoped=consumer' : ''}&lang.${language}`)
      styles.push(style.code)
    }
    for (const path of ['/src/admin.css?direct', '/src/screen/mixed.scss?direct', '/src/runtime/RuntimeCanvas.vue?vue&type=style&index=0&direct&scoped=consumer&lang.css']) {
      const style = await server.transformRequest(path)
      styles.push(style.code)
    }
    const dependencyResult = await postcss([createViewportPostcssPlugin(options, root)])
      .process('.third-party-width{width:192px}', { from: dependency })
    styles.push(dependencyResult.css)
    const cooperativeStyle = await server.transformRequest('/src/cooperative/CooperativePanel.vue?vue&type=style&index=0&direct&scoped=cooperative&lang.scss')
    styles.push(cooperativeStyle.code)
    const fullPageStyle = await server.transformRequest('/src/full-page/FullPage.vue?vue&type=style&index=0&direct&scoped=full-page&lang.scss')
    styles.push(fullPageStyle.code)
    const development = verifyCss(styles.join('\n'))
    const cooperativeDevelopment = verifyCooperativeCss(styles.join('\n'))
    const fullPageDevelopment = verifyFullPageCss(styles.join('\n'))
    const component = await server.ssrLoadModule('/src/screen/ScreenPanel.vue')
    const html = await renderToString(createSSRApp(component.default))
    assert.deepEqual(inlineValues(html, 'static-inline'), {
      'width': length(192),
      'height': length(96),
      'font-size': '14px',
      'line-height': '20px',
      'min-width': '320px',
    })
    assert.deepEqual(inlineValues(html, 'object-inline'), { width: length(192), top: length(24), height: '192px' })
    const array = inlineValues(html, 'array-inline')
    assert.equal(array.height, length(96))
    assert.equal(array.padding, length(24))
    assert.deepEqual(inlineValues(html, 'ignored-inline'), { width: '384px', height: '192px' })
    assert.equal(inlineValues(html, 'viewport-fixed').width, '192px')
    assert.deepEqual(inlineValues(html, 'map-panel'), { width: '192px', top: '24px' })
    assert.equal(inlineValues(html, 'dynamic-selector-inline').width, '192px')
    assert.equal(inlineValues(html, 'dynamic-selector-child').height, '96px')
    assert.equal(inlineValues(html, 'style-presence-inline').width, '288px')
    assert.equal(inlineValues(html, 'style-presence-child').height, '144px')
    assert.deepEqual(inlineValues(html, 'style-value-inline'), { width: '384px', height: '192px' })
    assert.ok(html.includes('w-[192px] h-[96px] top-[20px]'))
    assert.ok(html.includes('w-[192px] mt-[20px]'))
    assert.ok(html.includes('aria-label="192px"'))
    assert.ok(html.includes('192px'))

    const shared = await server.ssrLoadModule('/viewport.config.ts')
    assert.equal(shared.design.designWidth, 1920)
    const config = { enabled: true, designWidth }
    assert.deepEqual(getViewportConfig(), { enabled: false, designWidth: 1920 }, '未经过 Vite 的 Node 消费默认 px')
    assert.equal(viewportLength(192, config), `${Number((192 / designWidth * 100).toFixed(10))}vw`)
    for (const width of [1280, 1920, 2560])
      assert.equal(viewportPixels(192, width, config), 192 * width / designWidth)
    assert.equal(viewportPixels(192, 1280, { ...config, enabled: false }), 192)

    const cooperativeComponent = await server.ssrLoadModule('/src/cooperative/CooperativePanel.vue')
    const fullPageComponent = await server.ssrLoadModule('/src/full-page/FullPage.vue')
    const fullPageHtml = await renderToString(createSSRApp(fullPageComponent.default))
    assert.ok(fullPageHtml.includes(`font-size:${length(14)}`))
    assert.ok(fullPageHtml.includes(`line-height:${length(20)}`))
    assert.ok(fullPageHtml.includes(`min-width:${length(240)}`))
    assert.ok(fullPageHtml.includes('aria-label="192px"'))
    assert.ok(fullPageHtml.includes('class="w-[192px]"'))
    const cooperativeHtml = await renderToString(createSSRApp(cooperativeComponent.default))
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-static'), {
      'width': length(192),
      'height': length(96),
      'font-size': '14px',
      'line-height': '20px',
      'min-width': '320px',
    })
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-object'), {
      width: length(192),
      top: length(24),
      height: viewportLength(192, config),
    })
    const cooperativeArray = inlineValues(cooperativeHtml, 'cooperative-array')
    assert.equal(cooperativeArray.height, length(96))
    assert.equal(cooperativeArray.padding, length(24))
    assert.equal(cooperativeArray.left, '48px')
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-ignored'), { width: '192px', height: '96px' })
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-map'), { width: '192px', height: '96px' })
    assert.ok(cooperativeHtml.includes('w-[192px]'))
    assert.ok(cooperativeHtml.includes('aria-label="192px"'))
    assert.ok(cooperativeHtml.includes('192px'))
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-nested-content').width, length(192))
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-disabled-content').height, length(96))
    assert.doesNotMatch(cooperativeHtml, /transform:|--lumal-viewport-unit|data-viewport-mode/, '嵌套内容不施加二次缩放')
    // 容器宽 1000 时仍以浏览器宽 1280 为 vw 基准；此处核对契约，不冒充浏览器布局测量。
    const browserWidth = 1280
    const containerWidth = 1000
    const viewportPhysicalWidth = viewportPixels(192, browserWidth, config)
    assert.equal(viewportPhysicalWidth, 192 * browserWidth / designWidth)
    assert.notEqual(viewportPhysicalWidth, 192 * containerWidth / designWidth)

    const built = await build({ root, logLevel: 'silent', build: { write: false } })
    const output = (Array.isArray(built) ? built[0] : built).output
    const css = output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
    const production = verifyCss(css)
    assert.deepEqual(production, development)
    const cooperativeProduction = verifyCooperativeCss(css)
    assert.deepEqual(cooperativeProduction, cooperativeDevelopment)
    assert.deepEqual(verifyFullPageCss(css), fullPageDevelopment)
    const scripts = output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
    assert.ok(scripts.includes('w-[192px]'))
    assert.ok(scripts.includes('mt-[20px]'))
    assert.match(scripts, /["']aria-label["']:\s*["']192px["']/)
    assert.match(scripts, /left:\s*192/)
    assert.match(scripts, /fontSize:\s*14/)
    assert.ok(scripts.includes(length(192)) && scripts.includes(length(96)) && scripts.includes(length(24)))
    const maps = output.filter(item => item.fileName.endsWith('.js.map')).map(item => JSON.parse(String(item.source)))
    assert.ok(maps.some(map => map.sources.some(source => source.endsWith('ScreenPanel.vue'))))
    assert.ok(maps.some(map => map.sourcesContent.some(source => source?.includes('width: \'192px\''))))
    await writeFile(resolve(root, 'consumer-report.json'), `${JSON.stringify({
      status: 'passed',
      checks: ['esm', 'cjs', 'vue-types', 'css', 'scss', 'template-static', 'template-object-array', 'dynamic-preserved', 'atomic-css', 'selector-ignore', 'declaration-ignore', 'scope-dependencies', 'source-map', 'idempotence', 'dev-build', 'runtime-cooperation', 'plain-vw-output', 'nested-single-rule', 'browser-not-container-width', 'full-page-variables', 'unchanged-media-container-queries'],
      development,
      production,
      inline: {
        static: inlineValues(html, 'static-inline'),
        object: inlineValues(html, 'object-inline'),
        array,
        dynamicSelector: inlineValues(html, 'dynamic-selector-inline'),
      },
      runtime: { config, physicalWidth: viewportPhysicalWidth, validation: '公开数字工具与真实 Vue SSR，不是浏览器测量结果' },
      fullPage: {
        development: fullPageDevelopment,
        production: verifyFullPageCss(css),
        validation: '普通 vw、静态行内样式；媒体与容器断点保持原值',
      },
      cooperative: {
        development: cooperativeDevelopment,
        production: cooperativeProduction,
        inline: inlineValues(cooperativeHtml, 'cooperative-static'),
        browserWidth,
        containerWidth,
        physicalWidth: viewportPhysicalWidth,
        validation: '真实 Vue AST、SSR 与 Dev/Build 产物；未启动浏览器进行布局测量',
      },
    }, null, 2)}\n`)
    console.log('独立 Vue 消费者验证通过。')
  }
  finally {
    await server.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
