import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { measureAdminBuild } from './measure-admin-build.mjs'
import { createScaffoldTestApi, verifyScaffoldBrowsers } from './scaffold-verification.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const packageDirectories = {
  '@lumal/icons': 'packages/icons',
  '@lumal/icons-vue': 'packages/icons-vue',
  '@lumal/core': 'packages/core',
  '@lumal/vben-compat': 'packages/vben-compat',
  'create-lumal-admin': 'packages/create-lumal-admin',
}
const requiredBuildArtifacts = [
  'packages/icons/dist/index.js',
  'packages/icons-vue/dist/index.js',
  'packages/core/dist/index.js',
  'packages/core/dist/minimal.js',
  'packages/vben-compat/dist/v5.js',
  'packages/vben-compat/dist/v5-router.js',
  'packages/create-lumal-admin/dist/cli.js',
]

// Windows 下 Node 22 出于安全限制（CVE-2024-27980）禁止直接 spawn .cmd 脚本，
// 必须走 shell；而启用 shell 后 Node 只是把参数用空格拼成命令行，不会逐个加引号，
// 因此含空格的路径（如用户名带空格的临时目录）需要手动补引号。
function quoteWindowsArg(arg) {
  return /[\s"]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg
}

export function runPnpm(args, cwd = rootDir, capture = false, extraEnv = {}) {
  const started = performance.now()
  const useShell = process.platform === 'win32'
  const result = spawnSync(
    pnpmCommand,
    useShell ? args.map(quoteWindowsArg) : args,
    {
      cwd,
      env: {
        ...process.env,
        CI: 'true',
        ...extraEnv,
      },
      shell: useShell,
      stdio: capture ? 'pipe' : 'inherit',
      encoding: 'utf8',
    },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    if (capture)
      console.error(result.stdout, result.stderr)
    throw new Error(`pnpm ${args.join(' ')} 执行失败，退出码 ${result.status}`)
  }
  return { seconds: Number(((performance.now() - started) / 1000).toFixed(3)), stdout: result.stdout }
}

export function toFileSpecifier(fromDir, filePath) {
  return `file:${relative(fromDir, filePath).replaceAll('\\', '/')}`
}

async function ensureBuildArtifacts() {
  if (requiredBuildArtifacts.every(path => existsSync(join(rootDir, path)))) {
    return
  }

  for (const packageName of Object.keys(packageDirectories)) {
    runPnpm(['--filter', packageName, 'build'])
  }
}

export async function packPackage(packageName, packageDir, tarballDir) {
  const before = new Set(await readdir(tarballDir))
  runPnpm([
    '--dir',
    join(rootDir, packageDir),
    'pack',
    '--pack-destination',
    tarballDir,
  ])

  const created = (await readdir(tarballDir))
    .filter(fileName => fileName.endsWith('.tgz') && !before.has(fileName))

  if (created.length !== 1) {
    throw new Error(`${packageName} 打包产物数量异常：${created.length}`)
  }

  return join(tarballDir, created[0])
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function assertLazyModuleBoundaries(projectDir) {
  const manifest = await readJson(join(projectDir, 'dist/.vite/manifest.json'))
  function closure(key, visited = new Set()) {
    if (visited.has(key))
      return visited
    visited.add(key)
    for (const dependency of manifest[key]?.imports ?? [])
      closure(dependency, visited)
    return visited
  }
  const businessFiles = new Set(Object.entries(manifest)
    .filter(([key]) => /src\/modules\/(?:system|vben-migration)\/.*View\.vue$/.test(key))
    .map(([, value]) => value.file))
  const critical = Object.keys(manifest).filter(key => manifest[key].isEntry || /(?:Login|Forbidden|NotFound|Dashboard)View\.vue$/.test(key))
  for (const key of critical) {
    if ([...closure(key)].some(dependency => businessFiles.has(manifest[dependency]?.file)))
      throw new Error(`${key} 静态提前装载系统管理或迁移页面`)
  }
  return { criticalEntries: critical, isolatedBusinessPages: businessFiles.size, status: 'passed' }
}

async function checkMinimalConsumer(tempRoot, tarballs) {
  const projectDir = join(tempRoot, 'minimal-consumer')
  await mkdir(projectDir)
  const packages = {
    private: true,
    type: 'module',
    dependencies: {
      'vue': '^3.5.0',
      '@lumal/core': toFileSpecifier(projectDir, tarballs['@lumal/core']),
      '@lumal/vben-compat': toFileSpecifier(projectDir, tarballs['@lumal/vben-compat']),
    },
    devDependencies: { vite: '^8.0.0', typescript: '^6.0.0' },
    pnpm: {
      overrides: Object.fromEntries(['@lumal/core', '@lumal/icons', '@lumal/icons-vue']
        .map(name => [name, toFileSpecifier(projectDir, tarballs[name])])),
    },
  }
  await writeFile(join(projectDir, 'package.json'), `${JSON.stringify(packages, null, 2)}\n`)
  // 纯服务消费者不能靠 pnpm 自动补齐 UI peer 掩盖静态依赖泄漏。
  await writeFile(join(projectDir, '.npmrc'), 'auto-install-peers=false\nstrict-peer-dependencies=false\n')
  await writeFile(join(projectDir, 'index.html'), '<div id="app"></div><script type="module" src="/main.ts"></script>')
  await writeFile(join(projectDir, 'main.ts'), `
import { createLumalAdmin } from '@lumal/core/minimal'
import { createRequestClient } from '@lumal/core/request'
import { adaptVbenMenus } from '@lumal/vben-compat/v5/router'
const client = createRequestClient()
const admin = createLumalAdmin({ rootComponent: { render: () => null } })
globalThis.console.log(client, admin, adaptVbenMenus([{ path: '/example' }]))
void admin.mount('#app')
`)
  await writeFile(join(projectDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      strict: true,
      skipLibCheck: false,
      noEmit: true,
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    },
    include: ['main.ts'],
  }))
  runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], projectDir)
  if (existsSync(join(projectDir, 'node_modules/element-plus')))
    throw new Error('轻入口验收意外安装了 Element Plus')
  runPnpm(['exec', 'tsc', '-p', 'tsconfig.json'], projectDir)
  runPnpm(['exec', 'vite', 'build'], projectDir)
  console.log('minimal/request 与 V5 router tarball 无 UI peer 独立安装、类型检查与构建通过。')
}

async function main() {
  await ensureBuildArtifacts()

  const tempRoot = await mkdtemp(join(tmpdir(), 'lumal-consumer-'))
  const tarballDir = join(tempRoot, 'tarballs')
  const runnerDir = join(tempRoot, 'runner')
  const api = await createScaffoldTestApi()
  const results = []
  const optionalFeatures = []
  const projects = []
  const browserEvidence = []
  const reportDirectory = join(rootDir, 'output/release')
  const screenshotDirectory = join(rootDir, 'output/playwright/scaffold')

  try {
    await mkdir(tarballDir, { recursive: true })
    await mkdir(runnerDir, { recursive: true })
    await writeFile(join(runnerDir, 'package.json'), '{\n  "private": true\n}\n')

    const tarballs = {}
    for (const [packageName, packageDir] of Object.entries(packageDirectories)) {
      tarballs[packageName] = await packPackage(packageName, packageDir, tarballDir)
    }
    await checkMinimalConsumer(tempRoot, tarballs)

    runPnpm([
      'add',
      toFileSpecifier(runnerDir, tarballs['create-lumal-admin']),
    ], runnerDir)
    const cliPath = join(runnerDir, 'node_modules/create-lumal-admin/dist/cli.js')
    runPnpm(['exec', 'vitest', 'run', '--config', 'vitest.config.ts', 'packages/create-lumal-admin/tests/cli-terminal.test.ts'], rootDir, false, { LUMAL_TEST_CLI: cliPath })
    const createPackage = await readJson(join(rootDir, packageDirectories['create-lumal-admin'], 'package.json'))
    const cliCases = [
      [['--help'], 0, '--preset'],
      [['--version'], 0, createPackage.version],
      [['--unknown'], 1, '创建失败'],
      [['--preset'], 1, '创建失败'],
      [[join(tempRoot, 'invalid-name'), '--name', 'Invalid Name'], 1, '非法 npm'],
      [[join(tempRoot, 'invalid-special-name'), '--name', 'foo~bar'], 1, '非法 npm'],
      [[runnerDir], 1, '不是空目录'],
      [[join(tempRoot, 'ci-default')], 0, 'standard / local / hash'],
    ]
    for (const [args, status, message] of cliCases) {
      const result = spawnSync(process.execPath, [cliPath, ...args], { encoding: 'utf8', env: { ...process.env, CI: 'true' }, timeout: 10_000 })
      if (result.status !== status || !`${result.stdout}${result.stderr}`.includes(message))
        throw new Error(`tarball CLI 参数验证失败：${args.join(' ')} ${result.stdout}${result.stderr}`)
    }
    await mkdir(reportDirectory, { recursive: true })
    await mkdir(screenshotDirectory, { recursive: true })
    for (const preset of ['minimal', 'standard', 'vben-compatible']) {
      for (const apiMode of ['local', 'http']) {
        for (const routerMode of ['hash', 'history']) {
          const projectDir = join(tempRoot, `generated-${preset}-${apiMode}-${routerMode}`)
          runPnpm(['exec', 'create-lumal-admin', projectDir, '--preset', preset, '--api-mode', apiMode, '--router-mode', routerMode, '--no-interactive'], runnerDir)

          const generatedPackagePath = join(projectDir, 'package.json')
          const generatedPackage = await readJson(generatedPackagePath)
          const generatedTsConfig = await readJson(join(projectDir, 'tsconfig.json'))
          const expectedLumalVersion = createPackage.version

          const runtimeNames = ['@lumal/core', '@lumal/icons', '@lumal/icons-vue', ...(preset === 'vben-compatible' ? ['@lumal/vben-compat'] : [])]
          for (const packageName of runtimeNames) {
            if (generatedPackage.dependencies?.[packageName] !== expectedLumalVersion) {
              throw new Error(
                `${packageName} 生成版本异常：期望 ${expectedLumalVersion}，实际 ${generatedPackage.dependencies?.[packageName]}`,
              )
            }
          }

          if (generatedPackage.dependencies?.['@iconify/vue'] !== '^5.0.0') {
            throw new Error('生成项目缺少 @iconify/vue 运行时依赖')
          }

          if (generatedPackage.devDependencies?.['@types/node'] !== '^24.6.1') {
            throw new Error('生成项目缺少 @types/node 开发依赖')
          }

          if (generatedPackage.devDependencies?.['sass-embedded'] !== '^1.95.1') {
            throw new Error('生成项目缺少 sass-embedded 开发依赖')
          }

          if (!generatedTsConfig.compilerOptions?.types?.includes('node')) {
            throw new Error('生成项目 tsconfig 未启用 node 类型')
          }

          generatedPackage.pnpm = {
            ...generatedPackage.pnpm,
            overrides: {
              ...generatedPackage.pnpm?.overrides,
            },
          }

          for (const packageName of runtimeNames) {
            const tarballSpecifier = toFileSpecifier(projectDir, tarballs[packageName])
            generatedPackage.dependencies[packageName] = tarballSpecifier
            generatedPackage.pnpm.overrides[packageName] = tarballSpecifier
          }

          await writeFile(
            generatedPackagePath,
            `${JSON.stringify(generatedPackage, null, 2)}\n`,
          )

          const install = runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], projectDir)
          runPnpm(['install', '--frozen-lockfile', '--prefer-offline'], projectDir)
          runPnpm(['typecheck'], projectDir)
          runPnpm(['test'], projectDir)
          runPnpm(['lint'], projectDir)
          runPnpm(['format:check'], projectDir)
          const build = runPnpm(['exec', 'vite', 'build'], projectDir, false, {
            VITE_API_BASE_URL: `${api.url}/${preset}`,
            // 只为本轮生产浏览器演示显式启用，生成项目的默认环境仍禁用。
            VITE_ENABLE_LOCAL_DEMO: 'true',
          })
          const metrics = await measureAdminBuild(projectDir)
          const boundaries = await assertLazyModuleBoundaries(projectDir)
          const project = { projectDir, preset, apiMode, routerMode }
          projects.push(project)
          results.push({
            preset,
            apiMode,
            routerMode,
            runtimeDependencyCount: Object.keys(generatedPackage.dependencies ?? {}).length,
            developmentDependencyCount: Object.keys(generatedPackage.devDependencies ?? {}).length,
            installSeconds: install.seconds,
            buildSeconds: build.seconds,
            ...metrics,
            boundaries,
          })
          browserEvidence.push(...await verifyScaffoldBrowsers([project], api, screenshotDirectory))
          console.log(`create-lumal-admin ${preset}/${apiMode}/${routerMode} tarball 独立安装、类型、测试、lint 与生产构建通过。`)
          await writeFile(join(reportDirectory, 'scaffold-report.json'), `${JSON.stringify({ environment: { node: process.version, platform: process.platform }, cliCases: cliCases.length, tempRoot, projects, results, browserEvidence, optionalFeatures }, null, 2)}\n`)
        }
      }
    }
    const featureVariants = [
      { preset: 'standard', features: 'none' },
      { preset: 'standard', features: 'system' },
      { preset: 'standard', features: 'examples' },
      { preset: 'vben-compatible', features: 'none' },
    ]
    for (const { preset, features } of featureVariants) {
      const projectDir = join(tempRoot, `features-${preset}-${features}`)
      runPnpm(['exec', 'create-lumal-admin', projectDir, '--preset', preset, '--features', features, '--no-interactive'], runnerDir)
      const path = join(projectDir, 'package.json')
      const manifest = await readJson(path)
      manifest.pnpm = { overrides: {} }
      const runtimeNames = ['@lumal/core', '@lumal/icons', '@lumal/icons-vue', ...(preset === 'vben-compatible' ? ['@lumal/vben-compat'] : [])]
      for (const name of runtimeNames) {
        manifest.dependencies[name] = toFileSpecifier(projectDir, tarballs[name])
        manifest.pnpm.overrides[name] = manifest.dependencies[name]
      }
      await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`)
      runPnpm(['install', '--frozen-lockfile=false', '--prefer-offline'], projectDir)
      runPnpm(['install', '--frozen-lockfile', '--prefer-offline'], projectDir)
      runPnpm(['typecheck'], projectDir)
      runPnpm(['test'], projectDir)
      runPnpm(['lint'], projectDir)
      runPnpm(['format:check'], projectDir)
      const build = runPnpm(['exec', 'vite', 'build'], projectDir, false, { VITE_ENABLE_LOCAL_DEMO: 'true' })
      optionalFeatures.push({
        preset,
        features,
        runtimeDependencyCount: Object.keys(manifest.dependencies ?? {}).length,
        developmentDependencyCount: Object.keys(manifest.devDependencies ?? {}).length,
        buildSeconds: build.seconds,
        ...await measureAdminBuild(projectDir),
      })
    }
    await writeFile(join(reportDirectory, 'scaffold-report.json'), `${JSON.stringify({ environment: { node: process.version, platform: process.platform }, cliCases: cliCases.length, tempRoot, projects, results, browserEvidence, optionalFeatures }, null, 2)}\n`)
  }
  finally {
    await api.close()
    if (process.env.KEEP_LUMAL_CONSUMER_TEMP === '1') {
      console.log(`保留临时目录：${tempRoot}`)
    }
    else {
      await rm(tempRoot, { force: true, recursive: true })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
