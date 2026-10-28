// @vitest-environment node
import type { ViteDevServer } from 'vite'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer, normalizePath } from 'vite'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../', import.meta.url))
const runtimeLength = (value: number) => `calc(${value} * var(--lumal-viewport-unit, 1px))`

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

describe('工作区 vw 的真实 Vite 转换边界', () => {
  it('显式整页适配同时转换字体、最小尺寸、网格约束、间距和边框', async () => {
    await withAdminServer(async (server) => {
      const dashboard = await style(server, '/src/views/dashboard/DashboardView.vue', 'scss')
      expect(dashboard).toContain(`padding: ${runtimeLength(20)}`)
      expect(dashboard).toContain(`gap: ${runtimeLength(16)}`)
      expect(dashboard).toContain(`minmax(0, 2fr) minmax(${runtimeLength(280)}, 1fr)`)
      expect(dashboard).toContain(`font-size: calc(var(--lumal-font-size-base, ${runtimeLength(14)}) + ${runtimeLength(14)})`)
      expect(dashboard).toContain(`border: ${runtimeLength(1)} solid var(--el-border-color-lighter)`)
      expect(dashboard).toContain(':where(html[data-admin-viewport="vw"])')
      expect(dashboard).toContain(':where(html:not(html[data-admin-viewport="vw"]))')

      const user = await style(server, '/src/views/system/UserView.vue')
      expect(user).toContain(`padding: ${runtimeLength(16)}`)
      expect(user).toContain(`line-height: ${runtimeLength(20)}`)
      expect(user).toContain(`min-height: ${runtimeLength(32)}`)
      expect(user).toContain(`minmax(${runtimeLength(220)}, ${runtimeLength(260)}) minmax(0, 1fr)`)
      expect(user).toContain(`border: ${runtimeLength(1)} solid var(--el-border-color-lighter)`)

      const shared = await server.transformRequest('/src/styles.scss?direct')
      expect(shared).not.toBeNull()
      expect(shared!.code).toContain(`padding: ${runtimeLength(16)}`)
      expect(shared!.code).toContain(`gap: ${runtimeLength(12)}`)
      expect(shared!.code).toContain(`min-height: ${runtimeLength(40)}`)
    })
  }, 30_000)

  it('顶部导航和明确允许的 Element Plus 主题参与转换，固定图表和自管理画布仍排除', async () => {
    await withAdminServer(async (server) => {
      const header = await style(server, '/src/components/app/AppViewportModeSwitch.vue')
      expect(header).toContain(`width: ${runtimeLength(44)}`)
      expect(header).toContain(`height: ${runtimeLength(44)}`)
      expect(header).toContain(`width: ${runtimeLength(36)}`)
      expect(header).toContain('@media (max-width: 40vw)')

      const require = createRequire(import.meta.url)
      const themePath = require.resolve('element-plus/theme-chalk/el-dropdown.css')
      const theme = await server.transformRequest(`/@fs/${normalizePath(themePath)}?direct`)
      expect(theme).not.toBeNull()
      expect(theme!.code).toContain(`padding:${runtimeLength(5)} ${runtimeLength(16)}`)
      expect(theme!.code).toContain(`line-height:${runtimeLength(22)}`)
      const base = await server.transformRequest(`/@fs/${normalizePath(require.resolve('element-plus/theme-chalk/base.css'))}?direct`)
      expect(base!.code).toContain(`--el-font-size-base:${runtimeLength(14)}`)

      // 公共样式入口解析到真实工作区绝对路径，不能只验证 src 与 node_modules。
      const coreCss = await server.transformRequest(`/@fs/${normalizePath(require.resolve('@lumal/core/style.css'))}?direct`)
      expect(coreCss!.code).toContain(runtimeLength(4))
      expect(coreCss!.code).toContain('width<=40vw')
      expect(coreCss!.code).toContain(':where(html[data-admin-viewport="vw"])')

      const chart = await style(server, '/src/views/examples/ChartView.vue', 'scss')
      expect(chart).toMatch(/height:\s*340px/)
      expect(chart).not.toContain('var(--lumal-viewport-unit')

      const datav = await style(server, '/src/views/examples/DataVView.vue')
      expect(datav).toMatch(/height:\s*540px/)
      expect(datav).toMatch(/padding:\s*24px/)
      expect(datav).not.toContain('var(--lumal-viewport-unit')

      const cockpit = await style(server, '/src/views/examples/CockpitView.vue')
      expect(cockpit).toMatch(/height:\s*540px/)
      expect(cockpit).toMatch(/padding:\s*32px/)
      expect(cockpit).not.toContain('var(--lumal-viewport-unit')
    })
  }, 30_000)

  it('只转换 Vue 模板样式值，不改图表高度及表格列宽等组件属性', async () => {
    await withAdminServer(async (server) => {
      const result = await server.transformRequest('/src/views/examples/ChartPanelView.vue')
      expect(result).not.toBeNull()
      expect(result!.code).toContain(runtimeLength(160))
      expect(result!.code).toMatch(/\bheight:\s*["']320px["']/)
      expect(result!.code).toMatch(/["']min-width["']:\s*["']140["']/)
    })
  }, 30_000)
})
