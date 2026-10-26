import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createLumalAliases } from '../../packages/vite/src/aliases'
import { createAdminBuildInfo } from './build/app-info'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))
const elementPlusDataComponents = new Set(['pagination', 'table', 'table-v2', 'tree', 'tree-v2'])
const elementPlusFormComponents = new Set([
  'autocomplete',
  'cascader',
  'checkbox',
  'color-picker',
  'date-picker',
  'form',
  'input',
  'input-number',
  'radio',
  'rate',
  'select',
  'select-v2',
  'slider',
  'switch',
  'time-picker',
  'time-select',
  'transfer',
  'tree-select',
  'upload',
])
const elementPlusOverlayComponents = new Set([
  'dialog',
  'drawer',
  'message',
  'message-box',
  'notification',
  'popconfirm',
  'popover',
  'tooltip',
  'tour',
])

/***********************应用开发配置*********************/
export default defineConfig(({ command, isPreview, mode }) => ({
  define: {
    __LUMAL_ADMIN_BUILD_INFO__: JSON.stringify(createAdminBuildInfo(mode)),
  },
  plugins: [vue()],
  server: {
    // 固定端口，便于 admin 与 mock-api、datav-guide 之间的稳定联调
    port: 5170,
    strictPort: true,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: process.env.LUMAL_MOCK_API_TARGET || 'http://127.0.0.1:5320',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          // Vite 8 的分组不能递归吸入依赖，否则全局 Viewport 会被归入异步 Cockpit。
          includeDependenciesRecursively: false,
          groups: [{
            name(id) {
              const normalizedId = id.replaceAll('\\', '/')
              if (normalizedId.includes('/node_modules/echarts/lib/chart/'))
                return 'vendor-echarts-charts'
              if (normalizedId.includes('/node_modules/echarts/lib/component/'))
                return 'vendor-echarts-components'
              if (normalizedId.includes('/node_modules/echarts/'))
                return 'vendor-echarts-core'
              const elementPlusComponent = normalizedId.match(/\/element-plus\/es\/components\/([^/]+)\//)?.[1]
              if (elementPlusComponent && elementPlusDataComponents.has(elementPlusComponent))
                return 'vendor-element-plus-data'
              if (elementPlusComponent && elementPlusFormComponents.has(elementPlusComponent))
                return 'vendor-element-plus-form'
              if (elementPlusComponent && elementPlusOverlayComponents.has(elementPlusComponent))
                return 'vendor-element-plus-overlay'
              if (normalizedId.includes('/node_modules/element-plus/') || normalizedId.includes('/node_modules/@element-plus/'))
                return 'vendor-element-plus'
              if (normalizedId.includes('/node_modules/vue/') || normalizedId.includes('/node_modules/vue-router/') || normalizedId.includes('/node_modules/pinia/'))
                return 'vendor-vue'
              // 保留示例页的动态边界；不能把 DataV / Cockpit 合入首页依赖的 Core chunk。
              if (/\/(?:packages\/|node_modules\/@lumal\/)viewport\//.test(normalizedId))
                return 'vendor-viewport'
              if (/\/(?:packages\/|node_modules\/@lumal\/)datav\//.test(normalizedId))
                return 'vendor-lumal-datav'
              if (/\/(?:packages\/|node_modules\/@lumal\/)cockpit\//.test(normalizedId))
                return 'vendor-lumal-cockpit'
              if (normalizedId.includes('/packages/core/') || normalizedId.includes('/packages/icons') || /\/node_modules\/@lumal\/(?:core|icons|icons-vue)\//.test(normalizedId))
                return 'vendor-lumal'
            },
          }],
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
      ...(command === 'serve' && !isPreview
        ? createLumalAliases({
            packages: ['viewport', 'charts', 'core', 'datav', 'cockpit', 'icons', 'icons-vue'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
