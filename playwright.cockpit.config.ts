import { defineConfig, devices } from '@playwright/test'

// 只启动已构建的产物；不得借开发 alias 掩盖缺失声明或静态资源。
export default defineConfig({
  testDir: 'apps/lumal-cockpit/e2e',
  outputDir: 'output/playwright/cockpit',
  reporter: [['list'], ['json', { outputFile: 'output/playwright/cockpit-report.json' }]],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
      launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    },
  }],
  use: { baseURL: 'http://127.0.0.1:4182', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  metadata: { productionPreview: true },
  webServer: {
    command: 'node ../../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4182 --strictPort',
    cwd: 'apps/lumal-cockpit',
    url: 'http://127.0.0.1:4182',
    timeout: 60_000,
    reuseExistingServer: false,
  },
})
