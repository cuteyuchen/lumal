import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const packageRoot = __dirname

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(packageRoot, 'src/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['node:fs', 'node:path', 'node:process', '@vue/compiler-dom', '@vue/compiler-sfc', 'picomatch', 'postcss', 'postcss-load-config', 'postcss-selector-parser', 'postcss-value-parser'],
    },
  },
})
