import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const packageDirectories = {
  '@lumal/icons': 'packages/icons',
  '@lumal/icons-vue': 'packages/icons-vue',
  '@lumal/core': 'packages/core',
  'create-lumal-admin': 'packages/create-lumal-admin',
}
const requiredBuildArtifacts = [
  'packages/icons/dist/index.js',
  'packages/icons-vue/dist/index.js',
  'packages/core/dist/index.js',
  'packages/core/dist/minimal.js',
  'packages/create-lumal-admin/dist/cli.js',
]

// Windows 下 Node 22 出于安全限制（CVE-2024-27980）禁止直接 spawn .cmd 脚本，
// 必须走 shell；而启用 shell 后 Node 只是把参数用空格拼成命令行，不会逐个加引号，
// 因此含空格的路径（如用户名带空格的临时目录）需要手动补引号。
function quoteWindowsArg(arg) {
  return /[\s"]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg
}

function runPnpm(args, cwd = rootDir) {
  const useShell = process.platform === 'win32'
  const result = spawnSync(
    pnpmCommand,
    useShell ? args.map(quoteWindowsArg) : args,
    {
      cwd,
      env: {
        ...process.env,
        CI: 'true',
      },
      shell: useShell,
      stdio: 'inherit',
    },
  )

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} 执行失败，退出码 ${result.status}`)
  }
}

function toFileSpecifier(fromDir, filePath) {
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

async function packPackage(packageName, packageDir, tarballDir) {
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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function checkMinimalConsumer(tempRoot, tarballs) {
  const projectDir = join(tempRoot, 'minimal-consumer')
  await mkdir(projectDir)
  const packages = {
    private: true,
    type: 'module',
    dependencies: { 'vue': '^3.5.0', '@lumal/core': toFileSpecifier(projectDir, tarballs['@lumal/core']) },
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
const client = createRequestClient()
const admin = createLumalAdmin({ rootComponent: { render: () => null } })
globalThis.console.log(client, admin)
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
  runPnpm(['install', '--frozen-lockfile=false'], projectDir)
  if (existsSync(join(projectDir, 'node_modules/element-plus')))
    throw new Error('轻入口验收意外安装了 Element Plus')
  runPnpm(['exec', 'tsc', '-p', 'tsconfig.json'], projectDir)
  runPnpm(['exec', 'vite', 'build'], projectDir)
  console.log('minimal/request tarball 无 UI peer 独立安装、类型检查与构建通过。')
}

async function main() {
  await ensureBuildArtifacts()

  const tempRoot = await mkdtemp(join(tmpdir(), 'lumal-consumer-'))
  const tarballDir = join(tempRoot, 'tarballs')
  const runnerDir = join(tempRoot, 'runner')

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
    // 两种模式都从实际发布 tarball 生成，避免只验证源码中的版本占位符。
    for (const apiMode of ['local', 'http']) {
      const projectDir = join(tempRoot, `generated-admin-${apiMode}`)
      runPnpm(['exec', 'create-lumal-admin', projectDir, '--api-mode', apiMode], runnerDir)

      const createPackage = await readJson(join(
        rootDir,
        packageDirectories['create-lumal-admin'],
        'package.json',
      ))
      const generatedPackagePath = join(projectDir, 'package.json')
      const generatedPackage = await readJson(generatedPackagePath)
      const generatedTsConfig = await readJson(join(projectDir, 'tsconfig.json'))
      const expectedLumalVersion = createPackage.version

      for (const packageName of ['@lumal/core', '@lumal/icons', '@lumal/icons-vue']) {
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

      for (const packageName of ['@lumal/core', '@lumal/icons', '@lumal/icons-vue']) {
        const tarballSpecifier = toFileSpecifier(projectDir, tarballs[packageName])
        generatedPackage.dependencies[packageName] = tarballSpecifier
        generatedPackage.pnpm.overrides[packageName] = tarballSpecifier
      }

      await writeFile(
        generatedPackagePath,
        `${JSON.stringify(generatedPackage, null, 2)}\n`,
      )

      runPnpm(['install', '--frozen-lockfile=false'], projectDir)
      runPnpm(['build'], projectDir)
      console.log(`create-lumal-admin ${apiMode} 模式独立消费、安装与构建检查通过。`)
    }
  }
  finally {
    if (process.env.KEEP_LUMAL_CONSUMER_TEMP === '1') {
      console.log(`保留临时目录：${tempRoot}`)
    }
    else {
      await rm(tempRoot, { force: true, recursive: true })
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
