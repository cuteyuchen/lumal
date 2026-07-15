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
  datav: join(rootDir, 'packages/datav'),
  cockpit: join(rootDir, 'packages/cockpit'),
  vbenCompat: join(rootDir, 'packages/vben-compat'),
  vite: join(rootDir, 'packages/vite'),
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

function findTextMatches(dirPath, pattern, ignoredRelativeFiles = new Set(), allowedTexts = []) {
  const matches = []

  for (const filePath of walkFiles(dirPath)) {
    const relativePath = relative(rootDir, filePath).replaceAll('\\', '/')

    if (ignoredRelativeFiles.has(relativePath)) {
      continue
    }

    const content = allowedTexts.reduce(
      (value, allowedText) => value.replaceAll(allowedText, ''),
      readFileSync(filePath, 'utf8'),
    )

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
const datavPackage = checkPublishPackage('@luma/datav', packageDirs.datav)
const cockpitPackage = checkPublishPackage('@luma/cockpit', packageDirs.cockpit)
const compatPackage = checkPublishPackage('@luma/vben-compat', packageDirs.vbenCompat)
const vitePackage = checkPublishPackage('@luma/vite', packageDirs.vite)
const createPackage = checkPublishPackage('create-luma-admin', packageDirs.createLumaAdmin)

assert(corePackage.files?.includes('theme-chalk'), '@luma/core files 未包含 theme-chalk')
assert(corePackage.exports?.['./style.css'] === './dist/core.css', '@luma/core 未导出 style.css')
assert(corePackage.exports?.['./theme-chalk/index.scss'], '@luma/core 未导出 theme-chalk/index.scss')
assert(createPackage.bin?.['create-luma-admin'] === './dist/cli.js', 'create-luma-admin 缺少 bin.create-luma-admin')
assert(datavPackage.exports?.['./style.css'] === './dist/datav.css', '@luma/datav 未导出 style.css')
for (const entry of [
  'active-ring-chart',
  'border-box',
  'capsule-chart',
  'charts',
  'conical-column-chart',
  'decoration',
  'digital-flop',
  'flyline-chart',
  'flyline-chart-enhanced',
  'full-screen-container',
  'loading',
  'percent-pond',
  'scroll-board',
  'scroll-ranking-board',
  'water-level-pond',
]) {
  const exported = datavPackage.exports?.[`./${entry}`]
  assert(exported?.types && exported?.import && exported?.require, `@luma/datav 未完整导出 ${entry}`)
}

assert(cockpitPackage.exports?.['./style.css'] === './dist/cockpit.css', '@luma/cockpit 未导出 style.css')
assert(cockpitPackage.exports?.['./runtime'], '@luma/cockpit 未导出 runtime 入口')
assert(cockpitPackage.exports?.['./designer'], '@luma/cockpit 未导出 designer 入口')
assert(cockpitPackage.exports?.['./registry'], '@luma/cockpit 未导出 registry 入口')

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
const datavAllDependencies = getDependencyNames(datavPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])
const viteAllDependencies = getDependencyNames(vitePackage, [
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
assert(hasDependency(datavPackage, 'peerDependencies', 'vue'), '@luma/datav 应把 vue 放在 peerDependencies')
assert(hasDependency(datavPackage, 'peerDependencies', 'echarts'), '@luma/datav 应把 echarts 放在 peerDependencies')
assert(datavAllDependencies.size === 2, '@luma/datav 运行时依赖应仅包含 vue 与 echarts peer')
assert(!hasDependency(datavPackage, 'dependencies', 'vue'), '@luma/datav 不能把 vue 放在 dependencies')
assert(!hasDependency(datavPackage, 'dependencies', 'echarts'), '@luma/datav 不能把 echarts 放在 dependencies')
assert(!hasDependency(datavPackage, 'optionalDependencies', 'vue'), '@luma/datav 不能把 vue 放在 optionalDependencies')
for (const forbiddenName of ['@luma/cockpit', '@luma/charts', 'element-plus', '@jiaminghi/data-view', '@jiaminghi/charts', '@jiaminghi/c-render']) {
  assert(!datavAllDependencies.has(forbiddenName), `@luma/datav 不能依赖 ${forbiddenName}`)
}
assert(viteAllDependencies.size === 0, '@luma/vite 不应引入强制运行时依赖')

/***********************@luma/cockpit 依赖边界*********************/
const cockpitAllDependencies = getDependencyNames(cockpitPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])

assert(hasDependency(cockpitPackage, 'dependencies', '@luma/core'), '@luma/cockpit 应通过 dependencies 依赖 @luma/core')
assert(hasDependency(cockpitPackage, 'peerDependencies', 'vue'), '@luma/cockpit 应把 vue 放在 peerDependencies')
assert(!cockpitAllDependencies.has('@luma/charts'), '@luma/cockpit 不能依赖 @luma/charts')
assert(!coreAllDependencies.has('@luma/cockpit'), '@luma/core 不能反向依赖 @luma/cockpit')
for (const forbiddenName of ['echarts', 'vue-echarts', 'openlayers', 'ol', 'cesium', 'mapbox-gl', 'leaflet']) {
  assert(!cockpitAllDependencies.has(forbiddenName), `@luma/cockpit 不能依赖 ${forbiddenName}`)
}

for (const dependencyName of coreAllDependencies) {
  assert(!/^@intlify\//.test(dependencyName), `@luma/core 不能默认依赖 ${dependencyName}`)
}

for (const forbiddenName of ['echarts', 'vue-echarts', 'vue-i18n', 'vxe-table', 'vxe-pc-ui', 'xe-utils']) {
  assert(!coreAllDependencies.has(forbiddenName), `@luma/core 不能默认依赖 ${forbiddenName}`)
}

/***********************源码边界*********************/
const coreForbiddenMatches = findTextMatches(
  join(packageDirs.core, 'src'),
  /@luma\/vben-compat|@luma\/charts|@luma\/cockpit|vue-i18n|@intlify\/|vxe-table|vxe-pc-ui|xe-utils|vue-echarts|from 'echarts'/,
)

for (const match of coreForbiddenMatches) {
  errors.push(`@luma/core 源码出现禁止依赖标识：${match}`)
}

/***********************@luma/cockpit 源码边界*********************/
// 包内不得导入地图/图表运行时或 @luma/charts，也不得出现写死的引擎联合类型
const cockpitForbiddenMatches = findTextMatches(
  join(packageDirs.cockpit, 'src'),
  /@luma\/charts|from 'echarts'|from "echarts"|openlayers|from 'ol|cesium|mapbox-gl|from 'leaflet/,
)

for (const match of cockpitForbiddenMatches) {
  errors.push(`@luma/cockpit 源码出现禁止依赖标识：${match}`)
}

/***********************@luma/datav 源码边界*********************/
const datavForbiddenMatches = findTextMatches(
  join(packageDirs.datav, 'src'),
  /@luma\/cockpit|@luma\/charts|@jiaminghi\/|from 'element-plus'|from "element-plus"/,
)

for (const match of datavForbiddenMatches) {
  errors.push(`@luma/datav 源码出现禁止依赖标识：${match}`)
}

const appSourceAliasMatches = findTextMatches(
  join(rootDir, 'apps'),
  /\.\.\/\.\.\/packages|packages\/(?:icons|core|datav|cockpit|vben-compat|vite)\/src|packages\\(?:icons|core|datav|cockpit|vben-compat|vite)\\src/,
  new Set(),
  ['../../packages/vite/src/aliases'],
)

for (const match of appSourceAliasMatches) {
  errors.push(`apps 应通过包名消费 @luma/*，不能直连包源码：${match}`)
}

const oldNameMatches = findTextMatches(rootDir, oldNamePattern, new Set([
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
