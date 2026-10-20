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
        'index': resolve(packageRoot, 'src/index.ts'),
        'legacy': resolve(packageRoot, 'src/legacy.ts'),
        'v5': resolve(packageRoot, 'src/v5/index.ts'),
        'v5-router': resolve(packageRoot, 'src/v5/router.ts'),
      },
      formats: ['es', 'cjs'],
      cssFileName: 'vben-compat',
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      external: id => id === 'vue' || id === '@lumal/core' || id.startsWith('@lumal/core/') || id === '@lumal/icons-vue',
    },
  },
})
