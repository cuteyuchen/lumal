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

  it('消费者生产浏览器校验之前必须准备 Chromium', () => {
    const current = readWorkflows()
    expect(current['build-validation.yml'].jobs.validate.steps.some(step =>
      step.run === 'pnpm exec playwright install --with-deps chromium')).toBe(true)
    for (const [file, job] of [['build-validation.yml', 'validate'], ['release-gate.yml', 'release-check']]) {
      const workflows = readWorkflows()
      workflows[file].jobs[job].steps = workflows[file].jobs[job].steps
        .filter(step => step.run !== 'pnpm exec playwright install --with-deps chromium')
      expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('Chromium')
      workflows[file].jobs[job].steps.push({ run: 'pnpm exec playwright install --with-deps chromium' })
      expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('Chromium')
    }
  })

  it('npm 发布不自动授权生产部署，部署需显式启用', () => {
    const workflows = readWorkflows()
    const { publish, deploy } = workflows['release-gate.yml'].jobs
    expect(publish.if).toBe('github.event_name == \'push\' || !inputs.dry_run')
    expect(deploy.if).toBe('(github.event_name == \'push\' || !inputs.dry_run) && vars.DEPLOY_PRODUCTION == \'true\'')
    deploy.if = publish.if
    expect(() => verifyReleaseWorkflows(workflows, scripts)).toThrow('显式部署授权')
  })

  it('文档与四个示例共用受门禁约束的 Vercel 部署矩阵', () => {
    const workflows = readWorkflows()
    const deploy = workflows['deploy.yml']
    const caller = workflows['release-gate.yml'].jobs.deploy
    const matrix = deploy.jobs.vercel.strategy.matrix.include
    expect(Object.keys(deploy.jobs)).toEqual(['configuration', 'vercel'])
    expect(deploy.jobs.vercel.needs).toBe('configuration')
    expect(matrix).toHaveLength(5)
    expect(matrix).toContainEqual({
      name: 'docs',
      output: 'apps/lumal-docs/dist',
      projectIdSecret: 'VERCEL_PROJECT_ID_DOCS',
      prepareArgs: '--clean-urls',
    })
    const prepare = deploy.jobs.vercel.steps.find(step => step.run?.includes('node scripts/prepare-vercel-output.mjs'))
    expect(prepare.run).toContain(`\${{ matrix.prepareArgs }}`)
    const preflight = deploy.jobs.configuration.steps.find(step => step.run === 'node scripts/check-release-env.mjs production')
    for (const site of matrix) {
      expect(deploy.on.workflow_call.secrets).toHaveProperty(site.projectIdSecret)
      expect(caller.secrets[site.projectIdSecret]).toBe(`\${{ secrets.${site.projectIdSecret} }}`)
      expect(preflight.env[site.projectIdSecret]).toBe(`\${{ secrets.${site.projectIdSecret} }}`)
    }
    expect(Object.keys(caller.secrets).sort()).toEqual(Object.keys(deploy.on.workflow_call.secrets).sort())
    expect(JSON.stringify(deploy)).not.toMatch(/cloudflare|wrangler|CF_PAGES_PROJECT/i)
    expect(JSON.stringify(caller)).not.toMatch(/cloudflare|CF_PAGES_PROJECT/i)
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
  it.each(['npm', 'vercel', 'production'])('缺少 %s 配置时只列名称，不泄露值', (target) => {
    expect(() => verifyReleaseEnv(target, { VERCEL_TOKEN: 'sensitive-value' })).toThrow('缺少')
    try {
      verifyReleaseEnv(target, { VERCEL_TOKEN: 'sensitive-value' })
    }
    catch (error) {
      expect(error.message).not.toContain('sensitive-value')
    }
  })

  it('生产预检只需 Vercel 五站点配置，缺少文档项目 ID 仍阻断部署', () => {
    const env = {
      VERCEL_TOKEN: 'test-token',
      VERCEL_ORG_ID: 'test-team',
      VERCEL_PROJECT_ID_ADMIN: 'test-admin',
      VERCEL_PROJECT_ID_COCKPIT: 'test-cockpit',
      VERCEL_PROJECT_ID_DATAV_GUIDE: 'test-datav-guide',
      VERCEL_PROJECT_ID_VBEN_COMPAT: 'test-vben-compat',
      VERCEL_PROJECT_ID_DOCS: 'test-docs',
    }
    expect(() => verifyReleaseEnv('production', env)).not.toThrow()
    expect(() => verifyReleaseEnv('production', { ...env, VERCEL_PROJECT_ID_DOCS: ' ' })).toThrow('VERCEL_PROJECT_ID_DOCS')
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

  it('文档 prebuilt 保留无扩展名深层路由、目录首页和真实 404', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'lumal-release-'))
    try {
      const source = join(fixture, 'dist')
      const project = join(fixture, 'project')
      mkdirSync(join(source, 'guide'), { recursive: true })
      mkdirSync(join(source, 'packages'), { recursive: true })
      writeFileSync(join(source, 'index.html'), '<h1>Lumal</h1>')
      expect(() => prepareVercelOutput(source, project, { cleanUrls: true })).toThrow('缺少 404.html')
      writeFileSync(join(source, '404.html'), '<h1>Not Found</h1>')
      writeFileSync(join(source, 'guide/start.html'), '<h1>Start</h1>')
      writeFileSync(join(source, 'packages/index.html'), '<h1>Packages</h1>')
      const output = prepareVercelOutput(source, project, { cleanUrls: true })
      expect(JSON.parse(readFileSync(join(output, 'config.json'), 'utf8'))).toEqual({
        version: 3,
        overrides: {
          'guide/start.html': { path: 'guide/start' },
        },
        routes: [
          { handle: 'filesystem' },
          { src: '/(.*)', dest: '/404.html', status: 404 },
        ],
      })
      expect(readFileSync(join(output, 'static/packages/index.html'), 'utf8')).toBe('<h1>Packages</h1>')
      expect(readFileSync(join(output, 'static/404.html'), 'utf8')).toBe('<h1>Not Found</h1>')
    }
    finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
})
