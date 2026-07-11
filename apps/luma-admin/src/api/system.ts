import type { DictionaryOption } from '@luma/core/dictionary'
import type {
  SaveSystemMenuInput as MockSaveSystemMenuInput,
  SaveSystemUserInput as MockSaveSystemUserInput,
  SystemMenuRecord as MockSystemMenuRecord,
  SystemPermissionTreeNode as MockSystemPermissionTreeNode,
  SystemUserListParams as MockSystemUserListParams,
  SystemUserRecord as MockSystemUserRecord,
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
} from '../mock/system'
import {
  mockCreateDictionaryItem,
  mockCreateDictionaryType,
  mockCreateSystemMenu,
  mockCreateSystemOrganization,
  mockCreateSystemRole,
  mockCreateSystemUser,
  mockDeleteDictionaryItem,
  mockDeleteDictionaryType,
  mockDeleteSystemMenu,
  mockDeleteSystemOrganization,
  mockDeleteSystemRole,
  mockDeleteSystemUser,
  mockFetchDictionaryItems,
  mockFetchDictionaryOptions,
  mockFetchDictionaryTypes,
  mockFetchSystemMenus,
  mockFetchSystemOrganizations,
  mockFetchSystemPermissionTree,
  mockFetchSystemRoleOptions,
  mockFetchSystemRolePermissions,
  mockFetchSystemRoles,
  mockFetchSystemUsers,
  mockResetSystemUserPassword,
  mockUpdateDictionaryItem,
  mockUpdateDictionaryType,
  mockUpdateSystemMenu,
  mockUpdateSystemOrganization,
  mockUpdateSystemRole,
  mockUpdateSystemRolePermissions,
  mockUpdateSystemUser,
  mockUpdateSystemUserRoles,
  mockUpdateSystemUserStatus,
} from '../mock/system'

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
} from '../mock/system'

export interface SystemUserRecord {
  createdAt: string
  id: string
  nickname: string
  phone: string
  roles: string[]
  status: MockSystemUserRecord['status']
  username: string
}

export interface SystemUserQuery {
  keyword?: string
  roles?: string
  status?: MockSystemUserRecord['status'] | ''
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
  roles?: unknown
  status?: unknown
  username?: unknown
}

export interface SystemPermissionTreeNode {
  children?: SystemPermissionTreeNode[]
  id: string
  label: string
  permissions: string[]
}

export interface SystemMenuRecord {
  children?: SystemMenuRecord[]
  component: string
  externalLink?: string
  externalTarget?: '_blank' | '_self'
  hidden: boolean
  icon: string
  id: string
  name?: string
  order: number
  parentId: string
  path: string
  permissions: string[]
  redirect?: string
  title: string
  type: MockSystemMenuRecord['type']
}

export interface SaveSystemMenuInput {
  component?: unknown
  externalLink?: unknown
  externalTarget?: unknown
  hidden?: unknown
  icon?: unknown
  name?: unknown
  order?: unknown
  parentId?: unknown
  path?: unknown
  permissions?: unknown
  redirect?: unknown
  title?: unknown
  type?: unknown
}

function toSystemUserRecord(record: MockSystemUserRecord): SystemUserRecord {
  const { role: _legacyRole, ...standardRecord } = record
  return { ...standardRecord, roles: [...record.roles] }
}

function toSystemMenuRecord(record: MockSystemMenuRecord): SystemMenuRecord {
  const { permission: legacyPermission, ...standardRecord } = record
  return {
    ...standardRecord,
    children: record.children?.map(toSystemMenuRecord),
    permissions: record.permissions?.length
      ? [...record.permissions]
      : legacyPermission ? [legacyPermission] : [],
  }
}

function toSystemPermissionTreeNode(node: MockSystemPermissionTreeNode): SystemPermissionTreeNode {
  return {
    children: node.children?.map(toSystemPermissionTreeNode),
    id: node.id,
    label: node.label,
    permissions: node.permission ? [node.permission] : [],
  }
}

export async function fetchSystemUsers(params: SystemUserListParams): Promise<SystemUserListResult> {
  const transportParams: MockSystemUserListParams = {
    page: params.page,
    pageSize: params.pageSize,
    query: {
      keyword: params.query?.keyword,
      role: params.query?.roles,
      status: params.query?.status,
    },
  }
  const result = await mockFetchSystemUsers(transportParams)
  return { items: result.items.map(toSystemUserRecord), total: result.total }
}

export async function createSystemUser(input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return toSystemUserRecord(await mockCreateSystemUser(input as MockSaveSystemUserInput))
}

export async function updateSystemUser(id: string, input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return toSystemUserRecord(await mockUpdateSystemUser(id, input as MockSaveSystemUserInput))
}

export async function updateSystemUserStatus(id: string, status: SystemUserRecord['status']): Promise<SystemUserRecord> {
  return toSystemUserRecord(await mockUpdateSystemUserStatus(id, status))
}

export async function updateSystemUserRoles(id: string, roles: string[]): Promise<SystemUserRecord> {
  return toSystemUserRecord(await mockUpdateSystemUserRoles(id, roles))
}

export function resetSystemUserPassword(id: string): Promise<SystemUserPasswordResetResult> {
  return mockResetSystemUserPassword(id)
}

export function deleteSystemUser(id: string): Promise<void> {
  return mockDeleteSystemUser(id)
}

export function fetchSystemRoleOptions(): Promise<DictionaryOption[]> {
  return mockFetchSystemRoleOptions()
}

export function fetchSystemRoles(params: SystemRoleListParams): Promise<SystemRoleListResult> {
  return mockFetchSystemRoles(params)
}

export function createSystemRole(input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  return mockCreateSystemRole(input)
}

export function updateSystemRole(id: string, input: SaveSystemRoleInput): Promise<SystemRoleRecord> {
  return mockUpdateSystemRole(id, input)
}

export function deleteSystemRole(id: string): Promise<void> {
  return mockDeleteSystemRole(id)
}

export async function fetchSystemPermissionTree(): Promise<SystemPermissionTreeNode[]> {
  return (await mockFetchSystemPermissionTree()).map(toSystemPermissionTreeNode)
}

export function fetchSystemRolePermissions(roleCode: string): Promise<string[]> {
  return mockFetchSystemRolePermissions(roleCode)
}

export function updateSystemRolePermissions(roleCode: string, permissions: string[]): Promise<string[]> {
  return mockUpdateSystemRolePermissions(roleCode, permissions)
}

export function fetchSystemOrganizations(): Promise<SystemOrganizationRecord[]> {
  return mockFetchSystemOrganizations()
}

export function createSystemOrganization(input: SaveSystemOrganizationInput): Promise<SystemOrganizationRecord> {
  return mockCreateSystemOrganization(input)
}

export function updateSystemOrganization(
  id: string,
  input: SaveSystemOrganizationInput,
): Promise<SystemOrganizationRecord> {
  return mockUpdateSystemOrganization(id, input)
}

export function deleteSystemOrganization(id: string): Promise<void> {
  return mockDeleteSystemOrganization(id)
}

export async function fetchSystemMenus(): Promise<SystemMenuRecord[]> {
  return (await mockFetchSystemMenus()).map(toSystemMenuRecord)
}

export async function createSystemMenu(input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return toSystemMenuRecord(await mockCreateSystemMenu(input as MockSaveSystemMenuInput))
}

export async function updateSystemMenu(id: string, input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return toSystemMenuRecord(await mockUpdateSystemMenu(id, input as MockSaveSystemMenuInput))
}

export function deleteSystemMenu(id: string): Promise<void> {
  return mockDeleteSystemMenu(id)
}

export function fetchDictionaryTypes(): Promise<SystemDictionaryTypeRecord[]> {
  return mockFetchDictionaryTypes()
}

export function createDictionaryType(
  input: SaveSystemDictionaryTypeInput,
): Promise<SystemDictionaryTypeRecord> {
  return mockCreateDictionaryType(input)
}

export function updateDictionaryType(
  id: string,
  input: SaveSystemDictionaryTypeInput,
): Promise<SystemDictionaryTypeRecord> {
  return mockUpdateDictionaryType(id, input)
}

export function deleteDictionaryType(id: string): Promise<void> {
  return mockDeleteDictionaryType(id)
}

export function fetchDictionaryItems(typeCode: string): Promise<SystemDictionaryItemRecord[]> {
  return mockFetchDictionaryItems(typeCode)
}

export function createDictionaryItem(
  input: SaveSystemDictionaryItemInput,
): Promise<SystemDictionaryItemRecord> {
  return mockCreateDictionaryItem(input)
}

export function updateDictionaryItem(
  id: string,
  input: SaveSystemDictionaryItemInput,
): Promise<SystemDictionaryItemRecord> {
  return mockUpdateDictionaryItem(id, input)
}

export function deleteDictionaryItem(id: string): Promise<void> {
  return mockDeleteDictionaryItem(id)
}

export function fetchDictionaryOptions(dictionary: string): Promise<DictionaryOption[]> {
  return mockFetchDictionaryOptions(dictionary)
}
