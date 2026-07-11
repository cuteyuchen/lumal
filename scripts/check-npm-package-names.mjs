import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

/***********************基础路径*********************/
const scriptsDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(scriptsDir, '..')
const defaultRegistry = 'https://registry.npmjs.org'
const publishPackageJsonPaths = [
  'packages/icons/package.json',
  'packages/core/package.json',
  'packages/charts/package.json',
  'packages/vben-compat/package.json',
  'packages/vite/package.json',
  'packages/create-luma-admin/package.json',
]

/***********************包名收集*********************/
function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

export function getPublishPackageNames(baseDir = rootDir) {
  return publishPackageJsonPaths.map((packageJsonPath) => {
    const packageJson = readJson(join(baseDir, packageJsonPath))

    return packageJson.name
  })
}

/***********************结果分类*********************/
export function classifyNpmViewResult(result) {
  if (result.exitCode === 0) {
    return 'taken'
  }

  if (/E404|404 Not Found|Not found/i.test(result.output)) {
    return 'not-found'
  }

  return 'unknown'
}

function queryPackageName(name, registry = defaultRegistry) {
  const result = spawnSync('npm', [
    'view',
    name,
    'name',
    'version',
    `--registry=${registry}`,
  ], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  return {
    exitCode: result.status ?? 1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`,
  }
}

/***********************报告生成*********************/
export function createPackageNameReport(results) {
  const lines = results.map(result => `[${result.status}] ${result.name}`)
  const ok = results.every(result => result.status === 'not-found')

  return {
    lines,
    ok,
  }
}

export function checkPackageNames(options = {}) {
  const registry = options.registry ?? defaultRegistry
  const names = getPublishPackageNames(options.rootDir ?? rootDir)
  const results = names.map((name) => {
    const queryResult = queryPackageName(name, registry)

    return {
      name,
      status: classifyNpmViewResult(queryResult),
    }
  })

  return createPackageNameReport(results)
}

/***********************命令入口*********************/
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = checkPackageNames()

  for (const line of report.lines) {
    console.log(line)
  }

  if (!report.ok) {
    console.error('npm 包名检查失败：存在已占用或无法确认的包名。')
    process.exit(1)
  }

  console.log('npm 包名检查通过：目标包名当前未在 registry 查询到。')
  console.log('注意：这不能证明当前 npm 账号拥有或可创建 @luma scope，正式发布前仍需用发布账号确认。')
}
