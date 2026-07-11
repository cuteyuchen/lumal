export type AdminRoleCode = 'admin' | 'guest' | 'operator'

/***********************权限码定义*********************/
export const adminPermissionCodes = {
  dashboardView: 'dashboard:view',
  examplesDictionary: 'examples:dictionary',
  examplesView: 'examples:view',
  projectList: 'project:list',
  systemConfigView: 'system:config:view',
  systemDictCreate: 'system:dict:create',
  systemDictDelete: 'system:dict:delete',
  systemDictList: 'system:dict:list',
  systemDictUpdate: 'system:dict:update',
  systemMenuCreate: 'system:menu:create',
  systemMenuDelete: 'system:menu:delete',
  systemMenuList: 'system:menu:list',
  systemMenuUpdate: 'system:menu:update',
  systemOrganizationCreate: 'system:organization:create',
  systemOrganizationDelete: 'system:organization:delete',
  systemOrganizationList: 'system:organization:list',
  systemOrganizationUpdate: 'system:organization:update',
  systemRoleAuthorize: 'system:role:authorize',
  systemRoleCreate: 'system:role:create',
  systemRoleDelete: 'system:role:delete',
  systemRoleList: 'system:role:list',
  systemRoleUpdate: 'system:role:update',
  systemUserCreate: 'system:user:create',
  systemUserDelete: 'system:user:delete',
  systemUserAssignRoles: 'system:user:assign-roles',
  systemUserList: 'system:user:list',
  systemUserResetPassword: 'system:user:reset-password',
  systemUserStatus: 'system:user:status',
  systemUserUpdate: 'system:user:update',
} as const

/***********************角色权限*********************/
const initialRolePermissions: Record<AdminRoleCode, string[]> = {
  admin: [
    adminPermissionCodes.dashboardView,
    adminPermissionCodes.systemUserList,
    adminPermissionCodes.systemUserCreate,
    adminPermissionCodes.systemUserUpdate,
    adminPermissionCodes.systemUserDelete,
    adminPermissionCodes.systemUserStatus,
    adminPermissionCodes.systemUserAssignRoles,
    adminPermissionCodes.systemUserResetPassword,
    adminPermissionCodes.systemRoleList,
    adminPermissionCodes.systemRoleCreate,
    adminPermissionCodes.systemRoleUpdate,
    adminPermissionCodes.systemRoleDelete,
    adminPermissionCodes.systemRoleAuthorize,
    adminPermissionCodes.systemMenuList,
    adminPermissionCodes.systemMenuCreate,
    adminPermissionCodes.systemMenuUpdate,
    adminPermissionCodes.systemMenuDelete,
    adminPermissionCodes.systemOrganizationList,
    adminPermissionCodes.systemOrganizationCreate,
    adminPermissionCodes.systemOrganizationUpdate,
    adminPermissionCodes.systemOrganizationDelete,
    adminPermissionCodes.systemDictList,
    adminPermissionCodes.systemDictCreate,
    adminPermissionCodes.systemDictUpdate,
    adminPermissionCodes.systemDictDelete,
    adminPermissionCodes.systemConfigView,
    adminPermissionCodes.projectList,
    adminPermissionCodes.examplesView,
    adminPermissionCodes.examplesDictionary,
  ],
  operator: [
    adminPermissionCodes.dashboardView,
    adminPermissionCodes.projectList,
    adminPermissionCodes.systemDictList,
    adminPermissionCodes.systemDictCreate,
    adminPermissionCodes.systemDictUpdate,
    adminPermissionCodes.examplesView,
    adminPermissionCodes.examplesDictionary,
  ],
  guest: [
    adminPermissionCodes.dashboardView,
    adminPermissionCodes.examplesView,
  ],
}

export const mockRolePermissions: Record<string, string[]> = cloneRolePermissions(initialRolePermissions)

function cloneRolePermissions(source: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(source).map(([role, permissions]) => [role, [...permissions]]),
  )
}

export function resolveRolePermissions(roles: string[]): string[] {
  return Array.from(new Set(roles.flatMap(role => mockRolePermissions[role] ?? [])))
}

export function getMockRolePermissions(role: string): string[] {
  return [...(mockRolePermissions[role] ?? [])]
}

export function setMockRolePermissions(role: string, permissions: string[]): void {
  mockRolePermissions[role] = Array.from(new Set(
    permissions.map(permission => permission.trim()).filter(Boolean),
  ))
}

export function deleteMockRolePermissions(role: string): void {
  delete mockRolePermissions[role]
}

export function resetMockRolePermissions(): void {
  Object.keys(mockRolePermissions).forEach((role) => {
    delete mockRolePermissions[role]
  })
  Object.assign(mockRolePermissions, cloneRolePermissions(initialRolePermissions))
}
