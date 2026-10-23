import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const maxAdminChunkSize = 500 * 1024
const maxDatavCssSize = 60 * 1024
const maxDatavEsSize = 80 * 1024

const requiredArtifacts = [
  'packages/viewport/dist/index.js',
  'packages/viewport/dist/index.cjs',
  'packages/viewport/dist/src/index.d.ts',
  'packages/icons/dist/index.js',
  'packages/icons/dist/index.cjs',
  'packages/icons/dist/morph.js',
  'packages/icons/dist/morph.cjs',
  'packages/icons/dist/src/morph/index.d.ts',
  'packages/icons-vue/dist/index.js',
  'packages/icons-vue/dist/index.cjs',
  'packages/icons-vue/dist/icons-vue.css',
  'packages/core/dist/index.js',
  'packages/core/dist/index.cjs',
  'packages/core/dist/minimal.js',
  'packages/core/dist/minimal.cjs',
  'packages/core/dist/core.css',
  'packages/charts/dist/index.js',
  'packages/charts/dist/index.cjs',
  'packages/datav/dist/index.js',
  'packages/datav/dist/index.cjs',
  'packages/datav/dist/datav.css',
  'packages/cockpit/dist/index.js',
  'packages/cockpit/dist/index.cjs',
  'packages/cockpit/dist/cockpit.css',
  'packages/cockpit/dist/runtime.js',
  'packages/cockpit/dist/designer.js',
  'packages/vben-compat/dist/index.js',
  'packages/vben-compat/dist/index.cjs',
  'packages/vben-compat/dist/v5.js',
  'packages/vben-compat/dist/v5.cjs',
  'packages/vben-compat/dist/v5-router.js',
  'packages/vben-compat/dist/v5-router.cjs',
  'packages/vben-compat/dist/legacy.js',
  'packages/vben-compat/dist/legacy.cjs',
  'packages/vben-compat/dist/vben-compat.css',
  'packages/vben-compat/dist/src/v5/index.d.ts',
  'packages/vben-compat/dist/src/v5/router.d.ts',
  'packages/vben-compat/dist/src/legacy.d.ts',
  'packages/vite/dist/index.js',
  'packages/vite/dist/index.cjs',
  'packages/create-lumal-admin/dist/index.js',
  'packages/create-lumal-admin/dist/cli.js',
  'packages/create-lumal-admin/dist/project-cli.js',
  'packages/create-lumal-admin/templates/base/package.json',
  'packages/create-lumal-admin/templates/modes/http/src/app/services/data-source.ts',
  'packages/create-lumal-admin/templates/features/system/src/modules/system/module.ts',
  'packages/create-lumal-admin/templates/vben-compatible/src/modules/vben-migration/module.ts',
  'apps/lumal-admin/dist/index.html',
]

const datavComponentEntries = [
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
]

for (const entry of datavComponentEntries) {
  requiredArtifacts.push(`packages/datav/dist/${entry}.js`, `packages/datav/dist/${entry}.cjs`)
}

const errors = requiredArtifacts
  .filter(relativePath => !existsSync(join(rootDir, relativePath)))
  .map(relativePath => `缺少构建产物：${relativePath}`)

const datavSizeLimits = [
  ['packages/datav/dist/datav.css', maxDatavCssSize, 'CSS', '60 KiB'],
]

for (const [relativePath, maxSize, label, readableMaxSize] of datavSizeLimits) {
  const filePath = join(rootDir, relativePath)

  if (existsSync(filePath)) {
    const size = statSync(filePath).size

    if (size > maxSize) {
      errors.push(`@lumal/datav ${label} 超过 ${readableMaxSize}：${relativePath} (${size} bytes)`)
    }
  }
}

const datavDistDir = join(rootDir, 'packages/datav/dist')
const datavEsArtifacts = existsSync(datavDistDir)
  ? readdirSync(datavDistDir).filter(fileName => fileName.endsWith('.js'))
  : []

for (const fileName of datavEsArtifacts) {
  const filePath = join(datavDistDir, fileName)
  const size = statSync(filePath).size
  if (size > maxDatavEsSize) {
    errors.push(`@lumal/datav ES JS 超过 80 KiB：packages/datav/dist/${fileName} (${size} bytes)`)
  }
}

const adminAssetsDir = join(rootDir, 'apps/lumal-admin/dist/assets')
const javascriptAssets = existsSync(adminAssetsDir)
  ? readdirSync(adminAssetsDir)
      .filter(fileName => fileName.endsWith('.js'))
      .map(fileName => ({
        fileName,
        size: statSync(join(adminAssetsDir, fileName)).size,
      }))
  : []

for (const asset of javascriptAssets) {
  if (asset.size > maxAdminChunkSize) {
    errors.push(`Admin JS 块超过 500 KB：${asset.fileName} (${asset.size} bytes)`)
  }
}

for (const vendorName of ['vendor-echarts', 'vendor-element-plus', 'vendor-lumal']) {
  if (!javascriptAssets.some(asset => asset.fileName.startsWith(vendorName))) {
    errors.push(`Admin 缺少明确分包：${vendorName}`)
  }
}

if (javascriptAssets.length === 0) {
  errors.push('Admin 未生成 JavaScript 产物')
}

if (errors.length > 0) {
  console.error('Lumal 发布产物检查失败：')
  errors.forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

const largestAsset = javascriptAssets.sort((left, right) => right.size - left.size)[0]
console.log(`Lumal 发布产物检查通过。Admin 最大 JS 块：${largestAsset.fileName} (${largestAsset.size} bytes)。`)
