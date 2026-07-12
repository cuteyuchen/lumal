import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const maxAdminChunkSize = 500 * 1024

const requiredArtifacts = [
  'packages/icons/dist/index.js',
  'packages/icons/dist/index.cjs',
  'packages/core/dist/index.js',
  'packages/core/dist/index.cjs',
  'packages/core/dist/core.css',
  'packages/charts/dist/index.js',
  'packages/charts/dist/index.cjs',
  'packages/cockpit/dist/index.js',
  'packages/cockpit/dist/index.cjs',
  'packages/cockpit/dist/cockpit.css',
  'packages/cockpit/dist/runtime.js',
  'packages/cockpit/dist/designer.js',
  'packages/vben-compat/dist/index.js',
  'packages/vben-compat/dist/index.cjs',
  'packages/vite/dist/index.js',
  'packages/vite/dist/index.cjs',
  'packages/create-luma-admin/dist/index.js',
  'packages/create-luma-admin/dist/cli.js',
  'apps/luma-admin/dist/index.html',
]

const errors = requiredArtifacts
  .filter(relativePath => !existsSync(join(rootDir, relativePath)))
  .map(relativePath => `缺少构建产物：${relativePath}`)

const adminAssetsDir = join(rootDir, 'apps/luma-admin/dist/assets')
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

for (const vendorName of ['vendor-echarts', 'vendor-element-plus', 'vendor-luma']) {
  if (!javascriptAssets.some(asset => asset.fileName.startsWith(vendorName))) {
    errors.push(`Admin 缺少明确分包：${vendorName}`)
  }
}

if (javascriptAssets.length === 0) {
  errors.push('Admin 未生成 JavaScript 产物')
}

if (errors.length > 0) {
  console.error('Luma 发布产物检查失败：')
  errors.forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

const largestAsset = javascriptAssets.sort((left, right) => right.size - left.size)[0]
console.log(`Luma 发布产物检查通过。Admin 最大 JS 块：${largestAsset.fileName} (${largestAsset.size} bytes)。`)
