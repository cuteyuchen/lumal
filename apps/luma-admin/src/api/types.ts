export type AdminAccountKey = 'admin' | 'guest' | 'operator'

export interface AdminUser {
  id: string
  name: string
  permissions: string[]
  roles: string[]
  username: string
}

export interface AdminLoginRequest {
  account?: AdminAccountKey
  password?: string
  username: string
}

export interface AdminAccountPreset {
  description: string
  key: AdminAccountKey
  label: string
  password: string
  username: string
}

export type SystemUserStatus = 'disabled' | 'enabled'
export type SystemRoleStatus = SystemUserStatus
export type SystemMenuType = 'button' | 'directory' | 'embedded' | 'external' | 'menu'

export interface RawSystemUserRecord {
  createdAt: string
  id: string
  nickname: string
  phone: string
  role?: string
  roles: string[]
  status: SystemUserStatus
  username: string
}

export interface SystemUserPasswordResetResult { temporaryPassword: string }
export interface SystemRoleRecord { builtIn: boolean, code: string, description: string, id: string, name: string, status: SystemRoleStatus }
export interface SystemRoleQuery { keyword?: string, status?: SystemRoleStatus | '' }
export interface SystemRoleListParams { page: number, pageSize: number, query?: SystemRoleQuery }
export interface SystemRoleListResult { items: SystemRoleRecord[], total: number }
export interface SaveSystemRoleInput { code?: unknown, description?: unknown, name?: unknown, status?: unknown }
export interface SystemOrganizationRecord { children?: SystemOrganizationRecord[], code: string, email: string, id: string, leader: string, name: string, order: number, parentId: string, phone: string, status: SystemUserStatus }
export interface SaveSystemOrganizationInput { code?: unknown, email?: unknown, leader?: unknown, name?: unknown, order?: unknown, parentId?: unknown, phone?: unknown, status?: unknown }
export interface RawSystemPermissionTreeNode { children?: RawSystemPermissionTreeNode[], id: string, label: string, permission?: string }
export interface RawSystemMenuRecord { activeMenu?: string, badge?: string | number, badgeTone?: string, badgeType?: 'dot' | 'text', children?: RawSystemMenuRecord[], component: string, externalLink?: string, externalTarget?: '_blank' | '_self', hidden: boolean, hideInBreadcrumb?: boolean, icon: string, id: string, name?: string, order: number, parentId: string, path: string, permission?: string, permissions?: string[], redirect?: string, title: string, type: SystemMenuType }
export interface SystemDictionaryTypeRecord { code: string, description: string, id: string, name: string, status: SystemUserStatus }
export interface SystemDictionaryItemRecord { color: string, id: string, label: string, order: number, status: SystemUserStatus, typeCode: string, value: string }
export interface SaveSystemDictionaryTypeInput { code?: unknown, description?: unknown, name?: unknown, status?: unknown }
export interface SaveSystemDictionaryItemInput { color?: unknown, label?: unknown, order?: unknown, status?: unknown, typeCode?: unknown, value?: unknown }

export interface AdminPageTransport<T> {
  records: T[]
  totalNum: number
}
