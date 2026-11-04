import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { verifyVersionManifests } from './check-version-manifests.mjs'

const fixtures = []

function createFixture({ rootId = 'aaa-2026-11-04T08:00:00.000Z', pxId = 'bbb-2026-11-04T09:00:00.000Z' } = {}) {
  const dist = mkdtempSync(join(tmpdir(), 'lumal-version-'))
  fixtures.push(dist)
  for (const [directory, buildId, base] of [['', rootId, '/assets'], ['px', pxId, '/px/assets']]) {
    const target = join(dist, directory)
    mkdirSync(join(target, 'assets'), { recursive: true })
    const [commit, builtAt] = buildId.split(/-(?=\d{4}-)/)
    writeFileSync(join(target, 'version.json'), JSON.stringify({ buildId, builtAt, commit, version: '0.1.1-beta' }))
    writeFileSync(join(target, 'assets/main.js'), `globalThis.buildId=${JSON.stringify(buildId)}`)
    writeFileSync(join(target, 'index.html'), `<script type="module" src="${base}/main.js"></script>`)
  }
  return dist
}

afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { recursive: true, force: true })
})

describe('check-version-manifests', () => {
  it('确认两份产物各自的 manifest 与 JS 注入一致且不串用', () => {
    const result = verifyVersionManifests(createFixture())

    expect(result.buildIds.root).toBe('aaa-2026-11-04T08:00:00.000Z')
    expect(result.buildIds.px).toBe('bbb-2026-11-04T09:00:00.000Z')
  })

  it('buildId 与提交/时间不一致时拒绝', () => {
    const dist = createFixture()
    writeFileSync(join(dist, 'version.json'), JSON.stringify({
      buildId: 'wrong',
      builtAt: '2026-11-04T08:00:00.000Z',
      commit: 'aaa',
      version: '0.1.1-beta',
    }))

    expect(() => verifyVersionManifests(dist)).toThrow('buildId 与构建身份不一致')
  })

  it('manifest 混入依赖等额外字段时拒绝', () => {
    const dist = createFixture()
    writeFileSync(join(dist, 'version.json'), JSON.stringify({
      buildId: 'aaa-2026-11-04T08:00:00.000Z',
      builtAt: '2026-11-04T08:00:00.000Z',
      commit: 'aaa',
      dependencies: { vue: '3.5.0' },
      version: '0.1.1-beta',
    }))

    expect(() => verifyVersionManifests(dist)).toThrow('版本清单字段必须严格')
  })

  it('根路径 JS 混入 /px/ 身份时拒绝', () => {
    const dist = createFixture()
    writeFileSync(join(dist, 'assets/main.js'), 'globalThis.root="aaa-2026-11-04T08:00:00.000Z";globalThis.px="bbb-2026-11-04T09:00:00.000Z"')

    expect(() => verifyVersionManifests(dist)).toThrow('/px/ 构建身份混入了根路径 JS')
  })

  it('缺少 version.json 时给出明确路径', () => {
    const dist = createFixture()
    rmSync(join(dist, 'px/version.json'))

    expect(() => verifyVersionManifests(dist)).toThrow('缺少版本清单')
  })
})
