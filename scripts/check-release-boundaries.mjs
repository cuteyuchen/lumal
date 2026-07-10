import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'

/***********************基础路径*********************/
const rootDir = process.cwd()
const licensePath = join(rootDir, 'LICENSE')
const packageDirs = {
  createLumaAdmin: join(rootDir, 'packages/create-luma-admin'),
  icons: join(rootDir, 'packages/icons'),
  core: join(rootDir, 'packages/core'),
  charts: join(rootDir, 'packages/charts'),
  vbenCompat: join(rootDir, 'packages/vben-compat'),
}

const oldNamePattern = /guiren|gr-framework|GrFramework|GSchemaForm|GSchemaTable|GCrudTable|GPage|GPagination/
const textFilePattern = /\.(?:cjs|css|html|js|json|mjs|md|scss|ts|tsx|vue|yaml|yml)$/

const errors = []

/***********************通用工具*********************/
function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message)
  }
}

function getDependencyNames(packageJson, fields) {
  const names = new Set()

  for (const field of fields) {
    for (const name of Object.keys(packageJson[field] ?? {})) {
      names.add(name)
    }
  }

  return names
}

function hasDependency(packageJson, field, name) {
  return Object.hasOwn(packageJson[field] ?? {}, name)
}

function walkFiles(dirPath, files = []) {
  for (const entry of readdirSync(dirPath)) {
    const filePath = join(dirPath, entry)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      if (!['dist', 'node_modules', '.git'].includes(entry)) {
        walkFiles(filePath, files)
      }
    }
    else if (textFilePattern.test(entry)) {
      files.push(filePath)
    }
  }

  return files
}

function findTextMatches(dirPath, pattern, ignoredRelativeFiles = new Set()) {
  const matches = []

  for (const filePath of walkFiles(dirPath)) {
    const relativePath = relative(rootDir, filePath).replaceAll('\\', '/')

    if (ignoredRelativeFiles.has(relativePath)) {
      continue
    }

    const content = readFileSync(filePath, 'utf8')

    if (pattern.test(content)) {
      matches.push(relativePath)
    }
  }

  return matches
}

/***********************包发布配置*********************/
function checkPublishPackage(name, dirPath) {
  const packageJsonPath = join(dirPath, 'package.json')
  const readmePath = join(dirPath, 'README.md')
  const packageJson = readJson(packageJsonPath)

  assert(existsSync(readmePath), `${name} 缺少 README.md`)
  assert(packageJson.publishConfig?.access === 'public', `${name} 缺少 publishConfig.access=public`)
  assert(packageJson.license === 'MIT', `${name} license 应为 MIT`)
  assert(packageJson.files?.includes('README.md'), `${name} files 未包含 README.md`)
  assert(packageJson.files?.includes('dist'), `${name} files 未包含 dist`)

  return packageJson
}

/***********************许可证*********************/
assert(existsSync(licensePath), '根目录缺少 LICENSE')
if (existsSync(licensePath)) {
  const licenseText = readFileSync(licensePath, 'utf8')

  assert(licenseText.includes('MIT License'), 'LICENSE 不是 MIT License')
}

const iconsPackage = checkPublishPackage('@luma/icons', packageDirs.icons)
const corePackage = checkPublishPackage('@luma/core', packageDirs.core)
const chartsPackage = checkPublishPackage('@luma/charts', packageDirs.charts)
const compatPackage = checkPublishPackage('@luma/vben-compat', packageDirs.vbenCompat)
const createPackage = checkPublishPackage('create-luma-admin', packageDirs.createLumaAdmin)

assert(corePackage.files?.includes('theme-chalk'), '@luma/core files 未包含 theme-chalk')
assert(corePackage.exports?.['./style.css'] === './dist/core.css', '@luma/core 未导出 style.css')
assert(corePackage.exports?.['./theme-chalk/index.scss'], '@luma/core 未导出 theme-chalk/index.scss')
assert(createPackage.bin?.['create-luma-admin'] === './dist/cli.js', 'create-luma-admin 缺少 bin.create-luma-admin')

/***********************依赖边界*********************/
const iconsAllDependencies = getDependencyNames(iconsPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])
const coreAllDependencies = getDependencyNames(corePackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])
const compatAllDependencies = getDependencyNames(compatPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])
const chartsAllDependencies = getDependencyNames(chartsPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])

assert(!iconsAllDependencies.has('@luma/core'), '@luma/icons 不能依赖 @luma/core')
assert(!iconsAllDependencies.has('@luma/vben-compat'), '@luma/icons 不能依赖 @luma/vben-compat')

assert(hasDependency(corePackage, 'dependencies', '@luma/icons'), '@luma/core 应通过 dependencies 依赖 @luma/icons')
assert(hasDependency(corePackage, 'peerDependencies', 'element-plus'), '@luma/core 应把 element-plus 放在 peerDependencies')
assert(!hasDependency(corePackage, 'dependencies', 'element-plus'), '@luma/core 不能把 element-plus 放在 dependencies')
assert(!coreAllDependencies.has('@luma/vben-compat'), '@luma/core 不能依赖 @luma/vben-compat')
assert(!coreAllDependencies.has('@luma/charts'), '@luma/core 不能依赖 @luma/charts')

assert(hasDependency(compatPackage, 'dependencies', '@luma/core'), '@luma/vben-compat 应依赖 @luma/core')
assert(!compatAllDependencies.has('element-plus'), '@luma/vben-compat 不应直接依赖 element-plus')

assert(hasDependency(chartsPackage, 'peerDependencies', 'echarts'), '@luma/charts 应把 echarts 放在 peerDependencies')
assert(!hasDependency(chartsPackage, 'dependencies', 'echarts'), '@luma/charts 不能把 echarts 放在 dependencies')
assert(!chartsAllDependencies.has('@luma/core'), '@luma/charts 不应依赖 @luma/core')

for (const dependencyName of coreAllDependencies) {
  assert(!/^@intlify\//.test(dependencyName), `@luma/core 不能默认依赖 ${dependencyName}`)
}

for (const forbiddenName of ['echarts', 'vue-echarts', 'vue-i18n', 'vxe-table', 'vxe-pc-ui', 'xe-utils']) {
  assert(!coreAllDependencies.has(forbiddenName), `@luma/core 不能默认依赖 ${forbiddenName}`)
}

/***********************源码边界*********************/
const coreForbiddenMatches = findTextMatches(
  join(packageDirs.core, 'src'),
  /@luma\/vben-compat|@luma\/charts|vue-i18n|@intlify\/|vxe-table|vxe-pc-ui|xe-utils|vue-echarts|from 'echarts'/,
)

for (const match of coreForbiddenMatches) {
  errors.push(`@luma/core 源码出现禁止依赖标识：${match}`)
}

const appSourceAliasMatches = findTextMatches(
  join(rootDir, 'apps'),
  /\.\.\/\.\.\/packages|packages\/(?:icons|core|vben-compat)\/src|packages\\(?:icons|core|vben-compat)\\src/,
)

for (const match of appSourceAliasMatches) {
  errors.push(`apps 应通过包名消费 @luma/*，不能直连包源码：${match}`)
}

const oldNameMatches = findTextMatches(rootDir, oldNamePattern, new Set([
  'LUMA_DEVELOPMENT_PLAN.md',
  'docs/luma-next-development-plan.md',
  'docs/release-checklist.md',
  'scripts/check-release-boundaries.mjs',
]))

for (const match of oldNameMatches) {
  errors.push(`公开源码或文档仍包含旧名称/旧别名：${match}`)
}

/***********************检查结果*********************/
if (errors.length > 0) {
  console.error('Luma 发布边界检查失败：')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Luma 发布边界检查通过。')
