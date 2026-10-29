// @vitest-environment node
import type { AddressInfo } from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { describe, expect, it } from 'vitest'

describe('demo 同源 px 开关入口', () => {
  it('同一服务分别编译 vw 和 px，HTML 资源及 HMR 地址相互隔离', async () => {
    const root = fileURLToPath(new URL('../', import.meta.url))
    const server = await createServer({
      root,
      configFile: resolve(root, 'vite.config.ts'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, watch: null },
      optimizeDeps: { noDiscovery: true, include: [] },
    })
    try {
      await server.listen()
      const { port } = server.httpServer!.address() as AddressInfo
      const origin = `http://127.0.0.1:${port}`
      for (const [base, font, lineHeight] of [['/', '0.729167vw', '1.041667vw'], ['/px/', '14px', '20px']]) {
        const html = await fetch(`${origin}${base}?source=header`).then(response => response.text())
        expect(html).toContain(`src="${base}src/main.ts"`)
        expect(html).toContain(`src="${base}@vite/client"`)
        const css = await fetch(`${origin}${base}src/views/examples/viewport/ViewportCanvas.vue?vue&type=style&index=0&direct&lang.css`).then(response => response.text())
        expect(css).toContain(`font-size: ${font}`)
        expect(css).toContain(`line-height: ${lineHeight}`)
      }
      const client = await fetch(`${origin}/px/@vite/client`).then(response => response.text())
      expect(client).toContain('/px/__px_hmr')
    }
    finally {
      // 父服务关闭也必须释放 px 管线的 watcher、优化器和 WebSocket。
      await server.close()
    }
  }, 30_000)
})
