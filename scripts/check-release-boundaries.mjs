import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'

/***********************基础路径*********************/
const rootDir = process.cwd()
const licensePath = join(rootDir, 'LICENSE')
const packageDirs = {
  createLumalAdmin: join(rootDir, 'packages/create-lumal-admin'),
  icons: join(rootDir, 'packages/icons'),
  iconsVue: join(rootDir, 'packages/icons-vue'),
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

const iconsPackage = checkPublishPackage('@lumal/icons', packageDirs.icons)
const iconsVuePackage = checkPublishPackage('@lumal/icons-vue', packageDirs.iconsVue)
const corePackage = checkPublishPackage('@lumal/core', packageDirs.core)
const chartsPackage = checkPublishPackage('@lumal/charts', packageDirs.charts)
const datavPackage = checkPublishPackage('@lumal/datav', packageDirs.datav)
const cockpitPackage = checkPublishPackage('@lumal/cockpit', packageDirs.cockpit)
const compatPackage = checkPublishPackage('@lumal/vben-compat', packageDirs.vbenCompat)
const vitePackage = checkPublishPackage('@lumal/vite', packageDirs.vite)
const createPackage = checkPublishPackage('create-lumal-admin', packageDirs.createLumalAdmin)

assert(corePackage.files?.includes('theme-chalk'), '@lumal/core files 未包含 theme-chalk')
assert(iconsVuePackage.exports?.['./style.css'] === './dist/icons-vue.css', '@lumal/icons-vue 未导出 style.css')
assert(corePackage.exports?.['./style.css'] === './dist/core.css', '@lumal/core 未导出 style.css')
assert(corePackage.exports?.['./theme-chalk/index.scss'], '@lumal/core 未导出 theme-chalk/index.scss')
assert(createPackage.bin?.['create-lumal-admin'] === './dist/cli.js', 'create-lumal-admin 缺少 bin.create-lumal-admin')
assert(datavPackage.exports?.['./style.css'] === './dist/datav.css', '@lumal/datav 未导出 style.css')
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
  assert(exported?.types && exported?.import && exported?.require, `@lumal/datav 未完整导出 ${entry}`)
}

assert(cockpitPackage.exports?.['./style.css'] === './dist/cockpit.css', '@lumal/cockpit 未导出 style.css')
assert(cockpitPackage.exports?.['./runtime'], '@lumal/cockpit 未导出 runtime 入口')
assert(cockpitPackage.exports?.['./designer'], '@lumal/cockpit 未导出 designer 入口')
assert(cockpitPackage.exports?.['./registry'], '@lumal/cockpit 未导出 registry 入口')

/***********************依赖边界*********************/
const iconsAllDependencies = getDependencyNames(iconsPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])
const iconsVueAllDependencies = getDependencyNames(iconsVuePackage, [
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

assert(iconsAllDependencies.size === 0, '@lumal/icons 必须保持零运行时依赖')

assert(hasDependency(iconsVuePackage, 'dependencies', '@lumal/icons'), '@lumal/icons-vue 应通过 dependencies 依赖 @lumal/icons')
assert(hasDependency(iconsVuePackage, 'peerDependencies', 'vue'), '@lumal/icons-vue 应把 vue 放在 peerDependencies')
assert(hasDependency(iconsVuePackage, 'peerDependencies', '@iconify/vue'), '@lumal/icons-vue 应把 @iconify/vue 放在 peerDependencies')
assert(!iconsVueAllDependencies.has('@lumal/core'), '@lumal/icons-vue 不能依赖 @lumal/core')

assert(hasDependency(corePackage, 'dependencies', '@lumal/icons'), '@lumal/core 应通过 dependencies 依赖 @lumal/icons')
assert(hasDependency(corePackage, 'dependencies', '@lumal/icons-vue'), '@lumal/core 应通过 dependencies 依赖 @lumal/icons-vue')
assert(hasDependency(corePackage, 'peerDependencies', 'element-plus'), '@lumal/core 应把 element-plus 放在 peerDependencies')
assert(!hasDependency(corePackage, 'dependencies', 'element-plus'), '@lumal/core 不能把 element-plus 放在 dependencies')
assert(!coreAllDependencies.has('@lumal/vben-compat'), '@lumal/core 不能依赖 @lumal/vben-compat')
assert(!coreAllDependencies.has('@lumal/charts'), '@lumal/core 不能依赖 @lumal/charts')

assert(hasDependency(compatPackage, 'dependencies', '@lumal/core'), '@lumal/vben-compat 应依赖 @lumal/core')
assert(!compatAllDependencies.has('element-plus'), '@lumal/vben-compat 不应直接依赖 element-plus')

assert(hasDependency(chartsPackage, 'peerDependencies', 'echarts'), '@lumal/charts 应把 echarts 放在 peerDependencies')
assert(!hasDependency(chartsPackage, 'dependencies', 'echarts'), '@lumal/charts 不能把 echarts 放在 dependencies')
assert(!chartsAllDependencies.has('@lumal/core'), '@lumal/charts 不应依赖 @lumal/core')
assert(hasDependency(datavPackage, 'peerDependencies', 'vue'), '@lumal/datav 应把 vue 放在 peerDependencies')
assert(hasDependency(datavPackage, 'peerDependencies', 'echarts'), '@lumal/datav 应把 echarts 放在 peerDependencies')
assert(hasDependency(datavPackage, 'dependencies', '@jiaminghi/charts'), '@lumal/datav config 模式应声明 @jiaminghi/charts 运行时依赖')
assert(datavAllDependencies.size === 3, '@lumal/datav 运行时依赖应仅包含 vue、echarts peer 与 @jiaminghi/charts')
assert(!hasDependency(datavPackage, 'dependencies', 'vue'), '@lumal/datav 不能把 vue 放在 dependencies')
assert(!hasDependency(datavPackage, 'dependencies', 'echarts'), '@lumal/datav 不能把 echarts 放在 dependencies')
assert(!hasDependency(datavPackage, 'optionalDependencies', 'vue'), '@lumal/datav 不能把 vue 放在 optionalDependencies')
for (const forbiddenName of ['@lumal/cockpit', '@lumal/charts', 'element-plus', '@jiaminghi/data-view', '@jiaminghi/c-render']) {
  assert(!datavAllDependencies.has(forbiddenName), `@lumal/datav 不能依赖 ${forbiddenName}`)
}
assert(viteAllDependencies.size === 0, '@lumal/vite 不应引入强制运行时依赖')

/***********************@lumal/cockpit 依赖边界*********************/
const cockpitAllDependencies = getDependencyNames(cockpitPackage, [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
])

assert(hasDependency(cockpitPackage, 'dependencies', '@lumal/core'), '@lumal/cockpit 应通过 dependencies 依赖 @lumal/core')
assert(hasDependency(cockpitPackage, 'dependencies', '@lumal/icons-vue'), '@lumal/cockpit 应通过 dependencies 依赖 @lumal/icons-vue')
assert(hasDependency(cockpitPackage, 'peerDependencies', 'vue'), '@lumal/cockpit 应把 vue 放在 peerDependencies')
assert(!cockpitAllDependencies.has('@lumal/charts'), '@lumal/cockpit 不能依赖 @lumal/charts')
assert(!coreAllDependencies.has('@lumal/cockpit'), '@lumal/core 不能反向依赖 @lumal/cockpit')
for (const forbiddenName of ['echarts', 'vue-echarts', 'openlayers', 'ol', 'cesium', 'mapbox-gl', 'leaflet']) {
  assert(!cockpitAllDependencies.has(forbiddenName), `@lumal/cockpit 不能依赖 ${forbiddenName}`)
}

for (const dependencyName of coreAllDependencies) {
  assert(!/^@intlify\//.test(dependencyName), `@lumal/core 不能默认依赖 ${dependencyName}`)
}

for (const forbiddenName of ['echarts', 'vue-echarts', 'vue-i18n', 'vxe-table', 'vxe-pc-ui', 'xe-utils']) {
  assert(!coreAllDependencies.has(forbiddenName), `@lumal/core 不能默认依赖 ${forbiddenName}`)
}

/***********************源码边界*********************/
const iconsFrameworkMatches = findTextMatches(
  join(packageDirs.icons, 'src'),
  /from ['"]vue['"]|@iconify\/vue|\.vue['"]?/,
)

for (const match of iconsFrameworkMatches) {
  errors.push(`@lumal/icons 源码出现框架依赖：${match}`)
}

const coreForbiddenMatches = findTextMatches(
  join(packageDirs.core, 'src'),
  /@lumal\/vben-compat|@lumal\/charts|@lumal\/cockpit|vue-i18n|@intlify\/|vxe-table|vxe-pc-ui|xe-utils|vue-echarts|from 'echarts'/,
)

for (const match of coreForbiddenMatches) {
  errors.push(`@lumal/core 源码出现禁止依赖标识：${match}`)
}

/***********************@lumal/cockpit 源码边界*********************/
// 包内不得导入地图/图表运行时或 @lumal/charts，也不得出现写死的引擎联合类型
const cockpitForbiddenMatches = findTextMatches(
  join(packageDirs.cockpit, 'src'),
  /@lumal\/charts|from 'echarts'|from "echarts"|openlayers|from 'ol|cesium|mapbox-gl|from 'leaflet/,
)

for (const match of cockpitForbiddenMatches) {
  errors.push(`@lumal/cockpit 源码出现禁止依赖标识：${match}`)
}

/***********************@lumal/datav 源码边界*********************/
const datavForbiddenMatches = findTextMatches(
  join(packageDirs.datav, 'src'),
  /@lumal\/cockpit|@lumal\/charts|from 'element-plus'|from "element-plus"/,
)

for (const match of datavForbiddenMatches) {
  errors.push(`@lumal/datav 源码出现禁止依赖标识：${match}`)
}

const appSourceAliasMatches = findTextMatches(
  join(rootDir, 'apps'),
  /\.\.\/\.\.\/packages|packages\/(?:icons|icons-vue|core|datav|cockpit|vben-compat|vite)\/src|packages\\(?:icons|icons-vue|core|datav|cockpit|vben-compat|vite)\\src/,
  new Set(),
  ['../../packages/vite/src/aliases'],
)

for (const match of appSourceAliasMatches) {
  errors.push(`apps 应通过包名消费 @lumal/*，不能直连包源码：${match}`)
}

const oldNameMatches = findTextMatches(rootDir, oldNamePattern, new Set([
  'docs/release-checklist.md',
  'apps/lumal-docs/src/reference/release-checklist.md',
  'scripts/check-release-boundaries.mjs',
]))

for (const match of oldNameMatches) {
  errors.push(`公开源码或文档仍包含旧名称/旧别名：${match}`)
}

/***********************检查结果*********************/
if (errors.length > 0) {
  console.error('Lumal 发布边界检查失败：')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('Lumal 发布边界检查通过。')
