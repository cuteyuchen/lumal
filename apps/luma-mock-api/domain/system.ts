import type { DictionaryOption } from '@luma/core/dictionary'
import type { LumaMenuRecord } from '@luma/core/router'
import { adminRouteRecords, staticAdminRouteRecords } from '../../luma-admin/src/router/routes'
import {
  resetMockAccountPassword,
  resetMockAccounts,
  updateMockAccountName,
  updateMockAccountRoles,
  updateMockAccountStatus,
} from './auth'
import {
  adminPermissionCodes,
  deleteMockRolePermissions,
  getMockRolePermissions,
  resetMockRolePermissions,
  setMockRolePermissions,
} from './permission'

export type SystemUserStatus = 'disabled' | 'enabled'

export interface SystemUserRecord {
  createdAt: string
  id: string
  nickname: string
  organizationId: string
  phone: string
  /** @deprecated 使用 roles；保留给现有消费页面兼容。 */
  role: string
  roles: string[]
  status: SystemUserStatus
  username: string
}

export interface SystemUserQuery {
  keyword?: string
  organizationId?: string
  /** @deprecated 使用 roles；保留旧调用兼容。 */
  role?: string
  roles?: string
  status?: SystemUserStatus | ''
}

export interface SystemUserListParams {
  page: number
  pageSize: number
  query?: SystemUserQuery
}

export interface SystemUserListResult {
  items: SystemUserRecord[]
  total: number
}

export interface SaveSystemUserInput {
  nickname?: unknown
  organizationId?: unknown
  phone?: unknown
  /** @deprecated 使用 roles；保留旧调用兼容。 */
  role?: unknown
  roles?: unknown
  status?: unknown
  username?: unknown
}

export interface SystemUserPasswordResetResult {
  temporaryPassword: string
}

export type SystemUserRoleBatchMode = 'append' | 'replace'

export interface SystemUserBatchResult {
  items: SystemUserRecord[]
  updated: number
}

export type SystemRoleStatus = SystemUserStatus

export interface SystemRoleRecord {
  builtIn: boolean
  code: string
  description: string
  id: string
  name: string
  status: SystemRoleStatus
}

export interface SystemRoleQuery {
  keyword?: string
  status?: SystemRoleStatus | ''
}

export interface SystemRoleListParams {
  page: number
  pageSize: number
  query?: SystemRoleQuery
}

export interface SystemRoleListResult {
  items: SystemRoleRecord[]
  total: number
}

export interface SaveSystemRoleInput {
  code?: unknown
  description?: unknown
  name?: unknown
  status?: unknown
}

export interface SystemOrganizationRecord {
  children?: SystemOrganizationRecord[]
  code: string
  email: string
  id: string
  leader: string
  name: string
  order: number
  parentId: string
  phone: string
  status: SystemUserStatus
}

export interface SaveSystemOrganizationInput {
  code?: unknown
  email?: unknown
  leader?: unknown
  name?: unknown
  order?: unknown
  parentId?: unknown
  phone?: unknown
  status?: unknown
}

export interface SystemOrganizationOption {
  children?: SystemOrganizationOption[]
  disabled: boolean
  label: string
  value: string
}

export interface SystemPermissionTreeNode {
  children?: SystemPermissionTreeNode[]
  id: string
  label: string
  permission?: string
}

export type SystemMenuType = 'button' | 'directory' | 'embedded' | 'external' | 'menu'

export interface SystemMenuRecord {
  activeMenu?: string
  badge?: string | number
  badgeTone?: string
  badgeType?: 'dot' | 'text'
  children?: SystemMenuRecord[]
  component: string
  externalLink?: string
  externalTarget?: '_blank' | '_self'
  hidden: boolean
  hideInBreadcrumb?: boolean
  icon: string
  id: string
  order: number
  name?: string
  parentId: string
  path: string
  permission: string
  permissions?: string[]
  redirect?: string
  title: string
  type: SystemMenuType
}

export interface SaveSystemMenuInput {
  activeMenu?: unknown
  badge?: unknown
  badgeTone?: unknown
  badgeType?: unknown
  component?: unknown
  externalLink?: unknown
  externalTarget?: unknown
  hidden?: unknown
  hideInBreadcrumb?: unknown
  icon?: unknown
  order?: unknown
  name?: unknown
  parentId?: unknown
  path?: unknown
  permissions?: unknown
  /** @deprecated 使用 permissions；保留旧调用兼容。 */
  permission?: unknown
  redirect?: unknown
  title?: unknown
  type?: unknown
}

export interface SystemDictionaryTypeRecord {
  code: string
  description: string
  id: string
  name: string
  status: SystemUserStatus
}

export interface SystemDictionaryItemRecord {
  color: string
  id: string
  label: string
  order: number
  status: SystemUserStatus
  typeCode: string
  value: string
}

export interface SaveSystemDictionaryTypeInput {
  code?: unknown
  description?: unknown
  name?: unknown
  status?: unknown
}

export interface SaveSystemDictionaryItemInput {
  color?: unknown
  label?: unknown
  order?: unknown
  status?: unknown
  typeCode?: unknown
  value?: unknown
}

const initialSystemUsers: SystemUserRecord[] = [
  {
    createdAt: '2026-01-15',
    id: 'user-1',
    nickname: '超级管理员',
    organizationId: 'organization-1',
    phone: '13800138001',
    role: 'admin',
    roles: ['admin'],
    status: 'enabled',
    username: 'admin',
  },
  {
    createdAt: '2026-02-20',
    id: 'user-2',
    nickname: '运营人员',
    organizationId: 'organization-5',
    phone: '13800138002',
    role: 'operator',
    roles: ['operator'],
    status: 'enabled',
    username: 'operator',
  },
  {
    createdAt: '2026-03-10',
    id: 'user-3',
    nickname: '访客账号',
    organizationId: 'organization-1',
    phone: '13800138003',
    role: 'guest',
    roles: ['guest'],
    status: 'enabled',
    username: 'guest',
  },
  {
    createdAt: '2026-04-05',
    id: 'user-4',
    nickname: '项目管理员',
    organizationId: 'organization-2',
    phone: '13800138004',
    role: 'operator',
    roles: ['operator'],
    status: 'enabled',
    username: 'project-admin',
  },
  {
    createdAt: '2026-05-12',
    id: 'user-5',
    nickname: '审计访客',
    organizationId: 'organization-4',
    phone: '13800138005',
    role: 'guest',
    roles: ['guest'],
    status: 'disabled',
    username: 'audit-guest',
  },
  {
    createdAt: '2026-06-18',
    id: 'user-6',
    nickname: '内容运营',
    organizationId: 'organization-5',
    phone: '13800138006',
    role: 'operator',
    roles: ['operator'],
    status: 'enabled',
    username: 'content-operator',
  },
]

const initialSystemRoles: SystemRoleRecord[] = [
  {
    builtIn: true,
    code: 'admin',
    description: '拥有系统管理、项目和示例区全部权限',
    id: 'role-1',
    name: '超级管理员',
    status: 'enabled',
  },
  {
    builtIn: true,
    code: 'operator',
    description: '负责项目、字典和常用运营工作',
    id: 'role-2',
    name: '运营人员',
    status: 'enabled',
  },
  {
    builtIn: true,
    code: 'guest',
    description: '只允许访问工作台和基础示例',
    id: 'role-3',
    name: '访客',
    status: 'enabled',
  },
]

const initialPermissionMenuSeed: SystemMenuRecord[] = [
  {
    component: 'dashboard/index',
    hidden: false,
    icon: 'app:dashboard',
    id: 'menu-dashboard',
    order: 1,
    parentId: '',
    path: '/dashboard',
    permission: adminPermissionCodes.dashboardView,
    title: '工作台',
    type: 'menu',
  },
  {
    children: [
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-user-create', order: 1, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserCreate, title: '新增用户', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-user-update', order: 2, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserUpdate, title: '编辑用户', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-user-delete', order: 3, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserDelete, title: '删除用户', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-user-status', order: 4, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserStatus, title: '启停用户', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-user-assign-roles', order: 5, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserAssignRoles, title: '分配角色', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-user-reset-password', order: 6, parentId: 'menu-user', path: '', permission: adminPermissionCodes.systemUserResetPassword, title: '重置密码', type: 'button' },
        ],
        component: 'system/user',
        hidden: false,
        icon: 'app:user',
        id: 'menu-user',
        order: 1,
        parentId: 'menu-system',
        path: 'user',
        permission: adminPermissionCodes.systemUserList,
        title: '用户管理',
        type: 'menu',
      },
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-organization-create', order: 1, parentId: 'menu-organization', path: '', permission: adminPermissionCodes.systemOrganizationCreate, title: '新增机构', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-organization-update', order: 2, parentId: 'menu-organization', path: '', permission: adminPermissionCodes.systemOrganizationUpdate, title: '编辑机构', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-organization-delete', order: 3, parentId: 'menu-organization', path: '', permission: adminPermissionCodes.systemOrganizationDelete, title: '删除机构', type: 'button' },
        ],
        component: 'system/organization',
        hidden: false,
        icon: 'app:organization',
        id: 'menu-organization',
        order: 4,
        parentId: 'menu-system',
        path: 'organization',
        permission: adminPermissionCodes.systemOrganizationList,
        title: '机构管理',
        type: 'menu',
      },
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-role-create', order: 1, parentId: 'menu-role', path: '', permission: adminPermissionCodes.systemRoleCreate, title: '新增角色', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-role-update', order: 2, parentId: 'menu-role', path: '', permission: adminPermissionCodes.systemRoleUpdate, title: '编辑角色', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-role-delete', order: 3, parentId: 'menu-role', path: '', permission: adminPermissionCodes.systemRoleDelete, title: '删除角色', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-role-authorize', order: 4, parentId: 'menu-role', path: '', permission: adminPermissionCodes.systemRoleAuthorize, title: '角色授权', type: 'button' },
        ],
        component: 'system/role',
        hidden: false,
        icon: 'app:role',
        id: 'menu-role',
        order: 2,
        parentId: 'menu-system',
        path: 'role',
        permission: adminPermissionCodes.systemRoleList,
        title: '角色管理',
        type: 'menu',
      },
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-menu-create', order: 1, parentId: 'menu-menu', path: '', permission: adminPermissionCodes.systemMenuCreate, title: '新增菜单', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-menu-update', order: 2, parentId: 'menu-menu', path: '', permission: adminPermissionCodes.systemMenuUpdate, title: '编辑菜单', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-menu-delete', order: 3, parentId: 'menu-menu', path: '', permission: adminPermissionCodes.systemMenuDelete, title: '删除菜单', type: 'button' },
        ],
        component: 'system/menu',
        hidden: false,
        icon: 'app:menu',
        id: 'menu-menu',
        order: 3,
        parentId: 'menu-system',
        path: 'menu',
        permission: adminPermissionCodes.systemMenuList,
        title: '菜单管理',
        type: 'menu',
      },
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-dict-create', order: 1, parentId: 'menu-dict', path: '', permission: adminPermissionCodes.systemDictCreate, title: '新增字典', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-dict-update', order: 2, parentId: 'menu-dict', path: '', permission: adminPermissionCodes.systemDictUpdate, title: '编辑字典', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-dict-delete', order: 3, parentId: 'menu-dict', path: '', permission: adminPermissionCodes.systemDictDelete, title: '删除字典', type: 'button' },
        ],
        component: 'system/dict',
        hidden: false,
        icon: 'app:dict',
        id: 'menu-dict',
        order: 5,
        parentId: 'menu-system',
        path: 'dict',
        permission: adminPermissionCodes.systemDictList,
        title: '字典分类',
        type: 'menu',
      },
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-dict-item-create', order: 1, parentId: 'menu-dict-item', path: '', permission: adminPermissionCodes.systemDictCreate, title: '新增字典项', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-dict-item-update', order: 2, parentId: 'menu-dict-item', path: '', permission: adminPermissionCodes.systemDictUpdate, title: '编辑字典项', type: 'button' },
          { component: '', hidden: true, icon: '', id: 'button-dict-item-delete', order: 3, parentId: 'menu-dict-item', path: '', permission: adminPermissionCodes.systemDictDelete, title: '删除字典项', type: 'button' },
        ],
        component: 'system/dict-item',
        hidden: false,
        icon: 'app:dict',
        id: 'menu-dict-item',
        order: 6,
        parentId: 'menu-system',
        path: 'dict-item',
        permission: adminPermissionCodes.systemDictList,
        title: '字典项',
        type: 'menu',
      },
      {
        component: 'system/config',
        hidden: false,
        icon: 'app:settings',
        id: 'menu-config',
        order: 7,
        parentId: 'menu-system',
        path: 'config',
        permission: adminPermissionCodes.systemConfigView,
        title: '系统配置',
        type: 'menu',
      },
    ],
    component: '',
    hidden: false,
    icon: 'app:system',
    id: 'menu-system',
    order: 99,
    parentId: '',
    path: '/system',
    permission: '',
    title: '系统管理',
    type: 'directory',
  },
  {
    component: 'project/index',
    hidden: false,
    icon: '',
    id: 'menu-project',
    order: 4,
    parentId: '',
    path: '/project',
    permission: adminPermissionCodes.projectList,
    title: '项目管理',
    type: 'menu',
  },
  {
    children: [
      {
        children: [
          { component: '', hidden: true, icon: '', id: 'button-examples-dictionary', order: 1, parentId: 'menu-examples-overview', path: '', permission: adminPermissionCodes.examplesDictionary, title: '字典能力示例', type: 'button' },
        ],
        component: 'examples/overview',
        hidden: false,
        icon: 'app:examples',
        id: 'menu-examples-overview',
        order: 1,
        parentId: 'menu-examples',
        path: 'overview',
        permission: adminPermissionCodes.examplesView,
        title: '能力总览',
        type: 'menu',
      },
    ],
    component: '',
    hidden: false,
    icon: 'app:examples',
    id: 'menu-examples',
    order: 3,
    parentId: '',
    path: '/examples',
    permission: '',
    title: '能力示例',
    type: 'directory',
  },
]

function collectButtonSeeds(
  menus: SystemMenuRecord[],
  result = new Map<string, SystemMenuRecord[]>(),
): Map<string, SystemMenuRecord[]> {
  menus.forEach((menu) => {
    const buttons = menu.children?.filter(child => child.type === 'button') ?? []

    if (menu.component && buttons.length > 0) {
      result.set(menu.component, buttons)
    }

    if (menu.children) {
      collectButtonSeeds(menu.children.filter(child => child.type !== 'button'), result)
    }
  })

  return result
}

function normalizeRouteAuthority(authority: unknown): string[] {
  if (Array.isArray(authority)) {
    return authority.map(String).filter(Boolean)
  }

  return authority ? [String(authority)] : []
}

function createSystemMenusFromRoutes(
  routes: LumaMenuRecord[],
  buttonSeeds: Map<string, SystemMenuRecord[]>,
  parentId = '',
): SystemMenuRecord[] {
  return routes.map((route, index) => {
    const id = `route-${route.name ?? `${parentId || 'root'}-${index}`}`
    const permissions = normalizeRouteAuthority(route.meta?.authority)
    const routeChildren = createSystemMenusFromRoutes(route.children ?? [], buttonSeeds, id)
    const buttonChildren = (route.component ? buttonSeeds.get(route.component) : undefined)?.map(button => ({
      ...button,
      parentId: id,
    })) ?? []
    const externalLink = route.externalLink
      ?? (typeof route.meta?.externalLink === 'string' ? route.meta.externalLink : undefined)

    const children = [...routeChildren, ...buttonChildren]

    return {
      activeMenu: typeof route.meta?.activeMenu === 'string' ? route.meta.activeMenu : undefined,
      badge: typeof route.meta?.badge === 'string' || typeof route.meta?.badge === 'number' ? route.meta.badge : undefined,
      badgeTone: typeof route.meta?.badgeTone === 'string' ? route.meta.badgeTone : undefined,
      badgeType: route.meta?.badgeType === 'dot' ? 'dot' : route.meta?.badgeType === 'text' ? 'text' : undefined,
      ...(children.length > 0 ? { children } : {}),
      component: route.component ?? '',
      externalLink,
      externalTarget: externalLink ? (route.meta?.externalTarget === '_self' ? '_self' : '_blank') : undefined,
      hidden: route.meta?.hideInMenu === true,
      hideInBreadcrumb: route.meta?.hideInBreadcrumb === true,
      icon: typeof route.meta?.icon === 'string' ? route.meta.icon : '',
      id,
      name: route.name,
      order: typeof route.meta?.order === 'number' ? route.meta.order : index,
      parentId,
      path: route.path,
      permission: permissions[0] ?? '',
      permissions,
      redirect: typeof route.redirect === 'string' ? route.redirect : '',
      title: typeof route.meta?.title === 'string' ? route.meta.title : route.name ?? route.path,
      type: externalLink
        ? route.meta?.externalTarget === '_self' ? 'embedded' : 'external'
        : route.children?.length && !route.component ? 'directory' : 'menu',
    }
  })
}

const initialSystemMenus = createSystemMenusFromRoutes(
  adminRouteRecords,
  collectButtonSeeds(initialPermissionMenuSeed),
)
const staticPermissionMenus = createSystemMenusFromRoutes(staticAdminRouteRecords, new Map())

const initialSystemOrganizations: SystemOrganizationRecord[] = [
  {
    children: [
      {
        children: [
          {
            code: 'platform-front-end',
            email: 'frontend@luma.dev',
            id: 'organization-3',
            leader: '林晓',
            name: '前端研发组',
            order: 1,
            parentId: 'organization-2',
            phone: '010-80000003',
            status: 'enabled',
          },
          {
            code: 'platform-back-end',
            email: 'backend@luma.dev',
            id: 'organization-4',
            leader: '周宁',
            name: '服务端研发组',
            order: 2,
            parentId: 'organization-2',
            phone: '010-80000004',
            status: 'enabled',
          },
        ],
        code: 'platform-rd',
        email: 'rd@luma.dev',
        id: 'organization-2',
        leader: '陈屿',
        name: '平台研发中心',
        order: 1,
        parentId: 'organization-1',
        phone: '010-80000002',
        status: 'enabled',
      },
      {
        code: 'product-operation',
        email: 'operation@luma.dev',
        id: 'organization-5',
        leader: '叶青',
        name: '产品运营中心',
        order: 2,
        parentId: 'organization-1',
        phone: '010-80000005',
        status: 'enabled',
      },
    ],
    code: 'luma-headquarters',
    email: 'admin@luma.dev',
    id: 'organization-1',
    leader: '顾言',
    name: 'Luma 总部',
    order: 1,
    parentId: '',
    phone: '010-80000001',
    status: 'enabled',
  },
]

const initialDictionaryTypes: SystemDictionaryTypeRecord[] = [
  {
    code: 'status',
    description: '后台通用启用、停用状态',
    id: 'dict-type-1',
    name: '通用状态',
    status: 'enabled',
  },
  {
    code: 'priority',
    description: '任务和示例数据优先级',
    id: 'dict-type-2',
    name: '优先级',
    status: 'enabled',
  },
]

const initialDictionaryItems: SystemDictionaryItemRecord[] = [
  { color: '#16a34a', id: 'dict-item-1', label: '启用', order: 1, status: 'enabled', typeCode: 'status', value: 'enabled' },
  { color: '#94a3b8', id: 'dict-item-2', label: '停用', order: 2, status: 'enabled', typeCode: 'status', value: 'disabled' },
  { color: '#dc2626', id: 'dict-item-3', label: '高', order: 1, status: 'enabled', typeCode: 'priority', value: 'high' },
  { color: '#2563eb', id: 'dict-item-4', label: '普通', order: 2, status: 'enabled', typeCode: 'priority', value: 'normal' },
]

let systemUsers = cloneUsers(initialSystemUsers)
let nextSystemUserId = initialSystemUsers.length + 1
let systemRoles = cloneRoles(initialSystemRoles)
let nextSystemRoleId = initialSystemRoles.length + 1
let systemMenus = cloneMenus(initialSystemMenus)
let nextSystemMenuId = 1
let systemOrganizations = cloneOrganizations(initialSystemOrganizations)
let nextSystemOrganizationId = 6
let dictionaryTypes = cloneDictionaryTypes(initialDictionaryTypes)
let nextDictionaryTypeId = initialDictionaryTypes.length + 1
let dictionaryItems = cloneDictionaryItems(initialDictionaryItems)
let nextDictionaryItemId = initialDictionaryItems.length + 1

function cloneUser(user: SystemUserRecord): SystemUserRecord {
  return { ...user, roles: [...user.roles] }
}

function cloneUsers(users: SystemUserRecord[]): SystemUserRecord[] {
  return users.map(cloneUser)
}

function cloneOrganization(organization: SystemOrganizationRecord): SystemOrganizationRecord {
  return {
    ...organization,
    children: organization.children ? cloneOrganizations(organization.children) : undefined,
  }
}

function cloneOrganizations(organizations: SystemOrganizationRecord[]): SystemOrganizationRecord[] {
  return organizations.map(cloneOrganization)
}

function cloneRole(role: SystemRoleRecord): SystemRoleRecord {
  return { ...role }
}

function cloneRoles(roles: SystemRoleRecord[]): SystemRoleRecord[] {
  return roles.map(cloneRole)
}

function cloneMenu(menu: SystemMenuRecord): SystemMenuRecord {
  return {
    ...menu,
    children: menu.children ? cloneMenus(menu.children) : undefined,
    permissions: menu.permissions?.length
      ? [...menu.permissions]
      : menu.permission ? [menu.permission] : [],
  }
}

function cloneMenus(menus: SystemMenuRecord[]): SystemMenuRecord[] {
  return menus.map(cloneMenu)
}

function cloneDictionaryTypes(types: SystemDictionaryTypeRecord[]): SystemDictionaryTypeRecord[] {
  return types.map(type => ({ ...type }))
}

function cloneDictionaryItems(items: SystemDictionaryItemRecord[]): SystemDictionaryItemRecord[] {
  return items.map(item => ({ ...item }))
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeRoles(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  const roles = Array.from(new Set(values.map(normalizeText).filter(Boolean)))

  if (roles.length === 0 || roles.some(role => !systemRoles.some(item => item.code === role))) {
    throw new Error('请选择有效角色')
  }

  return roles
}

function normalizeStatus(value: unknown): SystemUserStatus {
  if (value === 'disabled' || value === 'enabled') {
    return value
  }

  return 'enabled'
}

function resolveUserInput(
  input: SaveSystemUserInput,
  currentOrganizationId?: string,
): Omit<SystemUserRecord, 'createdAt' | 'id'> {
  const username = normalizeText(input.username)
  const nickname = normalizeText(input.nickname)
  const organizationId = normalizeText(input.organizationId)
  const roles = normalizeRoles(input.roles ?? input.role)

  if (!username) {
    throw new Error('用户名不能为空')
  }

  if (!nickname) {
    throw new Error('昵称不能为空')
  }

  if (!organizationId) {
    throw new Error('请选择所属机构')
  }

  const organization = findOrganizationById(systemOrganizations, organizationId)
  if (!organization) {
    throw new Error('所属机构不存在')
  }

  if (organization.status === 'disabled' && organizationId !== currentOrganizationId) {
    throw new Error('只能选择启用机构')
  }

  return {
    nickname,
    organizationId,
    phone: normalizeText(input.phone),
    role: roles[0],
    roles,
    status: normalizeStatus(input.status),
    username,
  }
}

function assertUsernameAvailable(username: string, excludedId?: string): void {
  const duplicated = systemUsers.some(user => user.id !== excludedId && user.username === username)

  if (duplicated) {
    throw new Error('用户名已存在')
  }
}

function resolveRoleInput(input: SaveSystemRoleInput): Omit<SystemRoleRecord, 'builtIn' | 'id'> {
  const code = normalizeText(input.code)
  const name = normalizeText(input.name)

  if (!name) {
    throw new Error('角色名称不能为空')
  }

  if (!code) {
    throw new Error('角色编码不能为空')
  }

  if (!/^[a-z][a-z0-9:-]*$/.test(code)) {
    throw new Error('角色编码只能包含小写字母、数字、冒号和连字符')
  }

  return {
    code,
    description: normalizeText(input.description),
    name,
    status: normalizeStatus(input.status),
  }
}

function assertRoleCodeAvailable(code: string, excludedId?: string): void {
  const duplicated = systemRoles.some(role => role.id !== excludedId && role.code === code)

  if (duplicated) {
    throw new Error('角色编码已存在')
  }
}

function findOrganizationById(
  organizations: SystemOrganizationRecord[],
  id: string,
): SystemOrganizationRecord | undefined {
  for (const organization of organizations) {
    if (organization.id === id) {
      return organization
    }

    const child = organization.children
      ? findOrganizationById(organization.children, id)
      : undefined
    if (child) {
      return child
    }
  }

  return undefined
}

function organizationContains(organization: SystemOrganizationRecord, id: string): boolean {
  return organization.id === id
    || Boolean(organization.children?.some(child => organizationContains(child, id)))
}

function resolveOrganizationInput(
  input: SaveSystemOrganizationInput,
  currentId?: string,
): Omit<SystemOrganizationRecord, 'children' | 'id'> {
  const code = normalizeText(input.code)
  const name = normalizeText(input.name)
  const parentId = normalizeText(input.parentId)

  if (!name) {
    throw new Error('机构名称不能为空')
  }

  if (!/^[a-z][a-z0-9-]*$/.test(code)) {
    throw new Error('机构编码只能包含小写字母、数字和连字符')
  }

  if (parentId) {
    const parent = findOrganizationById(systemOrganizations, parentId)
    if (!parent) {
      throw new Error('上级机构不存在')
    }
    if (currentId) {
      const current = findOrganizationById(systemOrganizations, currentId)
      if (current && organizationContains(current, parentId)) {
        throw new Error('不能将机构移动到自身或其下级')
      }
    }
  }

  const duplicated = flattenOrganizations(systemOrganizations)
    .some(organization => organization.id !== currentId && organization.code === code)
  if (duplicated) {
    throw new Error('机构编码已存在')
  }

  return {
    code,
    email: normalizeText(input.email),
    leader: normalizeText(input.leader),
    name,
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
    parentId,
    phone: normalizeText(input.phone),
    status: normalizeStatus(input.status),
  }
}

function flattenOrganizations(
  organizations: SystemOrganizationRecord[],
): SystemOrganizationRecord[] {
  return organizations.flatMap(organization => [
    organization,
    ...flattenOrganizations(organization.children ?? []),
  ])
}

function insertOrganization(
  organizations: SystemOrganizationRecord[],
  organization: SystemOrganizationRecord,
): SystemOrganizationRecord[] {
  if (!organization.parentId) {
    return [...organizations, organization]
  }

  return organizations.map(item => item.id === organization.parentId
    ? { ...item, children: [...(item.children ?? []), organization] }
    : { ...item, children: item.children ? insertOrganization(item.children, organization) : undefined })
}

function removeOrganization(
  organizations: SystemOrganizationRecord[],
  id: string,
): SystemOrganizationRecord[] {
  return organizations
    .filter(organization => organization.id !== id)
    .map(organization => ({
      ...organization,
      children: organization.children ? removeOrganization(organization.children, id) : undefined,
    }))
}

function sortOrganizations(organizations: SystemOrganizationRecord[]): SystemOrganizationRecord[] {
  return [...organizations]
    .sort((left, right) => left.order - right.order)
    .map(organization => ({
      ...organization,
      children: organization.children ? sortOrganizations(organization.children) : undefined,
    }))
}

function normalizeMenuType(value: unknown): SystemMenuType {
  if (value === 'button' || value === 'directory' || value === 'embedded' || value === 'external' || value === 'menu') {
    return value
  }

  throw new Error('请选择菜单类型')
}

function resolveMenuInput(input: SaveSystemMenuInput): Omit<SystemMenuRecord, 'children' | 'id'> {
  const type = normalizeMenuType(input.type)
  const title = normalizeText(input.title)
  const parentId = normalizeText(input.parentId)
  const path = type === 'button' ? '' : normalizeText(input.path)
  const component = type === 'menu' ? normalizeText(input.component) : ''
  const externalLink = type === 'embedded' || type === 'external' ? normalizeText(input.externalLink) : ''
  const permissionValues = Array.isArray(input.permissions)
    ? input.permissions
    : normalizeText(input.permissions ?? input.permission).split(',')
  const permissions = Array.from(new Set(permissionValues.map(normalizeText).filter(Boolean)))

  if (!title) {
    throw new Error('菜单标题不能为空')
  }

  if (type !== 'button' && !path) {
    throw new Error('当前菜单类型必须填写路径')
  }

  if (type === 'menu' && !component) {
    throw new Error('菜单必须填写组件')
  }

  if ((type === 'embedded' || type === 'external') && !externalLink) {
    throw new Error(type === 'embedded' ? '内嵌菜单必须填写内嵌地址' : '外链菜单必须填写外链地址')
  }

  return {
    activeMenu: type === 'button' ? '' : normalizeText(input.activeMenu),
    badge: type === 'button' ? '' : typeof input.badge === 'number' ? input.badge : normalizeText(input.badge),
    badgeTone: type === 'button' ? '' : normalizeText(input.badgeTone),
    badgeType: input.badgeType === 'dot' ? 'dot' : input.badgeType === 'text' ? 'text' : undefined,
    component: type === 'embedded' ? 'shared/external-frame' : component,
    externalLink,
    externalTarget: type === 'embedded' ? '_self' : type === 'external' ? '_blank' : undefined,
    hidden: type === 'button' ? true : input.hidden === true,
    hideInBreadcrumb: type === 'button' ? true : input.hideInBreadcrumb === true,
    icon: type === 'button' ? '' : normalizeText(input.icon),
    name: type === 'button' ? '' : normalizeText(input.name),
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
    parentId,
    path,
    permission: permissions[0] ?? '',
    permissions,
    redirect: type === 'directory' ? normalizeText(input.redirect) : '',
    title,
    type,
  }
}

function findMenuById(menus: SystemMenuRecord[], id: string): SystemMenuRecord | undefined {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu
    }

    const child = menu.children ? findMenuById(menu.children, id) : undefined
    if (child) {
      return child
    }
  }

  return undefined
}

function insertMenu(menus: SystemMenuRecord[], menu: SystemMenuRecord): SystemMenuRecord[] {
  if (!menu.parentId) {
    return [...menus, menu]
  }

  return menus.map(item => item.id === menu.parentId
    ? { ...item, children: [...(item.children ?? []), menu] }
    : { ...item, children: item.children ? insertMenu(item.children, menu) : undefined })
}

function updateMenu(menus: SystemMenuRecord[], id: string, nextMenu: SystemMenuRecord): SystemMenuRecord[] {
  return menus.map(menu => menu.id === id
    ? nextMenu
    : { ...menu, children: menu.children ? updateMenu(menu.children, id, nextMenu) : undefined })
}

function removeMenu(menus: SystemMenuRecord[], id: string): SystemMenuRecord[] {
  return menus
    .filter(menu => menu.id !== id)
    .map(menu => ({
      ...menu,
      children: menu.children ? removeMenu(menu.children, id) : undefined,
    }))
}

function sortMenus(menus: SystemMenuRecord[]): SystemMenuRecord[] {
  return [...menus]
    .sort((left, right) => left.order - right.order)
    .map(menu => ({
      ...menu,
      children: menu.children ? sortMenus(menu.children) : undefined,
    }))
}

function createPermissionTreeFromMenus(
  menus: SystemMenuRecord[],
  seenPermissions = new Set<string>(),
): SystemPermissionTreeNode[] {
  return menus.flatMap((menu): SystemPermissionTreeNode[] => {
    const children = menu.children ? createPermissionTreeFromMenus(menu.children, seenPermissions) : []
    const permissions = menu.permissions?.length
      ? menu.permissions
      : menu.permission ? [menu.permission] : []
    const permissionNodes = permissions
      .filter(permission => !seenPermissions.has(permission))
      .map((permission, index) => {
        seenPermissions.add(permission)
        return {
          id: permission,
          label: index === 0 ? menu.title : `${menu.title}（${permission}）`,
          permission,
        }
      })

    if (permissionNodes.length === 0 && children.length === 0) {
      return []
    }

    if (permissionNodes.length === 1) {
      return [{ ...permissionNodes[0], ...(children.length > 0 ? { children } : {}) }]
    }

    return [{
      children: [...permissionNodes, ...children],
      id: `group:${menu.id}`,
      label: menu.title,
    }]
  })
}

function resolveDictionaryTypeInput(
  input: SaveSystemDictionaryTypeInput,
): Omit<SystemDictionaryTypeRecord, 'id'> {
  const code = normalizeText(input.code)
  const name = normalizeText(input.name)

  if (!name) {
    throw new Error('字典名称不能为空')
  }

  if (!/^[a-z][a-z0-9_-]*$/.test(code)) {
    throw new Error('字典编码只能包含小写字母、数字、下划线和连字符')
  }

  return {
    code,
    description: normalizeText(input.description),
    name,
    status: normalizeStatus(input.status),
  }
}

function resolveDictionaryItemInput(
  input: SaveSystemDictionaryItemInput,
): Omit<SystemDictionaryItemRecord, 'id'> {
  const typeCode = normalizeText(input.typeCode)
  const label = normalizeText(input.label)
  const value = normalizeText(input.value)

  if (!dictionaryTypes.some(type => type.code === typeCode)) {
    throw new Error('字典类型不存在')
  }

  if (!label || !value) {
    throw new Error('字典标签和值不能为空')
  }

  return {
    color: normalizeText(input.color),
    label,
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
    status: normalizeStatus(input.status),
    typeCode,
    value,
  }
}

function assertDictionaryCodeAvailable(code: string, excludedId?: string): void {
  if (dictionaryTypes.some(type => type.id !== excludedId && type.code === code)) {
    throw new Error('字典编码已存在')
  }
}

function assertDictionaryValueAvailable(typeCode: string, value: string, excludedId?: string): void {
  if (dictionaryItems.some(item => item.id !== excludedId && item.typeCode === typeCode && item.value === value)) {
    throw new Error('当前字典下已存在相同值')
  }
}

export async function mockFetchSystemUsers(params: SystemUserListParams): Promise<SystemUserListResult> {
  const keyword = normalizeText(params.query?.keyword).toLowerCase()
  const organizationId = normalizeText(params.query?.organizationId)
  const selectedOrganization = organizationId
    ? findOrganizationById(systemOrganizations, organizationId)
    : undefined
  const organizationIds = organizationId
    ? new Set(selectedOrganization ? flattenOrganizations([selectedOrganization]).map(item => item.id) : [])
    : undefined
  const role = params.query?.roles || params.query?.role || ''
  const status = params.query?.status || ''
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const filteredUsers = systemUsers.filter((user) => {
    const matchesKeyword = keyword
      ? [user.username, user.nickname, user.phone].some(value => value.toLowerCase().includes(keyword))
      : true
    const matchesRole = role ? user.roles.includes(role) : true
    const matchesStatus = status ? user.status === status : true
    const matchesOrganization = organizationIds ? organizationIds.has(user.organizationId) : true

    return matchesKeyword && matchesRole && matchesStatus && matchesOrganization
  })
  const start = (page - 1) * pageSize

  return {
    items: cloneUsers(filteredUsers.slice(start, start + pageSize)),
    total: filteredUsers.length,
  }
}

export async function mockCreateSystemUser(input: SaveSystemUserInput): Promise<SystemUserRecord> {
  const normalized = resolveUserInput(input)
  assertUsernameAvailable(normalized.username)

  const user: SystemUserRecord = {
    ...normalized,
    createdAt: new Date().toISOString().slice(0, 10),
    id: `user-${nextSystemUserId++}`,
  }
  systemUsers = [user, ...systemUsers]

  return cloneUser(user)
}

export async function mockUpdateSystemUser(id: string, input: SaveSystemUserInput): Promise<SystemUserRecord> {
  const currentUser = systemUsers.find(user => user.id === id)

  if (!currentUser) {
    throw new Error('用户不存在')
  }

  const normalized = resolveUserInput({
    ...currentUser,
    ...input,
  }, currentUser.organizationId)
  assertUsernameAvailable(normalized.username, id)

  const updatedUser: SystemUserRecord = {
    ...currentUser,
    ...normalized,
  }
  systemUsers = systemUsers.map(user => user.id === id ? updatedUser : user)
  updateMockAccountName(updatedUser.username, updatedUser.nickname)
  updateMockAccountRoles(updatedUser.username, updatedUser.roles)
  updateMockAccountStatus(updatedUser.username, updatedUser.status === 'enabled')

  return cloneUser(updatedUser)
}

export async function mockUpdateSystemUserStatus(
  id: string,
  status: SystemUserStatus,
): Promise<SystemUserRecord> {
  const user = systemUsers.find(item => item.id === id)

  if (!user) {
    throw new Error('用户不存在')
  }

  const updatedUser = { ...user, status: normalizeStatus(status) }
  systemUsers = systemUsers.map(item => item.id === id ? updatedUser : item)
  updateMockAccountStatus(updatedUser.username, updatedUser.status === 'enabled')
  return cloneUser(updatedUser)
}

export async function mockUpdateSystemUserRoles(
  id: string,
  roles: string[],
): Promise<SystemUserRecord> {
  const user = systemUsers.find(item => item.id === id)

  if (!user) {
    throw new Error('用户不存在')
  }

  const normalizedRoles = normalizeRoles(roles)
  const updatedUser = { ...user, role: normalizedRoles[0], roles: normalizedRoles }
  systemUsers = systemUsers.map(item => item.id === id ? updatedUser : item)
  updateMockAccountRoles(updatedUser.username, normalizedRoles)
  return cloneUser(updatedUser)
}

function resolveBatchUsers(ids: unknown): SystemUserRecord[] {
  if (!Array.isArray(ids)) {
    throw new TypeError('请选择用户')
  }

  const normalizedIds = Array.from(new Set(ids.map(normalizeText).filter(Boolean)))
  if (normalizedIds.length === 0) {
    throw new Error('请选择用户')
  }

  const users = normalizedIds.map(id => systemUsers.find(user => user.id === id))
  if (users.some(user => !user)) {
    throw new Error('用户不存在')
  }

  return users as SystemUserRecord[]
}

function normalizeRequiredStatus(value: unknown): SystemUserStatus {
  if (value !== 'disabled' && value !== 'enabled') {
    throw new Error('请选择有效状态')
  }

  return value
}

export async function mockBatchUpdateSystemUserStatus(
  ids: string[],
  status: SystemUserStatus,
): Promise<SystemUserBatchResult> {
  const users = resolveBatchUsers(ids)
  const normalizedStatus = normalizeRequiredStatus(status)
  const updates = new Map(users.map(user => [user.id, { ...user, status: normalizedStatus }]))

  systemUsers = systemUsers.map(user => updates.get(user.id) ?? user)
  const items = users.map((user) => {
    const updatedUser = updates.get(user.id)!
    updateMockAccountStatus(updatedUser.username, updatedUser.status === 'enabled')
    return cloneUser(updatedUser)
  })

  return { items, updated: items.length }
}

export async function mockBatchUpdateSystemUserRoles(
  ids: string[],
  roles: string[],
  mode: SystemUserRoleBatchMode,
): Promise<SystemUserBatchResult> {
  const users = resolveBatchUsers(ids)
  const normalizedRoles = normalizeRoles(roles)
  if (mode !== 'append' && mode !== 'replace') {
    throw new Error('请选择有效的角色分配方式')
  }

  const updates = new Map(users.map((user) => {
    const nextRoles = mode === 'append'
      ? normalizeRoles([...user.roles, ...normalizedRoles])
      : normalizedRoles
    return [user.id, { ...user, role: nextRoles[0]!, roles: [...nextRoles] }]
  }))

  systemUsers = systemUsers.map(user => updates.get(user.id) ?? user)
  const items = users.map((user) => {
    const updatedUser = updates.get(user.id)!
    updateMockAccountRoles(updatedUser.username, updatedUser.roles)
    return cloneUser(updatedUser)
  })

  return { items, updated: items.length }
}

export async function mockResetSystemUserPassword(id: string): Promise<SystemUserPasswordResetResult> {
  if (!systemUsers.some(user => user.id === id)) {
    throw new Error('用户不存在')
  }

  const user = systemUsers.find(item => item.id === id)!
  const temporaryPassword = 'Luma@123456'
  resetMockAccountPassword(user.username, temporaryPassword)
  return { temporaryPassword }
}

export async function mockDeleteSystemUser(id: string): Promise<void> {
  const user = systemUsers.find(item => item.id === id)
  systemUsers = systemUsers.filter(item => item.id !== id)
  if (user) {
    updateMockAccountStatus(user.username, false)
  }
}

export async function mockFetchSystemRoleOptions(): Promise<DictionaryOption[]> {
  return systemRoles.map(role => ({
    ...(role.status === 'disabled' ? { disabled: true } : {}),
    label: role.name,
    value: role.code,
  }))
}

export async function mockFetchSystemRoles(params: SystemRoleListParams): Promise<SystemRoleListResult> {
  const keyword = normalizeText(params.query?.keyword).toLowerCase()
  const status = params.query?.status || ''
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const filteredRoles = systemRoles.filter((role) => {
    const matchesKeyword = keyword
      ? [role.name, role.code, role.description].some(value => value.toLowerCase().includes(keyword))
      : true
    const matchesStatus = status ? role.status === status : true

    return matchesKeyword && matchesStatus
  })
  const start = (page - 1) * pageSize

  return {
    items: cloneRoles(filteredRoles.slice(start, start + pageSize)),
    total: filteredRoles.length,
  }
}

export async function mockCreateSystemRole(input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  const normalized = resolveRoleInput(input)
  assertRoleCodeAvailable(normalized.code)

  const role: SystemRoleRecord = {
    ...normalized,
    builtIn: false,
    id: `role-${nextSystemRoleId++}`,
  }
  systemRoles = [...systemRoles, role]
  setMockRolePermissions(role.code, [])

  return cloneRole(role)
}

export async function mockUpdateSystemRole(id: string, input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  const currentRole = systemRoles.find(role => role.id === id)

  if (!currentRole) {
    throw new Error('角色不存在')
  }

  const normalized = resolveRoleInput({
    ...currentRole,
    ...input,
    code: currentRole.code,
  })
  assertRoleCodeAvailable(normalized.code, id)

  const updatedRole: SystemRoleRecord = {
    ...currentRole,
    ...normalized,
  }
  systemRoles = systemRoles.map(role => role.id === id ? updatedRole : role)

  return cloneRole(updatedRole)
}

export async function mockDeleteSystemRole(id: string): Promise<void> {
  const role = systemRoles.find(item => item.id === id)

  if (!role) {
    return
  }

  if (role.builtIn) {
    throw new Error('内置角色不能删除')
  }

  if (systemUsers.some(user => user.roles.includes(role.code))) {
    throw new Error('该角色仍有关联用户，不能删除')
  }

  systemRoles = systemRoles.filter(item => item.id !== id)
  deleteMockRolePermissions(role.code)
}

export async function mockFetchSystemPermissionTree(): Promise<SystemPermissionTreeNode[]> {
  return createPermissionTreeFromMenus([...staticPermissionMenus, ...systemMenus])
}

export async function mockFetchSystemRolePermissions(roleCode: string): Promise<string[]> {
  return getMockRolePermissions(roleCode)
}

export async function mockUpdateSystemRolePermissions(roleCode: string, permissions: string[]): Promise<string[]> {
  if (!systemRoles.some(role => role.code === roleCode)) {
    throw new Error('角色不存在')
  }

  setMockRolePermissions(roleCode, permissions)
  return getMockRolePermissions(roleCode)
}

export async function mockFetchSystemOrganizations(): Promise<SystemOrganizationRecord[]> {
  return cloneOrganizations(sortOrganizations(systemOrganizations))
}

export async function mockFetchSystemOrganizationOptions(): Promise<SystemOrganizationOption[]> {
  return sortOrganizations(systemOrganizations).map(toOrganizationOption)
}

function toOrganizationOption(organization: SystemOrganizationRecord): SystemOrganizationOption {
  return {
    ...(organization.children?.length
      ? { children: organization.children.map(toOrganizationOption) }
      : {}),
    disabled: organization.status === 'disabled',
    label: `${organization.name}（${organization.code}）`,
    value: organization.id,
  }
}

export async function mockCreateSystemOrganization(
  input: SaveSystemOrganizationInput,
): Promise<SystemOrganizationRecord> {
  const normalized = resolveOrganizationInput(input)
  const organization: SystemOrganizationRecord = {
    ...normalized,
    id: `organization-${nextSystemOrganizationId++}`,
  }
  systemOrganizations = sortOrganizations(insertOrganization(systemOrganizations, organization))

  return cloneOrganization(organization)
}

export async function mockUpdateSystemOrganization(
  id: string,
  input: SaveSystemOrganizationInput,
): Promise<SystemOrganizationRecord> {
  const current = findOrganizationById(systemOrganizations, id)

  if (!current) {
    throw new Error('机构不存在')
  }

  const normalized = resolveOrganizationInput({ ...current, ...input }, id)
  const updated: SystemOrganizationRecord = {
    ...current,
    ...normalized,
    children: current.children,
  }
  const withoutCurrent = removeOrganization(systemOrganizations, id)
  systemOrganizations = sortOrganizations(insertOrganization(withoutCurrent, updated))

  return cloneOrganization(updated)
}

export async function mockDeleteSystemOrganization(id: string): Promise<void> {
  const organization = findOrganizationById(systemOrganizations, id)

  if (!organization) {
    return
  }

  if (organization.children?.length) {
    throw new Error('请先删除或移动下级机构')
  }

  if (systemUsers.some(user => user.organizationId === id)) {
    throw new Error('该机构仍有直属用户，请先迁移用户')
  }

  systemOrganizations = removeOrganization(systemOrganizations, id)
}

export async function mockFetchSystemMenus(): Promise<SystemMenuRecord[]> {
  return cloneMenus(sortMenus(systemMenus))
}

export async function mockCreateSystemMenu(input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  const normalized = resolveMenuInput(input)
  const parent = normalized.parentId ? findMenuById(systemMenus, normalized.parentId) : undefined

  if (normalized.parentId && !parent) {
    throw new Error('父级菜单不存在')
  }

  if (parent && parent.type !== 'directory' && parent.type !== 'menu') {
    throw new Error('当前节点类型不能添加子项')
  }

  const menu: SystemMenuRecord = {
    ...normalized,
    id: `menu-custom-${nextSystemMenuId++}`,
  }
  systemMenus = sortMenus(insertMenu(systemMenus, menu))

  return cloneMenu(menu)
}

export async function mockUpdateSystemMenu(id: string, input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  const currentMenu = findMenuById(systemMenus, id)

  if (!currentMenu) {
    throw new Error('菜单不存在')
  }

  const normalized = resolveMenuInput({
    ...currentMenu,
    ...input,
    parentId: currentMenu.parentId,
  })
  if (currentMenu.children?.length && normalized.type !== 'directory' && normalized.type !== 'menu') {
    throw new Error('存在子项的节点只能设置为目录或菜单')
  }
  const updatedMenu: SystemMenuRecord = {
    ...currentMenu,
    ...normalized,
    children: currentMenu.children,
  }
  systemMenus = sortMenus(updateMenu(systemMenus, id, updatedMenu))

  return cloneMenu(updatedMenu)
}

export async function mockDeleteSystemMenu(id: string): Promise<void> {
  systemMenus = removeMenu(systemMenus, id)
}

export async function mockFetchDictionaryTypes(): Promise<SystemDictionaryTypeRecord[]> {
  return cloneDictionaryTypes(dictionaryTypes)
}

export async function mockCreateDictionaryType(
  input: SaveSystemDictionaryTypeInput,
): Promise<SystemDictionaryTypeRecord> {
  const normalized = resolveDictionaryTypeInput(input)
  assertDictionaryCodeAvailable(normalized.code)

  const type: SystemDictionaryTypeRecord = {
    ...normalized,
    id: `dict-type-${nextDictionaryTypeId++}`,
  }
  dictionaryTypes = [...dictionaryTypes, type]

  return { ...type }
}

export async function mockUpdateDictionaryType(
  id: string,
  input: SaveSystemDictionaryTypeInput,
): Promise<SystemDictionaryTypeRecord> {
  const currentType = dictionaryTypes.find(type => type.id === id)

  if (!currentType) {
    throw new Error('字典类型不存在')
  }

  const normalized = resolveDictionaryTypeInput({
    ...currentType,
    ...input,
    code: currentType.code,
  })
  assertDictionaryCodeAvailable(normalized.code, id)

  const updatedType = { ...currentType, ...normalized }
  dictionaryTypes = dictionaryTypes.map(type => type.id === id ? updatedType : type)

  return { ...updatedType }
}

export async function mockDeleteDictionaryType(id: string): Promise<void> {
  const type = dictionaryTypes.find(item => item.id === id)

  if (!type) {
    return
  }

  dictionaryTypes = dictionaryTypes.filter(item => item.id !== id)
  dictionaryItems = dictionaryItems.filter(item => item.typeCode !== type.code)
}

export async function mockFetchDictionaryItems(typeCode: string): Promise<SystemDictionaryItemRecord[]> {
  return cloneDictionaryItems(
    dictionaryItems
      .filter(item => item.typeCode === typeCode)
      .sort((left, right) => left.order - right.order),
  )
}

export async function mockCreateDictionaryItem(
  input: SaveSystemDictionaryItemInput,
): Promise<SystemDictionaryItemRecord> {
  const normalized = resolveDictionaryItemInput(input)
  assertDictionaryValueAvailable(normalized.typeCode, normalized.value)

  const item: SystemDictionaryItemRecord = {
    ...normalized,
    id: `dict-item-${nextDictionaryItemId++}`,
  }
  dictionaryItems = [...dictionaryItems, item]

  return { ...item }
}

export async function mockUpdateDictionaryItem(
  id: string,
  input: SaveSystemDictionaryItemInput,
): Promise<SystemDictionaryItemRecord> {
  const currentItem = dictionaryItems.find(item => item.id === id)

  if (!currentItem) {
    throw new Error('字典项不存在')
  }

  const normalized = resolveDictionaryItemInput({
    ...currentItem,
    ...input,
    typeCode: currentItem.typeCode,
  })
  assertDictionaryValueAvailable(normalized.typeCode, normalized.value, id)

  const updatedItem = { ...currentItem, ...normalized }
  dictionaryItems = dictionaryItems.map(item => item.id === id ? updatedItem : item)

  return { ...updatedItem }
}

export async function mockDeleteDictionaryItem(id: string): Promise<void> {
  dictionaryItems = dictionaryItems.filter(item => item.id !== id)
}

export async function mockFetchDictionaryOptions(dictionary: string): Promise<DictionaryOption[]> {
  const type = dictionaryTypes.find(item => item.code === dictionary && item.status === 'enabled')

  if (!type) {
    return []
  }

  return dictionaryItems
    .filter(item => item.typeCode === dictionary && item.status === 'enabled')
    .sort((left, right) => left.order - right.order)
    .map(item => ({
      ...(item.color ? { color: item.color } : {}),
      label: item.label,
      value: item.value,
    }))
}

export function resetMockSystemUsers(): void {
  systemUsers = cloneUsers(initialSystemUsers)
  nextSystemUserId = initialSystemUsers.length + 1
  resetMockAccounts()
}

export function resetMockSystemRoles(): void {
  systemRoles = cloneRoles(initialSystemRoles)
  nextSystemRoleId = initialSystemRoles.length + 1
  resetMockRolePermissions()
}

export function resetMockSystemMenus(): void {
  systemMenus = cloneMenus(initialSystemMenus)
  nextSystemMenuId = 1
}

export function resetMockSystemOrganizations(): void {
  systemOrganizations = cloneOrganizations(initialSystemOrganizations)
  nextSystemOrganizationId = 6
}

export function resetMockDictionaries(): void {
  dictionaryTypes = cloneDictionaryTypes(initialDictionaryTypes)
  nextDictionaryTypeId = initialDictionaryTypes.length + 1
  dictionaryItems = cloneDictionaryItems(initialDictionaryItems)
  nextDictionaryItemId = initialDictionaryItems.length + 1
}

export interface MockSystemState {
  dictionaryItems: SystemDictionaryItemRecord[]
  dictionaryTypes: SystemDictionaryTypeRecord[]
  nextDictionaryItemId: number
  nextDictionaryTypeId: number
  nextSystemMenuId: number
  nextSystemOrganizationId: number
  nextSystemRoleId: number
  nextSystemUserId: number
  systemMenus: SystemMenuRecord[]
  systemOrganizations: SystemOrganizationRecord[]
  systemRoles: SystemRoleRecord[]
  systemUsers: SystemUserRecord[]
}

export function exportMockSystemState(): MockSystemState {
  return {
    dictionaryItems: cloneDictionaryItems(dictionaryItems),
    dictionaryTypes: cloneDictionaryTypes(dictionaryTypes),
    nextDictionaryItemId,
    nextDictionaryTypeId,
    nextSystemMenuId,
    nextSystemOrganizationId,
    nextSystemRoleId,
    nextSystemUserId,
    systemMenus: cloneMenus(systemMenus),
    systemOrganizations: cloneOrganizations(systemOrganizations),
    systemRoles: cloneRoles(systemRoles),
    systemUsers: cloneUsers(systemUsers),
  }
}

export function importMockSystemState(state: MockSystemState): void {
  dictionaryItems = cloneDictionaryItems(state.dictionaryItems)
  dictionaryTypes = cloneDictionaryTypes(state.dictionaryTypes)
  nextDictionaryItemId = state.nextDictionaryItemId
  nextDictionaryTypeId = state.nextDictionaryTypeId
  nextSystemMenuId = state.nextSystemMenuId
  nextSystemOrganizationId = state.nextSystemOrganizationId
  nextSystemRoleId = state.nextSystemRoleId
  nextSystemUserId = state.nextSystemUserId
  systemMenus = cloneMenus(state.systemMenus)
  systemOrganizations = cloneOrganizations(state.systemOrganizations)
  systemRoles = cloneRoles(state.systemRoles)
  systemUsers = cloneUsers(state.systemUsers)
}
