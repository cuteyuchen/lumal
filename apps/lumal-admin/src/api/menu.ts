import type { NormalizedMenuNode } from '@lumal/core/router'
import { adminRequest } from '../services/request'
import { parseAdminMenuData } from './adapters'

export async function loadAdminMenus(): Promise<NormalizedMenuNode[]> {
  return applyPagePolicies(parseAdminMenuData(await adminRequest.get<Record<string, unknown>[]>('/menu')))
}

// 权限与菜单由后端决定，页面布局策略来自应用白名单，不依赖后端 DTO 透传任意 meta。
function applyPagePolicies(nodes: NormalizedMenuNode[]): NormalizedMenuNode[] {
  return nodes.map(node => ({
    ...node,
    meta: node.component === 'examples/viewport'
      ? { ...node.meta, viewport: { mode: 'contain', designWidth: 960, designHeight: 540 } }
      : node.meta,
    children: node.children ? applyPagePolicies(node.children) : node.children,
  }))
}
