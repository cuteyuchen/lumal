// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { loadConfigFromFile } from 'vite'
import { describe, expect, it } from 'vitest'
import development from '../playwright.config'
import release from '../playwright.release.config'

describe('production browser acceptance configuration', () => {
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
