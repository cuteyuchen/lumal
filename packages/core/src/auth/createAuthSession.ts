import type { AuthSession, AuthSessionOptions, TokenStorage } from './types'
import { resolveLoginRedirect } from './redirect'
import { createTokenStorage } from './storage'

/***********************内存兜底存储*********************/
/**
 * 当运行环境无 Web Storage（SSR、测试）且未注入 storage 时，使用内存实现兜底，
 * 保证 API 行为一致，不抛异常。
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()

  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key)
    },
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
  }
}

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
  const key = options.tokenKey ?? 'luma:token'
  const tokenStorage: TokenStorage = createTokenStorage(resolveStorage(options.storage), key)

  async function handleSessionExpired(): Promise<void> {
    tokenStorage.clearToken()
    await options.onSessionExpired?.()
  }

  return {
    getToken: () => tokenStorage.getToken(),
    setToken: token => tokenStorage.setToken(token),
    clearToken: () => tokenStorage.clearToken(),
    isAuthenticated: () => Boolean(tokenStorage.getToken()),
    handleSessionExpired,
    logout: handleSessionExpired,
    resolveRedirect: (currentPath, redirectOptions) =>
      resolveLoginRedirect(currentPath, redirectOptions ?? options.redirect),
  }
}
