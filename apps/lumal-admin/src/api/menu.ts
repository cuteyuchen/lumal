import type { NormalizedMenuNode } from '@lumal/core/router'
import { adminRequest } from '../services/request'
import { parseAdminMenuData } from './adapters'

const selfManagedViewports = new Set(['examples/datav', 'examples/cockpit'])
// Viewport 只隔离内部画布；它的工具栏和 CRUD 编辑器都不放进外层 transform，仍可使用 vw。
const flowOnlyViewports = new Set(['examples/viewport', 'system/user', 'system/role', 'examples/crud-table'])

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
      ...(typeof node.component === 'string' && flowOnlyViewports.has(node.component) ? { workspaceViewport: 'flow-only' } : {}),
      ...(node.component === 'examples/viewport'
        ? { viewport: { mode: 'contain', designWidth: 960, designHeight: 540 } }
        : {}),
    },
    children: node.children ? applyPagePolicies(node.children) : node.children,
  }))
}
