import type { AuthSession, AuthSessionData, AuthSessionOptions, TokenStorage } from './types'
import { createMemoryStorage } from '../utils/storage'
import { resolveLoginRedirect } from './redirect'
import { createTokenStorage } from './storage'

function resolveStorage(storage?: Storage): Storage {
  if (storage) {
    return storage
  }

  if (typeof localStorage !== 'undefined') {
    return localStorage
  }

  return createMemoryStorage()
}

/***********************会话聚合*********************/
/**
 * 聚合 token 存储、登录跳转与会话过期处理，返回稳定的会话 API。
 * 不绑定任何具体登录接口或 token 字段名，仅负责会话状态管理。
 */
export function createAuthSession(options: AuthSessionOptions = {}): AuthSession {
  const key = options.tokenKey ?? 'lumal:token'
  const storage = resolveStorage(options.storage)
  const tokenStorage: TokenStorage = createTokenStorage(storage, key)
  const refreshTokenStorage = createTokenStorage(storage, options.refreshTokenKey ?? `${key}:refresh`)
  const expiresAtKey = options.expiresAtKey ?? `${key}:expires-at`

  function clearToken(): void {
    tokenStorage.clearToken()
    refreshTokenStorage.clearToken()
    storage.removeItem(expiresAtKey)
  }

  function getSession(): AuthSessionData | null {
    const accessToken = tokenStorage.getToken()

    if (!accessToken) {
      return null
    }

    const refreshToken = refreshTokenStorage.getToken()
    const rawExpiresAt = storage.getItem(expiresAtKey)
    const expiresAt = rawExpiresAt === null ? undefined : Number(rawExpiresAt)

    return {
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      ...(expiresAt !== undefined && Number.isFinite(expiresAt) ? { expiresAt } : {}),
    }
  }

  function setSession(session: AuthSessionData): void {
    if (!session.accessToken) {
      clearToken()
      return
    }

    tokenStorage.setToken(session.accessToken)
    refreshTokenStorage.setToken(session.refreshToken ?? '')

    if (session.expiresAt === undefined) {
      storage.removeItem(expiresAtKey)
    }
    else {
      storage.setItem(expiresAtKey, String(session.expiresAt))
    }
  }

  function setToken(token: string): void {
    clearToken()
    tokenStorage.setToken(token)
  }

  async function handleSessionExpired(): Promise<void> {
    clearToken()
    await options.onSessionExpired?.()
  }

  return {
    getToken: () => tokenStorage.getToken(),
    getRefreshToken: () => refreshTokenStorage.getToken(),
    getSession,
    setToken,
    setSession,
    clearToken,
    isAuthenticated: () => Boolean(tokenStorage.getToken()),
    handleSessionExpired,
    logout: handleSessionExpired,
    resolveRedirect: (currentPath, redirectOptions) =>
      resolveLoginRedirect(currentPath, redirectOptions ?? options.redirect),
  }
}
