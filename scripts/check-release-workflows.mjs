import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parse } from 'yaml'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gates = ['version-check', 'release-check', 'windows-check', 'site-build']
const sideEffectsCondition = 'github.event_name == \'push\' || !inputs.dry_run'
const deploymentCondition = `(${sideEffectsCondition}) && vars.DEPLOY_PRODUCTION == 'true'`

export function readWorkflows(baseDir = rootDir) {
  const dir = join(baseDir, '.github/workflows')
  return Object.fromEntries(readdirSync(dir).filter(name => /\.ya?ml$/.test(name))
    .map(name => [name, parse(readFileSync(join(dir, name), 'utf8'))]))
}

/** 保护当前发布图的安全约束；Actions 表达式语义另由 actionlint/服务端验证。 */
export function verifyReleaseWorkflows(workflows, scripts) {
  const release = workflows['release-gate.yml']
  assert.deepEqual(release.on.push.tags, ['v*'], '统一发布入口必须保留 v* tag')
  assert.equal(release.on.workflow_dispatch.inputs.dry_run.type, 'boolean')
  assert.equal(release.on.workflow_dispatch.inputs.dry_run.default, true, '手动运行默认必须无副作用')
  for (const name of ['release-npm.yml', 'deploy.yml'])
    assert.deepEqual(Object.keys(workflows[name].on), ['workflow_call'], `${name} 不能独立触发`)
  for (const [name, path] of [['publish', 'release-npm.yml'], ['deploy', 'deploy.yml']]) {
    const job = release.jobs[name]
    assert.equal(job.uses, `./.github/workflows/${path}`)
    for (const gate of gates)
      assert.ok(job.needs.includes(gate), `${name} 缺少门禁依赖 ${gate}`)
    assert.equal(
      job.if,
      name === 'deploy' ? deploymentCondition : sideEffectsCondition,
      `${name} 必须受 dry-run 保护${name === 'deploy' ? '和显式部署授权' : ''}`,
    )
    assert.ok(!/always\s*\(|failure\s*\(|cancelled\s*\(|success\s*\(/.test(job.if), '禁止覆盖默认成功条件')
    assert.notEqual(job.secrets, 'inherit', '仅传递需要的 Secret')
  }
  assert.ok(release.jobs.deploy.needs.includes('publish'), 'npm 发布失败也必须阻断部署')
  for (const gate of gates) {
    const job = release.jobs[gate]
    assert.ok(job && !job.if && !job['continue-on-error'], `${gate} 不得跳过或容错`)
    assert.ok(!JSON.stringify(job).includes('secrets.'), `${gate} 不得接触发布 Secrets`)
    assert.ok(job.steps.every(step => !step['continue-on-error']), `${gate} 步骤不得容错`)
    // 诊断附件可在失败时或始终上传，实际校验步骤仍不得条件跳过。
    assert.ok(job.steps.every(step => !step.if
      || (['failure()', 'always()'].includes(step.if) && step.uses === 'actions/upload-artifact@v4')
      || (gate === 'version-check' && step.run === 'pnpm release:verify --require-tag'
        && step.if === sideEffectsCondition)), `${gate} 校验步骤不得跳过`)
  }
  assert.ok(release.jobs['site-build'].needs.includes('release-check'), '站点必须使用生产 E2E 验证后的 Admin 产物')
  assert.ok(release.jobs['release-check'].steps.some(step => step.run === 'pnpm release:check'))
  assert.ok(release.jobs['site-build'].steps.some(step => step.run === 'pnpm release:budgets --require-all'))
  const demo = workflows['build-validation.yml'].jobs['demo-production']
  assert.deepEqual(demo.strategy.matrix.os, ['ubuntu-latest', 'windows-latest'], 'Demo 必须覆盖 Ubuntu / Windows')
  assert.ok(!demo.if && !demo['continue-on-error'], 'Demo 生产门禁不可跳过')
  for (const command of ['pnpm cockpit:build', 'pnpm --filter lumal-cockpit build', 'pnpm test:e2e:cockpit:built', 'pnpm --filter lumal-admin build', 'pnpm test:e2e:release:built', 'pnpm docs:build', 'pnpm release:budgets'])
    assert.ok(demo.steps.some(step => step.run === command && !step.if && !step['continue-on-error']), `Demo 缺少 ${command}`)
  assert.ok(release.jobs['site-build'].steps.some(step => step.run === 'pnpm test:e2e:cockpit:built'), '发布站点必须实跑 Cockpit 生产浏览器')
  for (const command of ['lint', 'format:check', 'release:workflows', 'release:boundaries', 'test', 'typecheck', 'build', 'test:create-consumer', 'test:create-projects', 'test:viewport', 'admin:build', 'compat:build', 'release:artifacts', 'test:e2e:release:built', 'pack:dry-run'])
    assert.ok(scripts['release:check'].split(' && ').includes(`pnpm ${command}`), `${command} 必须在 release:check 中`)
  for (const [file, jobName, commands] of [
    ['ci.yml', 'check', ['lint', 'format:check', 'test', 'typecheck', 'build']],
    ['release-gate.yml', 'windows-check', ['lint', 'format:check', 'test', 'typecheck', 'build']],
    ['build-validation.yml', 'validate', ['test:create-consumer', 'test:create-projects', 'test:viewport']],
  ]) {
    for (const command of commands) {
      assert.ok(workflows[file].jobs[jobName].steps.some(step =>
        step.run === `pnpm ${command}` && !step.if && !step['continue-on-error']), `${file} 必须执行 ${command}`)
    }
  }
  for (const [file, jobName] of [
    ['build-validation.yml', 'datav-visual'],
    ['release-gate.yml', 'windows-check'],
  ]) {
    const job = workflows[file].jobs[jobName]
    assert.ok(job && job['runs-on'] === 'windows-latest' && !job.if && !job['continue-on-error'], `${file} 必须执行 Windows DataV 视觉门禁`)
    const steps = job.steps
    const install = steps.findIndex(step => step.run === 'pnpm exec playwright install chromium'
      && !step.if && !step['continue-on-error'])
    const visual = steps.findIndex(step => step.run === 'pnpm test:datav:visual --repeat-each=3'
      && !step.if && !step['continue-on-error'])
    assert.ok(install >= 0 && visual > install, `${file} DataV 视觉门禁必须在 Chromium 安装后连续运行且不得容错`)
    assert.ok(steps.some(step => step.run === 'pnpm exec vue-tsc --noEmit -p packages/datav/tests/visual/tsconfig.json'
      && !step.if && !step['continue-on-error']), `${file} 必须检查 DataV 视觉夹具类型`)
  }
  for (const [file, jobName] of [['ci.yml', 'check'], ['release-gate.yml', 'windows-check']]) {
    assert.ok(workflows[file].jobs[jobName].steps.some(step => step.uses === 'actions/upload-artifact@v4'
      && step.if === 'always()' && !step['continue-on-error']
      && step.with?.path === 'output/release/cli-terminal/'
      && step.with?.['if-no-files-found'] === 'error'), `${file} 必须保留 CLI 终端实跑证据`)
  }
  assert.ok(scripts['release:check'].includes('pnpm --filter lumal-mock-api build:test'), '生产 E2E 必须构建独立 Mock Node 产物')
  assert.equal(scripts['test:e2e:release:built'], 'playwright test --config playwright.release.config.ts', '生产 E2E 必须使用专用配置且不能只跑 smoke')
  for (const [file, workflow] of Object.entries(workflows)) {
    for (const job of Object.values(workflow.jobs)) {
      if (job.uses?.match(/\/(?:release-npm|deploy)\.yml$/))
        assert.equal(file, 'release-gate.yml', '禁止新增绕过门禁的复用调用')
      const steps = job.steps ?? []
      const chromiumIndex = steps.findIndex(step => step.run === 'pnpm exec playwright install --with-deps chromium'
        && !step.if && !step['continue-on-error'])
      for (const [index, step] of steps.entries()) {
        if (['pnpm test:create-consumer', 'pnpm test:create-projects', 'pnpm test:viewport', 'pnpm release:check'].includes(step.run))
          assert.ok(chromiumIndex >= 0 && chromiumIndex < index, `${file} 必须在消费者生产浏览器校验前安装 Chromium`)
        if (/\b(?:pnpm|npm)\b[^\n]+\bpublish\b/.test(step.run ?? ''))
          assert.equal(file, 'release-npm.yml', '发现独立 npm 发布路径')
        if (/\b(?:vercel[^\n]+\bdeploy|wrangler[^\n]+\bpages deploy)\b/.test(step.run ?? ''))
          assert.equal(file, 'deploy.yml', '发现独立生产部署路径')
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyReleaseWorkflows(readWorkflows(), JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8')).scripts)
  console.log('发布工作流静态约束通过：唯一入口、全部 needs、dry-run、Secrets 隔离和完整生产 E2E')
}
