import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

const adminUrl = 'http://127.0.0.1:4174'
const mockApiUrl = 'http://127.0.0.1:5321'

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
  testDir: 'apps/luma-admin/e2e',
  timeout: 45_000,
  use: {
    baseURL: adminUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'pnpm exec nitro dev --host 127.0.0.1 --port 5321',
      cwd: 'apps/luma-mock-api',
      env: {
        MOCK_LOGIN_RATE_LIMIT: '1000',
        MOCK_RATE_LIMIT: '10000',
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${mockApiUrl}/api/status`,
    },
    {
      command: 'node ../../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4174',
      cwd: 'apps/luma-admin',
      env: {
        LUMA_MOCK_API_TARGET: mockApiUrl,
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: adminUrl,
    },
  ],
  workers: 1,
})
