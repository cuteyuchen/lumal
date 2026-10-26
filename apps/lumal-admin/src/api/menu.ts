import type { NormalizedMenuNode } from '@lumal/core/router'
import { adminRequest } from '../services/request'
import { parseAdminMenuData } from './adapters'

// 独立画布避免双重缩放；内置 CRUD editor 尚未 Teleport，保留其文档定位上下文。
const selfManagedViewports = new Set([
  'examples/viewport',
  'examples/datav',
  'examples/cockpit',
  'examples/crud-table',
  'system/user',
  'system/role',
])

export async function loadAdminMenus(): Promise<NormalizedMenuNode[]> {
  return applyPagePolicies(parseAdminMenuData(await adminRequest.get<Record<string, unknown>[]>('/menu')))
}

// 权限与菜单由后端决定，页面布局策略来自应用白名单，不依赖后端 DTO 透传任意 meta。
function applyPagePolicies(nodes: NormalizedMenuNode[]): NormalizedMenuNode[] {
  return nodes.map(node => ({
    ...node,
    meta: {
      ...node.meta,
      ...(typeof node.component === 'string' && selfManagedViewports.has(node.component) ? { workspaceViewport: 'self-managed' } : {}),
      ...(node.component === 'examples/viewport'
        ? { viewport: { mode: 'contain', designWidth: 960, designHeight: 540 } }
        : {}),
    },
    children: node.children ? applyPagePolicies(node.children) : node.children,
  }))
}
