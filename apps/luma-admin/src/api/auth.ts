import type { AuthSessionData } from '@luma/core/auth'
import type { AdminLoginRequest, AdminUser } from '../mock/auth'
import { adminAccountOptions, mockLogin, mockRefreshSession } from '../mock/auth'
import { parseAdminLoginResponse, parseAdminResponse, parseAdminSession } from './adapters'

export interface AdminLoginResult {
  session: AuthSessionData
  user: AdminUser
}

/***********************账号预设*********************/
export { adminAccountOptions }
export type {
  AdminAccountKey,
  AdminAccountPreset,
  AdminLoginRequest,
  AdminUser,
} from '../mock/auth'

/***********************登录接口*********************/
export async function loginAdmin(payload: AdminLoginRequest): Promise<AdminLoginResult> {
  return parseAdminLoginResponse(await mockLogin(payload))
}

export async function refreshAdminSession(refreshToken: string): Promise<AuthSessionData> {
  const result = parseAdminResponse<Record<string, unknown>>(await mockRefreshSession(refreshToken))
  return parseAdminSession(result)
}
