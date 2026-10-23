import type { CreateLumalAdminProjectOptions, CreateLumalProjectOptions, CreateLumalProjectResult, ResolvedScreenOptions, TemplateFile } from './types.js'
import { createLumalAdminProject, writeProjectFiles } from './create.js'
import { assertPackageName, resolveOptions } from './presets.js'
import { readTemplateLayers } from './templates.js'

export const projectTemplates = ['admin', 'screen', 'blank'] as const
export const screenAuthModes = ['none', 'local-demo', 'http'] as const
export const screenDataModes = ['none', 'local', 'http'] as const
export const screenVisualizations = ['none', 'charts', 'datav', 'cockpit'] as const
export const screenViewports = ['responsive', 'width', 'scale', 'vw'] as const
export const projectRouterModes = ['none', 'hash', 'history'] as const

export function resolveProjectOptions(input: CreateLumalProjectOptions) {
  const template = input.template ?? 'admin'
  if (!projectTemplates.includes(template))
    throw new Error('项目类型无效')
  if (template === 'admin') {
    if (input.auth !== undefined || input.data !== undefined || input.visualization !== undefined || input.viewport !== undefined)
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
    viewport: input.viewport ?? 'responsive',
  }
  if (!screenAuthModes.includes(options.auth) || !screenDataModes.includes(options.data)
    || !projectRouterModes.includes(options.routerMode) || !screenVisualizations.includes(options.visualization)
    || !screenViewports.includes(options.viewport)) {
    throw new Error('Screen 能力组合无效')
  }
  if (template === 'blank' && (options.auth !== 'none' || options.data !== 'none' || options.routerMode !== 'none'
    || options.visualization !== 'none' || options.viewport !== 'responsive')) {
    throw new Error('Blank 不包含认证、数据、路由或可视化能力，请选择 Screen')
  }
  return options
}

export async function composeProjectTemplates(options: ResolvedScreenOptions): Promise<TemplateFile[]> {
  if (options.auth !== 'none' || options.data !== 'none' || options.visualization !== 'none' || options.viewport !== 'responsive')
    throw new Error('此能力尚未启用')
  const layers = ['common', 'vue', options.template]
  if (options.routerMode !== 'none')
    layers.push('screen-router')
  const files = await readTemplateLayers(layers)
  const manifest = JSON.parse(files.get('package.json')!)
  manifest.name = options.name
  if (options.routerMode !== 'none')
    manifest.dependencies['vue-router'] = '^4.5.0'
  files.set('package.json', `${JSON.stringify(manifest, null, 2)}\n`)
  if (options.routerMode !== 'none') {
    files.set('src/router.ts', files.get('src/router.ts')!.replaceAll('createWebHashHistory', options.routerMode === 'hash' ? 'createWebHashHistory' : 'createWebHistory'))
  }
  const conventions = options.template === 'blank'
    ? '## Blank\n\n默认只安装 Vue 运行时，不引入 Router、Pinia、Element Plus 或 Lumal Core。按业务需要逐项接入，不预建后台结构。'
    : '## Screen\n\n页面只承担大屏组合，不生成管理菜单、标签和系统模块。普通响应式布局优先，地图按实际容器 resize，不默认 transform 整张地图。'
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
