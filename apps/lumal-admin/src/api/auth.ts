import type { AuthSessionData } from '@lumal/core/auth'
import type { AdminAccountPreset, AdminLoginRequest, AdminUser } from './types'
import { adminPublicRequest } from '../services/request'
import { parseAdminSession } from './adapters'

export interface AdminLoginResult { session: AuthSessionData, user: AdminUser }

export const adminAccountOptions: AdminAccountPreset[] = [
  { description: '拥有系统管理、项目和示例区全部访问能力', key: 'admin', label: '超级管理员', password: 'lumal123', username: 'admin' },
  { description: '负责项目、字典和常用运营工作，不具备系统管理权限', key: 'operator', label: '运营人员', password: 'lumal123', username: 'operator' },
  { description: '仅可访问工作台和基础示例，无系统管理操作权限', key: 'guest', label: '访客账号', password: 'lumal123', username: 'guest' },
]

export type { AdminAccountKey, AdminAccountPreset, AdminLoginRequest, AdminUser } from './types'

export async function loginAdmin(payload: AdminLoginRequest): Promise<AdminLoginResult> {
  const result = await adminPublicRequest.post<Record<string, unknown>>('/auth/login', { body: { ...payload } })
  return { session: parseAdminSession(result), user: result.user as AdminUser }
}

export async function refreshAdminSession(refreshToken: string): Promise<AuthSessionData> {
  return parseAdminSession(await adminPublicRequest.post('/auth/refresh', { body: { refreshToken } }))
}

export async function logoutAdmin(accessToken: string): Promise<void> {
  // 本地已退出后再撤销服务端凭据，避免在途页面请求使用已失效的 token。
  await adminPublicRequest.post('/auth/logout', { headers: { Authorization: `Bearer ${accessToken}` } })
}
