import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { JSDOM } from 'jsdom'
import ts from 'typescript'
import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// AST 只统计静态模块边，不把 import() 的可选引擎计入首屏。
export function staticImports(source) {
  const file = ts.createSourceFile('bundle.js', source, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS)
  return file.statements.flatMap((statement) => {
    if ((ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement))
      && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      return [statement.moduleSpecifier.text]
    }
    return []
  })
}

async function consumer(source) {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: [
        { find: '@lumal/core/minimal', replacement: resolve(root, 'packages/core/dist/minimal.js') },
        { find: '@lumal/core/request', replacement: resolve(root, 'packages/core/dist/request.js') },
        { find: '@lumal/datav/charts', replacement: resolve(root, 'packages/datav/dist/charts.js') },
      ],
    },
    plugins: [{
      name: 'budget-consumer',
      resolveId: id => id === 'virtual:budget-entry' ? '\0budget-entry' : undefined,
      load: id => id === '\0budget-entry' ? source : undefined,
    }],
    build: {
      write: false,
      target: 'es2022',
      rollupOptions: { input: 'virtual:budget-entry' },
    },
  })
  const output = (Array.isArray(result) ? result[0] : result).output
  const chunks = new Map(output.filter(item => item.type === 'chunk').map(item => [item.fileName, item]))
  const visited = new Set()
  const modules = new Set()
  let gzip = 0
  function visit(name) {
    if (visited.has(name))
      return
    const chunk = chunks.get(name)
    if (!chunk)
      throw new Error(`消费者静态模块不存在：${name}`)
    visited.add(name)
    gzip += gzipSync(chunk.code).length
    Object.keys(chunk.modules).forEach(id => modules.add(id))
    chunk.imports.forEach(visit)
  }
  for (const chunk of chunks.values()) {
    if (chunk.isEntry)
      visit(chunk.fileName)
  }
  return { gzip, modules: [...modules] }
}

export function measureApplication(dist) {
  const htmlPath = resolve(dist, 'index.html')
  const document = new JSDOM(readFileSync(htmlPath, 'utf8')).window.document
  const scripts = [...document.querySelectorAll('script[type="module"][src], link[rel="modulepreload"][href]')]
    .map(node => node.getAttribute('src') ?? node.getAttribute('href'))
  const styles = [...document.querySelectorAll('link[rel="stylesheet"][href]')].map(node => node.getAttribute('href'))
  document.defaultView.close()
  const visited = new Set()
  let jsGzip = 0
  let cssGzip = 0

  function assetPath(specifier, importer = htmlPath) {
    // 站点绝对路径以 dist 为根，不能用 Windows file URL 的盘符根解析。
    const path = specifier.startsWith('/')
      ? resolve(dist, `.${decodeURIComponent(new URL(specifier, 'https://lumal.local').pathname)}`)
      : fileURLToPath(new URL(specifier, pathToFileURL(importer)))
    const within = relative(dist, path)
    if (within.startsWith('..') || isAbsolute(within))
      throw new Error(`资源超出 dist：${specifier}`)
    return path
  }
  function visit(path) {
    if (visited.has(path))
      return
    visited.add(path)
    const source = readFileSync(path, 'utf8')
    jsGzip += gzipSync(source).length
    for (const specifier of staticImports(source)) {
      if (specifier.startsWith('.') || specifier.startsWith('/'))
        visit(assetPath(specifier, path))
    }
  }
  scripts.forEach(specifier => visit(assetPath(specifier)))
  for (const path of new Set(styles.map(specifier => assetPath(specifier))))
    cssGzip += gzipSync(readFileSync(path)).length
  return { jsGzip, cssGzip }
}

export async function checkConsumerBudgets() {
  const baseline = await consumer('import {createApp} from "vue";createApp({render:()=>null}).mount("#app")')
  const minimal = await consumer('import {createLumalAdmin} from "@lumal/core/minimal";createLumalAdmin({rootComponent:{render:()=>null}}).mount("#app")')
  const request = await consumer('import {createRequestClient} from "@lumal/core/request";globalThis.client=createRequestClient()')
  const datav = await consumer('import {createApp,h} from "vue";import Charts from "@lumal/datav/charts";createApp({render:()=>h(Charts,{config:{series:[]}})}).mount("#app")')
  const failures = []
  if (minimal.gzip - baseline.gzip > 10000)
    failures.push(`minimal 增量超过 10 KB gzip：${minimal.gzip - baseline.gzip}`)
  if (request.gzip > 5000)
    failures.push(`request 超过 5 KB gzip：${request.gzip}`)
  for (const [name, result] of [['minimal', minimal], ['request', request]]) {
    if (result.modules.some(id => /(?:element-plus|sortablejs|echarts)[@/\\]/.test(id)))
      failures.push(`${name} 静态引入了 UI 或图表引擎`)
  }
  if (datav.gzip > 55000 || datav.modules.some(id => /(?:echarts|jiaminghi)[@/\\]/.test(id)))
    failures.push('DataV charts 的首屏超出 55 KB gzip 或静态包含引擎')
  console.log(`消费者 gzip：Vue ${baseline.gzip} B；minimal ${minimal.gzip} B（增量 ${minimal.gzip - baseline.gzip} B）；request ${request.gzip} B；DataV charts 初始 ${datav.gzip} B。`)

  const applications = [
    ['lumal-admin', 335000, 50000],
    ['lumal-cockpit', 800000, 80000],
    ['lumal-datav-guide', 850000, 55000],
    ['vben-compat-demo', 300000, 45000],
  ]
  for (const [name, jsBudget, cssBudget] of applications) {
    const dist = resolve(root, 'apps', name, 'dist')
    if (!existsSync(resolve(dist, 'index.html'))) {
      if (name === 'lumal-admin' || process.argv.includes('--require-all'))
        failures.push(`缺少 ${name} 生产构建`)
      continue
    }
    const size = measureApplication(dist)
    console.log(`${name} 首屏 gzip：JS ${size.jsGzip} B / ${jsBudget} B；CSS ${size.cssGzip} B / ${cssBudget} B。`)
    if (size.jsGzip > jsBudget || size.cssGzip > cssBudget)
      failures.push(`${name} 首屏静态闭包超过预算`)
  }
  if (failures.length)
    throw new Error(failures.join('\n'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  checkConsumerBudgets().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
