import type { Plugin, ViteDevServer } from 'vite'
import { resolve } from 'node:path'
import { createServer } from 'vite'

/** Demo 同源对照入口；关闭转换必须重新编译，不能用运行时标记撤回已生成的 vw。 */
export function createAdminPxDemoPlugin(): Plugin {
  let pxServer: ViteDevServer | undefined
  return {
    name: 'lumal-admin-px-demo',
    apply: 'serve',
    async configureServer(server) {
      // 仅挂载真实 HTTP 服务；transformRequest 等无监听端口的消费者无需此入口。
      if (!server.httpServer)
        return
      pxServer = await createServer({
        root: server.config.root,
        configFile: resolve(server.config.root, 'vite.px.config.ts'),
        mode: server.config.mode,
        logLevel: server.config.logLevel,
        cacheDir: resolve(server.config.root, 'node_modules/.vite-px'),
        server: {
          middlewareMode: true,
          ws: { server: server.httpServer, path: '__px_hmr' },
          watch: server.config.server.watch,
        },
      })
      server.middlewares.use((request, response, next) => {
        if (request.url?.startsWith('/px/'))
          pxServer!.middlewares(request, response, next)
        else
          next()
      })
    },
    async closeBundle() {
      await pxServer?.close()
    },
  }
}
