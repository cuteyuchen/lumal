import type { CreateLumalAdminProjectOptions, CreateLumalProjectOptions, CreateLumalProjectResult, ResolvedScreenOptions, TemplateFile } from './types.js'
import { createLumalAdminProject, writeProjectFiles } from './create.js'
import { assertPackageName, resolveOptions } from './presets.js'
import { applyViewportTemplate, getVersion, readTemplateLayers } from './templates.js'

export const projectTemplates = ['admin', 'screen', 'blank'] as const
export const screenAuthModes = ['none', 'local-demo', 'http'] as const
export const screenDataModes = ['none', 'local', 'http'] as const
export const screenVisualizations = ['none', 'charts', 'datav', 'cockpit'] as const
export const projectRouterModes = ['none', 'hash', 'history'] as const

export function resolveProjectOptions(input: CreateLumalProjectOptions) {
  const template = input.template ?? 'admin'
  if (!projectTemplates.includes(template))
    throw new Error('项目类型无效')
  if (template === 'admin') {
    if (input.auth !== undefined || input.data !== undefined || input.visualization !== undefined)
      throw new Error('Admin 使用 --api-mode 和 --features，不接受 Screen 专属选项')
    if (input.routerMode === 'none')
      throw new Error('Admin 需要 hash 或 history 路由')
    return { ...resolveOptions(input as CreateLumalAdminProjectOptions), template: 'admin' as const }
  }
  assertPackageName(input.name)
  if (!input.targetDir?.trim())
    throw new Error('目标目录不能为空')
  if (input.preset !== undefined || input.features !== undefined)
    throw new Error('非 Admin 项目不能使用 --preset 或 --features')
  if (input.data !== undefined && input.apiMode !== undefined && input.data !== input.apiMode)
    throw new Error('--data 与 --api-mode 冲突')
  const options: ResolvedScreenOptions = {
    template,
    name: input.name,
    targetDir: input.targetDir,
    signal: input.signal,
    auth: input.auth ?? 'none',
    data: input.data ?? input.apiMode ?? 'none',
    routerMode: input.routerMode ?? 'none',
    visualization: input.visualization ?? 'none',
    viewport: input.viewport ?? template === 'screen',
    designWidth: input.designWidth ?? 1920,
  }
  if (!screenAuthModes.includes(options.auth) || !screenDataModes.includes(options.data)
    || !projectRouterModes.includes(options.routerMode) || !screenVisualizations.includes(options.visualization)
    || typeof options.viewport !== 'boolean' || !Number.isFinite(options.designWidth) || options.designWidth <= 0) {
    throw new Error('Screen 能力组合无效')
  }
  if (template === 'blank' && (options.auth !== 'none' || options.data !== 'none' || options.routerMode !== 'none'
    || options.visualization !== 'none')) {
    throw new Error('Blank 不包含认证、数据、路由或可视化能力，请选择 Screen')
  }
  return options
}

export async function composeProjectTemplates(options: ResolvedScreenOptions): Promise<TemplateFile[]> {
  const layers = ['common', 'vue', options.template]
  if (options.routerMode !== 'none')
    layers.push('screen-router')
  if (options.data !== 'none')
    layers.push('screen-data', `screen-data-${options.data}`)
  if (options.auth !== 'none')
    layers.push('screen-auth', `screen-auth-${options.auth}`)
  const http = options.auth === 'http' || options.data === 'http'
  if (http)
    layers.push('screen-http')
  if (options.data === 'http' && options.auth !== 'none')
    layers.push('screen-request-auth')
  if (options.visualization !== 'none')
    layers.push(`screen-visualization-${options.visualization}`)
  const files = await readTemplateLayers(layers)
  const manifest = JSON.parse(files.get('package.json')!)
  const version = await getVersion()
  manifest.name = options.name
  if (options.routerMode !== 'none')
    manifest.dependencies['vue-router'] = '^4.5.0'
  if (options.auth !== 'none' || options.data === 'http')
    manifest.dependencies['@lumal/core'] = version
  if (options.visualization !== 'none')
    manifest.dependencies[`@lumal/${options.visualization}`] = version
  if (options.visualization === 'charts') {
    manifest.dependencies.echarts = '^6.0.0'
    manifest.dependencies['vue-echarts'] = '^8.0.0'
  }
  if (options.visualization === 'cockpit')
    manifest.dependencies['element-plus'] = '^2.11.0'
  applyViewportTemplate(files, manifest, options, version)
  manifest.dependencies = Object.fromEntries(Object.entries(manifest.dependencies).sort(([a], [b]) => a.localeCompare(b)))
  manifest.devDependencies = Object.fromEntries(Object.entries(manifest.devDependencies).sort(([a], [b]) => a.localeCompare(b)))
  files.set('package.json', `${JSON.stringify(manifest, null, 2)}\n`)
  if (options.routerMode !== 'none') {
    files.set('src/router.ts', files.get('src/router.ts')!.replaceAll('createWebHashHistory', options.routerMode === 'hash' ? 'createWebHashHistory' : 'createWebHistory'))
  }
  if (http) {
    files.set('.env.development', 'VITE_API_BASE_URL=\n')
    files.set('.env.production.example', 'VITE_API_BASE_URL=https://api.example.com\n')
  }
  const screenPath = 'src/screen/ScreenView.vue'
  if (files.has(screenPath)) {
    files.set(screenPath, files.get(screenPath)!
      .replace('// SCREEN_VISUALIZATION_IMPORT\n', options.visualization === 'none' ? '' : 'import ScreenVisualization from \'./components/ScreenVisualization.vue\';\n')
      .replace('    <!-- SCREEN_VISUALIZATION -->\n', options.visualization === 'none' ? '' : '    <ScreenVisualization />\n'))
  }
  const conventions = options.template === 'blank'
    ? '## Blank\n\n默认只安装 Vue 运行时，不引入 Router、Pinia、Element Plus 或 Lumal Core。按业务需要逐项接入，不预建后台结构。'
    : '## Screen\n\n业务写普通 px，启用时在构建阶段统一转换 vw，只按项目设计宽度换算。高度不足默认滚动。地图按实际容器 resize，不变换整张地图。'
  files.set('docs/DEVELOPMENT.md', files.get('docs/DEVELOPMENT.md')!.replace('<!-- PROJECT_CONVENTIONS -->', conventions))
  return [...files].map(([path, content]) => ({ path, content })).sort((a, b) => a.path.localeCompare(b.path))
}

/** 新入口不改变旧 createLumalAdminProject 的默认值与返回协议。 */
export async function createLumalProject(input: CreateLumalProjectOptions): Promise<CreateLumalProjectResult> {
  const options = resolveProjectOptions(input)
  if (options.template === 'admin')
    return { ...await createLumalAdminProject(options), template: 'admin' }
  const files = await composeProjectTemplates(options)
  return { ...options, ...await writeProjectFiles(options, files) }
}
