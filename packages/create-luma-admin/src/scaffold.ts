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
import '@luma/core/theme-chalk/index.scss'
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
  icons: {
    localSvg: localIcons,
  },
}).mount('#app')
`
}

function createAppVue(): string {
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
import type { LumaLayoutMenuItem, LumaLayoutTabItem } from '@luma/core/layout'
import {
  LumaCrudTable,
  LumaIcon,
} from '@luma/core/components'
import { LumaLayout } from '@luma/core/layout'
import { shallowRef } from 'vue'

/***********************页面状态*********************/
const title = 'Luma Admin'
const description = '轻量 Vue Admin 项目已启动'
const collapsed = shallowRef(false)
const activeMenuPath = shallowRef('/dashboard')
const activeTabPath = shallowRef('/dashboard')

/***********************布局配置*********************/
const menus: LumaLayoutMenuItem[] = [
  {
    path: '/dashboard',
    title: '工作台',
    icon: 'app:dashboard',
  },
  {
    path: '/project',
    title: '项目管理',
    icon: 'app:dashboard',
  },
]

const tabs: LumaLayoutTabItem[] = [
  {
    path: '/dashboard',
    title: '工作台',
  },
  {
    path: '/project',
    title: '项目管理',
  },
]

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
const message = shallowRef('当前展示示例数据')

function handleSearch(payload: CrudTableSearchPayload): void {
  message.value = \`查询项目：\${String(payload.name ?? '') || '全部'}\`
}

function handleReset(_payload: CrudTableResetPayload): void {
  message.value = '已重置查询条件'
}

function handlePaginationChange(payload: CrudTablePageChangePayload): void {
  message.value = \`第 \${payload.page} 页，每页 \${payload.pageSize} 条\`
}

function handleMenuSelect(path: string): void {
  activeMenuPath.value = path
  activeTabPath.value = path
  message.value = \`已切换菜单：\${path}\`
}

function handleTabChange(path: string): void {
  activeMenuPath.value = path
}
</script>

<template>
  <LumaLayout
    v-model:collapsed="collapsed"
    v-model:active-tab-path="activeTabPath"
    :title="title"
    :menus="menus"
    :tabs="tabs"
    :active-menu-path="activeMenuPath"
    @menu-select="handleMenuSelect"
    @tab-change="handleTabChange"
  >
    <template #headerActions>
      <span class="luma-admin-template__status">Mini</span>
    </template>

    <main class="luma-admin-template">
      <LumaCrudTable
        v-model:query-model="formModel"
        v-model:page="page"
        v-model:page-size="pageSize"
        class="luma-admin-template__crud"
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
          <LumaIcon name="app:dashboard" color="#2563eb" :size="36" />
        </template>

        <template #default>
          <span class="luma-admin-template__message">
            {{ message }}
          </span>
        </template>
      </LumaCrudTable>
    </main>
  </LumaLayout>
</template>
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

.luma-admin-template {
  box-sizing: border-box;
  padding: 32px;
}

.luma-admin-template__crud {
  max-width: 920px;
  box-shadow: 0 10px 30px rgb(15 23 42 / 8%);
}

.luma-admin-template__message {
  display: block;
  padding-top: 12px;
  color: #64748b;
  font-size: 13px;
}

.luma-admin-template__status {
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}
`
}

function createTemplateFiles(projectName: string): TemplateFile[] {
  return [
    { path: 'index.html', content: createIndexHtml() },
    { path: 'package.json', content: createPackageJson(projectName) },
    { path: 'src/App.vue', content: createAppVue() },
    { path: 'src/main.ts', content: createMainTs() },
    { path: 'src/styles.scss', content: createStylesScss() },
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
