import type { DictionaryOption } from '@luma/core/dictionary'
import type {
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SaveSystemMenuInput,
  SaveSystemRoleInput,
  SaveSystemUserInput,
  SystemDictionaryItemRecord,
  SystemDictionaryTypeRecord,
  SystemMenuRecord,
  SystemPermissionTreeNode,
  SystemRoleListParams,
  SystemRoleListResult,
  SystemRoleRecord,
  SystemUserListParams,
  SystemUserListResult,
  SystemUserRecord,
} from '../mock/system'
import {
  mockCreateDictionaryItem,
  mockCreateDictionaryType,
  mockCreateSystemMenu,
  mockCreateSystemRole,
  mockCreateSystemUser,
  mockDeleteDictionaryItem,
  mockDeleteDictionaryType,
  mockDeleteSystemMenu,
  mockDeleteSystemRole,
  mockDeleteSystemUser,
  mockFetchDictionaryItems,
  mockFetchDictionaryOptions,
  mockFetchDictionaryTypes,
  mockFetchSystemMenus,
  mockFetchSystemPermissionTree,
  mockFetchSystemRoleOptions,
  mockFetchSystemRolePermissions,
  mockFetchSystemRoles,
  mockFetchSystemUsers,
  mockUpdateDictionaryItem,
  mockUpdateDictionaryType,
  mockUpdateSystemMenu,
  mockUpdateSystemRole,
  mockUpdateSystemRolePermissions,
  mockUpdateSystemUser,
} from '../mock/system'

export type {
  SaveSystemDictionaryItemInput,
  SaveSystemDictionaryTypeInput,
  SaveSystemMenuInput,
  SaveSystemRoleInput,
  SaveSystemUserInput,
  SystemDictionaryItemRecord,
  SystemDictionaryTypeRecord,
  SystemMenuRecord,
  SystemMenuType,
  SystemPermissionTreeNode,
  SystemRoleListParams,
  SystemRoleListResult,
  SystemRoleQuery,
  SystemRoleRecord,
  SystemRoleStatus,
  SystemUserListParams,
  SystemUserListResult,
  SystemUserQuery,
  SystemUserRecord,
  SystemUserStatus,
} from '../mock/system'

export function fetchSystemUsers(params: SystemUserListParams): Promise<SystemUserListResult> {
  return mockFetchSystemUsers(params)
}

export function createSystemUser(input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return mockCreateSystemUser(input)
}

export function updateSystemUser(id: string, input: SaveSystemUserInput): Promise<SystemUserRecord> {
  return mockUpdateSystemUser(id, input)
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

export function fetchSystemPermissionTree(): Promise<SystemPermissionTreeNode[]> {
  return mockFetchSystemPermissionTree()
}

export function fetchSystemRolePermissions(roleCode: string): Promise<string[]> {
  return mockFetchSystemRolePermissions(roleCode)
}

export function updateSystemRolePermissions(roleCode: string, permissions: string[]): Promise<string[]> {
  return mockUpdateSystemRolePermissions(roleCode, permissions)
}

export function fetchSystemMenus(): Promise<SystemMenuRecord[]> {
  return mockFetchSystemMenus()
}

export function createSystemMenu(input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return mockCreateSystemMenu(input)
}

export function updateSystemMenu(id: string, input: SaveSystemMenuInput): Promise<SystemMenuRecord> {
  return mockUpdateSystemMenu(id, input)
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
