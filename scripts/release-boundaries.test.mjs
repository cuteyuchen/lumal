import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = []
const legacyName = ['G', 'SchemaForm'].join('')

afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true })
})

function createFixture() {
  const fixture = mkdtempSync(join(tmpdir(), 'lumal-boundaries-'))
  fixtures.push(fixture)
  const copy = (path) => {
    const target = join(fixture, path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(root, path), target)
  }

  // 复制发布契约所需的真实元数据，不把本机 dist 或诊断快照带入隔离用例。
  for (const entry of readdirSync(join(root, 'packages'), { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    for (const file of ['package.json', 'README.md', 'CHANGELOG.md'])
      copy(`packages/${entry.name}/${file}`)
    mkdirSync(join(fixture, 'packages', entry.name, 'src'), { recursive: true })
  }
  for (const path of ['LICENSE', 'docs/changelog.md', 'apps/lumal-docs/src/.vitepress/config/nav.ts'])
    copy(path)
  mkdirSync(join(fixture, 'apps/lumal-docs/src/reference'), { recursive: true })
  return fixture
}

function writeFixture(fixture, path) {
  const target = join(fixture, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, legacyName)
}

function check(fixture) {
  return spawnSync(process.execPath, [join(root, 'scripts/check-release-boundaries.mjs')], {
    cwd: fixture,
    encoding: 'utf8',
  })
}

describe('release source boundaries', () => {
  it('根目录诊断产物不参与公开源码命名检查', () => {
    const fixture = createFixture()
    writeFixture(fixture, 'output/repair/deploy/static/index.html')
    const result = check(fixture)
    expect(result.error).toBeUndefined()
    expect(result.stderr).toBe('')
    expect(result.status).toBe(0)
  })

  it.each(['packages/core/src/legacy.ts', 'packages/core/src/output/legacy.ts', 'docs/legacy.md'])('仍拒绝公开文件中的旧名称：%s', (path) => {
    const fixture = createFixture()
    writeFixture(fixture, path)
    const result = check(fixture)
    expect(result.error).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(path)
  })

  it.each(['docs/real-consumer-compatibility.md', 'docs/upgrade-guide.md'])('迁移证据可准确提及旧API：%s', (path) => {
    const fixture = createFixture()
    writeFixture(fixture, path)
    expect(check(fixture).status).toBe(0)
  })

  it.each(['charts', 'viewport'])('新消费包也不能绕过公开入口：%s', (name) => {
    const fixture = createFixture()
    const path = 'apps/consumer/src/main.ts'
    mkdirSync(dirname(join(fixture, path)), { recursive: true })
    writeFileSync(join(fixture, path), `import 'packages/${name}/src/index'`)
    const result = check(fixture)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('不能直连包源码')
  })
})
