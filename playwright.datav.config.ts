import { defineConfig, devices } from '@playwright/test'

const datavUrl = 'http://127.0.0.1:4176'

export default defineConfig({
  expect: {
    timeout: 8_000,
  },
  forbidOnly: true,
  fullyParallel: false,
  outputDir: '.playwright-results/datav',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: datavUrl,
        colorScheme: 'dark',
        reducedMotion: 'no-preference',
      },
    },
  ],
  reporter: [['list']],
  retries: 0,
  testDir: 'packages/datav/tests/visual',
  timeout: 45_000,
  webServer: {
    command: 'node node_modules/vite/bin/vite.js --config packages/datav/tests/visual/vite.config.ts --host 127.0.0.1 --port 4176',
    reuseExistingServer: false,
    timeout: 120_000,
    url: datavUrl,
  },
  workers: 1,
})
