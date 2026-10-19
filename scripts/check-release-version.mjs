import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from 'yaml'
import { getPublishPackageNames } from './check-npm-package-names.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

/** 校验九包、所有工作区内部依赖和锁文件，不改写版本或锁文件。 */
export function verifyWorkspaceRelease(baseDir = rootDir, expectedVersion) {
  const manifests = ['packages', 'apps'].flatMap(root =>
    readdirSync(join(baseDir, root), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map((entry) => {
        const dir = `${root}/${entry.name}`
        return { dir, ...JSON.parse(readFileSync(join(baseDir, dir, 'package.json'), 'utf8')) }
      }))
  const names = getPublishPackageNames(baseDir)
  const packages = names.map(name => manifests.find(pkg => pkg.name === name && !pkg.private))
  if (names.length !== 9 || packages.some(pkg => !pkg) || manifests.filter(pkg => !pkg.private).length !== 9)
    throw new Error('发布集合必须恰好包含九个公共包')

  const version = expectedVersion ?? packages[0].version
  if (!/^\d+\.\d+\.\d+(?:-[\da-z.-]+)?$/i.test(version ?? ''))
    throw new Error('无法解析合法发布版本')
  const byName = new Map(packages.map(pkg => [pkg.name, pkg]))
  const lock = parse(readFileSync(join(baseDir, 'pnpm-lock.yaml'), 'utf8'))
  for (const pkg of packages) {
    if (pkg.version !== version)
      throw new Error(`${pkg.name} 版本 ${pkg.version} 与发布版本 ${version} 不一致`)
  }
  for (const pkg of manifests) {
    for (const field of dependencyFields) {
      for (const [name, range] of Object.entries(pkg[field] ?? {})) {
        const target = byName.get(name)
        if (!target)
          continue
        if (![version, `^${version}`, `~${version}`, 'workspace:*', 'workspace:^', 'workspace:~', `workspace:${version}`].includes(range))
          throw new Error(`${pkg.dir} 的内部依赖 ${name}@${range} 与 ${version} 不一致`)
        if (field === 'peerDependencies')
          continue
        const locked = lock.importers?.[pkg.dir]?.[field]?.[name]
        if (locked?.specifier !== range
          || typeof locked.version !== 'string'
          || !locked.version.startsWith('link:')
          || resolve(baseDir, pkg.dir, locked.version.slice(5)) !== resolve(baseDir, target.dir)) {
          throw new Error(`${pkg.dir} 的锁文件内部依赖 ${name} 不一致；请更新 lockfile`)
        }
      }
    }
  }
  return { version, packages }
}

/** 先查完全部版本，任意包已发布或查询失败时均禁止开始发布。 */
export async function verifyUnpublishedRelease(release, fetcher = globalThis.fetch) {
  const published = []
  for (const pkg of release.packages) {
    const response = await fetcher(`https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${encodeURIComponent(release.version)}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (response.status === 200)
      published.push(pkg.name)
    else if (response.status !== 404)
      throw new Error(`无法确认 ${pkg.name}@${release.version} 发布状态：HTTP ${response.status}，停止发布`)
  }
  if (published.length) {
    const state = published.length === release.packages.length ? '全部已发布' : '部分已发布'
    throw new Error(`${release.version} ${state}：${published.join(', ')}。禁止全量重发；按 release-checklist 的中断恢复流程处理`)
  }
  return release
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const isTag = process.env.GITHUB_REF_TYPE === 'tag'
  if (process.argv.includes('--require-tag') && !isTag)
    throw new Error('真实发布仅允许匹配工作区版本的 v* tag；分支只能运行 dry-run')
  const tag = process.env.GITHUB_REF_NAME
  if (isTag && !tag?.startsWith('v'))
    throw new Error('发布 tag 必须以 v 开头')
  const release = verifyWorkspaceRelease(rootDir, isTag ? tag.slice(1) : undefined)
  if (isTag) {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim()
    const tagged = execFileSync('git', ['rev-parse', `refs/tags/${tag}^{commit}`], { cwd: rootDir, encoding: 'utf8' }).trim()
    if (head !== tagged)
      throw new Error('工作区 HEAD 与发布 tag 不一致')
  }
  if (process.argv.includes('--check-registry'))
    await verifyUnpublishedRelease(release)
  console.log(`发布版本校验通过：${release.version}，九包版本、内部依赖与 lockfile 一致${isTag ? '，tag 指向当前 HEAD' : '（未验证 tag）'}`)
}
