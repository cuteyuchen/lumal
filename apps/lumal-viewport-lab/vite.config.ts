import { createViewportTransformPlugin } from '@lumal/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), createViewportTransformPlugin({ enabled: true, include: ['src/**'], viewportWidth: 1920, dependencies: ['element-plus'] })],
})
