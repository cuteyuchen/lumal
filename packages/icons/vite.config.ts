import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const packageRoot = __dirname

/***********************包构建配置*********************/
export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(packageRoot, 'src/index.ts'),
        morph: resolve(packageRoot, 'src/morph/index.ts'),
        vite: resolve(packageRoot, 'src/vite/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      // 可选 ESM 引擎只通过动态 import 加载，根入口与 CJS 不静态依赖它。
      external: id => /^morphicons(?:\/|$)/.test(id),
    },
  },
})
