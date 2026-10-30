// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile } from 'vite'
import { describe, expect, it } from 'vitest'
import cockpit from '../playwright.cockpit.config'
import development from '../playwright.config'
import datav from '../playwright.datav.config'
import release from '../playwright.release.config'

describe('production browser acceptance configuration', () => {
  it('cockpit 保留全部生产用例、零重试及 DOM/网络 trace，不以超时增长掩盖失败', () => {
    expect(cockpit.testDir).toBe('apps/lumal-cockpit/e2e')
    expect(cockpit.forbidOnly).toBe(true)
    expect(cockpit.grep).toBeUndefined()
    expect(cockpit.retries).toBe(0)
    expect(cockpit.workers).toBe(1)
    expect(cockpit.timeout).toBe(90_000)
    expect(cockpit.use).toMatchObject({
      screenshot: 'only-on-failure',
      trace: { mode: 'retain-on-failure', screenshots: false, snapshots: true, sources: true },
    })
  })

  it('cockpit 使用平台原生软件渲染后端，不缩小生产视口', () => {
    expect(cockpit.projects?.[0]?.use).toMatchObject({
      viewport: { width: 1920, height: 1080 },
      launchOptions: {
        args: process.platform === 'win32'
          ? ['--use-angle=d3d11-warp']
          : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      },
    })
  })

  it('dataV 视觉门禁固定单 worker，禁止 only 与重试掩盖不稳定', () => {
    expect(datav.forbidOnly).toBe(true)
    expect(datav.retries).toBe(0)
    expect(datav.workers).toBe(1)
    expect(datav.testDir).toBe('packages/datav/tests/visual')
  })

  it('复用完整用例，服务只启动 Admin dist 与独立 Mock Node 产物', () => {
    expect(release.testDir).toBe(development.testDir)
    expect(release.grep).toBeUndefined()
    expect(release.retries).toBe(0)
    expect(release.forbidOnly).toBe(true)
    expect(release.use).toMatchObject({ screenshot: 'only-on-failure', trace: 'retain-on-failure' })
    expect(release.webServer).toEqual([
      expect.objectContaining({
        command: 'node .output/server/index.mjs',
        env: expect.objectContaining({ NITRO_HOST: '127.0.0.1', NITRO_PORT: '5323' }),
        reuseExistingServer: false,
        url: 'http://127.0.0.1:5323/api/status',
      }),
      expect.objectContaining({
        command: expect.stringContaining('vite.js preview --host 127.0.0.1 --port 4176 --strictPort'),
        env: { LUMAL_MOCK_API_TARGET: 'http://127.0.0.1:5323' },
        reuseExistingServer: false,
        url: 'http://127.0.0.1:4176',
      }),
    ])
  })

  it.each([
    { command: 'serve' as const, isPreview: true },
    { command: 'build' as const, isPreview: false },
  ])('构建与 preview 均不解析工作区源码 alias（$command / $isPreview）', async ({ command, isPreview }) => {
    const config = await loadConfigFromFile(
      { command, isPreview, mode: 'production' },
      fileURLToPath(new URL('../apps/lumal-admin/vite.config.ts', import.meta.url)),
    )
    expect(config?.config.resolve?.alias).toEqual([
      expect.objectContaining({ find: '@' }),
    ])
    expect(config?.config.server?.proxy).toHaveProperty('/api')
    // 未覆写 preview.proxy 时由 Vite 继承 server.proxy，实际连通性由 E2E 登录验证。
    expect(config?.config.preview?.proxy).toBeUndefined()
  })
})
