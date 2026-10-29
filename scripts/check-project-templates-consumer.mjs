import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'
import { packPackage, readJson, runPnpm, toFileSpecifier } from './check-create-lumal-admin-consumer.mjs'
import { measureAdminBuild } from './measure-admin-build.mjs'
import { createScaffoldTestApi, serveProduction } from './scaffold-verification.mjs'

const root = resolve(import.meta.dirname, '..')
const reportPath = join(root, 'output/release/project-templates-report.json')
const cases = [
  { name: 'blank', args: ['--template', 'blank'] },
  { name: 'screen-static', args: ['--template', 'screen'] },
  { name: 'screen-hash', args: ['--template', 'screen', '--router-mode', 'hash'] },
  { name: 'screen-history', args: ['--template', 'screen', '--router-mode', 'history'] },
  { name: 'screen-local', args: ['--template', 'screen', '--data', 'local'] },
  { name: 'screen-http', args: ['--template', 'screen', '--data', 'http'], http: true },
  { name: 'screen-demo-auth', args: ['--template', 'screen', '--auth', 'local-demo', '--data', 'local'], auth: 'local-demo' },
  { name: 'screen-auth-only', args: ['--template', 'screen', '--auth', 'http'], auth: 'http', http: true },
  { name: 'screen-auth-http', args: ['--template', 'screen', '--auth', 'http', '--data', 'http', '--router-mode', 'history'], auth: 'http', http: true, protectedData: true },
  { name: 'screen-charts', args: ['--template', 'screen', '--visualization', 'charts'], visualization: 'charts' },
  { name: 'screen-datav', args: ['--template', 'screen', '--visualization', 'datav', '--design-width', '1440'], visualization: 'datav', designWidth: 1440 },
  { name: 'screen-cockpit', args: ['--template', 'screen', '--visualization', 'cockpit', '--design-width', '1440'], visualization: 'cockpit', designWidth: 1440 },
  { name: 'screen-px', args: ['--template', 'screen', '--no-viewport'] },
  { name: 'screen-vw-1440', args: ['--template', 'screen', '--design-width', '1440'], designWidth: 1440 },
]

async function sourceHash(directory) {
  const hash = createHash('sha256')
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (['node_modules', 'dist'].includes(entry.name))
      continue
    hash.update(entry.name)
    hash.update(entry.isDirectory() ? await sourceHash(join(directory, entry.name)) : await readFile(join(directory, entry.name)))
  }
  return hash.digest('hex')
}

async function verifyBrowser(projectDir, scenario, screenshots, api) {
  const { name } = scenario
  const preview = await serveProduction(projectDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(preview.url)
    const mainElement = page.locator('main').first()
    await expect(mainElement).toBeVisible()
    if (scenario.visualization === 'charts')
      await expect(page.locator('.lumal-chart canvas')).toBeVisible()
    if (scenario.visualization === 'datav')
      await expect(page.locator('.lumal-digital-flop')).toBeVisible()
    if (scenario.visualization === 'cockpit')
      await expect(page.locator('.screen-cockpit')).toContainText('128')
    if (scenario.auth === 'local-demo') {
      await expect(page.getByRole('button', { name: '登录', exact: true })).toBeDisabled()
      await expect(page.getByRole('alert')).toContainText('生产环境禁止')
    }
    if (scenario.auth === 'http') {
      await page.getByLabel('用户名', { exact: true }).fill('admin')
      await page.getByLabel('密码', { exact: true }).fill('incorrect')
      await page.getByRole('button', { name: '登录', exact: true }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      await expect(page.getByRole('button', { name: '退出登录' })).toHaveCount(0)
      await page.getByLabel('密码', { exact: true }).fill('integration-pass')
      await page.getByRole('button', { name: '登录', exact: true }).click()
      await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible()
      await page.reload()
      await expect(page.getByRole('button', { name: '退出登录' })).toBeVisible()
    }
    if (scenario.http && (!scenario.auth || scenario.protectedData)) {
      await expect(page.locator('dd').first()).toHaveText('128')
      api.state.failList = true
      await page.getByRole('button', { name: '刷新数据' }).click()
      await expect(page.getByRole('alert')).toBeVisible()
      api.state.failList = false
      await page.getByRole('button', { name: '刷新数据' }).click()
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
    if (scenario.protectedData) {
      const refreshCount = api.state.refreshes
      api.expireAccess()
      await page.getByRole('button', { name: '刷新数据' }).click()
      await expect.poll(() => api.state.refreshes).toBeGreaterThan(refreshCount)
      await expect(page.getByRole('alert')).toHaveCount(0)
    }
    const sizes = [[1280, 720], [1366, 768], [1920, 920], [1920, 1080], [2560, 1440], [1440, 900], [390, 844]]
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height })
      await expect.poll(async () => {
        const box = await mainElement.boundingBox()
        return Boolean(box && Math.abs(box.width - width) < 2)
      }).toBe(true)
      const main = await mainElement.boundingBox()
      if (!main || main.width > width + 1 || main.x < -1)
        throw new Error(`${name} ${width}x${height} 页面溢出`)
      await expect(page.locator('[data-viewport-mode]')).toHaveCount(0)
      if (name.startsWith('screen') && name !== 'screen-px') {
        // Local Demo 的生产门禁仍停留在登录表单，不应拿尚未挂载的 ScreenView padding 验收。
        if (scenario.auth === 'local-demo') {
          const input = page.getByLabel('用户名', { exact: true })
          const minHeight = await input.evaluate(element => Number.parseFloat(getComputedStyle(element).minHeight))
          expect(Math.abs(minHeight - 40 * width / (scenario.designWidth ?? 1920))).toBeLessThan(0.1)
        }
        else {
          const padding = await mainElement.evaluate(element => Number.parseFloat(getComputedStyle(element).paddingTop))
          expect(Math.abs(padding - 32 * width / (scenario.designWidth ?? 1920))).toBeLessThan(0.1)
        }
      }
      if (scenario.visualization === 'datav') {
        // CSS 已响应新视口时，共享 RAF 和 Vue 仍可能尚未提交数值字号。
        await expect.poll(async () =>
          Number(await page.locator('.lumal-digital-flop text').getAttribute('font-size')),
        ).toBeCloseTo(30 * width / scenario.designWidth, 1)
      }
      if (scenario.visualization === 'cockpit') {
        await expect(page.locator('.lumal-cockpit-canvas__stage')).toHaveCSS('transform', 'none')
        const stage = await page.locator('.lumal-cockpit-canvas__stage').boundingBox()
        expect(stage.width).toBeCloseTo(1440 * width / scenario.designWidth, 0)
      }
      await page.screenshot({ path: join(screenshots, `${name}-${width}x${height}.png`), fullPage: true })
    }
    expect(errors).toEqual([])
    if (scenario.auth === 'http') {
      if (scenario.protectedData) {
        api.revokeSessions()
        await page.getByRole('button', { name: '刷新数据' }).click()
      }
      else {
        await page.getByRole('button', { name: '退出登录' }).click()
      }
      await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
    }
    return { status: 'passed', viewports: sizes, pageErrors: errors }
  }
  finally {
    await browser.close()
    await preview.close()
  }
}

async function main() {
  const temporary = await mkdtemp(join(tmpdir(), 'lumal-project-consumer-'))
  const tarballDir = join(temporary, 'tarballs')
  const runner = join(temporary, 'runner')
  const screenshots = join(root, 'output/playwright/project-templates')
  const report = { environment: { node: process.version, platform: process.platform }, temporary, results: [] }
  const api = await createScaffoldTestApi()
  try {
    await mkdir(tarballDir)
    await mkdir(runner)
    await mkdir(screenshots, { recursive: true })
    const tarballs = {}
    for (const entry of await readdir(join(root, 'packages'), { withFileTypes: true })) {
      if (!entry.isDirectory())
        continue
      const directory = `packages/${entry.name}`
      const manifest = await readJson(join(root, directory, 'package.json'))
      if (!manifest.private)
        tarballs[manifest.name] = await packPackage(manifest.name, directory, tarballDir)
    }
    await writeFile(join(runner, 'package.json'), '{"private":true}\n')
    runPnpm(['add', toFileSpecifier(runner, tarballs['create-lumal-admin'])], runner)
    const cli = join(runner, 'node_modules/create-lumal-admin/dist/project-cli.js')
    const selected = process.env.LUMAL_PROJECT_CASES?.split(',')
    if (selected?.some(name => !cases.some(scenario => scenario.name === name)))
      throw new Error('LUMAL_PROJECT_CASES 包含未知场景')
    for (const scenario of cases.filter(scenario => !selected || selected.includes(scenario.name))) {
      api.reset('screen-private')
      const projectDir = join(temporary, scenario.name)
      const generated = spawnSync(process.execPath, [cli, projectDir, '--no-interactive', ...scenario.args], { encoding: 'utf8', timeout: 15_000 })
      if (generated.status !== 0)
        throw new Error(`真实 CLI ${scenario.name} 失败：${generated.stdout}${generated.stderr}`)
      const manifestPath = join(projectDir, 'package.json')
      const manifest = await readJson(manifestPath)
      const dependencies = Object.keys(manifest.dependencies)
      manifest.pnpm = { overrides: Object.fromEntries(Object.entries(tarballs).filter(([name]) => name.startsWith('@lumal/')).sort(([a], [b]) => a.localeCompare(b)).map(([name, path]) => [name, toFileSpecifier(projectDir, path)])) }
      for (const name of dependencies) {
        if (tarballs[name])
          manifest.dependencies[name] = toFileSpecifier(projectDir, tarballs[name])
      }
      for (const name of Object.keys(manifest.devDependencies)) {
        if (tarballs[name])
          manifest.devDependencies[name] = toFileSpecifier(projectDir, tarballs[name])
      }
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
      if (scenario.http)
        await writeFile(join(projectDir, '.env.development'), `VITE_API_BASE_URL=${api.url}/${scenario.auth === 'http' ? 'screen-private' : 'screen-public'}\n`)
      if (scenario.http)
        await writeFile(join(projectDir, '.env.production'), `VITE_API_BASE_URL=${api.url}/${scenario.auth === 'http' ? 'screen-private' : 'screen-public'}\n`)
      const install = runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], projectDir)
      runPnpm(['install', '--frozen-lockfile', '--prefer-offline'], projectDir)
      const check = runPnpm(['check'], projectDir)
      const before = await sourceHash(projectDir)
      runPnpm(['format'], projectDir, true)
      if (before !== await sourceHash(projectDir))
        throw new Error(`${scenario.name} 格式化不幂等`)
      report.results.push({
        name: scenario.name,
        args: scenario.args,
        dependencies,
        runtimeDependencyCount: dependencies.length,
        developmentDependencyCount: Object.keys(manifest.devDependencies).length,
        installSeconds: install.seconds,
        checkSeconds: check.seconds,
        ...await measureAdminBuild(projectDir),
        browser: await verifyBrowser(projectDir, scenario, screenshots, api),
        status: 'passed',
      })
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
    }
  }
  catch (error) {
    report.failure = error instanceof Error ? error.message : String(error)
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`)
    throw error
  }
  finally {
    await api.close()
    if (process.env.KEEP_LUMAL_CONSUMER_TEMP === '1')
      console.log(`保留临时目录：${temporary}`)
    else
      await rm(temporary, { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
