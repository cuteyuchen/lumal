import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { createLumalAliases } from '../../packages/vite/src/aliases'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

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
