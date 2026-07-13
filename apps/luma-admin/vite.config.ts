import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createLumaAliases } from '../../packages/vite/src/aliases'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

/***********************应用开发配置*********************/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://127.0.0.1:5320',
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              maxSize: 420 * 1024,
              name: 'vendor-echarts',
              priority: 50,
              test: /node_modules[\\/](?:echarts|vue-echarts|zrender)[\\/]/,
            },
            {
              maxSize: 420 * 1024,
              name: 'vendor-element-plus',
              priority: 40,
              test: /node_modules[\\/]element-plus[\\/]/,
            },
            {
              maxSize: 420 * 1024,
              name: 'vendor-vue',
              priority: 30,
              test: /node_modules[\\/](?:@vue|pinia|vue|vue-router)[\\/]/,
            },
            {
              maxSize: 420 * 1024,
              name: 'vendor-luma',
              priority: 20,
              test: /[\\/]packages[\\/](?:charts|core|icons)[\\/](?:dist|src)[\\/]/,
            },
            {
              entriesAware: true,
              maxSize: 420 * 1024,
              name: 'vendor',
              priority: 10,
              test: /node_modules[\\/]/,
            },
          ],
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
            packages: ['charts', 'cockpit', 'core', 'icons'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
