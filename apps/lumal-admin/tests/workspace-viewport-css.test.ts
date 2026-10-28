// @vitest-environment node
import type { ViteDevServer } from 'vite'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, normalizePath } from 'vite'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))
const length = (value: number) => `${Number((value / 1920 * 100).toFixed(6))}vw`

async function withAdminServer(check: (server: ViteDevServer) => Promise<void>) {
  // 加载应用实际配置，避免测试复制一份转换白名单后与消费者接线脱节。
  const server = await createServer({
    root,
    configFile: resolve(root, 'vite.config.ts'),
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    await check(server)
  }
  finally {
    await server.close()
  }
}

async function style(server: ViteDevServer, path: string, language = 'css') {
  const result = await server.transformRequest(`${path}?vue&type=style&index=0&direct&lang.${language}`)
  expect(result, `缺少样式转换结果：${path}`).not.toBeNull()
  return result!.code
}

describe('纯 vw 的真实 Vite 转换边界', () => {
  it('设计尺寸参与转换，物理细边框和媒体断点保持不变', async () => {
    await withAdminServer(async (server) => {
      const dashboard = await style(server, '/src/views/dashboard/DashboardView.vue', 'scss')
      expect(dashboard).toContain(`padding: ${length(20)}`)
      expect(dashboard).toContain(`gap: ${length(16)}`)
      expect(dashboard).toContain(`minmax(0, 2fr) minmax(${length(280)}, 1fr)`)
      expect(dashboard).toContain('font-size: calc(var(--lumal-font-size-base, 14px) * 2)')
      expect(dashboard).toContain('border: 1px solid var(--el-border-color-lighter)')
      expect(dashboard).toContain('@media (max-width: 1024px)')
      expect(dashboard).toContain('.is-responsive')
      expect(dashboard).not.toContain('--lumal-viewport-unit')

      const user = await style(server, '/src/views/system/UserView.vue')
      expect(user).toContain(`padding: ${length(16)}`)
      expect(user).toContain(`line-height: ${length(20)}`)
      expect(user).toContain(`min-height: ${length(32)}`)
      expect(user).toContain(`minmax(${length(220)}, ${length(260)}) minmax(0, 1fr)`)
      expect(user).toContain('border: 1px solid var(--el-border-color-lighter)')

      const shared = await server.transformRequest('/src/styles.scss?direct')
      expect(shared).not.toBeNull()
      expect(shared!.code).toContain(`padding: ${length(16)}`)
      expect(shared!.code).toContain(`gap: ${length(12)}`)
      expect(shared!.code).toContain(`min-height: ${length(40)}`)
    })
  }, 30_000)

  it('顶部导航、公共包和明确允许的 Element Plus 主题统一转换', async () => {
    await withAdminServer(async (server) => {
      const header = await style(server, '/src/components/app/AppHeaderActions.vue')
      expect(header).toContain(`width: ${length(44)}`)
      expect(header).toContain(`height: ${length(44)}`)
      expect(header).toContain(`width: ${length(36)}`)
      expect(header).toContain('@media (max-width: 768px)')

      const require = createRequire(import.meta.url)
      const themePath = require.resolve('element-plus/theme-chalk/el-dropdown.css')
      const theme = await server.transformRequest(`/@fs/${normalizePath(themePath)}?direct`)
      expect(theme).not.toBeNull()
      expect(theme!.code).toContain(`padding:${length(5)} ${length(16)}`)
      expect(theme!.code).toContain(`line-height:${length(22)}`)
      const base = await server.transformRequest(`/@fs/${normalizePath(require.resolve('element-plus/theme-chalk/base.css'))}?direct`)
      expect(base!.code).toContain(`--el-font-size-base:${length(14)}`)

      // 公共样式入口解析到真实工作区绝对路径，不能只验证 src 与 node_modules。
      const coreCss = await server.transformRequest(`/@fs/${normalizePath(require.resolve('@lumal/core/style.css'))}?direct`)
      expect(coreCss!.code).toContain(length(4))
      expect(coreCss!.code).toMatch(/(?:width\s*<=\s*768px|max-width:\s*768px)/)
      expect(coreCss!.code).toContain('.is-responsive')

      const chart = await style(server, '/src/views/examples/ChartView.vue', 'scss')
      expect(chart).toContain(`height: ${length(340)}`)

      const datav = await style(server, '/src/views/examples/DataVView.vue')
      expect(datav).toContain(`height: ${length(540)}`)
      expect(datav).toContain(`padding: ${length(24)}`)

      const cockpit = await style(server, '/src/views/examples/CockpitView.vue')
      expect(cockpit).toContain(`height: ${length(540)}`)
      expect(cockpit).toContain(`padding: ${length(32)}`)
    })
  }, 30_000)

  it('只转换 Vue 模板样式值，不改图表高度及表格列宽等组件属性', async () => {
    await withAdminServer(async (server) => {
      const result = await server.transformRequest('/src/views/examples/ChartPanelView.vue')
      expect(result).not.toBeNull()
      expect(result!.code).toContain(length(160))
      expect(result!.code).toMatch(/\bheight:\s*320/)
      expect(result!.code).toContain('viewport.pixels(140)')
    })
  }, 30_000)

  it('视口页与普通内容共用 vw，字号和行高同步，内层不再绑定单位或缩放', async () => {
    await withAdminServer(async (server) => {
      const page = await style(server, '/src/views/examples/ViewportView.vue')
      expect(page).toContain(`gap: ${length(12)}`)
      expect(page).toContain(`height: ${length(32)}`)
      const canvas = await style(server, '/src/views/examples/viewport/ViewportCanvas.vue')
      expect(canvas).toContain(`font-size: ${length(14)}`)
      expect(canvas).toContain(`line-height: ${length(20)}`)
      expect(canvas).toContain(`gap: ${length(24)}`)
      expect(canvas).not.toMatch(/--lumal-viewport-unit|transform:/)
    })
  }, 30_000)
})
