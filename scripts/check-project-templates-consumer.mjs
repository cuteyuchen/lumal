import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { chromium, expect } from '@playwright/test'
import { packPackage, readJson, runPnpm, toFileSpecifier } from './check-create-lumal-admin-consumer.mjs'
import { measureAdminBuild } from './measure-admin-build.mjs'
import { serveProduction } from './scaffold-verification.mjs'

const root = resolve(import.meta.dirname, '..')
const reportPath = join(root, 'output/release/project-templates-report.json')
const cases = [
  { name: 'blank', args: ['--template', 'blank'] },
  { name: 'screen-static', args: ['--template', 'screen'] },
  { name: 'screen-hash', args: ['--template', 'screen', '--router-mode', 'hash'] },
  { name: 'screen-history', args: ['--template', 'screen', '--router-mode', 'history'] },
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

async function verifyBrowser(projectDir, name, screenshots) {
  const preview = await serveProduction(projectDir)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(preview.url)
    await expect(page.locator('main')).toBeVisible()
    const sizes = [[1366, 768], [1920, 1080], [2560, 1440], [1440, 900], [390, 844]]
    for (const [width, height] of sizes) {
      await page.setViewportSize({ width, height })
      const main = await page.locator('main').boundingBox()
      if (!main || main.width > width + 1 || main.x < -1)
        throw new Error(`${name} ${width}x${height} 页面溢出`)
      await page.screenshot({ path: join(screenshots, `${name}-${width}x${height}.png`), fullPage: true })
    }
    expect(errors).toEqual([])
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
    for (const scenario of cases) {
      const projectDir = join(temporary, scenario.name)
      const generated = spawnSync(process.execPath, [cli, projectDir, '--no-interactive', ...scenario.args], { encoding: 'utf8', timeout: 15_000 })
      if (generated.status !== 0)
        throw new Error(`真实 CLI ${scenario.name} 失败：${generated.stdout}${generated.stderr}`)
      const manifestPath = join(projectDir, 'package.json')
      const manifest = await readJson(manifestPath)
      const dependencies = Object.keys(manifest.dependencies)
      manifest.pnpm = { overrides: Object.fromEntries(Object.entries(tarballs).filter(([name]) => name.startsWith('@lumal/')).map(([name, path]) => [name, toFileSpecifier(projectDir, path)])) }
      for (const name of dependencies) {
        if (tarballs[name])
          manifest.dependencies[name] = toFileSpecifier(projectDir, tarballs[name])
      }
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
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
        browser: await verifyBrowser(projectDir, scenario.name, screenshots),
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
