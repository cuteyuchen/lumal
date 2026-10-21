import { defineConfig } from '@playwright/test'
import development from './playwright.config'

const adminUrl = 'http://127.0.0.1:4176'
const mockApiUrl = 'http://127.0.0.1:5323'

// 复用全部业务用例和严格诊断，仅替换服务为已经构建完成的发布产物。
export default defineConfig({
  ...development,
  forbidOnly: true,
  outputDir: '.playwright-results/release',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/release' }],
    ['json', { outputFile: '.playwright-results/release-report.json' }],
  ],
  retries: 0,
  metadata: {
    cockpitUrl: 'https://lumal-cockpit.cuteyuchen.top/',
    productionPreview: true,
  },
  use: { ...development.use, baseURL: adminUrl },
  webServer: [
    {
      command: 'node .output/server/index.mjs',
      cwd: 'apps/lumal-mock-api',
      env: {
        MOCK_LOGIN_RATE_LIMIT: '1000',
        MOCK_RATE_LIMIT: '10000',
        NITRO_HOST: '127.0.0.1',
        NITRO_PORT: '5323',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${mockApiUrl}/api/status`,
    },
    {
      command: 'node ../../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4176 --strictPort',
      cwd: 'apps/lumal-admin',
      env: { LUMAL_MOCK_API_TARGET: mockApiUrl },
      reuseExistingServer: false,
      timeout: 120_000,
      url: adminUrl,
    },
  ],
})
