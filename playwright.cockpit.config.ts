import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

// 只启动已构建的产物；不得借开发 alias 掩盖缺失声明或静态资源。
export default defineConfig({
  testDir: 'apps/lumal-cockpit/e2e',
  outputDir: 'output/playwright/cockpit',
  reporter: [['list'], ['json', { outputFile: 'output/playwright/cockpit-report.json' }]],
  fullyParallel: false,
  forbidOnly: true,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
      launchOptions: {
        // Windows 使用原生 WARP 软件后端，避免 SwiftShader 的全幅读回阻塞输入；不依赖宿主 GPU。
        args: process.platform === 'win32'
          ? ['--use-angle=d3d11-warp']
          : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      },
    },
  }],
  use: {
    baseURL: 'http://127.0.0.1:4182',
    // DOM/网络 trace 与失败截图保留，不持续抓取软件 GPU 的高分辨率逐帧截图。
    trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true },
    screenshot: 'only-on-failure',
  },
  metadata: { productionPreview: true },
  webServer: {
    command: 'node ../../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4182 --strictPort',
    cwd: 'apps/lumal-cockpit',
    url: 'http://127.0.0.1:4182',
    timeout: 60_000,
    reuseExistingServer: false,
  },
})
