import type {
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  CreateTopMenusOptions,
  FindAccessibleMenuOptions,
  GlobComponentResolverOptions,
  LumaMenuInputRecord,
  LumaMenuRecord,
  LumaRouteAuthority,
  LumaRouteMeta,
  LumaRouteRecord,
  MenuNode,
  MenuRecordFieldNames,
  NormalizedMenuNode,
  NormalizeMenuRecordsOptions,
  RouteComponentResolver,
  RouteRegistry,
  RouteRegistryRouterLike,
  SidebarMenuItem,
} from './types'

export type {
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  CreateTopMenusOptions,
  FindAccessibleMenuOptions,
  GlobComponentResolverOptions,
  LumaMenuInputRecord,
  LumaMenuRecord,
  LumaRouteAuthority,
  LumaRouteMeta,
  LumaRouteRecord,
  MenuNode,
  MenuNodeId,
  MenuRecordFieldNames,
  NormalizedMenuNode,
  NormalizeMenuRecordsOptions,
  RouteComponentResolver,
  RouteRegistry,
  RouteRegistryRouterLike,
  SidebarMenuItem,
} from './types'

interface InternalMenuNode extends Omit<MenuNode, 'children'> {
  authority?: string[]
  children: InternalMenuNode[]
  keepAlive?: boolean
  redirect?: string
  externalLink?: string
  sourceIndex: number
}

/***********************标准字段归一化*********************/
export function normalizeMenuRecords(
  records: LumaMenuInputRecord[],
  options: NormalizeMenuRecordsOptions = {},
): NormalizedMenuNode[] {
  const { fieldNames } = options
  const standardRecords = fieldNames
    ? records.map(record => mapRawRecord(record as Record<string, unknown>, fieldNames))
    : (records as LumaMenuRecord[])

  return normalizeMenuNodes(standardRecords.map(record => convertMenuRecord(record)))
}

/**
 * 按 fieldNames 把非标准菜单记录映射为标准 LumaMenuRecord。
 * 未配置的字段回退到标准位置，children 递归复用同一份映射。
 */
function mapRawRecord(raw: Record<string, unknown>, fieldNames: MenuRecordFieldNames): LumaMenuRecord {
  const pick = (key: keyof MenuRecordFieldNames, fallback: unknown): unknown => {
    const source = fieldNames[key]

    if (source && source in raw) {
      return raw[source]
    }

    return fallback
  }

  const baseMeta = (raw.meta as LumaRouteMeta | undefined) ?? {}
  const meta: LumaRouteMeta = { ...baseMeta }
  assignDefined(meta, 'title', pick('title', baseMeta.title))
  assignDefined(meta, 'icon', pick('icon', baseMeta.icon))
  assignDefined(meta, 'order', pick('order', baseMeta.order))
  assignDefined(meta, 'authority', pick('authority', baseMeta.authority))
  assignDefined(meta, 'roles', pick('roles', baseMeta.roles))
  assignDefined(meta, 'hideInMenu', pick('hideInMenu', baseMeta.hideInMenu))
  assignDefined(meta, 'keepAlive', pick('keepAlive', baseMeta.keepAlive))

  const record: LumaMenuRecord = {
    meta,
    path: (pick('path', raw.path) as string | undefined) ?? '',
  }

  const name = pick('name', raw.name)
  if (name !== undefined) {
    record.name = name as string
  }

  const component = pick('component', raw.component)
  if (component !== undefined) {
    record.component = component as string
  }

  const redirect = pick('redirect', raw.redirect)
  if (redirect !== undefined) {
    record.redirect = redirect as string
  }

  const externalLink = pick('externalLink', raw.externalLink)
  if (externalLink !== undefined) {
    record.externalLink = externalLink as string
  }

  const childrenRaw = pick('children', raw.children) as Record<string, unknown>[] | undefined
  if (Array.isArray(childrenRaw)) {
    record.children = childrenRaw.map(child => mapRawRecord(child, fieldNames))
  }

  return record
}

function assignDefined(target: LumaRouteMeta, key: string, value: unknown): void {
  if (value !== undefined) {
    target[key] = value
  }
}

function convertMenuRecord(record: LumaMenuRecord): MenuNode {
  const meta = record.meta ?? {}
  const title = resolveRouteTitle(record, meta)
  const name = record.name ?? createRouteName(record.path)
  const externalLink = record.externalLink
    ?? (typeof meta.externalLink === 'string' ? meta.externalLink : undefined)

  return {
    children: record.children?.map(child => convertMenuRecord(child)),
    component: record.component,
    externalLink,
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
    externalLink: node.externalLink,
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

  if (node.externalLink) {
    route.meta.externalLink = node.externalLink
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
        externalLink: node.externalLink,
        icon: node.icon,
        path: node.path,
        title: node.title,
      }
    })
}

/***********************顶部菜单*********************/
/**
 * 顶部菜单：在可访问过滤的基础上，仅保留一级菜单中标记 meta.topMenu === true 的项。
 * 未标记任何顶部菜单时回退为全部可访问的一级菜单，便于 top-nav 布局直接使用。
 */
export function createTopMenus(
  nodes: NormalizedMenuNode[],
  options: CreateTopMenusOptions = {},
): SidebarMenuItem[] {
  const accessibleMenus = createSidebarMenus(nodes, options)
  const topMenuPaths = new Set(
    nodes
      .filter(node => node.meta?.topMenu === true)
      .map(node => node.path),
  )
  const explicitTopMenus = accessibleMenus.filter(menu => topMenuPaths.has(menu.path))

  return explicitTopMenus.length > 0 ? explicitTopMenus : accessibleMenus
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

/***********************动态路由注册*********************/
export function createRouteRegistry(router: RouteRegistryRouterLike): RouteRegistry {
  const registeredNames: string[] = []

  function register(routes: LumaRouteRecord[]): void {
    for (const route of routes) {
      router.addRoute(route)

      if (route.name && !registeredNames.includes(route.name)) {
        registeredNames.push(route.name)
      }
    }
  }

  function reset(): void {
    while (registeredNames.length) {
      const name = registeredNames.pop()

      if (name && router.hasRoute(name)) {
        router.removeRoute(name)
      }
    }
  }

  return {
    register,
    reset,
    get names() {
      return [...registeredNames]
    },
  }
}

/***********************glob 组件解析*********************/
/**
 * 基于 import.meta.glob 收集的模块表，创建组件字符串到懒加载组件的解析函数。
 * 依次尝试 `${viewsPrefix}/${component}.vue` 与 `${viewsPrefix}/${component}/index.vue`，
 * 命中即缓存懒加载函数；全部未命中时回退到 fallback。
 */
export function createGlobComponentResolver(
  options: GlobComponentResolverOptions,
): RouteComponentResolver {
  const { fallback, modules, viewsPrefix = '../views' } = options
  const loaderCache = new Map<string, () => Promise<unknown>>()
  const prefix = viewsPrefix.replace(/\/+$/, '')

  return (component: string) => {
    const normalized = normalizeComponentPath(component)
    const candidates = [
      `${prefix}/${normalized}.vue`,
      `${prefix}/${normalized}/index.vue`,
    ]

    for (const candidate of candidates) {
      const matched = modules[candidate]

      if (matched) {
        const cached = loaderCache.get(candidate)

        if (cached) {
          return cached
        }

        loaderCache.set(candidate, matched)
        return matched
      }
    }

    return fallback
  }
}

function normalizeComponentPath(component: string): string {
  return component
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/+/g, '/')
    .replace(/\.vue$/i, '')
    .replace(/^\/+|\/+$/g, '')
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
