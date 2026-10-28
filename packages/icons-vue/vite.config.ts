import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const packageRoot = __dirname

/***********************包构建配置*********************/
export default defineConfig({
  plugins: [vue()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(packageRoot, 'src/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      // Morphicons 仅提供 ESM；保留动态 import，兼容 CJS 静态消费与按需加载。
      external: id => ['vue', '@iconify/vue', '@lumal/viewport'].includes(id) || /^@lumal\/icons(?:\/|$)/.test(id) || /^morphicons(?:\/|$)/.test(id),
    },
  },
})
