import type { AuthSessionData } from '@lumal/core/auth'
import type { LumalMenuRecord } from '@lumal/core/router'

export interface LoginInput { username: string, password: string }
export interface CurrentUser { id: string, name: string, username: string }
export interface AccessSnapshot { permissions: string[], roles: string[] }
export type DataRow = Record<string, unknown>
export interface ListInput { page: number, pageSize: number, query: DataRow }
export interface PageResult { items: DataRow[], total: number }

// 应用协议由 Local/HTTP 共同实现，后端包装和字段转换不进入 Core。
export interface ApplicationService {
  login: (input: LoginInput, signal: AbortSignal) => Promise<AuthSessionData>
  getUser: (signal: AbortSignal) => Promise<CurrentUser>
  getAccess: (signal: AbortSignal) => Promise<AccessSnapshot>
  getMenus: (signal: AbortSignal) => Promise<LumalMenuRecord[]>
  logout: (accessToken: string) => Promise<void>
  clearCache: () => void
  list: (resource: string, input: ListInput) => Promise<PageResult>
  save: (resource: string, model: DataRow, id?: string) => Promise<unknown>
  remove: (resource: string, id: string) => Promise<void>
}

export interface ServiceContext {
  getSession: () => AuthSessionData | null
  getSignal: () => AbortSignal
  setSession: (value: AuthSessionData) => void
  expire: () => Promise<void>
}
