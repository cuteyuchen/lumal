import type { AdminFeature, CreateLumalAdminProjectOptions } from './types.js'
import { builtinModules } from 'node:module'

export const presets = ['minimal', 'standard', 'vben-compatible'] as const
export const apiModes = ['local', 'http'] as const
export const routerModes = ['hash', 'history'] as const
export const features = ['system', 'examples'] as const

export function assertPackageName(name: string): void {
  // 新建 npm 包不接受前导连字符或 ~；scope 与包名均限制为安全的小写子集。
  const part = '[a-z0-9][a-z0-9._-]*'
  if (name.length > 214 || !new RegExp(`^(?:@${part}/)?${part}$`).test(name)
    || ['node_modules', 'favicon.ico', ...builtinModules].includes(name)) {
    throw new Error(`非法 npm 项目名称：${name}`)
  }
}

export function resolveOptions(options: CreateLumalAdminProjectOptions) {
  assertPackageName(options.name)
  const preset = options.preset ?? 'standard'
  const apiMode = options.apiMode ?? 'local'
  const routerMode = options.routerMode ?? 'hash'
  const selected: AdminFeature[] = [...new Set(options.features ?? (preset === 'minimal' ? [] : features))]
  if (!presets.includes(preset) || !apiModes.includes(apiMode) || !routerModes.includes(routerMode))
    throw new Error('预设、数据源或路由模式无效')
  if (selected.some(feature => !features.includes(feature)))
    throw new Error('可选能力仅支持 system、examples')
  if (preset === 'minimal' && selected.length)
    throw new Error('minimal 预设不包含业务模块，请选择 standard')
  if (!options.targetDir?.trim())
    throw new Error('目标目录不能为空')
  return { ...options, preset, apiMode, routerMode, features: selected }
}
