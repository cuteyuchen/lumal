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
        auth: resolve(packageRoot, 'src/auth/index.ts'),
        components: resolve(packageRoot, 'src/exports/components.ts'),
        composables: resolve(packageRoot, 'src/composables/index.ts'),
        dictionary: resolve(packageRoot, 'src/dictionary/index.ts'),
        directives: resolve(packageRoot, 'src/directives/index.ts'),
        layout: resolve(packageRoot, 'src/layout/index.ts'),
        permission: resolve(packageRoot, 'src/permission/index.ts'),
        request: resolve(packageRoot, 'src/request/index.ts'),
        router: resolve(packageRoot, 'src/router/index.ts'),
        theme: resolve(packageRoot, 'src/theme/index.ts'),
        utils: resolve(packageRoot, 'src/utils/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      external: ['vue', '@luma/icons', 'element-plus', 'pinia', 'vue-router'],
    },
  },
})
