import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { createAdminBuildInfo } from './build/app-info'

const testBuildInfo = createAdminBuildInfo('test')

export default defineConfig({
  define: {
    '__LUMAL_ADMIN_BUILD_INFO__': JSON.stringify(testBuildInfo),
    '__LUMAL_VERSION_INFO__': JSON.stringify({
      buildId: testBuildInfo.buildId,
      builtAt: testBuildInfo.builtAt,
      commit: testBuildInfo.commit,
      version: testBuildInfo.version,
    }),
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://127.0.0.1:5321/api'),
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    fileParallelism: false,
    globalSetup: ['./tests/global-setup.ts'],
    globals: true,
  },
})
