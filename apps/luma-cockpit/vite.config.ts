import type { Target } from 'vite-plugin-static-copy'
import { relative } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, normalizePath } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { createLumaAliases } from '../../packages/vite/src/aliases'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const appRoot = fileURLToPath(new URL('.', import.meta.url))
const cesiumBaseUrl = 'cesiumStatic'
const cesiumSource = normalizePath(fileURLToPath(new URL('./node_modules/cesium/Build/Cesium', import.meta.url)))
const cesiumDirectories = ['ThirdParty', 'Workers', 'Assets', 'Widgets'] as const

function createCesiumCopyTarget(directory: typeof cesiumDirectories[number]): Target {
  const sourceDirectory = `${cesiumSource}/${directory}`
  const stripBase = normalizePath(relative(appRoot, sourceDirectory)).split('/').length
  return {
    src: `${sourceDirectory}/**/*`,
    dest: `${cesiumBaseUrl}/${directory}`,
    rename: { stripBase },
  }
}

/***********************独立驾驶舱应用配置*********************/
// 独立应用自行决定第三方依赖的分包与静态资源策略，不进入 @luma/cockpit 发布检查。
export default defineConfig(({ command }) => ({
  define: {
    CESIUM_BASE_URL: JSON.stringify(`./${cesiumBaseUrl}/`),
  },
  server: {
    // 固定端口，便于独立驾驶舱应用稳定联调
    port: 5180,
    strictPort: true,
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: cesiumDirectories.map(createCesiumCopyTarget),
    }),
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('/@vue/'))
            return 'vendor-vue'
          if (id.includes('node_modules/element-plus'))
            return 'vendor-element-plus'
          if (id.includes('node_modules/echarts') || id.includes('node_modules/vue-echarts'))
            return 'vendor-echarts'
          if (id.includes('/packages/core/') || id.includes('/packages/icons/') || id.includes('/packages/icons-vue/') || id.includes('/packages/charts/') || id.includes('/packages/datav/'))
            return 'vendor-luma'
        },
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
      ...(command === 'serve'
        ? createLumaAliases({
            packages: ['charts', 'cockpit', 'core', 'datav', 'icons', 'icons-vue'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
