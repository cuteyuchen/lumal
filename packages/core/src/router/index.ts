import type {
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  FindAccessibleMenuOptions,
  LumaMenuRecord,
  LumaRouteAuthority,
  LumaRouteMeta,
  LumaRouteRecord,
  MenuNode,
  NormalizedMenuNode,
  SidebarMenuItem,
} from './types'

export type {
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  FindAccessibleMenuOptions,
  LumaMenuRecord,
  LumaRouteAuthority,
  LumaRouteMeta,
  LumaRouteRecord,
  MenuNode,
  MenuNodeId,
  NormalizedMenuNode,
  RouteComponentResolver,
  SidebarMenuItem,
} from './types'

interface InternalMenuNode extends Omit<MenuNode, 'children'> {
  authority?: string[]
  children: InternalMenuNode[]
  keepAlive?: boolean
  redirect?: string
  sourceIndex: number
}

/***********************标准字段归一化*********************/
export function normalizeMenuRecords(records: LumaMenuRecord[]): NormalizedMenuNode[] {
  return normalizeMenuNodes(records.map(record => convertMenuRecord(record)))
}

function convertMenuRecord(record: LumaMenuRecord): MenuNode {
  const meta = record.meta ?? {}
  const title = resolveRouteTitle(record, meta)
  const name = record.name ?? createRouteName(record.path)

  return {
    children: record.children?.map(child => convertMenuRecord(child)),
    component: record.component,
    icon: typeof meta.icon === 'string' ? meta.icon : undefined,
    id: name || record.path,
    keepAlive: meta.keepAlive === true,
    meta,
    name,
    order: typeof meta.order === 'number' ? meta.order : undefined,
    path: record.path,
    permissions: normalizePermissionRequirement(meta.authority),
    redirect: record.redirect,
    roles: normalizePermissionRequirement(meta.roles),
    title,
    visible: meta.hideInMenu !== true,
  } as MenuNode
}

function resolveRouteTitle(record: LumaMenuRecord, meta: LumaRouteMeta): string {
  if (typeof meta.title === 'string' && meta.title) {
    return meta.title
  }

  return record.name ?? record.path
}

function normalizePermissionRequirement(value: LumaRouteAuthority | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return value ? [value] : []
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
  const authority = node.authority ?? node.permissions ?? []

  return {
    authority,
    children,
    component: node.component,
    icon: node.icon,
    id: node.id,
    meta: node.meta ?? {},
    name: node.name ?? createRouteName(node.id),
    order: node.order,
    path,
    redirect: node.redirect,
    permissions: node.permissions ?? [],
    roles: node.roles ?? [],
    keepAlive: node.keepAlive,
    title: node.title,
    visible: node.visible !== false,
  }
}

function sortMenuNodes(nodes: InternalMenuNode[]): InternalMenuNode[] {
  return [...nodes].sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER
    const orderDiff = leftOrder - rightOrder
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

  if ((node.authority?.length ?? 0) > 0) {
    route.meta.authority = node.authority
  }

  if (node.redirect) {
    route.redirect = node.redirect
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
export function createSidebarMenus(
  nodes: NormalizedMenuNode[],
  options: CreateSidebarMenusOptions = {},
): SidebarMenuItem[] {
  return nodes
    .filter(node => node.visible)
    .flatMap((node) => {
      const children = createSidebarMenus(node.children, options)

      if (!canAccessMenu(node, options) || (node.children.length > 0 && children.length === 0)) {
        return []
      }

      return {
        children,
        icon: node.icon,
        path: node.path,
        title: node.title,
      }
    })
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
