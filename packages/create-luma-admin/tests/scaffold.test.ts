import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createLumaAdminProject } from '../src/scaffold'

/***********************测试目录*********************/
async function createTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'luma-create-'))
}

describe('createLumaAdminProject', () => {
  it('会生成使用公开包入口的最小 Luma Admin 应用', async () => {
    const tempDir = await createTempDir()
    const targetDir = join(tempDir, 'demo-admin')

    try {
      const result = await createLumaAdminProject({
        name: 'demo-admin',
        targetDir,
      })

      const packageJson = await readFile(join(targetDir, 'package.json'), 'utf8')
      const mainTs = await readFile(join(targetDir, 'src/main.ts'), 'utf8')
      const appVue = await readFile(join(targetDir, 'src/App.vue'), 'utf8')
      const routerTs = await readFile(join(targetDir, 'src/router/index.ts'), 'utf8')
      const loginView = await readFile(join(targetDir, 'src/views/auth/LoginView.vue'), 'utf8')
      const dashboardView = await readFile(join(targetDir, 'src/views/dashboard/DashboardView.vue'), 'utf8')
      const projectView = await readFile(join(targetDir, 'src/views/project/ProjectView.vue'), 'utf8')
      const forbiddenView = await readFile(join(targetDir, 'src/views/error/ForbiddenView.vue'), 'utf8')
      const notFoundView = await readFile(join(targetDir, 'src/views/error/NotFoundView.vue'), 'utf8')
      const preferencesService = await readFile(join(targetDir, 'src/services/preferences.ts'), 'utf8')
      const sessionService = await readFile(join(targetDir, 'src/services/session.ts'), 'utf8')
      const requestExample = await readFile(join(targetDir, 'src/composables/useMockRequestExample.ts'), 'utf8')
      const requestPanel = await readFile(join(targetDir, 'src/components/request/RequestExamplePanel.vue'), 'utf8')
      const stylesScss = await readFile(join(targetDir, 'src/styles.scss'), 'utf8')
      const viteConfig = await readFile(join(targetDir, 'vite.config.ts'), 'utf8')

      expect(result.createdFiles).toEqual([
        'index.html',
        'package.json',
        'src/App.vue',
        'src/components/app/AppHeaderActions.vue',
        'src/components/app/AppSettingsDrawer.vue',
        'src/components/request/RequestExamplePanel.vue',
        'src/composables/useMockRequestExample.ts',
        'src/main.ts',
        'src/router/index.ts',
        'src/services/access.ts',
        'src/services/preferences.ts',
        'src/services/session.ts',
        'src/styles.scss',
        'src/views/auth/LoginView.vue',
        'src/views/dashboard/DashboardView.vue',
        'src/views/error/ForbiddenView.vue',
        'src/views/error/NotFoundView.vue',
        'src/views/project/ProjectView.vue',
        'tsconfig.json',
        'vite.config.ts',
      ])
      expect(packageJson).toContain('"name": "demo-admin"')
      expect(packageJson).toContain('"@luma/core"')
      expect(packageJson).toContain('"element-plus"')
      expect(packageJson).toContain('"vue-router"')
      expect(mainTs).toContain('import { createLumaAdmin } from \'@luma/core\'')
      expect(mainTs).toContain('import { router } from \'./router\'')
      expect(mainTs).toContain('permissionStore,')
      expect(mainTs).toContain('locale: zhCn')
      expect(mainTs).toContain('import \'@luma/core/theme-chalk/index.scss\'')
      expect(mainTs).toContain('import \'@luma/core/style.css\'')
      expect(mainTs).toContain('router,')
      expect(appVue).toContain('<script setup lang="ts">')
      expect(appVue).toContain('/***********************页面状态*********************/')
      expect(appVue).toContain('LumaLayout')
      expect(appVue).toContain('LumaRouterView')
      expect(appVue).toContain('createAdminSidebarMenus')
      expect(appVue).toContain('AppSettingsDrawer')
      expect(appVue).toContain(':menus="allMenus"')
      expect(appVue).toContain(':preferences="adminPreferences"')
      expect(appVue).not.toContain('splitMenusByLayout')
      expect(appVue).not.toContain('top-menus')
      expect(appVue).toContain(':view-key="routeViewKey"')
      expect(appVue).toContain(':transition-name="adminPreferences.transition.name"')
      expect(appVue).toContain(':cache="routeViewCache"')
      expect(appVue).toContain('route-driven')
      expect(appVue).toContain(':route-tab-resolver="resolveAdminRouteTab"')
      expect(appVue).toContain(':tab-storage-key="adminTabSnapshotStorageKey"')
      expect(appVue).toContain('@tab-refresh="handleTabRefresh"')
      expect(appVue).toContain('app.dynamicTitle')
      expect(routerTs).not.toContain('createPermissionStore')
      expect(routerTs).toContain('setupPermissionGuard')
      expect(routerTs).toContain('createMenuRouteRuntime')
      expect(routerTs).not.toContain('createRouteRecords')
      expect(routerTs).not.toContain('normalizeMenuRecords')
      expect(routerTs).toContain('meta: {')
      expect(routerTs).toContain('authority: [\'dashboard:view\']')
      expect(routerTs).toContain('createAdminRouter')
      expect(routerTs).toContain('path: \'/login\'')
      expect(routerTs).toContain('component: NotFoundView')
      expect(routerTs).toContain('requireLoginByDefault: true')
      expect(routerTs).not.toContain('permissions: [\'project:list\']')
      expect(loginView).toContain('admin / luma123')
      expect(dashboardView).toContain('工作台指标')
      expect(dashboardView).toContain('RequestExamplePanel')
      expect(projectView).toContain('project:list')
      expect(forbiddenView).toContain('返回工作台')
      expect(notFoundView).toContain('页面不存在')
      expect(preferencesService).toContain('createPreferencesStore')
      expect(preferencesService).toContain('styleType: \'chrome\'')
      expect(preferencesService).toContain('persist: true')
      expect(preferencesService).toContain('visitHistory: true')
      expect(preferencesService).toContain('draggable: true')
      expect(preferencesService).toContain('wheelable: true')
      expect(preferencesService).toContain('middleClickToClose: true')
      expect(preferencesService).toContain('showMore: true')
      expect(preferencesService).toContain('showRefresh: true')
      expect(preferencesService).toContain('maxCount: 0')
      expect(preferencesService).toContain('dynamicTitle: true')
      expect(preferencesService).toContain('fontSize: 14')
      expect(preferencesService).toContain('globalSearch: true')
      expect(sessionService).toContain('createAuthSession')
      expect(sessionService).toContain('luma-admin:tabs')
      expect(sessionService).toContain('sessionStorage.removeItem')
      expect(requestExample).toContain('createRequestClient')
      expect(requestExample).toContain('getToken')
      expect(requestExample).toContain('onResponse')
      expect(requestPanel).toContain('<style scoped lang="scss">')
      expect(stylesScss).toContain('.luma-admin-home')
      expect(stylesScss).toContain('.luma-admin-page')
      expect(stylesScss).toContain('.luma-admin-login')
      expect(viteConfig).toContain('codeSplitting')
      expect(viteConfig).toContain('vendor-element-plus')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('目标目录非空时会拒绝覆盖已有文件', async () => {
    const tempDir = await createTempDir()

    try {
      await createLumaAdminProject({
        name: 'demo-admin',
        targetDir: tempDir,
      })

      await expect(createLumaAdminProject({
        name: 'demo-admin',
        targetDir: tempDir,
      })).rejects.toThrow('目标目录不是空目录')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })

  it('http 模式会生成接口环境变量和接入示例', async () => {
    const tempDir = await createTempDir()
    const targetDir = join(tempDir, 'http-admin')

    try {
      const result = await createLumaAdminProject({ apiMode: 'http', name: 'http-admin', targetDir })
      const requestService = await readFile(join(targetDir, 'src/services/request.ts'), 'utf8')
      const authApi = await readFile(join(targetDir, 'src/services/auth-api.ts'), 'utf8')
      const contract = await readFile(join(targetDir, 'API-CONTRACT.md'), 'utf8')

      expect(result.createdFiles).toEqual(expect.arrayContaining([
        '.env.development',
        '.env.production.example',
        'API-CONTRACT.md',
        'src/services/auth-api.ts',
        'src/services/request.ts',
      ]))
      expect(requestService).toContain('VITE_API_BASE_URL')
      expect(requestService).toContain('createAuthenticatedRequest')
      expect(authApi).toContain('/auth/refresh')
      expect(contract).toContain('业务协议写入 `@luma/core`')
    }
    finally {
      await rm(tempDir, { force: true, recursive: true })
    }
  })
})
