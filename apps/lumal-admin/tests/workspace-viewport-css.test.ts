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
  it('转换自有页面与公共示例间距，保留字号、最小尺寸、网格约束和边框', async () => {
    await withAdminServer(async (server) => {
      const dashboard = await style(server, '/src/views/dashboard/DashboardView.vue', 'scss')
      expect(dashboard).toContain(`padding: ${runtimeLength(20)}`)
      expect(dashboard).toContain(`gap: ${runtimeLength(16)}`)
      expect(dashboard).toMatch(/grid-template-columns:\s*minmax\(0,\s*2fr\)\s*minmax\(280px,\s*1fr\)/)
      expect(dashboard).toContain('font-size: calc(var(--lumal-font-size-base, 14px) + 14px)')
      expect(dashboard).toMatch(/border:\s*1px solid var\(--el-border-color-lighter\)/)

      const user = await style(server, '/src/views/system/UserView.vue')
      expect(user).toContain(`padding: ${runtimeLength(16)}`)
      expect(user).toMatch(/line-height:\s*20px/)
      expect(user).toMatch(/min-height:\s*32px/)
      expect(user).toMatch(/grid-template-columns:\s*minmax\(220px,\s*260px\)\s*minmax\(0,\s*1fr\)/)
      expect(user).toMatch(/border:\s*1px solid var\(--el-border-color-lighter\)/)

      const shared = await server.transformRequest('/src/styles.scss?direct')
      expect(shared).not.toBeNull()
      expect(shared!.code).toContain(`padding: ${runtimeLength(16)}`)
      expect(shared!.code).toContain(`gap: ${runtimeLength(12)}`)
      expect(shared!.code).toMatch(/min-height:\s*40px/)
    })
  }, 30_000)

  it('顶部 Header 控件、固定图表高度和自管理大屏画布不参与工作区转换', async () => {
    await withAdminServer(async (server) => {
      const header = await style(server, '/src/components/app/AppViewportModeSwitch.vue')
      expect(header).toMatch(/width:\s*44px/)
      expect(header).toMatch(/height:\s*44px/)
      expect(header).toMatch(/width:\s*36px/)
      expect(header).not.toContain('var(--lumal-viewport-unit')

      const themePath = createRequire(import.meta.url).resolve('@lumal/core/theme-chalk/index.scss')
      const theme = await server.transformRequest(`/@fs/${normalizePath(themePath)}?direct`)
      expect(theme).not.toBeNull()
      expect(/\.el-dropdown-menu__item\s*\{[^}]*padding:\s*5px 16px/.test(theme!.code), '共享菜单保留整行点击区域').toBe(true)
      expect(/\.el-dropdown-menu__item\s*\{[^}]*line-height:\s*22px/.test(theme!.code), '共享菜单不跟随工作区缩放').toBe(true)
      expect(theme!.code).not.toContain('var(--lumal-viewport-unit')

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
