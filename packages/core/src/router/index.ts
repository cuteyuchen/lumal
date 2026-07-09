import type {
  CreateRouteRecordsOptions,
  FindAccessibleMenuOptions,
  LumaRouteRecord,
  MenuNode,
  NormalizedMenuNode,
  SidebarMenuItem,
} from './types'

export type {
  CreateRouteRecordsOptions,
  FindAccessibleMenuOptions,
  LumaRouteRecord,
  MenuNode,
  MenuNodeId,
  NormalizedMenuNode,
  RouteComponentResolver,
  SidebarMenuItem,
} from './types'

interface InternalMenuNode extends Omit<MenuNode, 'children'> {
  children: InternalMenuNode[]
  sourceIndex: number
}

/***********************菜单归一化*********************/
export function normalizeMenuNodes(nodes: MenuNode[]): NormalizedMenuNode[] {
  const rawNodes = flattenMenuNodes(nodes)
  const nodeMap = new Map(rawNodes.map(node => [node.id, node]))
  const roots: InternalMenuNode[] = []

  for (const node of rawNodes) {
    const parent = node.parentId ? nodeMap.get(node.parentId) : undefined

    if (parent) {
      parent.children.push(node)
      continue
    }

    roots.push(node)
  }

  return sortMenuNodes(roots).map(node => normalizeMenuNode(node))
}

function flattenMenuNodes(nodes: MenuNode[]): InternalMenuNode[] {
  const result: InternalMenuNode[] = []
  let sourceIndex = 0

  function collect(items: MenuNode[], parentId?: string): void {
    for (const item of items) {
      const current: InternalMenuNode = {
        ...item,
        children: [],
        parentId: item.parentId ?? parentId,
        sourceIndex,
      }

      sourceIndex += 1
      result.push(current)

      if (item.children?.length) {
        collect(item.children, item.id)
      }
    }
  }

  collect(nodes)
  return result
}

function normalizeMenuNode(node: InternalMenuNode, parentPath = ''): NormalizedMenuNode {
  const path = resolveMenuPath(node.path, parentPath)
  const children = sortMenuNodes(node.children).map(child => normalizeMenuNode(child, path))

  return {
    children,
    component: node.component,
    icon: node.icon,
    id: node.id,
    meta: node.meta ?? {},
    name: node.name ?? createRouteName(node.id),
    order: node.order,
    path,
    permissions: node.permissions ?? [],
    roles: node.roles ?? [],
    title: node.title,
    visible: node.visible !== false,
  }
}

function sortMenuNodes(nodes: InternalMenuNode[]): InternalMenuNode[] {
  return [...nodes].sort((left, right) => {
    const orderDiff = (left.order ?? 0) - (right.order ?? 0)
    return orderDiff === 0 ? left.sourceIndex - right.sourceIndex : orderDiff
  })
}

/***********************路由记录*********************/
export function createRouteRecords(
  nodes: NormalizedMenuNode[],
  options: CreateRouteRecordsOptions = {},
): LumaRouteRecord[] {
  return nodes.map(node => createRouteRecord(node, options))
}

function createRouteRecord(
  node: NormalizedMenuNode,
  options: CreateRouteRecordsOptions,
): LumaRouteRecord {
  const route: LumaRouteRecord = {
    meta: {
      ...node.meta,
      permissions: node.permissions,
      roles: node.roles,
      title: node.title,
    },
    name: node.name,
    path: node.path,
  }

  if (node.component) {
    const component = options.componentResolver?.(node.component)

    if (component) {
      route.component = component
    }
  }

  if (node.children.length) {
    route.children = createRouteRecords(node.children, options)
  }

  return route
}

/***********************侧边栏菜单*********************/
export function createSidebarMenus(nodes: NormalizedMenuNode[]): SidebarMenuItem[] {
  return nodes
    .filter(node => node.visible)
    .map(node => ({
      children: createSidebarMenus(node.children),
      icon: node.icon,
      path: node.path,
      title: node.title,
    }))
}

/***********************访问菜单查找*********************/
export function findFirstAccessibleMenu(
  nodes: NormalizedMenuNode[],
  options: FindAccessibleMenuOptions = {},
): NormalizedMenuNode | undefined {
  for (const node of nodes) {
    if (!node.visible) {
      continue
    }

    const firstChild = findFirstAccessibleMenu(node.children, options)

    if (firstChild) {
      return firstChild
    }

    if (canAccessMenu(node, options)) {
      return node
    }
  }

  return undefined
}

function canAccessMenu(node: NormalizedMenuNode, options: FindAccessibleMenuOptions): boolean {
  const hasPermission = node.permissions.length === 0 || options.hasPermission?.(node.permissions) !== false
  const hasRole = node.roles.length === 0 || options.hasRole?.(node.roles) !== false

  return hasPermission && hasRole
}

/***********************路径和名称工具*********************/
function resolveMenuPath(path: string, parentPath = ''): string {
  if (path.startsWith('/')) {
    return normalizePath(path)
  }

  const parent = parentPath === '/' ? '' : parentPath
  return normalizePath(`${parent}/${path}`)
}

function normalizePath(path: string): string {
  const normalizedPath = path.replace(/\/+/g, '/')
  return normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
}

function createRouteName(value: string): string {
  return value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('')
}
