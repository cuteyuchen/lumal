import type { AdminFeature, AdminPreset, CreateLumalAdminProjectOptions } from './types.js'
import { builtinModules } from 'node:module'

export const presets = ['minimal', 'standard', 'vben-compatible'] as const
export const apiModes = ['local', 'http'] as const
export const routerModes = ['hash', 'history'] as const
export interface FeatureDefinition {
  label: string
  hint: string
  presets: readonly AdminPreset[]
  default: boolean
  requires?: readonly AdminFeature[]
  conflicts?: readonly AdminFeature[]
}

// 特性选择、默认值和约束共享一份注册表，新增特性无需改写终端流程。
export const featureDefinitions = {
  system: { label: '系统管理', hint: '用户、授权、菜单、机构、字典与配置', presets: ['standard', 'vben-compatible'], default: true },
  examples: { label: '开发示例', hint: '独立的 Schema Form 与 CRUD Table 示例', presets: ['standard', 'vben-compatible'], default: true },
} satisfies Record<AdminFeature, FeatureDefinition>
export const features = Object.keys(featureDefinitions) as AdminFeature[]

export function availableFeatures(preset: AdminPreset): AdminFeature[] {
  return features.filter(feature => (featureDefinitions[feature] as FeatureDefinition).presets.includes(preset))
}

export function defaultFeatures(preset: AdminPreset): AdminFeature[] {
  return availableFeatures(preset).filter(feature => featureDefinitions[feature].default)
}

export function assertFeatures(selected: AdminFeature[], preset: AdminPreset): void {
  for (const feature of selected) {
    if (!Object.hasOwn(featureDefinitions, feature))
      throw new Error(`未知可选能力：${feature}`)
    const definition: FeatureDefinition = featureDefinitions[feature]
    if (!definition.presets.includes(preset))
      throw new Error(`${preset} 预设不包含 ${feature} 业务模块，请选择 standard`)
    for (const dependency of definition.requires ?? []) {
      if (!selected.includes(dependency))
        throw new Error(`${feature} 需要同时启用 ${dependency}`)
    }
    for (const conflict of definition.conflicts ?? []) {
      if (selected.includes(conflict))
        throw new Error(`${feature} 不能与 ${conflict} 同时启用`)
    }
  }
}

export function assertPackageName(name: string): void {
  // 新建 npm 包不接受前导连字符或 ~；scope 与包名均限制为安全的小写子集。
  const part = '[a-z0-9][a-z0-9._-]*'
  const invalid = name.length > 214
    ? '长度不能超过 214 个字符'
    : !new RegExp(`^(?:@${part}/)?${part}$`).test(name)
        ? '仅支持小写字母、数字、点、下划线和连字符，且不能以符号开头；scope 使用 @scope/name'
        : ['node_modules', 'favicon.ico', ...builtinModules].includes(name) ? '不能使用 npm 保留名称或 Node 内置模块名' : ''
  if (invalid)
    throw new Error(`非法 npm 项目名称：${name}；${invalid}`)
}

export function resolveOptions(options: CreateLumalAdminProjectOptions) {
  assertPackageName(options.name)
  const preset = options.preset ?? 'standard'
  const apiMode = options.apiMode ?? 'local'
  const routerMode = options.routerMode ?? 'hash'
  const selected: AdminFeature[] = [...new Set(options.features ?? defaultFeatures(preset))]
  if (!presets.includes(preset) || !apiModes.includes(apiMode) || !routerModes.includes(routerMode))
    throw new Error('预设、数据源或路由模式无效')
  assertFeatures(selected, preset)
  if (!options.targetDir?.trim())
    throw new Error('目标目录不能为空')
  return { ...options, preset, apiMode, routerMode, features: selected }
}
