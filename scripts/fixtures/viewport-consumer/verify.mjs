import assert from 'node:assert/strict'
import { realpath, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve, sep } from 'node:path'
import process from 'node:process'
import { computeViewportScale, LumalViewport, resolveViewportPolicy } from '@lumal/viewport'
import { createViewportPostcssPlugin, createViewportTransformPlugin } from '@lumal/vite'
import postcss from 'postcss'
import { compile } from 'sass-embedded'
import { build, createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

const root = process.cwd()
const require = createRequire(import.meta.url)
const options = { enabled: true, include: ['src/screen/**'], viewportWidth: 1920 }
const cooperativeOptions = { ...options, include: ['src/cooperative/**'], output: 'runtime' }
const runtimeLength = value => `calc(${value} * var(--lumal-viewport-unit, 1px))`

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
    'width': '20vw',
    'font-size': '14px',
    'line-height': '20px',
    'min-width': '320px',
    'min-height': '40px',
    'border': '2px solid red',
    'margin': '24px',
    'padding': '1.25vw',
    '--existing': 'retained',
  })
  assert.equal(ruleValues(css, '.ordinary').width, '10vw')
  assert.equal(ruleValues(css, '.map-panel').width, '192px')
  assert.deepEqual(ruleValues(css, '.ignored-size'), { width: '192px', height: '96px', padding: '1.25vw' })
  assert.equal(ruleValues(css, '.w-\\[192px\\]').width, '192px')
  assert.equal(ruleValues(css, '.hover\\:top-\\[20px\\]').top, '20px')
  assert.match(ruleValues(css, '.variable-size').width, /192px\s*\*\s*var\(--lumal-viewport-scale\)/)
  assert.equal(ruleValues(css, '.variable-size').height, 'clamp(40px, 10vw, 192px)')
  assert.equal(ruleValues(css, '.shared-panel').width, '192px')
  assert.equal(ruleValues(css, '.mixed-screen').width, '384px')
  assert.equal(ruleValues(css, '.consumer-admin').width, '192px')
  assert.deepEqual(ruleValues(css, '.runtime-canvas'), { width: '192px', height: '96px' })
  assert.equal(ruleValues(css, '.third-party-width').width, '192px')
  return { panel, atomicWidth: '192px', ordinaryAttributeWidth: '10vw', runtimeWidth: '192px' }
}

function verifyCooperativeCss(css) {
  const panel = ruleValues(css, '.cooperative-panel')
  assert.deepEqual(panel, {
    'width': runtimeLength(384),
    'height': runtimeLength(192),
    'padding': runtimeLength(24),
    'margin': runtimeLength(12),
    'font-size': '14px',
    'line-height': '20px',
    'min-width': '320px',
    'min-height': '40px',
    'border': '2px solid red',
  })
  assert.equal(ruleValues(css, '.cooperative-map').width, '192px')
  assert.equal(ruleValues(css, '.cooperative-normal').width, runtimeLength(192))
  assert.equal(ruleValues(css, '.cooperative-atomic').width, '192px')
  assert.deepEqual(ruleValues(css, '.cooperative-ignored-size'), {
    width: '192px',
    height: '96px',
    padding: runtimeLength(24),
  })
  assert.match(ruleValues(css, '.cooperative-variable').width, /192px\s*\*\s*var\(--lumal-viewport-scale\)/)
  assert.equal(ruleValues(css, '.cooperative-variable').height, 'clamp(40px, 10vw, 192px)')
  return { panel, atomicWidth: '192px', ordinaryAttributeWidth: runtimeLength(192) }
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
    assert.equal(result.css, '.format{width:10vw;font-size:14px;line-height:20px;min-height:40px}', format)
    const cooperative = await postcss([api.createViewportPostcssPlugin(cooperativeOptions, root)])
      .process('.format{width:192px;font-size:14px;line-height:20px;min-height:40px}', { from: resolve(root, 'src/cooperative/format.css') })
    assert.equal(cooperative.css, `.format{width:${runtimeLength(192)};font-size:14px;line-height:20px;min-height:40px}`, format)
    const repeated = await postcss([api.createViewportPostcssPlugin(cooperativeOptions, root)])
      .process(cooperative.css, { from: resolve(root, 'src/cooperative/format.css') })
    assert.equal(repeated.css, cooperative.css, `${format} runtime output must be idempotent`)
  }
  const dependency = require.resolve('viewport-widget')
  for (const [dependencies, expected] of [[[], '192px'], [['viewport-widget'], '10vw']]) {
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
  assert.equal(ruleValues(mapped.css, '.mixed-screen').width, '20vw')
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
    const development = verifyCss(styles.join('\n'))
    const cooperativeDevelopment = verifyCooperativeCss(styles.join('\n'))
    const component = await server.ssrLoadModule('/src/screen/ScreenPanel.vue')
    const html = await renderToString(createSSRApp(component.default))
    assert.deepEqual(inlineValues(html, 'static-inline'), {
      'width': '10vw',
      'height': '5vw',
      'font-size': '14px',
      'line-height': '20px',
      'min-width': '320px',
    })
    assert.deepEqual(inlineValues(html, 'object-inline'), { width: '10vw', top: '1.25vw', height: '192px' })
    const array = inlineValues(html, 'array-inline')
    assert.equal(array.height, '5vw')
    assert.equal(array.padding, '1.25vw')
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
    const design = shared.design
    const scale = computeViewportScale(1280, 720, design.designWidth, design.designHeight)
    assert.equal(scale.scale, 2 / 3)
    assert.equal(192 * scale.scale, 128)
    const policy = resolveViewportPolicy({ ...shared.viewportPolicy, mode: 'responsive' })
    const runtimeHtml = await renderToString(createSSRApp({
      render: () => h(LumalViewport, { policy }, () => h('span', { style: { width: '192px' } }, 'runtime')),
    }))
    assert.ok(runtimeHtml.includes('width:192px;'))
    assert.ok(runtimeHtml.includes('data-viewport-mode="responsive"'))

    const cooperativeComponent = await server.ssrLoadModule('/src/cooperative/CooperativePanel.vue')
    const cooperativeHtml = await renderToString(createSSRApp(cooperativeComponent.default))
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-static'), {
      'width': runtimeLength(192),
      'height': runtimeLength(96),
      'font-size': '14px',
      'line-height': '20px',
      'min-width': '320px',
    })
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-object'), {
      width: runtimeLength(192),
      top: runtimeLength(24),
      height: '192px',
    })
    const cooperativeArray = inlineValues(cooperativeHtml, 'cooperative-array')
    assert.equal(cooperativeArray.height, runtimeLength(96))
    assert.equal(cooperativeArray.padding, runtimeLength(24))
    assert.equal(cooperativeArray.left, '48px')
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-ignored'), { width: '192px', height: '96px' })
    assert.deepEqual(inlineValues(cooperativeHtml, 'cooperative-map'), { width: '192px', height: '96px' })
    assert.ok(cooperativeHtml.includes('w-[192px]'))
    assert.ok(cooperativeHtml.includes('aria-label="192px"'))
    assert.ok(cooperativeHtml.includes('192px'))
    const cooperativeHost = inlineValues(cooperativeHtml, 'cooperative-host')
    assert.equal(cooperativeHost['--lumal-viewport-unit'], `${100 / design.designWidth}vw`)
    assert.equal(cooperativeHost['--lumal-viewport-x-unit'], `${100 / design.designWidth}vw`)
    assert.equal(cooperativeHost['--lumal-viewport-y-unit'], `${100 / design.designWidth}vw`)
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-nested-responsive')['--lumal-viewport-unit'], '1px')
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-nested-disabled')['--lumal-viewport-unit'], '1px')
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-nested-content').width, runtimeLength(192))
    assert.equal(inlineValues(cooperativeHtml, 'cooperative-disabled-content').height, runtimeLength(96))
    assert.doesNotMatch(cooperativeHtml, /transform:/, 'vw must keep a fluid layout without a canvas transform')
    const nonViewportModes = {}
    for (const mode of ['responsive', 'disabled', 'contain', 'width']) {
      const html = await renderToString(createSSRApp(cooperativeComponent.default, { mode }))
      const host = inlineValues(html, 'cooperative-host')
      assert.equal(host['--lumal-viewport-unit'], '1px', `${mode} must restore design px before any canvas scale`)
      if (mode === 'responsive' || mode === 'disabled')
        assert.doesNotMatch(html, /transform:/)
      nonViewportModes[mode] = { unit: host['--lumal-viewport-unit'] }
    }
    // 容器宽 1000 时仍以浏览器宽 1280 为 vw 基准；此处核对契约，不冒充浏览器布局测量。
    const browserWidth = 1280
    const containerWidth = 1000
    const viewportPhysicalWidth = 192 * browserWidth / design.designWidth
    assert.equal(viewportPhysicalWidth, 128)
    assert.notEqual(viewportPhysicalWidth, 192 * containerWidth / design.designWidth)

    const built = await build({ root, logLevel: 'silent', build: { write: false } })
    const output = (Array.isArray(built) ? built[0] : built).output
    const css = output.filter(item => item.fileName.endsWith('.css')).map(item => String(item.source)).join('\n')
    const production = verifyCss(css)
    assert.deepEqual(production, development)
    const cooperativeProduction = verifyCooperativeCss(css)
    assert.deepEqual(cooperativeProduction, cooperativeDevelopment)
    const scripts = output.filter(item => item.type === 'chunk').map(item => item.code).join('\n')
    assert.ok(scripts.includes('w-[192px]'))
    assert.ok(scripts.includes('mt-[20px]'))
    assert.match(scripts, /["']aria-label["']:\s*["']192px["']/)
    assert.match(scripts, /left:\s*192/)
    assert.match(scripts, /fontSize:\s*14/)
    assert.ok(scripts.includes('10vw') && scripts.includes('5vw') && scripts.includes('1.25vw'))
    assert.ok(scripts.includes(runtimeLength(192)) && scripts.includes(runtimeLength(96)))
    const maps = output.filter(item => item.fileName.endsWith('.js.map')).map(item => JSON.parse(String(item.source)))
    assert.ok(maps.some(map => map.sources.some(source => source.endsWith('ScreenPanel.vue'))))
    assert.ok(maps.some(map => map.sourcesContent.some(source => source?.includes('width: \'192px\''))))
    await writeFile(resolve(root, 'consumer-report.json'), `${JSON.stringify({
      status: 'passed',
      checks: ['esm', 'cjs', 'vue-types', 'css', 'scss', 'template-static', 'template-object-array', 'dynamic-preserved', 'atomic-css', 'selector-ignore', 'declaration-ignore', 'scope-dependencies', 'source-map', 'idempotence', 'dev-build', 'runtime-cooperation', 'runtime-output', 'vw-fluid-layout', 'nested-mode-isolation', 'browser-not-container-width'],
      development,
      production,
      inline: {
        static: inlineValues(html, 'static-inline'),
        object: inlineValues(html, 'object-inline'),
        array,
        dynamicSelector: inlineValues(html, 'dynamic-selector-inline'),
      },
      runtime: { design, scale, physicalWidth: 128, validation: '公开算法与真实 Vue SSR，不是浏览器测量结果' },
      cooperative: {
        development: cooperativeDevelopment,
        production: cooperativeProduction,
        inline: inlineValues(cooperativeHtml, 'cooperative-static'),
        unit: cooperativeHost['--lumal-viewport-unit'],
        nonViewportModes,
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
