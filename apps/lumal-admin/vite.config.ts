import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { createLumalAliases, createViewportTransformPlugin } from '@lumal/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createAdminBuildInfo } from './build/app-info'
import { viewportDesign } from './viewport.config'

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
  plugins: [
    vue(),
    createViewportTransformPlugin({
      enabled: true,
      // 仅转换独立视口示例，不影响 Admin 布局、第三方组件或用户工作区策略。
      include: ['src/views/examples/viewport/**'],
      viewportWidth: viewportDesign.designWidth,
      output: 'runtime',
      inlineStyles: true,
      fontSize: false,
      minSize: false,
      excludeProperties: ['border*'],
    }),
  ],
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
      preserveEntrySignatures: false,
      output: {
        strictExecutionOrder: true,
        codeSplitting: {
          groups: [{
            // 仅 Lumal 边界禁止递归吸入；全局 Viewport 不能被归入异步 Cockpit。
            includeDependenciesRecursively: false,
            priority: 20,
            name(id) {
              const normalizedId = id.replaceAll('\\', '/')
              if (/\/(?:packages\/|node_modules\/@lumal\/)viewport\//.test(normalizedId))
                return 'vendor-viewport'
              if (/\/(?:packages\/|node_modules\/@lumal\/)datav\//.test(normalizedId))
                return 'vendor-lumal-datav'
              if (/\/(?:packages\/|node_modules\/@lumal\/)cockpit\//.test(normalizedId))
                return 'vendor-lumal-cockpit'
              if (normalizedId.includes('/packages/core/') || normalizedId.includes('/packages/icons') || /\/node_modules\/@lumal\/(?:core|icons|icons-vue)\//.test(normalizedId))
                return 'vendor-lumal'
            },
          }, {
            // ECharts 的注册依赖保留递归分组，避免按需图表页的初始化环。
            includeDependenciesRecursively: true,
            priority: 10,
            name(id) {
              const normalizedId = id.replaceAll('\\', '/')
              if (normalizedId.includes('/node_modules/echarts/lib/chart/'))
                return 'vendor-echarts-charts'
              if (normalizedId.includes('/node_modules/echarts/lib/component/'))
                return 'vendor-echarts-components'
              if (normalizedId.includes('/node_modules/echarts/'))
                return 'vendor-echarts-core'
            },
          }, {
            // UI 依赖保持显式分组，不能递归合并成超出原预算的单个 vendor。
            includeDependenciesRecursively: false,
            name(id) {
              const normalizedId = id.replaceAll('\\', '/')
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
