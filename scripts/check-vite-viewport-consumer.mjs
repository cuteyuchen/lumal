import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { packPackage, readJson, runPnpm, toFileSpecifier } from './check-create-lumal-admin-consumer.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixture = join(root, 'scripts/fixtures/viewport-consumer')
const reportFile = join(root, 'output/release/vite-viewport-report.json')
const prefix = 'lumal-vite-viewport-consumer-'

async function installedVersion(name) {
  for (const directory of ['node_modules', 'packages/vite/node_modules']) {
    try {
      return (await readJson(join(root, directory, name, 'package.json'))).version
    }
    catch (error) {
      if (error.code !== 'ENOENT')
        throw error
    }
  }
  throw new Error(`未找到本地验证依赖 ${name}，请先安装仓库依赖`)
}

async function verifyGeneratedViewportProject(temporary, runner, tarballs) {
  const project = join(temporary, 'generated-screen-vw')
  runPnpm(['exec', 'create-lumal', project, '--template', 'screen', '--viewport', 'vw', '--no-interactive'], runner)
  const manifestPath = join(project, 'package.json')
  const manifest = await readJson(manifestPath)
  const version = (await readJson(join(root, 'packages/create-lumal-admin/package.json'))).version
  assert.equal(manifest.dependencies['@lumal/viewport'], version)
  assert.equal(manifest.devDependencies['@lumal/vite'], version)
  assert.equal(manifest.dependencies['@lumal/core'], undefined, 'vw Screen 不应引入 Admin/Core')
  const viteConfig = await readFile(join(project, 'vite.config.ts'), 'utf8')
  const viewportConfig = await readFile(join(project, 'viewport.config.ts'), 'utf8')
  assert.match(viteConfig, /output:\s*['"]runtime['"]/)
  assert.match(viteConfig, /viewportWidth:\s*viewportDesign\.designWidth/)
  assert.match(viteConfig, /inlineStyles:\s*true/)
  assert.match(viewportConfig, /mode:\s*['"]vw['"]/)
  // 只替换包来源，不改生成的 Vite 配置或业务样式，以真实 tarball 验证默认接线。
  manifest.dependencies['@lumal/viewport'] = toFileSpecifier(project, tarballs.viewport)
  manifest.devDependencies['@lumal/vite'] = toFileSpecifier(project, tarballs.vite)
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], project)
  runPnpm(['install', '--frozen-lockfile', '--prefer-offline'], project)
  runPnpm(['typecheck'], project)
  runPnpm(['build'], project)
  const assets = join(project, 'dist/assets')
  const css = (await Promise.all((await readdir(assets))
    .filter(name => name.endsWith('.css'))
    .map(name => readFile(join(assets, name), 'utf8')))).join('\n')
  assert.match(css, /padding:\s*calc\(\s*32\s*\*\s*var\(--lumal-viewport-unit,\s*1px\)\s*\)/)
  assert.match(css, /gap:\s*calc\(\s*16\s*\*\s*var\(--lumal-viewport-unit,\s*1px\)\s*\)/)
  assert.match(css, /font-size:\s*max\(\s*14px/, '默认字号保护不应被模板转换绕过')
  return {
    status: 'passed',
    command: 'create-lumal --template screen --viewport vw --no-interactive',
    checks: ['real-cli-tarball', 'shared-design-config', 'minimal-dependencies', 'install-frozen', 'vue-types', 'production-build', 'runtime-css-output', 'font-protection'],
    version,
    validation: '真实生成的独立 Vue 项目，无浏览器或业务项目改动',
  }
}

async function main() {
  const temporary = await mkdtemp(join(tmpdir(), prefix))
  const project = join(temporary, 'consumer')
  const report = {
    scope: '本地 tarball 独立 Vue 消费者，不启动浏览器或修改业务项目',
    environment: { node: process.version, platform: process.platform },
    status: 'running',
  }
  try {
    // 每次从当前源码重建，避免消费者无意验证上一次的 dist。
    for (const name of ['@lumal/viewport', '@lumal/vite', 'create-lumal-admin'])
      runPnpm(['--filter', name, 'build'], root)
    const tarballs = join(temporary, 'tarballs')
    await mkdir(tarballs)
    const viteTarball = await packPackage('@lumal/vite', 'packages/vite', tarballs)
    const viewportTarball = await packPackage('@lumal/viewport', 'packages/viewport', tarballs)
    const createTarball = await packPackage('create-lumal-admin', 'packages/create-lumal-admin', tarballs)
    await cp(fixture, project, { recursive: true })
    const dependencies = {
      '@lumal/vite': toFileSpecifier(project, viteTarball),
      '@lumal/viewport': toFileSpecifier(project, viewportTarball),
      'viewport-widget': 'file:./vendor/viewport-widget',
      'vue': await installedVersion('vue'),
    }
    const devDependencies = {}
    for (const name of ['@types/node', '@vitejs/plugin-vue', 'postcss', 'sass-embedded', 'typescript', 'vite', 'vue-tsc'])
      devDependencies[name] = await installedVersion(name)
    devDependencies['create-lumal-admin'] = toFileSpecifier(project, createTarball)
    await writeFile(join(project, 'package.json'), `${JSON.stringify({
      name: 'lumal-vite-viewport-consumer',
      private: true,
      type: 'module',
      dependencies,
      devDependencies,
    }, null, 2)}\n`)
    runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], project)
    runPnpm(['install', '--frozen-lockfile', '--prefer-offline'], project)
    runPnpm(['exec', 'vue-tsc', '--noEmit', '-p', 'tsconfig.json'], project)
    runPnpm(['exec', 'node', 'verify.mjs'], project)
    const generatedProject = await verifyGeneratedViewportProject(temporary, project, { vite: viteTarball, viewport: viewportTarball })
    Object.assign(report, await readJson(join(project, 'consumer-report.json')), {
      dependencies,
      devDependencies,
      generatedProject,
      status: 'passed',
    })
    assert.equal(report.status, 'passed')
    console.log('Vite 视口 tarball 消费通过：ESM/CJS、Vue 类型、CSS/SCSS/模板、Dev/Build、运行时协同及真实 CLI vw 项目。')
  }
  catch (error) {
    report.status = 'failed'
    report.failure = error instanceof Error ? error.message : String(error)
    throw error
  }
  finally {
    await mkdir(dirname(reportFile), { recursive: true })
    await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`)
    if (process.env.KEEP_LUMAL_CONSUMER_TEMP === '1') {
      console.log(`保留独立消费者目录：${temporary}`)
    }
    else {
      // 仅删除本次 mkdtemp 在系统临时目录创建的已核对绝对路径。
      const target = resolve(temporary)
      assert.equal(dirname(target), resolve(tmpdir()))
      assert.ok(basename(target).startsWith(prefix))
      await rm(target, { recursive: true, force: true })
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
