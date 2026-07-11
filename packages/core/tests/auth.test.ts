import { describe, expect, it, vi } from 'vitest'
import {
  clearStoredToken,
  createAuthSession,
  createTokenStorage,
  DEFAULT_TOKEN_STORAGE_KEY,
  getStoredToken,
  parseAuthSession,
  registerSessionExpiredHandler,
  resolveLoginRedirect,
  setStoredToken,
} from '../src/auth'

/***********************内存存储桩*********************/
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

describe('token storage', () => {
  it('会读写并清除 token，空值等价于移除', () => {
    const storage = createMemoryStorage()
    const tokenStorage = createTokenStorage(storage, 'custom:token')

    tokenStorage.setToken('abc')
    expect(tokenStorage.getToken()).toBe('abc')
    expect(storage.getItem('custom:token')).toBe('abc')

    tokenStorage.setToken('')
    expect(tokenStorage.getToken()).toBe('')
    expect(storage.getItem('custom:token')).toBeNull()

    tokenStorage.setToken('def')
    tokenStorage.clearToken()
    expect(tokenStorage.getToken()).toBe('')
  })

  it('便捷函数会使用默认键名读写 token', () => {
    const storage = createMemoryStorage()

    setStoredToken(storage, 'token-1')
    expect(storage.getItem(DEFAULT_TOKEN_STORAGE_KEY)).toBe('token-1')
    expect(getStoredToken(storage)).toBe('token-1')

    clearStoredToken(storage)
    expect(getStoredToken(storage)).toBe('')
  })
})

describe('login redirect', () => {
  it('会把当前路径写入 redirect 查询参数', () => {
    expect(resolveLoginRedirect('/system/user?tab=1')).toBe('/login?redirect=%2Fsystem%2Fuser%3Ftab%3D1')
  })

  it('当前路径为空或已是登录页时直接返回登录页', () => {
    expect(resolveLoginRedirect('')).toBe('/login')
    expect(resolveLoginRedirect('/login')).toBe('/login')
  })

  it('支持自定义登录页与查询参数名', () => {
    expect(resolveLoginRedirect('/dashboard', {
      loginPath: '/auth/sign-in',
      redirectQueryKey: 'from',
    })).toBe('/auth/sign-in?from=%2Fdashboard')
  })
})

describe('create auth session', () => {
  it('会聚合 token 读写并判断登录态', () => {
    const session = createAuthSession({
      storage: createMemoryStorage(),
      tokenKey: 'luma:token',
    })

    expect(session.isAuthenticated()).toBe(false)

    session.setToken('token-1')
    expect(session.getToken()).toBe('token-1')
    expect(session.isAuthenticated()).toBe(true)

    session.clearToken()
    expect(session.isAuthenticated()).toBe(false)
  })

  it('会持久化标准会话并一次清除访问与刷新凭据', () => {
    const session = createAuthSession({ storage: createMemoryStorage() })
    session.setSession({
      accessToken: 'access-1',
      expiresAt: 1893456000000,
      refreshToken: 'refresh-1',
    })

    expect(session.getToken()).toBe('access-1')
    expect(session.getRefreshToken()).toBe('refresh-1')
    expect(session.getSession()).toEqual({
      accessToken: 'access-1',
      expiresAt: 1893456000000,
      refreshToken: 'refresh-1',
    })

    session.clearToken()
    expect(session.getSession()).toBeNull()
    expect(session.getRefreshToken()).toBe('')

    session.setSession({ accessToken: '', refreshToken: 'stale-refresh' })
    expect(session.getSession()).toBeNull()
    expect(session.getRefreshToken()).toBe('')
  })

  it('会话过期与登出会清 token 并触发回调', async () => {
    const onSessionExpired = vi.fn()
    const session = createAuthSession({
      onSessionExpired,
      storage: createMemoryStorage(),
    })

    session.setToken('token-1')
    await session.handleSessionExpired()

    expect(session.getToken()).toBe('')
    expect(onSessionExpired).toHaveBeenCalledTimes(1)

    session.setToken('token-2')
    await session.logout()
    expect(session.getToken()).toBe('')
    expect(onSessionExpired).toHaveBeenCalledTimes(2)
  })

  it('未注入 storage 时也能在无 Web Storage 环境兜底工作', () => {
    const session = createAuthSession({ tokenKey: 'luma:fallback' })

    session.setToken('token-x')
    expect(session.getToken()).toBe('token-x')
    session.clearToken()
    expect(session.isAuthenticated()).toBe(false)
  })

  it('resolveRedirect 会复用会话默认登录跳转选项', () => {
    const session = createAuthSession({
      redirect: { loginPath: '/auth/login', redirectQueryKey: 'next' },
      storage: createMemoryStorage(),
    })

    expect(session.resolveRedirect('/dashboard')).toBe('/auth/login?next=%2Fdashboard')
  })
})

describe('auth session adapter', () => {
  it('支持多层响应、字段映射与数字字符串过期时间', () => {
    expect(parseAuthSession({
      result: {
        access_token: 'access-1',
        expire_time: '1893456000000',
        refresh_token: 'refresh-1',
      },
    }, {
      fieldNames: {
        accessToken: 'access_token',
        expiresAt: 'expire_time',
        refreshToken: 'refresh_token',
      },
      parseResponse: response => (response as { result: unknown }).result,
    })).toEqual({
      accessToken: 'access-1',
      expiresAt: 1893456000000,
      refreshToken: 'refresh-1',
    })
  })
})

describe('session expired registry', () => {
  it('注册的会话过期回调可被触发', async () => {
    const { handleSessionExpired } = await import('../src/auth')
    const handler = vi.fn()

    registerSessionExpiredHandler(handler)
    await handleSessionExpired()

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
