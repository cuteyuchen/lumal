import type { AdminAccountKey, AdminLoginRequest, AdminUser } from '../api/auth'
import { createAuthSession } from '@luma/core/auth'
import { readonly, shallowRef } from 'vue'
import { adminAccountOptions, loginAdmin } from '../api/auth'
import { clearAdminAccess, syncAdminAccess } from './permission'

const tokenStorageKey = 'luma-admin:token'
const userStorageKey = 'luma-admin:user'

/***********************存储兜底*********************/
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

function resolveStorage(): Storage {
  if (typeof localStorage !== 'undefined') {
    return localStorage
  }

  return createMemoryStorage()
}

const sessionStorage = resolveStorage()

/***********************用户快照*********************/
function readStoredUser(): AdminUser | null {
  const raw = sessionStorage.getItem(userStorageKey)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminUser
  }
  catch {
    sessionStorage.removeItem(userStorageKey)
    return null
  }
}

function writeStoredUser(user: AdminUser | null): void {
  if (!user) {
    sessionStorage.removeItem(userStorageKey)
    return
  }

  sessionStorage.setItem(userStorageKey, JSON.stringify(user))
}

const currentUserState = shallowRef<AdminUser | null>(null)
const sessionResetHandlers = new Set<() => void>()

/***********************会话实例*********************/
function clearCurrentSessionState(): void {
  currentUserState.value = null
  writeStoredUser(null)
  clearAdminAccess()
  sessionResetHandlers.forEach(handler => handler())
}

export const adminSession = createAuthSession({
  onSessionExpired: clearCurrentSessionState,
  storage: sessionStorage,
  tokenKey: tokenStorageKey,
})

const storedUser = adminSession.isAuthenticated() ? readStoredUser() : null

if (storedUser) {
  currentUserState.value = storedUser
  syncAdminAccess(storedUser)
}
else {
  writeStoredUser(null)
}

export const currentUser = readonly(currentUserState)

export function registerSessionResetHandler(handler: () => void): () => void {
  sessionResetHandlers.add(handler)

  return () => sessionResetHandlers.delete(handler)
}

/***********************权限同步*********************/
export function syncSessionAccess(user: AdminUser | null = currentUserState.value): void {
  if (!user) {
    clearAdminAccess()
    return
  }

  syncAdminAccess(user)
}

/***********************登录登出*********************/
function normalizeLoginPayload(payload: AdminAccountKey | AdminLoginRequest): AdminLoginRequest {
  if (typeof payload !== 'string') {
    return payload
  }

  const preset = adminAccountOptions.find(account => account.key === payload)

  if (!preset) {
    throw new Error('账号不存在')
  }

  return {
    account: preset.key,
    password: preset.password,
    username: preset.username,
  }
}

export function isAuthenticated(): boolean {
  return adminSession.isAuthenticated()
}

export async function login(payload: AdminAccountKey | AdminLoginRequest): Promise<AdminUser> {
  const result = await loginAdmin(normalizeLoginPayload(payload))

  adminSession.setSession(result.session)
  currentUserState.value = result.user
  writeStoredUser(result.user)
  syncSessionAccess(result.user)

  return result.user
}

export async function logout(): Promise<void> {
  await adminSession.logout()
}
