import type {
  CreateMenuRouteRuntimeOptions,
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  CreateTopMenusOptions,
  FindAccessibleMenuOptions,
  GlobComponentResolverOptions,
  LumalMenuBadgeTone,
  LumalMenuBadgeType,
  LumalMenuInputRecord,
  LumalMenuRecord,
  LumalRouteAuthority,
  LumalRouteMeta,
  LumalRouteRecord,
  MenuNode,
  MenuRecordFieldNames,
  MenuRouteConflictKind,
  MenuRouteConflictSource,
  MenuRouteErrorContext,
  MenuRouteRuntime,
  MenuRouteRuntimeRouterLike,
  MenuRouteSource,
  NormalizedMenuNode,
  NormalizeMenuRecordsOptions,
  RouteComponentResolver,
  RouteRegistry,
  RouteRegistryRouterLike,
  SidebarMenuItem,
} from './types'

export type {
  CreateMenuRouteRuntimeOptions,
  CreateRouteRecordsOptions,
  CreateSidebarMenusOptions,
  CreateTopMenusOptions,
  FindAccessibleMenuOptions,
  GlobComponentResolverOptions,
  LumalMenuBadgeTone,
  LumalMenuBadgeType,
  LumalMenuComponent,
  LumalMenuInputRecord,
  LumalMenuRecord,
  LumalRouteAuthority,
  LumalRouteMeta,
  LumalRouteRecord,
  LumalStaticMenuRecord,
  MenuNode,
  MenuNodeId,
  MenuRecordFieldNames,
  MenuRouteComponent,
  MenuRouteConflictKind,
  MenuRouteConflictSource,
  MenuRouteErrorContext,
  MenuRouteRuntime,
  MenuRouteRuntimeRouterLike,
  MenuRouteSource,
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
  records: LumalMenuInputRecord[],
  options: NormalizeMenuRecordsOptions = {},
): NormalizedMenuNode[] {
  const { fieldNames } = options
  const standardRecords = fieldNames
    ? records.map(record => mapRawRecord(record as Record<string, unknown>, fieldNames))
    : (records as LumalMenuRecord[])

  return normalizeMenuNodes(standardRecords.map(record => convertMenuRecord(record)))
}

/**
 * 按 fieldNames 把非标准菜单记录映射为标准 LumalMenuRecord。
 * 未配置的字段回退到标准位置，children 递归复用同一份映射。
 */
function mapRawRecord(raw: Record<string, unknown>, fieldNames: MenuRecordFieldNames): LumalMenuRecord {
  const pick = (key: keyof MenuRecordFieldNames, fallback: unknown): unknown => {
    const source = fieldNames[key]

    if (source && source in raw) {
      return raw[source]
    }

    return fallback
  }

  const baseMeta = (raw.meta as LumalRouteMeta | undefined) ?? {}
  const meta: LumalRouteMeta = { ...baseMeta }
  assignDefined(meta, 'activeMenu', pick('activeMenu', baseMeta.activeMenu))
  assignDefined(meta, 'badge', pick('badge', baseMeta.badge))
  assignDefined(meta, 'badgeType', pick('badgeType', baseMeta.badgeType))
  assignDefined(meta, 'badgeTone', pick('badgeTone', baseMeta.badgeTone))
  assignDefined(meta, 'title', pick('title', baseMeta.title))
  assignDefined(meta, 'icon', pick('icon', baseMeta.icon))
  assignDefined(meta, 'order', pick('order', baseMeta.order))
  assignDefined(meta, 'authority', pick('authority', baseMeta.authority))
  assignDefined(meta, 'roles', pick('roles', baseMeta.roles))
  assignDefined(meta, 'hideInMenu', pick('hideInMenu', baseMeta.hideInMenu))
  assignDefined(meta, 'hideInBreadcrumb', pick('hideInBreadcrumb', baseMeta.hideInBreadcrumb))
  assignDefined(meta, 'keepAlive', pick('keepAlive', baseMeta.keepAlive))

  const record: LumalMenuRecord = {
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

function assignDefined(target: LumalRouteMeta, key: string, value: unknown): void {
  if (value !== undefined) {
    target[key] = value
  }
}

function convertMenuRecord(record: LumalMenuRecord): MenuNode {
  const meta = record.meta ?? {}
  const title = resolveRouteTitle(record, meta)
  const name = record.name ?? createRouteName(record.path)
  const component = typeof record.component === 'string' && record.component.trim() === ''
    ? undefined
    : record.component
  const externalLink = record.externalLink
    ?? (typeof meta.externalLink === 'string' ? meta.externalLink : undefined)
  const badgeType = meta.badgeType === 'dot' || meta.badgeType === 'text'
    ? meta.badgeType as LumalMenuBadgeType
    : undefined
  const badgeTone = ['primary', 'success', 'warning', 'danger', 'info'].includes(String(meta.badgeTone))
    ? meta.badgeTone as LumalMenuBadgeTone
    : undefined

  return {
    activeMenu: typeof meta.activeMenu === 'string' ? meta.activeMenu : undefined,
    badge: typeof meta.badge === 'string' || typeof meta.badge === 'number' ? meta.badge : undefined,
    badgeTone,
    badgeType,
    children: record.children?.map(child => convertMenuRecord(child)),
    component,
    externalLink,
    hideInBreadcrumb: meta.hideInBreadcrumb === true,
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

function resolveRouteTitle(record: LumalMenuRecord, meta: LumalRouteMeta): string {
  if (typeof meta.title === 'string' && meta.title) {
    return meta.title
  }

  return record.name ?? record.path
}

function normalizePermissionRequirement(value: LumalRouteAuthority | undefined): string[] {
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
    activeMenu: node.activeMenu,
    authority,
    badge: node.badge,
    badgeTone: node.badgeTone,
    badgeType: node.badgeType,
    children,
    component: node.component,
    externalLink: node.externalLink,
    hideInBreadcrumb: node.hideInBreadcrumb === true,
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
): LumalRouteRecord[] {
  return nodes.map(node => createRouteRecord(node, options))
}

function createRouteRecord(
  node: NormalizedMenuNode,
  options: CreateRouteRecordsOptions,
): LumalRouteRecord {
  const route: LumalRouteRecord = {
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

  if (node.activeMenu) {
    route.meta.activeMenu = node.activeMenu
  }

  if (node.badge !== undefined) {
    route.meta.badge = node.badge
  }

  if (node.badgeType) {
    route.meta.badgeType = node.badgeType
  }

  if (node.badgeTone) {
    route.meta.badgeTone = node.badgeTone
  }

  if (node.hideInBreadcrumb) {
    route.meta.hideInBreadcrumb = true
  }

  if (node.externalLink) {
    route.meta.externalLink = node.externalLink
  }

  if (node.redirect) {
    route.redirect = node.redirect
  }

  if (node.component) {
    const component = typeof node.component === 'string'
      ? options.componentResolver?.(node.component)
      : node.component

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
        ...(node.badge !== undefined ? { badge: node.badge } : {}),
        ...(node.badgeTone ? { badgeTone: node.badgeTone } : {}),
        ...(node.badgeType ? { badgeType: node.badgeType } : {}),
        children,
        ...(node.externalLink
          ? {
              externalLink: node.externalLink,
              externalTarget: node.meta.externalTarget === '_self' ? '_self' as const : '_blank' as const,
            }
          : {}),
        icon: node.icon,
        path: node.path,
        ...(node.redirect ? { redirect: node.redirect } : {}),
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
    if (!node.visible || !canAccessMenu(node, options)) {
      continue
    }

    const firstChild = findFirstAccessibleMenu(node.children, options)

    if (firstChild) {
      return firstChild
    }

    if (node.children.length === 0) {
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
  const removeRoutes: Array<() => void> = []

  function collectRouteNames(route: LumalRouteRecord): string[] {
    return [
      route.name,
      ...(route.children?.flatMap(collectRouteNames) ?? []),
    ]
  }

  function register(routes: LumalRouteRecord[]): void {
    for (const route of routes) {
      if (route.name && router.hasRoute(route.name)) {
        continue
      }

      const removeRoute = router.addRoute(route)
      const rootRouteName = route.name
      removeRoutes.push(typeof removeRoute === 'function'
        ? removeRoute as () => void
        : () => {
            if (rootRouteName && router.hasRoute(rootRouteName)) {
              router.removeRoute(rootRouteName)
            }
          })

      for (const routeName of collectRouteNames(route)) {
        if (!registeredNames.includes(routeName)) {
          registeredNames.push(routeName)
        }
      }
    }
  }

  function reset(): void {
    while (removeRoutes.length) {
      removeRoutes.pop()?.()
    }

    registeredNames.length = 0
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

/***********************统一菜单路由运行时*********************/
interface MenuRouteState {
  menus: NormalizedMenuNode[]
  routes: LumalRouteRecord[]
}

interface MenuRouteIdentity {
  node: NormalizedMenuNode
  source: MenuRouteSource
}

export class MenuRouteConflictError extends Error {
  readonly firstSource: MenuRouteConflictSource
  readonly kind: MenuRouteConflictKind
  readonly secondSource: MenuRouteConflictSource
  readonly value: string

  constructor(
    kind: MenuRouteConflictKind,
    value: string,
    firstSource: MenuRouteConflictSource,
    secondSource: MenuRouteConflictSource,
  ) {
    super(`菜单路由 ${kind} 冲突：${value}（${firstSource} / ${secondSource}）`)
    this.name = 'MenuRouteConflictError'
    this.kind = kind
    this.value = value
    this.firstSource = firstSource
    this.secondSource = secondSource
  }
}

function reportMenuRouteError(
  options: CreateMenuRouteRuntimeOptions,
  error: unknown,
  context: MenuRouteErrorContext,
): void {
  try {
    options.onError?.(error, context)
  }
  catch {
    // 错误观察器不能覆盖原始路由错误。
  }
}

function createComponentError(node: NormalizedMenuNode, source: MenuRouteSource, message: string): Error {
  return new Error(`${message}：${node.name} (${node.path}, ${source})`)
}

function createSafeComponentLoader(
  loader: () => unknown,
  options: CreateMenuRouteRuntimeOptions,
  context: MenuRouteErrorContext,
): () => Promise<unknown> {
  return async () => {
    try {
      return await loader()
    }
    catch (error) {
      return recoverComponentLoad(
        error,
        options,
        context,
        loader !== options.fallbackComponent,
      )
    }
  }
}

async function recoverComponentLoad(
  error: unknown,
  options: CreateMenuRouteRuntimeOptions,
  context: MenuRouteErrorContext,
  useFallback: boolean,
): Promise<unknown> {
  reportMenuRouteError(options, error, {
    ...context,
    phase: 'load-component',
  })

  if (!options.fallbackComponent || !useFallback) {
    throw error
  }

  try {
    return await options.fallbackComponent()
  }
  catch (fallbackError) {
    reportMenuRouteError(options, fallbackError, {
      ...context,
      component: undefined,
      phase: 'load-component',
    })
    throw fallbackError
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && 'then' in value
}

function createSafeDirectComponent(
  component: (...args: unknown[]) => unknown,
  options: CreateMenuRouteRuntimeOptions,
  context: MenuRouteErrorContext,
): (...args: unknown[]) => unknown {
  if (!options.fallbackComponent && !options.onError) {
    return component
  }

  const wrapped = (...args: unknown[]): unknown => {
    try {
      const result = component(...args)
      return isPromiseLike(result)
        ? Promise.resolve(result).catch(error => recoverComponentLoad(error, options, context, true))
        : result
    }
    catch (error) {
      return recoverComponentLoad(error, options, context, true)
    }
  }

  return Object.assign(wrapped, component)
}

function resolveRuntimeComponents(
  nodes: NormalizedMenuNode[],
  source: MenuRouteSource,
  options: CreateMenuRouteRuntimeOptions,
): Map<string, unknown> {
  const resolvedComponents = new Map<string, unknown>()

  function visit(node: NormalizedMenuNode): void {
    const component = node.component
    const context: MenuRouteErrorContext = {
      component: typeof component === 'string' ? component : undefined,
      phase: 'resolve-component',
      routeName: node.name,
      routePath: node.path,
      source,
    }

    if (source === 'remote' && component !== undefined && typeof component !== 'string') {
      const error = createComponentError(node, source, '远程菜单组件必须是字符串')
      reportMenuRouteError(options, error, context)
      throw error
    }

    if (component !== undefined && typeof component !== 'string'
      && typeof component !== 'function' && typeof component !== 'object') {
      const error = createComponentError(node, source, '静态菜单组件类型无效')
      reportMenuRouteError(options, error, context)
      throw error
    }

    if (typeof component === 'string' && !resolvedComponents.has(component)) {
      let resolved: unknown
      try {
        resolved = options.componentResolver?.(component)
      }
      catch (error) {
        reportMenuRouteError(options, error, context)
        throw error
      }

      if (!resolved) {
        const error = createComponentError(node, source, `无法解析组件 "${component}"`)
        reportMenuRouteError(options, error, context)

        if (!options.fallbackComponent) {
          throw error
        }

        resolvedComponents.set(
          component,
          createSafeComponentLoader(options.fallbackComponent, options, context),
        )
      }
      else {
        resolvedComponents.set(
          component,
          typeof resolved === 'function'
            ? createSafeComponentLoader(resolved as () => unknown, options, context)
            : resolved,
        )
      }
    }

    const canRenderWithoutComponent = Boolean(node.redirect || node.externalLink || node.children.length > 0)
    if ((component === undefined || component === null) && !canRenderWithoutComponent) {
      const error = createComponentError(node, source, '叶子菜单缺少路由组件')
      reportMenuRouteError(options, error, context)
      throw error
    }

    node.children.forEach(visit)
  }

  nodes.forEach(visit)
  return resolvedComponents
}

function prepareMenuRouteState(
  menus: NormalizedMenuNode[],
  source: MenuRouteSource,
  options: CreateMenuRouteRuntimeOptions,
): MenuRouteState {
  const resolvedComponents = resolveRuntimeComponents(menus, source, options)
  const routes = createRouteRecords(menus, {
    componentResolver: component => resolvedComponents.get(component),
  })

  if (source === 'static') {
    protectStaticComponentLoaders(menus, routes, options)
  }

  return {
    menus,
    routes,
  }
}

function protectStaticComponentLoaders(
  menus: NormalizedMenuNode[],
  routes: LumalRouteRecord[],
  options: CreateMenuRouteRuntimeOptions,
): void {
  menus.forEach((menu, index) => {
    const route = routes[index]
    if (!route) {
      return
    }

    if (typeof menu.component === 'function') {
      route.component = createSafeDirectComponent(
        menu.component as (...args: unknown[]) => unknown,
        options,
        {
          phase: 'load-component',
          routeName: menu.name,
          routePath: menu.path,
          source: 'static',
        },
      )
    }

    if (menu.children.length && route.children?.length) {
      protectStaticComponentLoaders(menu.children, route.children, options)
    }
  })
}

function stableSortByOrder<T>(items: T[], resolveOrder: (item: T) => unknown): T[] {
  return items
    .map((item, index) => ({ index, item }))
    .sort((left, right) => {
      const leftOrder = typeof resolveOrder(left.item) === 'number'
        ? resolveOrder(left.item) as number
        : Number.MAX_SAFE_INTEGER
      const rightOrder = typeof resolveOrder(right.item) === 'number'
        ? resolveOrder(right.item) as number
        : Number.MAX_SAFE_INTEGER
      const orderDifference = leftOrder - rightOrder
      return orderDifference === 0 ? left.index - right.index : orderDifference
    })
    .map(entry => entry.item)
}

function mergeMenuRouteStates(staticState: MenuRouteState, remoteState: MenuRouteState): MenuRouteState {
  return {
    menus: stableSortByOrder(
      [...staticState.menus, ...remoteState.menus],
      menu => menu.order,
    ),
    routes: stableSortByOrder(
      [...staticState.routes, ...remoteState.routes],
      route => route.meta.order,
    ),
  }
}

function collectMenuRouteIdentities(
  nodes: NormalizedMenuNode[],
  source: MenuRouteSource,
): MenuRouteIdentity[] {
  return nodes.flatMap(node => [
    { node, source },
    ...collectMenuRouteIdentities(node.children, source),
  ])
}

function assertNoMenuRouteConflicts(
  staticMenus: NormalizedMenuNode[],
  remoteMenus: NormalizedMenuNode[],
  router: MenuRouteRuntimeRouterLike,
  ownedRouteNames: ReadonlySet<string>,
): void {
  const identities = [
    ...collectMenuRouteIdentities(staticMenus, 'static'),
    ...collectMenuRouteIdentities(remoteMenus, 'remote'),
  ]
  const seenIds = new Map<string, MenuRouteIdentity>()
  const seenNames = new Map<string, MenuRouteIdentity>()
  const seenPaths = new Map<string, MenuRouteIdentity>()

  function check(
    kind: MenuRouteConflictKind,
    value: string,
    identity: MenuRouteIdentity,
    seen: Map<string, MenuRouteIdentity>,
  ): void {
    const previous = seen.get(value)
    if (previous) {
      throw new MenuRouteConflictError(kind, value, previous.source, identity.source)
    }
    seen.set(value, identity)
  }

  for (const identity of identities) {
    const { node } = identity
    if (!node.id || typeof node.name !== 'string' || !node.name.trim() || !node.path) {
      throw createComponentError(node, identity.source, '菜单路由 id、name 和 path 不能为空')
    }

    check('name', node.name, identity, seenNames)
    check('path', node.path, identity, seenPaths)
    check('id', node.id, identity, seenIds)
  }

  for (const [routeName, identity] of seenNames) {
    if (router.hasRoute(routeName) && !ownedRouteNames.has(routeName)) {
      throw new MenuRouteConflictError('name', routeName, 'existing', identity.source)
    }
  }

  const externalRoutes = router.getRoutes().filter((route) => {
    return typeof route.name !== 'string' || !ownedRouteNames.has(route.name)
  })
  const externalPaths = new Set(externalRoutes.map(route => route.path))

  for (const [routePath, identity] of seenPaths) {
    if (externalPaths.has(routePath)) {
      throw new MenuRouteConflictError('path', routePath, 'existing', identity.source)
    }
  }
}

function cloneRootItems<T>(items: T[]): T[] {
  return [...items]
}

function assertMenuInputPaths(
  records: LumalMenuInputRecord[],
  normalizeOptions: NormalizeMenuRecordsOptions | undefined,
  source: MenuRouteSource,
): void {
  const pathField = normalizeOptions?.fieldNames?.path ?? 'path'
  const nameField = normalizeOptions?.fieldNames?.name ?? 'name'
  const childrenField = normalizeOptions?.fieldNames?.children ?? 'children'

  for (const record of records) {
    const raw = record as Record<string, unknown>
    const path = pathField in raw ? raw[pathField] : raw.path
    if (typeof path !== 'string' || !path.trim()) {
      const rawName = nameField in raw ? raw[nameField] : raw.name
      const name = String(rawName ?? 'unknown')
      throw new Error(`菜单路由 path 不能为空：${name} (${source})`)
    }

    const name = nameField in raw ? raw[nameField] : raw.name
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      throw new Error(`菜单路由 name 必须是非空字符串：${String(name)} (${source})`)
    }

    const children = childrenField in raw ? raw[childrenField] : raw.children
    if (Array.isArray(children)) {
      assertMenuInputPaths(children as LumalMenuInputRecord[], normalizeOptions, source)
    }
  }
}

export function createMenuRouteRuntime(options: CreateMenuRouteRuntimeOptions): MenuRouteRuntime {
  if (typeof options.router.getRoutes !== 'function') {
    throw new TypeError('菜单路由运行时要求 router.getRoutes() 用于检测既有 path 冲突')
  }

  const staticRegistry = createRouteRegistry(options.router)
  const remoteRegistry = createRouteRegistry(options.router)
  const emptyState = (): MenuRouteState => ({ menus: [], routes: [] })
  const staticMenuInputs = (options.staticMenus ?? []) as unknown as LumalMenuInputRecord[]
  assertMenuInputPaths(staticMenuInputs, undefined, 'static')
  let staticState = prepareMenuRouteState(
    normalizeMenuRecords(staticMenuInputs),
    'static',
    options,
  )
  let remoteState = emptyState()
  let remoteLoaded = false
  let disposed = false
  let loadGeneration = 0
  let loadingRemote: Promise<NormalizedMenuNode[]> | undefined
  let combinedState = mergeMenuRouteStates(staticState, remoteState)

  try {
    assertNoMenuRouteConflicts(staticState.menus, [], options.router, new Set())
    staticRegistry.register(staticState.routes)
  }
  catch (error) {
    staticRegistry.reset()
    reportMenuRouteError(options, error, { phase: 'register-routes', source: 'static' })
    throw error
  }

  function getCombinedState(): MenuRouteState {
    return combinedState
  }

  function refreshCombinedState(): void {
    combinedState = mergeMenuRouteStates(staticState, remoteState)
  }

  function getOwnedRouteNames(): Set<string> {
    return new Set([...staticRegistry.names, ...remoteRegistry.names])
  }

  function replaceRemoteState(nextState: MenuRouteState): void {
    const previousState = remoteState
    remoteRegistry.reset()

    try {
      remoteRegistry.register(nextState.routes)
    }
    catch (error) {
      remoteRegistry.reset()
      remoteRegistry.register(previousState.routes)
      reportMenuRouteError(options, error, { phase: 'register-routes', source: 'remote' })
      throw error
    }

    remoteState = nextState
    remoteLoaded = true
    refreshCombinedState()
  }

  function startRemoteLoad(force: boolean): Promise<NormalizedMenuNode[]> {
    if (disposed) {
      return Promise.reject(new Error('菜单路由运行时已释放'))
    }

    if (loadingRemote) {
      return loadingRemote
    }

    if (remoteLoaded && !force) {
      return Promise.resolve(cloneRootItems(remoteState.menus))
    }

    if (!options.loadRemoteMenus) {
      remoteLoaded = true
      return Promise.resolve([])
    }

    const currentGeneration = loadGeneration
    const request = (async () => {
      let records: LumalMenuInputRecord[]
      try {
        records = await options.loadRemoteMenus!()
      }
      catch (error) {
        reportMenuRouteError(options, error, { phase: 'load-remote-menus', source: 'remote' })
        throw error
      }

      if (disposed || currentGeneration !== loadGeneration) {
        return cloneRootItems(remoteState.menus)
      }

      assertMenuInputPaths(records, options.remoteNormalizeOptions, 'remote')
      const nextState = prepareMenuRouteState(
        normalizeMenuRecords(records, options.remoteNormalizeOptions),
        'remote',
        options,
      )
      assertNoMenuRouteConflicts(
        staticState.menus,
        nextState.menus,
        options.router,
        getOwnedRouteNames(),
      )

      if (disposed || currentGeneration !== loadGeneration) {
        return cloneRootItems(remoteState.menus)
      }

      replaceRemoteState(nextState)
      return cloneRootItems(remoteState.menus)
    })()
    const trackedRequest = request.finally(() => {
      if (loadingRemote === trackedRequest) {
        loadingRemote = undefined
      }
    })
    loadingRemote = trackedRequest
    return trackedRequest
  }

  function resetRemote(): void {
    loadGeneration += 1
    loadingRemote = undefined
    remoteRegistry.reset()
    remoteState = emptyState()
    remoteLoaded = false
    refreshCombinedState()
  }

  function dispose(): void {
    if (disposed) {
      return
    }

    disposed = true
    resetRemote()
    staticRegistry.reset()
    staticState = emptyState()
    refreshCombinedState()
  }

  return {
    get firstAccessibleMenu() {
      return findFirstAccessibleMenu(getCombinedState().menus, {
        hasPermission: options.hasPermission,
        hasRole: options.hasRole,
      })
    },
    get firstAccessiblePath() {
      return this.firstAccessibleMenu?.path ?? ''
    },
    get menus() {
      return cloneRootItems(getCombinedState().menus)
    },
    get remoteLoaded() {
      return remoteLoaded
    },
    get remoteMenus() {
      return cloneRootItems(remoteState.menus)
    },
    get routeNames() {
      return [...staticRegistry.names, ...remoteRegistry.names]
    },
    get routes() {
      return cloneRootItems(getCombinedState().routes)
    },
    get sidebarMenus() {
      return createSidebarMenus(getCombinedState().menus, {
        hasPermission: options.hasPermission,
        hasRole: options.hasRole,
      })
    },
    get staticMenus() {
      return cloneRootItems(staticState.menus)
    },
    get topMenus() {
      return createTopMenus(getCombinedState().menus, {
        hasPermission: options.hasPermission,
        hasRole: options.hasRole,
      })
    },
    loadRemote: () => startRemoteLoad(false),
    reload: () => startRemoteLoad(true),
    resetRemote,
    dispose,
  }
}
