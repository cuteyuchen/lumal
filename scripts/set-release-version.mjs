/**
 * 统一设置发布版本号。
 *
 * 仓库的 9 个可发布包在 .changeset/config.json 里属于同一个 fixed 组，
 * 始终同版本发布；apps/* 通过 workspace 引用这些包，也需要同步版本，
 * 否则 pnpm install --frozen-lockfile 会因 specifier 不一致而失败。
 *
 * 用法：node scripts/set-release-version.mjs 0.0.2-beta
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const version = process.argv[2]?.trim()

if (!version || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
  throw new Error(`版本号不合法：${version || '空值'}`)

// 先收集所有 workspace 包名，只改写指向这些包的依赖
const workspaceDirs = ['packages', 'apps']
const manifests = []

for (const root of workspaceDirs) {
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory())
      continue
    const path = join(root, dir.name, 'package.json')
    try {
      manifests.push({ path, json: JSON.parse(readFileSync(path, 'utf8')) })
    }
    catch (error) {
      if (error.code !== 'ENOENT')
        throw error
    }
  }
}

const internalNames = new Set(manifests.map(item => item.json.name).filter(Boolean))
const depFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const changed = []

for (const { path, json } of manifests) {
  const before = JSON.stringify(json)

  // 仅可发布包提升自身 version；private 包（apps）保持原样
  if (!json.private && json.version)
    json.version = version

  for (const field of depFields) {
    const deps = json[field]
    if (!deps)
      continue
    for (const [name, range] of Object.entries(deps)) {
      // 跳过 workspace: / catalog: 等协议写法，只改固定版本号
      if (!internalNames.has(name) || typeof range !== 'string')
        continue
      if (range.startsWith('workspace:') || range.startsWith('catalog:') || range.startsWith('link:') || range.startsWith('file:'))
        continue
      // 保留原有前缀（^ / ~ / 无）
      const prefix = /^[\^~]/.test(range) ? range[0] : ''
      deps[name] = `${prefix}${version}`
    }
  }

  const after = JSON.stringify(json)
  if (before !== after) {
    writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`)
    changed.push(path)
  }
}

console.log(`已将版本设置为 ${version}，更新 ${changed.length} 个 package.json：`)
for (const path of changed)
  console.log(`  ${path}`)
