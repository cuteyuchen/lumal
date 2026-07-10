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
  systemRoleAuthorize: 'system:role:authorize',
  systemRoleCreate: 'system:role:create',
  systemRoleDelete: 'system:role:delete',
  systemRoleList: 'system:role:list',
  systemRoleUpdate: 'system:role:update',
  systemUserCreate: 'system:user:create',
  systemUserDelete: 'system:user:delete',
  systemUserList: 'system:user:list',
  systemUserUpdate: 'system:user:update',
} as const

/***********************角色权限*********************/
export const mockRolePermissions: Record<AdminRoleCode, string[]> = {
  admin: [
    adminPermissionCodes.dashboardView,
    adminPermissionCodes.systemUserList,
    adminPermissionCodes.systemUserCreate,
    adminPermissionCodes.systemUserUpdate,
    adminPermissionCodes.systemUserDelete,
    adminPermissionCodes.systemRoleList,
    adminPermissionCodes.systemRoleCreate,
    adminPermissionCodes.systemRoleUpdate,
    adminPermissionCodes.systemRoleDelete,
    adminPermissionCodes.systemRoleAuthorize,
    adminPermissionCodes.systemMenuList,
    adminPermissionCodes.systemMenuCreate,
    adminPermissionCodes.systemMenuUpdate,
    adminPermissionCodes.systemMenuDelete,
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
    adminPermissionCodes.examplesView,
    adminPermissionCodes.examplesDictionary,
  ],
  guest: [
    adminPermissionCodes.dashboardView,
    adminPermissionCodes.examplesView,
  ],
}

export function resolveRolePermissions(roles: AdminRoleCode[]): string[] {
  return Array.from(new Set(roles.flatMap(role => mockRolePermissions[role] ?? [])))
}
