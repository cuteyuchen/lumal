import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'

export interface CreateLumaAdminProjectOptions {
  name: string
  targetDir: string
}

export interface CreateLumaAdminProjectResult {
  targetDir: string
  createdFiles: string[]
}

interface TemplateFile {
  path: string
  content: string
}

/***********************项目名称*********************/
function normalizePackageName(name: string): string {
  const normalizedName = name
    .trim()
    .toLowerCase()
    .replaceAll('\\', '/')
    .split('/')
    .filter(Boolean)
    .at(-1)
    ?.replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalizedName || 'luma-admin'
}

function resolveProjectName(options: CreateLumaAdminProjectOptions): string {
  return normalizePackageName(options.name || basename(options.targetDir))
}

/***********************模板内容*********************/
function createPackageJson(projectName: string): string {
  return `${JSON.stringify({
    name: projectName,
    type: 'module',
    version: '0.0.0',
    private: true,
    scripts: {
      dev: 'vite --host 127.0.0.1',
      build: 'vue-tsc --noEmit -p tsconfig.json && vite build',
      preview: 'vite preview --host 127.0.0.1',
    },
    dependencies: {
      '@luma/core': '^0.0.0',
      '@luma/icons': '^0.0.0',
      'element-plus': '^2.11.0',
      'vue': '^3.5.0',
      'vue-router': '^4.5.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^6.0.1',
      'typescript': '^6.0.0',
      'vite': '^8.0.0',
      'vue-tsc': '^3.1.1',
    },
  }, null, 2)}\n`
}

function createIndexHtml(): string {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Luma Admin</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`
}

function createTsConfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "useDefineForClassFields": true,
    "resolveJsonModule": true,
    "types": ["vite/client"],
    "isolatedModules": true,
    "skipLibCheck": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.vue",
    "vite.config.ts"
  ]
}
`
}

function createViteConfig(): string {
  return `import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/***********************应用开发配置*********************/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
`
}

function createMainTs(): string {
  return `import type { IconDefinition } from '@luma/icons'
import { createLumaAdmin } from '@luma/core'
import App from './App.vue'
import { router } from './router'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons/style.css'
import './styles.scss'

/***********************本地图标定义*********************/
const localIcons: IconDefinition[] = [
  {
    key: 'app:dashboard',
    label: '控制台',
    source: 'local-svg',
    svgText: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/></svg>',
  },
]

/***********************应用启动*********************/
createLumaAdmin({
  rootComponent: App,
  router,
  icons: {
    localSvg: localIcons,
  },
}).mount('#app')
`
}

function createAppVue(): string {
  return `<script setup lang="ts">
import type { LumaLayoutMenuItem, LumaLayoutTabItem } from '@luma/core/layout'
import { LumaLayout, LumaRouterView } from '@luma/core/layout'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createAdminSidebarMenus,
  createAdminTabs,
} from './router'

/***********************页面状态*********************/
const title = 'Luma Admin'
const collapsed = shallowRef(false)

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()

const menus = computed<LumaLayoutMenuItem[]>(() => createAdminSidebarMenus())
const tabs = computed<LumaLayoutTabItem[]>(() => createAdminTabs(route.path))
const activePath = computed({
  get: () => route.path,
  set: (path: string) => {
    if (path !== route.path) {
      void router.push(path)
    }
  },
})

/***********************导航事件*********************/
function handleMenuSelect(path: string): void {
  activePath.value = path
}

function handleTabChange(path: string): void {
  activePath.value = path
}
</script>

<template>
  <LumaLayout
    v-model:collapsed="collapsed"
    v-model:active-tab-path="activePath"
    :title="title"
    :menus="menus"
    :tabs="tabs"
    :active-menu-path="activePath"
    @menu-select="handleMenuSelect"
    @tab-change="handleTabChange"
  >
    <template #headerActions>
      <span class="luma-admin-home__status">Mini</span>
    </template>

    <LumaRouterView />
  </LumaLayout>
</template>
`
}

function createRouterTs(): string {
  return `import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { LumaMenuRecord, SidebarMenuItem } from '@luma/core/router'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { createPermissionStore, setupPermissionGuard } from '@luma/core/permission'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuRecords,
} from '@luma/core/router'
import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/dashboard/DashboardView.vue'
import ForbiddenView from '../views/error/ForbiddenView.vue'
import ProjectView from '../views/project/ProjectView.vue'

/***********************权限状态*********************/
export const permissionStore = createPermissionStore({
  permissions: ['dashboard:view'],
  roles: ['admin'],
})

/***********************菜单配置*********************/
export const adminRouteRecords: LumaMenuRecord[] = [
  {
    component: 'dashboard/index',
    name: 'Dashboard',
    path: '/dashboard',
    meta: {
      authority: ['dashboard:view'],
      icon: 'app:dashboard',
      order: 1,
      title: '工作台',
    },
  },
  {
    component: 'project/index',
    name: 'Project',
    path: '/project',
    meta: {
      authority: ['project:list'],
      icon: 'app:dashboard',
      order: 2,
      title: '项目管理',
    },
  },
  {
    component: 'error/forbidden',
    name: 'Forbidden',
    path: '/403',
    meta: {
      hideInMenu: true,
      title: '无权限',
    },
  },
]

export const normalizedAdminMenus = normalizeMenuRecords(adminRouteRecords)

/***********************菜单生成*********************/
function hasPermission(permissions: string[]): boolean {
  return permissionStore.hasPermission(permissions, 'every')
}

function hasRole(roles: string[]): boolean {
  return permissionStore.hasRole(roles, 'every')
}

function flattenMenuTabs(menus: SidebarMenuItem[]): LumaLayoutTabItem[] {
  return menus.flatMap((menu) => {
    if (menu.children.length > 0) {
      return flattenMenuTabs(menu.children)
    }

    return {
      path: menu.path,
      title: menu.title,
    }
  })
}

export function createAdminSidebarMenus(): SidebarMenuItem[] {
  return createSidebarMenus(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })
}

export function createAdminTabs(activePath?: string): LumaLayoutTabItem[] {
  const tabs = flattenMenuTabs(createAdminSidebarMenus())

  if (activePath === '/403' && !tabs.some(tab => tab.path === '/403')) {
    tabs.push({
      closable: false,
      path: '/403',
      title: '无权限',
    })
  }

  return tabs
}

/***********************路由创建*********************/
function resolveRouteComponent(component: string): RouteRecordRaw['component'] | undefined {
  const components: Record<string, RouteRecordRaw['component']> = {
    'dashboard/index': DashboardView,
    'error/forbidden': ForbiddenView,
    'project/index': ProjectView,
  }

  return components[component]
}

function createRoutes(): RouteRecordRaw[] {
  const firstAccessibleMenu = findFirstAccessibleMenu(normalizedAdminMenus, {
    hasPermission,
    hasRole,
  })
  const menuRoutes = createRouteRecords(normalizedAdminMenus, {
    componentResolver: resolveRouteComponent,
  }) as RouteRecordRaw[]

  return [
    {
      path: '/',
      redirect: firstAccessibleMenu?.path ?? '/403',
    },
    ...menuRoutes,
    {
      path: '/:pathMatch(.*)*',
      redirect: firstAccessibleMenu?.path ?? '/403',
    },
  ]
}

export function createAdminRouter(history: RouterHistory = createWebHashHistory()): Router {
  const router = createRouter({
    history,
    routes: createRoutes(),
  })

  setupPermissionGuard(router, permissionStore, {
    mode: 'every',
    noAccessRedirect: '/403',
    roleMode: 'every',
  })

  return router
}

export const router = createAdminRouter()
`
}

function createDashboardViewVue(): string {
  return `<script setup lang="ts">
import type {
  CrudTablePageChangePayload,
  CrudTableResetPayload,
  CrudTableSearchPayload,
  SchemaFormItem,
  SchemaFormModel,
  SchemaTableColumn,
  SchemaTableRow,
} from '@luma/core/components'
import {
  LumaCrudTable,
  LumaIcon,
} from '@luma/core/components'
import { onMounted, shallowRef } from 'vue'
import RequestExamplePanel from '../../components/request/RequestExamplePanel.vue'
import { useMockRequestExample } from '../../composables/useMockRequestExample'

/***********************页面状态*********************/
const title = 'Luma Admin'
const description = '轻量 Vue Admin 框架基线已启动'

/***********************表单配置*********************/
const formModel = shallowRef<SchemaFormModel>({
  id: 'demo-001',
  name: 'Luma 示例项目',
  status: 'enabled',
})

const schemas: SchemaFormItem[] = [
  {
    field: 'id',
    label: 'ID',
    component: 'hidden',
  },
  {
    field: 'name',
    label: '项目名称',
    component: 'input',
    placeholder: '请输入项目名称',
  },
  {
    field: 'status',
    label: '状态',
    component: 'select',
    options: [
      { label: '启用', value: 'enabled' },
      { label: '停用', value: 'disabled' },
    ],
  },
]

/***********************表格配置*********************/
const tableColumns: SchemaTableColumn[] = [
  {
    field: 'name',
    label: '项目名称',
  },
  {
    field: 'status',
    label: '状态',
    formatter: value => value === 'enabled' ? '启用' : '停用',
  },
]

const tableRows: SchemaTableRow[] = [
  {
    id: 'demo-001',
    name: 'Luma 示例项目',
    status: 'enabled',
  },
]

/***********************分页状态*********************/
const page = shallowRef(1)
const pageSize = shallowRef(10)
const paginationMessage = shallowRef('当前展示示例数据')

/***********************请求示例*********************/
const {
  authorizationHeader,
  lastUrl,
  loadProjectSummary,
  loading: requestLoading,
  message: requestMessage,
  projectName,
  projectStatus,
  sessionExpiredCount,
  status: requestStatus,
  tokenInjected,
} = useMockRequestExample()

onMounted(() => {
  void loadProjectSummary()
})

/***********************事件处理*********************/
function handleSearch(payload: CrudTableSearchPayload): void {
  paginationMessage.value = \`查询项目：\${String(payload.name ?? '') || '全部'}\`
}

function handleReset(_payload: CrudTableResetPayload): void {
  paginationMessage.value = '已重置查询条件'
}

function handlePaginationChange(payload: CrudTablePageChangePayload): void {
  paginationMessage.value = \`第 \${payload.page} 页，每页 \${payload.pageSize} 条\`
}
</script>

<template>
  <main class="luma-admin-home">
    <LumaCrudTable
      v-model:query-model="formModel"
      v-model:page="page"
      v-model:page-size="pageSize"
      class="luma-admin-home__crud"
      :title="title"
      :description="description"
      :query-schemas="schemas"
      :columns="tableColumns"
      :rows="tableRows"
      row-key="id"
      :total="35"
      :page-sizes="[10, 20]"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePaginationChange"
    >
      <template #actions>
        <LumaIcon name="app:dashboard" color="#1677ff" :size="36" />
      </template>

      <template #default>
        <span class="luma-admin-home__pagination-text">
          {{ paginationMessage }}
        </span>
      </template>
    </LumaCrudTable>

    <RequestExamplePanel
      :authorization-header="authorizationHeader"
      :last-url="lastUrl"
      :loading="requestLoading"
      :message="requestMessage"
      :project-name="projectName"
      :project-status="projectStatus"
      :session-expired-count="sessionExpiredCount"
      :status="requestStatus"
      :token-injected="tokenInjected"
      @refresh="loadProjectSummary"
    />
  </main>
</template>
`
}

function createProjectViewVue(): string {
  return `<script setup lang="ts">
import { LumaPage } from '@luma/core/components'

/***********************页面数据*********************/
const features = [
  '菜单节点来自后端菜单格式',
  '路由记录由 @luma/core/router 生成',
  '权限不足会通过守卫进入 403 页面',
]
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="项目管理"
      description="这是一个需要 project:list 权限的路由页面。"
    >
      <ul class="luma-admin-page__list">
        <li
          v-for="feature in features"
          :key="feature"
          class="luma-admin-page__item"
        >
          {{ feature }}
        </li>
      </ul>
    </LumaPage>
  </main>
</template>
`
}

function createForbiddenViewVue(): string {
  return `<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

/***********************路由操作*********************/
const router = useRouter()

function handleBackDashboardClick(): void {
  void router.push('/dashboard')
}
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage
      title="无权限"
      description="当前账号没有访问该页面所需的权限。"
    >
      <ElButton type="primary" @click="handleBackDashboardClick">
        返回工作台
      </ElButton>
    </LumaPage>
  </main>
</template>
`
}

function createRequestExampleTs(): string {
  return `import type { RequestContext } from '@luma/core/request'
import { createRequestClient } from '@luma/core/request'
import { computed, readonly, shallowRef } from 'vue'

export type RequestExampleStatus = 'error' | 'idle' | 'loading' | 'success'

interface ProjectSummary {
  id: string
  name: string
  status: 'disabled' | 'enabled'
  updatedAt: string
}

interface ApiResponse<TData> {
  code: number
  data: TData
  message: string
}

/***********************Mock 服务*********************/
function createJsonResponse<TData>(payload: ApiResponse<TData>, init?: ResponseInit): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      'content-type': 'application/json',
    },
    status: 200,
    ...init,
  })
}

function resolveRequestUrl(input: Parameters<typeof fetch>[0]): string {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.toString()
  }

  return input.url
}

/***********************请求示例*********************/
export function useMockRequestExample() {
  const status = shallowRef<RequestExampleStatus>('idle')
  const message = shallowRef('等待发起请求')
  const lastUrl = shallowRef('-')
  const authorizationHeader = shallowRef('未请求')
  const sessionExpiredCount = shallowRef(0)
  const project = shallowRef<ProjectSummary | null>(null)

  const mockFetch: typeof fetch = async (input, init) => {
    lastUrl.value = resolveRequestUrl(input)
    authorizationHeader.value = new Headers(init?.headers).get('Authorization') ?? '未注入'

    return createJsonResponse({
      code: 0,
      data: {
        id: 'demo-001',
        name: 'Luma 示例项目',
        status: 'enabled',
        updatedAt: '2026-07-09 21:00',
      },
      message: 'ok',
    })
  }

  const request = createRequestClient({
    baseURL: '/mock-api',
    fetch: mockFetch,
    getToken: () => 'mock-token-001',
    onResponse: <TResult>(context: RequestContext) => {
      const payload = context.data as ApiResponse<ProjectSummary>

      if (payload.code !== 0) {
        throw new Error(payload.message || '请求失败')
      }

      return payload.data as TResult
    },
    onSessionExpired: () => {
      sessionExpiredCount.value += 1
    },
  })

  const loading = computed(() => status.value === 'loading')
  const projectName = computed(() => project.value?.name ?? '暂无数据')
  const projectStatus = computed(() => project.value?.status === 'enabled' ? '启用' : '停用')
  const tokenInjected = computed(() => authorizationHeader.value.startsWith('Bearer '))

  async function loadProjectSummary(): Promise<void> {
    status.value = 'loading'
    message.value = '正在请求项目摘要'

    try {
      project.value = await request.get<ProjectSummary>('/projects/summary', {
        query: {
          scene: 'admin-demo',
        },
      })
      status.value = 'success'
      message.value = '请求成功，已完成 token 注入和响应解析'
    }
    catch (error) {
      status.value = 'error'
      message.value = error instanceof Error ? error.message : '请求失败'
    }
  }

  return {
    authorizationHeader: readonly(authorizationHeader),
    lastUrl: readonly(lastUrl),
    loadProjectSummary,
    loading,
    message: readonly(message),
    project: readonly(project),
    projectName,
    projectStatus,
    sessionExpiredCount: readonly(sessionExpiredCount),
    status: readonly(status),
    tokenInjected,
  }
}
`
}

function createRequestPanelVue(): string {
  return `<script setup lang="ts">
import type { RequestExampleStatus } from '../../composables/useMockRequestExample'
import { ElButton, ElTag } from 'element-plus'
import { computed } from 'vue'

interface Props {
  authorizationHeader: string
  lastUrl: string
  loading: boolean
  message: string
  projectName: string
  projectStatus: string
  sessionExpiredCount: number
  status: RequestExampleStatus
  tokenInjected: boolean
}

interface Emits {
  refresh: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/***********************展示状态*********************/
const statusLabel = computed(() => {
  const labels: Record<RequestExampleStatus, string> = {
    error: '失败',
    idle: '待请求',
    loading: '请求中',
    success: '成功',
  }

  return labels[props.status]
})

const statusType = computed(() => props.status === 'error' ? 'danger' : props.status === 'success' ? 'success' : 'info')
</script>

<template>
  <section class="luma-request-panel">
    <div class="luma-request-panel__header">
      <div class="luma-request-panel__title-group">
        <span class="luma-request-panel__eyebrow">Request Client</span>
        <h2 class="luma-request-panel__title">
          请求封装示例
        </h2>
      </div>

      <ElButton
        type="primary"
        :loading="loading"
        @click="emit('refresh')"
      >
        重新请求
      </ElButton>
    </div>

    <div class="luma-request-panel__meta">
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">状态</span>
        <ElTag :type="statusType">
          {{ statusLabel }}
        </ElTag>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">项目</span>
        <strong class="luma-request-panel__value">{{ projectName }}</strong>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">业务状态</span>
        <strong class="luma-request-panel__value">{{ projectStatus }}</strong>
      </div>
      <div class="luma-request-panel__item">
        <span class="luma-request-panel__label">Token</span>
        <strong class="luma-request-panel__value">{{ tokenInjected ? '已注入' : '未注入' }}</strong>
      </div>
    </div>

    <dl class="luma-request-panel__details">
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          请求地址
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ lastUrl }}
        </dd>
      </div>
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          Authorization
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ authorizationHeader }}
        </dd>
      </div>
      <div class="luma-request-panel__detail">
        <dt class="luma-request-panel__detail-label">
          会话过期次数
        </dt>
        <dd class="luma-request-panel__detail-value">
          {{ sessionExpiredCount }}
        </dd>
      </div>
    </dl>

    <p class="luma-request-panel__message">
      {{ message }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.luma-request-panel {
  box-sizing: border-box;
  width: min(920px, 100%);
  padding: 24px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.luma-request-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.luma-request-panel__title-group {
  display: grid;
  gap: 6px;
}

.luma-request-panel__eyebrow {
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.luma-request-panel__title {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 700;
}

.luma-request-panel__meta {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}

.luma-request-panel__item {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f8fafc;
}

.luma-request-panel__label,
.luma-request-panel__detail-label {
  color: #64748b;
  font-size: 12px;
}

.luma-request-panel__value {
  overflow: hidden;
  color: #111827;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-request-panel__details {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
}

.luma-request-panel__detail {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.luma-request-panel__detail-value {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #334155;
  font-family:
    "JetBrains Mono",
    Consolas,
    monospace;
  font-size: 13px;
}

.luma-request-panel__message {
  margin: 18px 0 0;
  color: #475569;
  font-size: 13px;
}

@media (max-width: 760px) {
  .luma-request-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .luma-request-panel__meta {
    grid-template-columns: 1fr;
  }

  .luma-request-panel__detail {
    grid-template-columns: 1fr;
  }
}
</style>
`
}

function createStylesScss(): string {
  return `:root {
  color: #1f2937;
  background: #f5f7fb;
  font-family:
    Inter,
    "Segoe UI",
    "Microsoft YaHei",
    Arial,
    sans-serif;
}

body {
  margin: 0;
}

.luma-admin-home {
  display: grid;
  gap: 24px;
  box-sizing: border-box;
  padding: 32px;
}

.luma-admin-home__crud {
  max-width: 920px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.luma-admin-home__pagination-text {
  display: block;
  padding-top: 12px;
  color: #6b7280;
  font-size: 13px;
}

.luma-admin-home__status {
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.luma-admin-page {
  box-sizing: border-box;
  padding: 32px;
}

.luma-admin-page__list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
}

.luma-admin-page__item {
  color: #334155;
  font-size: 14px;
  line-height: 1.6;
}
`
}

function createTemplateFiles(projectName: string): TemplateFile[] {
  return [
    { path: 'index.html', content: createIndexHtml() },
    { path: 'package.json', content: createPackageJson(projectName) },
    { path: 'src/App.vue', content: createAppVue() },
    { path: 'src/components/request/RequestExamplePanel.vue', content: createRequestPanelVue() },
    { path: 'src/composables/useMockRequestExample.ts', content: createRequestExampleTs() },
    { path: 'src/main.ts', content: createMainTs() },
    { path: 'src/router/index.ts', content: createRouterTs() },
    { path: 'src/styles.scss', content: createStylesScss() },
    { path: 'src/views/dashboard/DashboardView.vue', content: createDashboardViewVue() },
    { path: 'src/views/error/ForbiddenView.vue', content: createForbiddenViewVue() },
    { path: 'src/views/project/ProjectView.vue', content: createProjectViewVue() },
    { path: 'tsconfig.json', content: createTsConfig() },
    { path: 'vite.config.ts', content: createViteConfig() },
  ]
}

/***********************目录写入*********************/
async function assertEmptyTargetDir(targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true })

  const entries = await readdir(targetDir)

  if (entries.length > 0) {
    throw new Error('目标目录不是空目录')
  }
}

async function writeTemplateFile(targetDir: string, file: TemplateFile): Promise<void> {
  const filePath = join(targetDir, file.path)
  const directoryPath = dirname(filePath)

  if (directoryPath) {
    await mkdir(directoryPath, { recursive: true })
  }

  await writeFile(filePath, file.content, 'utf8')
}

/***********************公开 API*********************/
export async function createLumaAdminProject(
  options: CreateLumaAdminProjectOptions,
): Promise<CreateLumaAdminProjectResult> {
  const targetDir = resolve(options.targetDir)
  const projectName = resolveProjectName(options)
  const templateFiles = createTemplateFiles(projectName)

  await assertEmptyTargetDir(targetDir)

  for (const file of templateFiles) {
    await writeTemplateFile(targetDir, file)
  }

  return {
    targetDir,
    createdFiles: templateFiles.map(file => file.path),
  }
}
