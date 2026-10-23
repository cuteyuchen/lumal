import type { LumalMenuRecord } from '@lumal/core/router'

export interface PermissionNode {
  id: string
  label: string
  permission?: string
  children?: PermissionNode[]
}
export interface AppModule {
  menus: LumalMenuRecord[]
  views: Record<string, () => Promise<unknown>>
  permissions?: PermissionNode[]
}

export function collectPermissions(nodes: readonly PermissionNode[]): string[] {
  return [...new Set(nodes.flatMap(node => [
    ...(node.permission ? [node.permission] : []),
    ...collectPermissions(node.children ?? []),
  ]))]
}

export function assembleModules(modules: AppModule[]) {
  const views: Record<string, () => Promise<unknown>> = Object.create(null)
  const permissions = modules.flatMap(module => module.permissions ?? [])
  for (const module of modules) {
    for (const [name, loader] of Object.entries(module.views)) {
      if (['constructor', '__proto__', 'prototype'].includes(name) || Object.hasOwn(views, name) || typeof loader !== 'function')
        throw new Error(`模块组件名称重复或无效：${name}`)
      views[name] = loader
    }
  }
  return { views, menus: modules.flatMap(module => module.menus), permissions, permissionCodes: collectPermissions(permissions) }
}
