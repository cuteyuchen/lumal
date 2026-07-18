import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createLumaAliases } from '../../packages/vite/src/aliases'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

/***********************应用开发配置*********************/
export default defineConfig(({ command }) => ({
  plugins: [vue()],
  server: {
    // 固定端口，便于 vben 兼容层示例稳定联调
    port: 5185,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              maxSize: 420 * 1024,
              name: 'vendor-element-plus',
              priority: 30,
              test: /node_modules[\\/]element-plus[\\/]/,
            },
            {
              maxSize: 420 * 1024,
              name: 'vendor-vue',
              priority: 20,
              test: /node_modules[\\/](?:@vue|vue)[\\/]/,
            },
            {
              maxSize: 420 * 1024,
              name: 'vendor-luma',
              priority: 10,
              test: /[\\/]packages[\\/](?:core|icons|icons-vue|vben-compat)[\\/](?:dist|src)[\\/]/,
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
            packages: ['core', 'icons', 'icons-vue', 'vben-compat'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
