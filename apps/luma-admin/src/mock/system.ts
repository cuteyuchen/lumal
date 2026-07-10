import type { DictionaryOption } from '@luma/core/dictionary'
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
  phone: string
  role: string
  status: SystemUserStatus
  username: string
}

export interface SystemUserQuery {
  keyword?: string
  role?: string
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
  phone?: unknown
  role?: unknown
  status?: unknown
  username?: unknown
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

export interface SystemPermissionTreeNode {
  children?: SystemPermissionTreeNode[]
  id: string
  label: string
  permission?: string
}

export type SystemMenuType = 'button' | 'directory' | 'menu'

export interface SystemMenuRecord {
  children?: SystemMenuRecord[]
  component: string
  hidden: boolean
  icon: string
  id: string
  order: number
  parentId: string
  path: string
  permission: string
  title: string
  type: SystemMenuType
}

export interface SaveSystemMenuInput {
  component?: unknown
  hidden?: unknown
  icon?: unknown
  order?: unknown
  parentId?: unknown
  path?: unknown
  permission?: unknown
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
    phone: '13800138001',
    role: 'admin',
    status: 'enabled',
    username: 'admin',
  },
  {
    createdAt: '2026-02-20',
    id: 'user-2',
    nickname: '运营人员',
    phone: '13800138002',
    role: 'operator',
    status: 'enabled',
    username: 'operator',
  },
  {
    createdAt: '2026-03-10',
    id: 'user-3',
    nickname: '访客账号',
    phone: '13800138003',
    role: 'guest',
    status: 'enabled',
    username: 'guest',
  },
  {
    createdAt: '2026-04-05',
    id: 'user-4',
    nickname: '项目管理员',
    phone: '13800138004',
    role: 'operator',
    status: 'enabled',
    username: 'project-admin',
  },
  {
    createdAt: '2026-05-12',
    id: 'user-5',
    nickname: '审计访客',
    phone: '13800138005',
    role: 'guest',
    status: 'disabled',
    username: 'audit-guest',
  },
  {
    createdAt: '2026-06-18',
    id: 'user-6',
    nickname: '内容运营',
    phone: '13800138006',
    role: 'operator',
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

const initialSystemMenus: SystemMenuRecord[] = [
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
        order: 4,
        parentId: 'menu-system',
        path: 'dict',
        permission: adminPermissionCodes.systemDictList,
        title: '字典管理',
        type: 'menu',
      },
      {
        component: 'system/config',
        hidden: false,
        icon: 'app:settings',
        id: 'menu-config',
        order: 5,
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
    order: 2,
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
let dictionaryTypes = cloneDictionaryTypes(initialDictionaryTypes)
let nextDictionaryTypeId = initialDictionaryTypes.length + 1
let dictionaryItems = cloneDictionaryItems(initialDictionaryItems)
let nextDictionaryItemId = initialDictionaryItems.length + 1

function cloneUser(user: SystemUserRecord): SystemUserRecord {
  return { ...user }
}

function cloneUsers(users: SystemUserRecord[]): SystemUserRecord[] {
  return users.map(cloneUser)
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

function normalizeRole(value: unknown): string {
  const role = normalizeText(value)

  if (systemRoles.some(item => item.code === role)) {
    return role
  }

  throw new Error('请选择有效角色')
}

function normalizeStatus(value: unknown): SystemUserStatus {
  if (value === 'disabled' || value === 'enabled') {
    return value
  }

  return 'enabled'
}

function resolveUserInput(input: SaveSystemUserInput): Omit<SystemUserRecord, 'createdAt' | 'id'> {
  const username = normalizeText(input.username)
  const nickname = normalizeText(input.nickname)

  if (!username) {
    throw new Error('用户名不能为空')
  }

  if (!nickname) {
    throw new Error('昵称不能为空')
  }

  return {
    nickname,
    phone: normalizeText(input.phone),
    role: normalizeRole(input.role),
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

function normalizeMenuType(value: unknown): SystemMenuType {
  if (value === 'button' || value === 'directory' || value === 'menu') {
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

  if (!title) {
    throw new Error('菜单标题不能为空')
  }

  if (type !== 'button' && !path) {
    throw new Error('目录和菜单必须填写路径')
  }

  if (type === 'menu' && !component) {
    throw new Error('菜单必须填写组件')
  }

  return {
    component,
    hidden: type === 'button' ? true : input.hidden === true,
    icon: type === 'button' ? '' : normalizeText(input.icon),
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
    parentId,
    path,
    permission: normalizeText(input.permission),
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

function createPermissionTreeFromMenus(menus: SystemMenuRecord[]): SystemPermissionTreeNode[] {
  return menus.flatMap((menu) => {
    const children = menu.children ? createPermissionTreeFromMenus(menu.children) : []

    if (!menu.permission && children.length === 0) {
      return []
    }

    return [{
      ...(children.length > 0 ? { children } : {}),
      id: menu.permission || `group:${menu.id}`,
      label: menu.title,
      ...(menu.permission ? { permission: menu.permission } : {}),
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
  const role = params.query?.role || ''
  const status = params.query?.status || ''
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const filteredUsers = systemUsers.filter((user) => {
    const matchesKeyword = keyword
      ? [user.username, user.nickname, user.phone].some(value => value.toLowerCase().includes(keyword))
      : true
    const matchesRole = role ? user.role === role : true
    const matchesStatus = status ? user.status === status : true

    return matchesKeyword && matchesRole && matchesStatus
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
  })
  assertUsernameAvailable(normalized.username, id)

  const updatedUser: SystemUserRecord = {
    ...currentUser,
    ...normalized,
  }
  systemUsers = systemUsers.map(user => user.id === id ? updatedUser : user)

  return cloneUser(updatedUser)
}

export async function mockDeleteSystemUser(id: string): Promise<void> {
  systemUsers = systemUsers.filter(user => user.id !== id)
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

  if (systemUsers.some(user => user.role === role.code)) {
    throw new Error('该角色仍有关联用户，不能删除')
  }

  systemRoles = systemRoles.filter(item => item.id !== id)
  deleteMockRolePermissions(role.code)
}

export async function mockFetchSystemPermissionTree(): Promise<SystemPermissionTreeNode[]> {
  return createPermissionTreeFromMenus(systemMenus)
}

export async function mockFetchSystemRolePermissions(roleCode: string): Promise<string[]> {
  return getMockRolePermissions(roleCode)
}

export async function mockUpdateSystemRolePermissions(roleCode: string, permissions: string[]): Promise<string[]> {
  setMockRolePermissions(roleCode, permissions)
  return getMockRolePermissions(roleCode)
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

  if (parent?.type === 'button') {
    throw new Error('按钮节点不能添加子项')
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

export function resetMockDictionaries(): void {
  dictionaryTypes = cloneDictionaryTypes(initialDictionaryTypes)
  nextDictionaryTypeId = initialDictionaryTypes.length + 1
  dictionaryItems = cloneDictionaryItems(initialDictionaryItems)
  nextDictionaryItemId = initialDictionaryItems.length + 1
}
