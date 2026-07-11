import { createAdminResponseTransport, createAdminSessionTransport } from '../api/adapters'
import { resolveRolePermissions } from './permission'

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

interface MockAccount extends AdminAccountPreset {
  enabled: boolean
  user: AdminUser
}

/***********************账号数据*********************/
export const mockAccounts: Record<AdminAccountKey, MockAccount> = {
  admin: {
    description: '拥有系统管理、项目和示例区全部访问能力',
    enabled: true,
    key: 'admin',
    label: '超级管理员',
    password: 'luma123',
    username: 'admin',
    user: {
      id: '1',
      name: '超级管理员',
      permissions: resolveRolePermissions(['admin']),
      roles: ['admin'],
      username: 'admin',
    },
  },
  operator: {
    description: '负责项目、字典和常用运营工作，不具备系统管理权限',
    enabled: true,
    key: 'operator',
    label: '运营人员',
    password: 'luma123',
    username: 'operator',
    user: {
      id: '2',
      name: '运营人员',
      permissions: resolveRolePermissions(['operator']),
      roles: ['operator'],
      username: 'operator',
    },
  },
  guest: {
    description: '仅可访问工作台和基础示例，无系统管理操作权限',
    enabled: true,
    key: 'guest',
    label: '访客账号',
    password: 'luma123',
    username: 'guest',
    user: {
      id: '3',
      name: '访客账号',
      permissions: resolveRolePermissions(['guest']),
      roles: ['guest'],
      username: 'guest',
    },
  },
}

export const adminAccountOptions: AdminAccountPreset[] = Object.values(mockAccounts).map((account) => {
  const { enabled: _enabled, user: _user, ...preset } = account
  return preset
})

/***********************登录接口模拟*********************/
function cloneUser(user: AdminUser): AdminUser {
  return {
    ...user,
    permissions: [...user.permissions],
    roles: [...user.roles],
  }
}

function resolveAccount(payload: AdminLoginRequest): MockAccount | undefined {
  if (payload.account) {
    return mockAccounts[payload.account]
  }

  return Object.values(mockAccounts).find(account => account.username === payload.username)
}

export async function mockLogin(payload: AdminLoginRequest): Promise<Record<string, unknown>> {
  const account = resolveAccount(payload)
  const password = payload.password || 'luma123'

  if (!account || account.username !== payload.username || account.password !== password) {
    throw new Error('账号或密码不正确')
  }

  if (!account.enabled) {
    throw new Error('账号已停用')
  }

  return createAuthResponse(account)
}

function createAuthResponse(account: MockAccount): Record<string, unknown> {
  return createAdminSessionTransport({
    accessToken: `mock-token-${account.key}-${Date.now()}`,
    expiresAt: Date.now() + 30 * 60 * 1000,
    refreshToken: `mock-refresh-${account.key}`,
  }, cloneUser({
    ...account.user,
    permissions: resolveRolePermissions(account.user.roles),
  }))
}

export async function mockRefreshSession(refreshToken: string): Promise<Record<string, unknown>> {
  const accountKey = refreshToken.replace(/^mock-refresh-/, '') as AdminAccountKey
  const account = mockAccounts[accountKey]

  if (!account || refreshToken !== `mock-refresh-${accountKey}`) {
    return createAdminResponseTransport(null, {
      code: 'AUTH_EXPIRED',
      message: '刷新凭据已失效',
    })
  }

  return createAuthResponse(account)
}

export function updateMockAccountStatus(username: string, enabled: boolean): void {
  const account = Object.values(mockAccounts).find(item => item.username === username)
  if (account) {
    account.enabled = enabled
  }
}

export function updateMockAccountRoles(username: string, roles: string[]): void {
  const account = Object.values(mockAccounts).find(item => item.username === username)
  if (account) {
    account.user.roles = [...roles]
    account.user.permissions = resolveRolePermissions(roles)
  }
}

export function resetMockAccountPassword(username: string, password: string): void {
  const account = Object.values(mockAccounts).find(item => item.username === username)
  if (account) {
    account.password = password
  }
}

export function resetMockAccounts(): void {
  const defaults: Record<AdminAccountKey, string[]> = {
    admin: ['admin'],
    guest: ['guest'],
    operator: ['operator'],
  }

  Object.values(mockAccounts).forEach((account) => {
    account.enabled = true
    account.password = 'luma123'
    account.user.roles = [...defaults[account.key]]
    account.user.permissions = resolveRolePermissions(account.user.roles)
  })
}
