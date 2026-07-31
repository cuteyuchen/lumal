import type { AdminAccountKey, AdminLoginRequest, AdminUser } from '../api/auth'
import { createAuthSession } from '@lumal/core/auth'
import { ElMessageBox } from 'element-plus'
import { readonly, shallowRef } from 'vue'
import { adminAccountOptions, loginAdmin, logoutAdmin } from '../api/auth'
import { clearAdminAccess, syncAdminAccess } from './permission'

const tokenStorageKey = 'lumal-admin:token'
const userStorageKey = 'lumal-admin:user'
export const adminTabSnapshotStorageKey = 'lumal-admin:tabs'
const loginPath = '/login'

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
  clearAdminTabSnapshot()
  sessionResetHandlers.forEach(handler => handler())
}

function clearAdminTabSnapshot(): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(adminTabSnapshotStorageKey)
    }
  }
  catch {
    // 存储不可用时静默跳过。
  }
}

export const adminSession = createAuthSession({
  onSessionExpired: clearCurrentSessionState,
  redirect: { loginPath, redirectQueryKey: 'redirect' },
  storage: sessionStorage,
  tokenKey: tokenStorageKey,
})

let reLoginPrompt: Promise<void> | undefined

/**
 * 提示会话失效并跳转登录页。
 * 通过模块级 `reLoginPrompt` 单例保证并发 401 只弹出一个确认框。
 */
async function promptReLoginAndRedirect(): Promise<void> {
  if (reLoginPrompt)
    return reLoginPrompt

  reLoginPrompt = (async () => {
    try {
      await ElMessageBox.alert('登录状态已失效，请重新登录', '登录已过期', {
        closeOnClickModal: false,
        closeOnPressEscape: false,
        confirmButtonText: '重新登录',
        showClose: false,
        type: 'warning',
      })
    }
    catch {
      // 确认框被关闭时仍跳转登录页。
    }

    const { router } = await import('../router')
    if (router.currentRoute.value.path === loginPath)
      return

    await router.replace(adminSession.resolveRedirect(router.currentRoute.value.fullPath))
  })().finally(() => {
    reLoginPrompt = undefined
  })

  return reLoginPrompt
}

/**
 * 会话失效的统一处理入口：清理本地会话状态、提示重新登录并跳转登录页。
 * request 层收到 401 时仅需调用此函数，无需感知内部清理与提示的拆分。
 */
export async function handleAdminSessionExpired(): Promise<void> {
  await adminSession.handleSessionExpired()
  await promptReLoginAndRedirect()
}

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

export function updateCurrentUserName(name: string): AdminUser {
  const user = currentUserState.value

  if (!user) {
    throw new Error('当前用户未登录')
  }

  const updatedUser = { ...user, name }
  currentUserState.value = updatedUser
  writeStoredUser(updatedUser)
  return updatedUser
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
  try {
    if (adminSession.isAuthenticated())
      await logoutAdmin()
  }
  catch {
    // 服务端会话可能已过期；本地会话仍必须清理。
  }
  finally {
    await adminSession.logout()
  }
}
