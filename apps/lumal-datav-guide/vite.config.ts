import { fileURLToPath, URL } from 'node:url'
import { createLumalAliases, createViewportTransformPlugin } from '@lumal/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

/***********************DataV 指南应用配置*********************/
// 独立示例应用，作为 @lumal/datav 的组件文档站，可静态托管并以外链形式嵌入 Admin。
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [vue(), createViewportTransformPlugin({ enabled: true, include: ['src/**'], viewportWidth: 1920, dependencies: ['element-plus'], customProperties: true })],
  server: {
    // 固定端口，admin 通过 VITE_DATAV_GUIDE_URL(默认 5175) 外链嵌入本站
    port: 5175,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('/@vue/') || id.includes('node_modules/vue-router'))
            return 'vendor-vue'
          if (id.includes('node_modules/element-plus') || id.includes('node_modules/@element-plus'))
            return 'vendor-element-plus'
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender'))
            return 'vendor-echarts'
          if (id.includes('/packages/datav/'))
            return 'vendor-datav'
          if (id.includes('/packages/core/') || id.includes('/packages/icons/') || id.includes('/packages/icons-vue/'))
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
            packages: ['core', 'datav', 'icons', 'icons-vue'],
            workspaceRoot,
          })
        : []),
    ],
  },
}))
