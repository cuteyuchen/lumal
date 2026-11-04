import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const manifestKeys = ['buildId', 'builtAt', 'commit', 'version']

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

export function readVersionManifest(filePath) {
  assert(existsSync(filePath), `缺少版本清单：${filePath}`)
  let manifest
  try {
    manifest = JSON.parse(readFileSync(filePath, 'utf8'))
  }
  catch {
    throw new Error(`版本清单不是合法 JSON：${filePath}`)
  }
  assert(manifest && typeof manifest === 'object' && !Array.isArray(manifest), `版本清单必须是对象：${filePath}`)
  assert(
    JSON.stringify(Object.keys(manifest).sort()) === JSON.stringify(manifestKeys),
    `版本清单字段必须严格为 ${manifestKeys.join('/')}：${filePath}`,
  )
  for (const key of manifestKeys)
    assert(typeof manifest[key] === 'string' && manifest[key].trim(), `版本清单缺少 ${key}：${filePath}`)
  assert(manifest.buildId === `${manifest.commit}-${manifest.builtAt}`, `buildId 与构建身份不一致：${filePath}`)
  return manifest
}

export function collectJavaScriptFiles(directory) {
  assert(existsSync(directory), `缺少脚本目录：${directory}`)
  return readdirSync(directory, { recursive: true })
    .filter(name => name.endsWith('.js'))
    .map(name => join(directory, name))
    .filter(filePath => statSync(filePath).isFile())
}

function readJavaScript(directory) {
  return collectJavaScriptFiles(directory)
    .map(filePath => readFileSync(filePath, 'utf8'))
    .join('\n')
}

/**
 * 核对两份真实构建产物：各自的 version.json 必须与注入到自身 JS 的 buildId 相同，
 * 且根路径与 /px/ 不能互相串用构建身份。
 */
export function verifyVersionManifests(dist) {
  const rootDist = resolve(dist)
  const pxDist = join(rootDist, 'px')
  const rootManifest = readVersionManifest(join(rootDist, 'version.json'))
  const pxManifest = readVersionManifest(join(pxDist, 'version.json'))

  assert(rootManifest.buildId !== pxManifest.buildId, '根路径与 /px/ 构建的 buildId 不能相同')

  const rootJavaScript = readJavaScript(join(rootDist, 'assets'))
  const pxJavaScript = readJavaScript(join(pxDist, 'assets'))
  assert(rootJavaScript.includes(rootManifest.buildId), `根路径 JS 缺少注入的 buildId：${rootManifest.buildId}`)
  assert(pxJavaScript.includes(pxManifest.buildId), `/px/ JS 缺少注入的 buildId：${pxManifest.buildId}`)
  assert(!rootJavaScript.includes(pxManifest.buildId), '/px/ 构建身份混入了根路径 JS')
  assert(!pxJavaScript.includes(rootManifest.buildId), '根路径构建身份混入了 /px/ JS')

  const rootHtml = readFileSync(join(rootDist, 'index.html'), 'utf8')
  const pxHtml = readFileSync(join(pxDist, 'index.html'), 'utf8')
  assert(/src="\/assets\//.test(rootHtml), '根路径 index.html 未使用根 base')
  assert(/src="\/px\/assets\//.test(pxHtml), '/px/ index.html 未使用 /px/ base')

  return {
    buildIds: { px: pxManifest.buildId, root: rootManifest.buildId },
    files: { px: join(pxDist, 'version.json'), root: join(rootDist, 'version.json') },
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dist = process.argv[2] ?? 'apps/lumal-admin/dist'
  if (process.argv.length > 3)
    throw new Error('用法：node scripts/check-version-manifests.mjs [dist]')

  const result = verifyVersionManifests(dist)
  console.log(`版本清单一致：根路径 ${result.buildIds.root}，/px/ ${result.buildIds.px}`)
}
