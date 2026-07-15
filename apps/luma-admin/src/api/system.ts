import type { DictionaryOption } from '@luma/core/dictionary'
import type {
  AdminPageTransport,
  RawSystemMenuRecord,
  RawSystemPermissionTreeNode,
  RawSystemUserRecord,
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SaveSystemOrganizationInput,
  SaveSystemRoleInput,
  SystemDictionaryItemRecord,
  SystemDictionaryTypeRecord,
  SystemOrganizationRecord,
  SystemRoleListParams,
  SystemRoleListResult,
  SystemRoleRecord,
  SystemUserPasswordResetResult,
  SystemUserStatus,
} from './types'
import { adminRequest } from '../services/request'

export type {
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SaveSystemOrganizationInput,
  SaveSystemRoleInput,
  SystemDictionaryItemRecord,
  SystemDictionaryTypeRecord,
  SystemMenuType,
  SystemOrganizationRecord,
  SystemRoleListParams,
  SystemRoleListResult,
  SystemRoleQuery,
  SystemRoleRecord,
  SystemRoleStatus,
  SystemUserPasswordResetResult,
  SystemUserStatus,
} from './types'

export interface SystemUserRecord extends Omit<RawSystemUserRecord, 'role'> {}
export interface SystemUserQuery { keyword?: string, role?: string, roles?: string, status?: SystemUserStatus | '' }
export interface SystemUserListParams { page: number, pageSize: number, query?: SystemUserQuery }
export interface SystemUserListResult { items: SystemUserRecord[], total: number }
export interface SaveSystemUserInput { nickname?: unknown, phone?: unknown, roles?: unknown, status?: unknown, username?: unknown }
export interface SystemPermissionTreeNode { children?: SystemPermissionTreeNode[], id: string, label: string, permissions: string[] }
export interface SystemMenuRecord extends Omit<RawSystemMenuRecord, 'children' | 'permission' | 'permissions'> { children?: SystemMenuRecord[], permissions: string[] }
export interface SaveSystemMenuInput { activeMenu?: unknown, badge?: unknown, badgeTone?: unknown, badgeType?: unknown, component?: unknown, externalLink?: unknown, externalTarget?: unknown, hidden?: unknown, hideInBreadcrumb?: unknown, icon?: unknown, name?: unknown, order?: unknown, parentId?: unknown, path?: unknown, permissions?: unknown, redirect?: unknown, title?: unknown, type?: unknown }

function toSystemUserRecord(record: RawSystemUserRecord): SystemUserRecord {
  const { role: _legacyRole, ...standardRecord } = record
  return { ...standardRecord, roles: [...record.roles] }
}

function toSystemMenuRecord(record: RawSystemMenuRecord): SystemMenuRecord {
  const { permission, permissions, children, ...rest } = record
  return {
    ...rest,
    children: children?.map(toSystemMenuRecord),
    permissions: permissions?.length ? [...permissions] : permission ? [permission] : [],
  }
}

function toPermissionNode(node: RawSystemPermissionTreeNode): SystemPermissionTreeNode {
  return { children: node.children?.map(toPermissionNode), id: node.id, label: node.label, permissions: node.permission ? [node.permission] : [] }
}

export async function fetchSystemUsers(params: SystemUserListParams): Promise<SystemUserListResult> {
  const result = await adminRequest.get<AdminPageTransport<RawSystemUserRecord>>('/system/users', {
    query: { page: params.page, pageSize: params.pageSize, keyword: params.query?.keyword, roles: params.query?.roles ?? params.query?.role, status: params.query?.status },
  })
  return { items: result.records.map(toSystemUserRecord), total: result.totalNum }
}

export async function createSystemUser(input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return toSystemUserRecord(await adminRequest.post('/system/users', { body: { ...input } }))
}

export async function updateSystemUser(id: string, input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return toSystemUserRecord(await adminRequest.put(`/system/users/${id}`, { body: { ...input }, retryOnAuthRefresh: true }))
}

export async function updateSystemUserStatus(id: string, status: SystemUserStatus): Promise<SystemUserRecord> {
  return toSystemUserRecord(await adminRequest.patch(`/system/users/${id}/status`, { body: { status }, retryOnAuthRefresh: true }))
}

export async function updateSystemUserRoles(id: string, roles: string[]): Promise<SystemUserRecord> {
  return toSystemUserRecord(await adminRequest.put(`/system/users/${id}/roles`, { body: { roles }, retryOnAuthRefresh: true }))
}

export function resetSystemUserPassword(id: string): Promise<SystemUserPasswordResetResult> {
  return adminRequest.post(`/system/users/${id}/reset-password`, { retryOnAuthRefresh: true })
}

export async function deleteSystemUser(id: string): Promise<void> {
  await adminRequest.delete(`/system/users/${id}`, { retryOnAuthRefresh: true })
}

export function fetchSystemRoleOptions(): Promise<DictionaryOption[]> {
  return adminRequest.get('/system/roles/options')
}
export async function fetchSystemRoles(params: SystemRoleListParams): Promise<SystemRoleListResult> {
  const result = await adminRequest.get<AdminPageTransport<SystemRoleRecord>>('/system/roles', { query: { page: params.page, pageSize: params.pageSize, keyword: params.query?.keyword, status: params.query?.status } })
  return { items: result.records, total: result.totalNum }
}
export function createSystemRole(input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  return adminRequest.post('/system/roles', { body: { ...input } })
}

export function updateSystemRole(id: string, input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  return adminRequest.put(`/system/roles/${id}`, { body: { ...input }, retryOnAuthRefresh: true })
}

export async function deleteSystemRole(id: string): Promise<void> {
  await adminRequest.delete(`/system/roles/${id}`, { retryOnAuthRefresh: true })
}

export async function fetchSystemPermissionTree(): Promise<SystemPermissionTreeNode[]> {
  return (await adminRequest.get<RawSystemPermissionTreeNode[]>('/system/permissions/tree')).map(toPermissionNode)
}

export function fetchSystemRolePermissions(roleCode: string): Promise<string[]> {
  return adminRequest.get(`/system/roles/${roleCode}/permissions`)
}

export function updateSystemRolePermissions(roleCode: string, permissions: string[]): Promise<string[]> {
  return adminRequest.put(`/system/roles/${roleCode}/permissions`, { body: { permissions }, retryOnAuthRefresh: true })
}

export function fetchSystemOrganizations(): Promise<SystemOrganizationRecord[]> {
  return adminRequest.get('/system/organizations')
}

export function createSystemOrganization(input: SaveSystemOrganizationInput): Promise<SystemOrganizationRecord> {
  return adminRequest.post('/system/organizations', { body: { ...input } })
}

export function updateSystemOrganization(id: string, input: SaveSystemOrganizationInput): Promise<SystemOrganizationRecord> {
  return adminRequest.put(`/system/organizations/${id}`, { body: { ...input }, retryOnAuthRefresh: true })
}

export async function deleteSystemOrganization(id: string): Promise<void> {
  await adminRequest.delete(`/system/organizations/${id}`, { retryOnAuthRefresh: true })
}

export async function fetchSystemMenus(): Promise<SystemMenuRecord[]> {
  return (await adminRequest.get<RawSystemMenuRecord[]>('/system/menus')).map(toSystemMenuRecord)
}

export async function createSystemMenu(input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return toSystemMenuRecord(await adminRequest.post('/system/menus', { body: { ...input } }))
}

export async function updateSystemMenu(id: string, input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return toSystemMenuRecord(await adminRequest.put(`/system/menus/${id}`, { body: { ...input }, retryOnAuthRefresh: true }))
}

export async function deleteSystemMenu(id: string): Promise<void> {
  await adminRequest.delete(`/system/menus/${id}`, { retryOnAuthRefresh: true })
}

export function fetchDictionaryTypes(): Promise<SystemDictionaryTypeRecord[]> {
  return adminRequest.get('/system/dictionaries/types')
}

export function createDictionaryType(input: SaveSystemDictionaryTypeInput): Promise<SystemDictionaryTypeRecord> {
  return adminRequest.post('/system/dictionaries/types', { body: { ...input } })
}

export function updateDictionaryType(id: string, input: SaveSystemDictionaryTypeInput): Promise<SystemDictionaryTypeRecord> {
  return adminRequest.put(`/system/dictionaries/types/${id}`, { body: { ...input }, retryOnAuthRefresh: true })
}

export async function deleteDictionaryType(id: string): Promise<void> {
  await adminRequest.delete(`/system/dictionaries/types/${id}`, { retryOnAuthRefresh: true })
}

export function fetchDictionaryItems(typeCode: string): Promise<SystemDictionaryItemRecord[]> {
  return adminRequest.get('/system/dictionaries/items', { query: { typeCode } })
}

export function createDictionaryItem(input: SaveSystemDictionaryItemInput): Promise<SystemDictionaryItemRecord> {
  return adminRequest.post('/system/dictionaries/items', { body: { ...input } })
}

export function updateDictionaryItem(id: string, input: SaveSystemDictionaryItemInput): Promise<SystemDictionaryItemRecord> {
  return adminRequest.put(`/system/dictionaries/items/${id}`, { body: { ...input }, retryOnAuthRefresh: true })
}

export async function deleteDictionaryItem(id: string): Promise<void> {
  await adminRequest.delete(`/system/dictionaries/items/${id}`, { retryOnAuthRefresh: true })
}

export function fetchDictionaryOptions(dictionary: string): Promise<DictionaryOption[]> {
  return adminRequest.get(`/system/dictionaries/options/${encodeURIComponent(dictionary)}`)
}
