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
        // runtime 与 designer 保持独立入口，只读驾驶舱可避免同步加载 Designer
        index: resolve(packageRoot, 'src/index.ts'),
        runtime: resolve(packageRoot, 'src/runtime/index.ts'),
        designer: resolve(packageRoot, 'src/designer/index.ts'),
        registry: resolve(packageRoot, 'src/registry/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`,
    },
    rollupOptions: {
      // vue / element-plus / @lumal/core / @lumal/icons-vue 作为外部依赖，不打进产物
      external: id => id === 'vue' || id === 'element-plus' || id === '@lumal/viewport' || id === '@lumal/icons-vue' || id === '@lumal/core' || id.startsWith('@lumal/core/'),
    },
  },
})
