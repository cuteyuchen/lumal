import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createLumalAliases } from '../../packages/vite/src/aliases'

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
export default defineConfig(({ command }) => ({
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
        manualChunks(id) {
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
          if (normalizedId.includes('/packages/core/') || normalizedId.includes('/packages/icons') || normalizedId.includes('/node_modules/@lumal/'))
            return 'vendor-lumal'
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
        ? createLumalAliases({
            packages: ['charts', 'core', 'icons', 'icons-vue'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
