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
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import { router } from './router'
import '@luma/core/theme-chalk/index.scss'
import '@luma/core/style.css'
import '@luma/icons/style.css'
import 'element-plus/dist/index.css'
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
const framework = createLumaAdmin({
  elementPlus: {
    plugin: ElementPlus,
    options: { locale: zhCn },
  },
  rootComponent: App,
  router,
  icons: {
    localSvg: localIcons,
  },
})

await framework.mount('#app')
`
}

function createAppVue(): string {
  return `<script setup lang="ts">
import type { LumaPreferences } from '@luma/core/theme'
import {
  LumaLayout,
  LumaRouterView,
  resolveActiveTopMenuPath,
  splitMenusByLayout,
} from '@luma/core/layout'
import { computed, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeaderActions from './components/app/AppHeaderActions.vue'
import AppSettingsDrawer from './components/app/AppSettingsDrawer.vue'
import { createAdminSidebarMenus, createAdminTabs } from './router'
import {
  adminPreferenceDefaults,
  adminPreferences,
  adminResolvedThemeMode,
  patchAdminPreferences,
} from './services/preferences'
import { currentUser, logout } from './services/session'

/***********************页面状态*********************/
const title = 'Luma Admin'
const settingsVisible = shallowRef(false)

/***********************路由状态*********************/
const route = useRoute()
const router = useRouter()
const isPublicLayout = computed(() => route.meta.layout === 'public')
const collapsed = computed({
  get: () => adminPreferences.value.sidebar.collapsed,
  set: collapsed => patchAdminPreferences({ sidebar: { collapsed } }),
})

const allMenus = computed(() => createAdminSidebarMenus())
const activeTopMenuPath = computed(() => resolveActiveTopMenuPath(allMenus.value, route.path))
const layoutMenus = computed(() => splitMenusByLayout({
  activeTopMenuPath: activeTopMenuPath.value,
  layout: adminPreferences.value.app.layout,
  menus: allMenus.value,
}))
const menus = computed(() => adminPreferences.value.sidebar.enable ? layoutMenus.value.sidebarMenus : [])
const topMenus = computed(() => layoutMenus.value.topMenus)
const tabs = computed(() => adminPreferences.value.tabbar.enable ? createAdminTabs(route.path) : [])
const routeViewKey = computed(() => route.fullPath)
const topMenuMode = computed(() => adminPreferences.value.app.layout === 'mixed-nav' ? 'flat' : 'tree')
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

function handlePreferencesChange(preferences: LumaPreferences): void {
  patchAdminPreferences(preferences)
}

function toggleTheme(): void {
  patchAdminPreferences({
    theme: {
      mode: adminResolvedThemeMode.value === 'dark' ? 'light' : 'dark',
    },
  })
}

async function handleLogout(): Promise<void> {
  logout()
  await router.replace('/login')
}
</script>

<template>
  <LumaRouterView
    v-if="isPublicLayout"
    :view-key="routeViewKey"
    transition
    transition-name="fade"
  />

  <LumaLayout
    v-else
    v-model:collapsed="collapsed"
    v-model:active-tab-path="activePath"
    :title="title"
    :menus="menus"
    :top-menus="topMenus"
    :tabs="tabs"
    :active-menu-path="activePath"
    :active-top-menu-path="activeTopMenuPath"
    :header-menu-align="adminPreferences.header.menuAlign"
    :header-menu-max-width="adminPreferences.header.menuMaxWidth"
    :show-tab-icons="adminPreferences.tabbar.showIcon"
    :show-tab-maximize="adminPreferences.tabbar.showMaximize"
    :sidebar-width="\`\${adminPreferences.sidebar.width}px\`"
    :tabs-visible="adminPreferences.tabbar.enable"
    :top-menu-mode="topMenuMode"
    @menu-select="handleMenuSelect"
    @top-menu-select="handleMenuSelect"
    @tab-change="handleTabChange"
  >
    <template #headerActions>
      <AppHeaderActions
        :resolved-theme-mode="adminResolvedThemeMode"
        :user-name="currentUser?.name"
        @logout="handleLogout"
        @open-settings="settingsVisible = true"
        @toggle-theme="toggleTheme"
      />
    </template>

    <LumaRouterView
      :view-key="routeViewKey"
      :progress="true"
      :loading="true"
      :cache="adminPreferences.tabbar.cache"
      :cache-max="8"
      :transition="adminPreferences.transition.enable"
      :transition-name="adminPreferences.transition.name"
    />
  </LumaLayout>

  <AppSettingsDrawer
    v-model:visible="settingsVisible"
    :defaults="adminPreferenceDefaults"
    :preferences="adminPreferences"
    @change="handlePreferencesChange"
    @reset="handlePreferencesChange"
    @update:preferences="handlePreferencesChange"
  />
</template>
`
}

function createRouterTs(): string {
  return `import type { LumaLayoutTabItem } from '@luma/core/layout'
import type { LumaMenuRecord, SidebarMenuItem } from '@luma/core/router'
import type { Router, RouteRecordRaw, RouterHistory } from 'vue-router'
import { setupPermissionGuard } from '@luma/core/permission'
import {
  createRouteRecords,
  createSidebarMenus,
  findFirstAccessibleMenu,
  normalizeMenuRecords,
} from '@luma/core/router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { permissionStore } from '../services/access'
import { isAuthenticated } from '../services/session'
import LoginView from '../views/auth/LoginView.vue'
import DashboardView from '../views/dashboard/DashboardView.vue'
import ForbiddenView from '../views/error/ForbiddenView.vue'
import NotFoundView from '../views/error/NotFoundView.vue'
import ProjectView from '../views/project/ProjectView.vue'

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
  const tabs = flattenMenuTabs(createAdminSidebarMenus()).map(tab => ({
    ...tab,
    closable: false,
  }))

  if (['/403', '/404'].includes(activePath ?? '') && !tabs.some(tab => tab.path === activePath)) {
    tabs.push({
      closable: false,
      path: activePath!,
      title: activePath === '/403' ? '无权限' : '页面不存在',
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
      component: LoginView,
      meta: { layout: 'public' },
      name: 'Login',
      path: '/login',
    },
    {
      path: '/',
      redirect: firstAccessibleMenu?.path ?? '/403',
    },
    ...menuRoutes,
    {
      component: NotFoundView,
      meta: { title: '页面不存在' },
      name: 'NotFound',
      path: '/:pathMatch(.*)*',
    },
  ]
}

export function createAdminRouter(history: RouterHistory = createWebHashHistory()): Router {
  const router = createRouter({
    history,
    routes: createRoutes(),
  })

  setupPermissionGuard(router, permissionStore, {
    isAuthenticated,
    loginPath: '/login',
    mode: 'every',
    noAccessRedirect: '/403',
    requireLoginByDefault: true,
    roleMode: 'every',
    whiteList: ['/login'],
  })

  return router
}

export const router = createAdminRouter()
`
}

function createDashboardViewVue(): string {
  return `<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { onMounted } from 'vue'
import RequestExamplePanel from '../../components/request/RequestExamplePanel.vue'
import { useMockRequestExample } from '../../composables/useMockRequestExample'

const metrics = [
  { label: '待处理任务', value: 12, description: '今日需要跟进的事项' },
  { label: '运行服务', value: 6, description: '当前在线的业务服务' },
  { label: '本周发布', value: 3, description: '已完成的版本发布' },
  { label: '系统告警', value: 0, description: '当前无未处理告警' },
]

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

</script>

<template>
  <main class="luma-admin-home">
    <LumaPage
      title="工作台"
      description="这是脚手架生成的轻量后台首页，可替换为你的业务指标和快捷入口。"
    >
      <section class="luma-admin-home__metrics" aria-label="工作台指标">
        <article v-for="metric in metrics" :key="metric.label" class="luma-admin-home__metric">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.description }}</small>
        </article>
      </section>
    </LumaPage>

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

function createNotFoundViewVue(): string {
  return `<script setup lang="ts">
import { LumaPage } from '@luma/core/components'
import { ElButton } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <main class="luma-admin-page">
    <LumaPage title="页面不存在" description="请检查地址，或返回工作台继续操作。">
      <ElButton type="primary" @click="router.push('/dashboard')">
        返回工作台
      </ElButton>
    </LumaPage>
  </main>
</template>
`
}

function createLoginViewVue(): string {
  return `<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'
import { reactive, shallowRef, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../../services/session'

const route = useRoute()
const router = useRouter()
const formRef = useTemplateRef<FormInstance>('formRef')
const loading = shallowRef(false)
const errorMessage = shallowRef('')
const form = reactive({ username: 'admin', password: 'luma123' })

function resolveRedirect(): string {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect
  return redirect && redirect.startsWith('/') && !redirect.startsWith('/login') ? redirect : '/dashboard'
}

async function handleSubmit(): Promise<void> {
  if (loading.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const valid = await formRef.value?.validate()
    if (valid === false) {
      return
    }

    await login(form)
    await router.replace(resolveRedirect())
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="luma-admin-login">
    <section class="luma-admin-login__panel">
      <div class="luma-admin-login__brand" aria-hidden="true">L</div>
      <h1>Luma Admin</h1>
      <p>轻量后台基座</p>

      <ElForm ref="formRef" :model="form" label-position="top" @submit.prevent="handleSubmit">
        <ElFormItem label="用户名" prop="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <ElInput v-model="form.username" autocomplete="username" />
        </ElFormItem>
        <ElFormItem label="密码" prop="password" :rules="[{ required: true, message: '请输入密码' }]">
          <ElInput v-model="form.password" type="password" show-password autocomplete="current-password" />
        </ElFormItem>
        <p v-if="errorMessage" class="luma-admin-login__error" role="alert">
          {{ errorMessage }}
        </p>
        <ElButton native-type="submit" type="primary" :loading="loading">
          登录
        </ElButton>
      </ElForm>

      <small>演示账号：admin / luma123</small>
    </section>
  </main>
</template>
`
}

function createAccessTs(): string {
  return `import { createPermissionStore } from '@luma/core/permission'

export const permissionStore = createPermissionStore()

export function syncAccess(authenticated: boolean): void {
  if (!authenticated) {
    permissionStore.clear()
    return
  }

  permissionStore.setPermissions(['dashboard:view', 'project:list'])
  permissionStore.setRoles(['admin'])
}
`
}

function createSessionTs(): string {
  return `import { createAuthSession } from '@luma/core/auth'
import { readonly, shallowRef } from 'vue'
import { syncAccess } from './access'

export interface LoginPayload {
  password: string
  username: string
}

export interface AdminUser {
  name: string
  username: string
}

const userStorageKey = 'luma-admin:user'
const currentUserState = shallowRef<AdminUser | null>(null)

function readStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(userStorageKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminUser
  }
  catch {
    localStorage.removeItem(userStorageKey)
    return null
  }
}

function clearSessionState(): void {
  currentUserState.value = null
  localStorage.removeItem(userStorageKey)
  syncAccess(false)
}

export const session = createAuthSession({
  onSessionExpired: clearSessionState,
  tokenKey: 'luma-admin:token',
})

const storedUser = session.isAuthenticated() ? readStoredUser() : null
currentUserState.value = storedUser
syncAccess(Boolean(storedUser))

export const currentUser = readonly(currentUserState)

export function isAuthenticated(): boolean {
  return session.isAuthenticated() && Boolean(currentUserState.value)
}

export async function login(payload: LoginPayload): Promise<AdminUser> {
  await Promise.resolve()
  if (payload.username !== 'admin' || payload.password !== 'luma123') {
    throw new Error('用户名或密码错误')
  }

  const user = { name: '管理员', username: payload.username }
  session.setSession({ accessToken: 'luma-demo-token' })
  currentUserState.value = user
  localStorage.setItem(userStorageKey, JSON.stringify(user))
  syncAccess(true)
  return user
}

export async function logout(): Promise<void> {
  await session.logout()
}
`
}

function createPreferencesTs(): string {
  return `import type { LumaPreferencesDefaults } from '@luma/core/theme'
import { createPreferencesStore } from '@luma/core/theme'

export const adminPreferenceDefaults = {
  app: { layout: 'sidebar-nav' },
  sidebar: { width: 220 },
  tabbar: { cache: true, enable: true, maxCount: 8, showIcon: true, showMaximize: true },
  transition: { enable: true, name: 'fade-side' },
} satisfies LumaPreferencesDefaults

const preferencesStore = createPreferencesStore({
  defaults: adminPreferenceDefaults,
  storage: localStorage,
  storageKey: 'luma-admin:preferences',
})

export const adminPreferences = preferencesStore.state
export const adminResolvedThemeMode = preferencesStore.resolvedThemeMode

export function patchAdminPreferences(preferences: Parameters<typeof preferencesStore.patch>[0]): void {
  preferencesStore.patch(preferences)
}
`
}

function createHeaderActionsVue(): string {
  return `<script setup lang="ts">
import type { ResolvedThemeMode } from '@luma/core/theme'
import { ElButton } from 'element-plus'

withDefaults(defineProps<{
  resolvedThemeMode: ResolvedThemeMode
  userName?: string
}>(), {
  userName: '管理员',
})

defineEmits<{
  logout: []
  openSettings: []
  toggleTheme: []
}>()
</script>

<template>
  <div class="luma-admin-header-actions">
    <ElButton text :aria-label="resolvedThemeMode === 'dark' ? '切换浅色模式' : '切换深色模式'" @click="$emit('toggleTheme')">
      主题
    </ElButton>
    <ElButton text aria-label="主题与布局设置" @click="$emit('openSettings')">
      设置
    </ElButton>
    <span>{{ userName }}</span>
    <ElButton text aria-label="退出登录" @click="$emit('logout')">
      退出
    </ElButton>
  </div>
</template>
`
}

function createSettingsDrawerVue(): string {
  return `<script setup lang="ts">
import type { LumaPreferences, LumaPreferencesDefaults } from '@luma/core/theme'
import { LumaThemeSettingsPanel } from '@luma/core/theme'
import { ElDrawer } from 'element-plus'
import { computed } from 'vue'

const props = defineProps<{
  defaults: LumaPreferencesDefaults
  preferences: LumaPreferences
  visible: boolean
}>()

const emit = defineEmits<{
  change: [preferences: LumaPreferences]
  reset: [preferences: LumaPreferences]
  'update:preferences': [preferences: LumaPreferences]
  'update:visible': [visible: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})
</script>

<template>
  <ElDrawer v-model="visible" title="主题与布局设置" size="420px" append-to-body>
    <LumaThemeSettingsPanel
      :defaults="defaults"
      :preferences="preferences"
      @change="$emit('change', $event)"
      @reset="$emit('reset', $event)"
      @update:preferences="$emit('update:preferences', $event)"
    />
  </ElDrawer>
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
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: var(--luma-shadow-card);
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
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.luma-request-panel__title {
  margin: 0;
  color: var(--el-text-color-primary);
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
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-light);
}

.luma-request-panel__label,
.luma-request-panel__detail-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.luma-request-panel__value {
  overflow: hidden;
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-regular);
  font-family:
    "JetBrains Mono",
    Consolas,
    monospace;
  font-size: 13px;
}

.luma-request-panel__message {
  margin: 18px 0 0;
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-primary);
  background: var(--el-bg-color-page);
  font-family:
    Inter,
    "Segoe UI",
    "Microsoft YaHei",
    Arial,
    sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  overflow-x: hidden;
}

.luma-admin-home {
  display: grid;
  gap: var(--luma-page-gutter, 20px);
  box-sizing: border-box;
  padding: var(--luma-page-gutter, 20px);
}

.luma-admin-home__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.luma-admin-home__metric {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--luma-radius-base, 8px);
  background: var(--el-bg-color);
}

.luma-admin-home__metric strong {
  color: var(--el-color-primary);
  font-size: 28px;
}

.luma-admin-home__metric small {
  color: var(--el-text-color-secondary);
}

.luma-admin-page {
  box-sizing: border-box;
  padding: var(--luma-page-gutter, 20px);
}

.luma-admin-page__list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
}

.luma-admin-page__item {
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 1.6;
}

.luma-admin-header-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.luma-admin-header-actions .el-button {
  min-width: 44px;
  min-height: 44px;
  margin: 0;
}

.luma-admin-header-actions span {
  max-width: 120px;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.luma-admin-login {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  padding: 24px;
  background: var(--el-bg-color-page);
}

.luma-admin-login__panel {
  box-sizing: border-box;
  width: min(400px, 100%);
  padding: 32px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--luma-radius-large, 12px);
  background: var(--el-bg-color);
  box-shadow: var(--luma-shadow-dialog);
}

.luma-admin-login__brand {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: var(--luma-radius-base, 8px);
  color: var(--el-color-white);
  background: var(--el-color-primary);
  font-size: 24px;
  font-weight: 800;
}

.luma-admin-login h1 {
  margin: 20px 0 6px;
}

.luma-admin-login p,
.luma-admin-login small {
  color: var(--el-text-color-secondary);
}

.luma-admin-login .el-form {
  margin: 24px 0 16px;
}

.luma-admin-login .el-button {
  width: 100%;
  min-height: 44px;
}

.luma-admin-login__error {
  color: var(--el-color-danger) !important;
  font-size: 13px;
}

@media (max-width: 900px) {
  .luma-admin-home__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .luma-admin-home,
  .luma-admin-page {
    padding: 12px;
  }

  .luma-admin-home__metrics {
    grid-template-columns: minmax(0, 1fr);
  }

  .luma-admin-header-actions span {
    display: none;
  }

  .luma-admin-login {
    padding: 16px;
  }

  .luma-admin-login__panel {
    padding: 24px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }
}
`
}

function createTemplateFiles(projectName: string): TemplateFile[] {
  return [
    { path: 'index.html', content: createIndexHtml() },
    { path: 'package.json', content: createPackageJson(projectName) },
    { path: 'src/App.vue', content: createAppVue() },
    { path: 'src/components/app/AppHeaderActions.vue', content: createHeaderActionsVue() },
    { path: 'src/components/app/AppSettingsDrawer.vue', content: createSettingsDrawerVue() },
    { path: 'src/components/request/RequestExamplePanel.vue', content: createRequestPanelVue() },
    { path: 'src/composables/useMockRequestExample.ts', content: createRequestExampleTs() },
    { path: 'src/main.ts', content: createMainTs() },
    { path: 'src/router/index.ts', content: createRouterTs() },
    { path: 'src/services/access.ts', content: createAccessTs() },
    { path: 'src/services/preferences.ts', content: createPreferencesTs() },
    { path: 'src/services/session.ts', content: createSessionTs() },
    { path: 'src/styles.scss', content: createStylesScss() },
    { path: 'src/views/auth/LoginView.vue', content: createLoginViewVue() },
    { path: 'src/views/dashboard/DashboardView.vue', content: createDashboardViewVue() },
    { path: 'src/views/error/ForbiddenView.vue', content: createForbiddenViewVue() },
    { path: 'src/views/error/NotFoundView.vue', content: createNotFoundViewVue() },
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
