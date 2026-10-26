import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
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
    for (const name of ['@lumal/viewport', '@lumal/vite'])
      runPnpm(['--filter', name, 'build'], root)
    const tarballs = join(temporary, 'tarballs')
    await mkdir(tarballs)
    const viteTarball = await packPackage('@lumal/vite', 'packages/vite', tarballs)
    const viewportTarball = await packPackage('@lumal/viewport', 'packages/viewport', tarballs)
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
    Object.assign(report, await readJson(join(project, 'consumer-report.json')), {
      dependencies,
      devDependencies,
      status: 'passed',
    })
    assert.equal(report.status, 'passed')
    console.log('Vite 视口 tarball 消费通过：ESM/CJS、Vue 类型、CSS/SCSS/模板、Dev/Build 与运行时协同。')
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
