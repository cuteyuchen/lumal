import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const adminPort = Number(process.env.LUMAL_E2E_ADMIN_PORT ?? 4174)
const mockApiPort = Number(process.env.LUMAL_E2E_API_PORT ?? 5321)
if ([adminPort, mockApiPort].some(port => !Number.isInteger(port) || port < 1 || port > 65535))
  throw new Error('E2E 端口必须是 1-65535 的整数')
const adminUrl = `http://127.0.0.1:${adminPort}`
const mockApiUrl = `http://127.0.0.1:${mockApiPort}`

export default defineConfig({
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  outputDir: '.playwright-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [['list']],
  retries: process.env.CI ? 1 : 0,
  testDir: 'apps/lumal-admin/e2e',
  timeout: 45_000,
  use: {
    baseURL: adminUrl,
    // 本机可使用已安装的 Chromium 系浏览器；CI 默认使用 Playwright 配套版本。
    channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL || undefined,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm exec nitro dev --host 127.0.0.1 --port ${mockApiPort}`,
      cwd: 'apps/lumal-mock-api',
      env: {
        MOCK_LOGIN_RATE_LIMIT: '1000',
        MOCK_RATE_LIMIT: '10000',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${mockApiUrl}/api/status`,
    },
    {
      command: `node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${adminPort} --strictPort`,
      cwd: 'apps/lumal-admin',
      env: {
        LUMAL_MOCK_API_TARGET: mockApiUrl,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: adminUrl,
    },
  ],
  workers: 1,
})
