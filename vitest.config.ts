import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    // 避免多包质量门禁同时转换 Element Plus 时耗尽本地或 CI 内存。
    maxWorkers: 4,
    // Element Plus 的 async-validator 为 CJS；由 Vite 转换，保持与生产构建相同的默认导入语义。
    server: { deps: { inline: ['element-plus'] } },
  },
})
