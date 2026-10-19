import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { verifyReleaseEnv } from './check-release-env.mjs'
import { verifyUnpublishedRelease, verifyWorkspaceRelease } from './check-release-version.mjs'
import { readWorkflows, verifyReleaseWorkflows } from './check-release-workflows.mjs'
import { prepareVercelOutput } from './prepare-vercel-output.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts

describe('release dependency graph', () => {
  it('现有发布/部署只有受完整门禁约束的调用入口', () => {
    expect(() => verifyReleaseWorkflows(readWorkflows(), scripts)).not.toThrow()
  })

  it.each(['release-npm.yml', 'deploy.yml'])('拒绝恢复 %s 的独立手动入口', (name) => {
    const workflows = readWorkflows()
    workflows[name].on.workflow_dispatch = {}
    expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('不能独立触发')
  })

  it.each(['release-check', 'windows-check', 'site-build'])('拒绝移除 %s 发布依赖', (gate) => {
    const workflows = readWorkflows()
    workflows['release-gate.yml'].jobs.publish.needs = workflows['release-gate.yml'].jobs.publish.needs.filter(name => name !== gate)
    expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('缺少门禁依赖')
  })

  it.each(['always()', 'success() || true', 'cancelled()'])('拒绝 %s 覆盖失败/取消/跳过的默认阻断', (condition) => {
    const workflows = readWorkflows()
    workflows['release-gate.yml'].jobs.publish.if = `${condition} && !inputs.dry_run`
    expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow()
  })

  it('拒绝跳过完整门禁步骤或把生产 E2E 改为 smoke', () => {
    const workflows = readWorkflows()
    workflows['release-gate.yml'].jobs['release-check'].steps.find(step => step.run === 'pnpm release:check').if = 'false'
    expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('不得跳过')
    expect(() => verifyReleaseWorkflows(readWorkflows(), {
      ...scripts,
      'test:e2e:release:built': 'playwright test --grep smoke',
    })).toThrow('不能只跑 smoke')
  })
})

describe('release version and registry preflight', () => {
  it('当前九包、内部依赖和锁文件一致', () => {
    const release = verifyWorkspaceRelease()
    expect(release.packages).toHaveLength(9)
    expect(release.version).toBe(JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version)
    expect(() => verifyWorkspaceRelease(root, '99.0.0-no-release')).toThrow('不一致')
  })

  it('拒绝内部依赖与 lockfile 不一致', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'lumal-release-'))
    try {
      for (const dir of ['packages', 'apps']) {
        const source = verifyWorkspaceRelease().packages
        mkdirSync(join(fixture, dir), { recursive: true })
        if (dir === 'packages') {
          for (const pkg of source) {
            mkdirSync(join(fixture, pkg.dir), { recursive: true })
            cpSync(join(root, pkg.dir, 'package.json'), join(fixture, pkg.dir, 'package.json'))
          }
        }
      }
      const lock = parse(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8'))
      lock.importers['packages/core'].dependencies['@lumal/icons'].specifier = '0.0.0'
      writeFileSync(join(fixture, 'pnpm-lock.yaml'), stringify(lock))
      expect(() => verifyWorkspaceRelease(fixture)).toThrow('锁文件内部依赖')
      const manifest = JSON.parse(readFileSync(join(fixture, 'packages/core/package.json'), 'utf8'))
      manifest.dependencies['@lumal/icons'] = '0.0.0'
      writeFileSync(join(fixture, 'packages/core/package.json'), JSON.stringify(manifest))
      expect(() => verifyWorkspaceRelease(fixture)).toThrow('内部依赖')
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })

  it.each([1, 9])('已有 %s 个包发布时，在任何发布动作前拒绝全量重发', async (count) => {
    const release = verifyWorkspaceRelease()
    const fetcher = vi.fn()
    release.packages.forEach((_pkg, index) => fetcher.mockResolvedValueOnce({ status: index < count ? 200 : 404 }))
    await expect(verifyUnpublishedRelease(release, fetcher)).rejects.toThrow('禁止全量重发')
    expect(fetcher).toHaveBeenCalledTimes(9)
  })

  it('仅全部 404 可以发布；registry 异常或网络失败均中断', async () => {
    const release = verifyWorkspaceRelease()
    await expect(verifyUnpublishedRelease(release, async () => ({ status: 404 }))).resolves.toBe(release)
    await expect(verifyUnpublishedRelease(release, async () => ({ status: 403 }))).rejects.toThrow('停止发布')
    await expect(verifyUnpublishedRelease(release, async () => {
      throw new Error('offline')
    })).rejects.toThrow('offline')
  })
})

describe('deployment preparation', () => {
  it.each(['npm', 'vercel', 'cloudflare'])('缺少 %s 配置时只列名称，不泄露值', (target) => {
    expect(() => verifyReleaseEnv(target, { VERCEL_TOKEN: 'sensitive-value' })).toThrow('缺少')
    try {
      verifyReleaseEnv(target, { VERCEL_TOKEN: 'sensitive-value' })
    }
    catch (error) {
      expect(error.message).not.toContain('sensitive-value')
    }
  })

  it('已验证静态目录转成合法 prebuilt，缺产物和旧输出均拒绝', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'lumal-release-'))
    try {
      const source = join(fixture, 'dist')
      const project = join(fixture, 'project')
      expect(() => prepareVercelOutput(source, project)).toThrow('缺少 index.html')
      mkdirSync(join(source, 'assets'), { recursive: true })
      writeFileSync(join(source, 'index.html'), '<script src="/assets/main.js"></script>')
      writeFileSync(join(source, 'assets/main.js'), 'console.log("built")')
      const output = prepareVercelOutput(source, project)
      expect(JSON.parse(readFileSync(join(output, 'config.json'), 'utf8'))).toEqual({ version: 3 })
      expect(readFileSync(join(output, 'static/assets/main.js'), 'utf8')).toBe('console.log("built")')
      expect(() => prepareVercelOutput(source, project)).toThrow('拒绝混入旧文件')
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
