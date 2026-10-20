import type { LumalMenuRecord } from '@lumal/core/router'
import type { ApplicationService, CurrentUser, LoginInput, ServiceContext } from './contracts'
import { createAuthSession } from '@lumal/core/auth'
import { createPermissionStore } from '@lumal/core/permission'
import { readonly, shallowRef } from 'vue'

export function createApplicationSession(
  createService: (context: ServiceContext) => ApplicationService,
  storage: Storage,
  tabStorage?: Storage,
) {
  const permissionStore = createPermissionStore()
  const user = shallowRef<CurrentUser | null>(null)
  const menus = shallowRef<LumalMenuRecord[]>([])
  const ready = shallowRef(false)
  const error = shallowRef('')
  const resetHandlers = new Set<(expired: boolean) => void>()
  const tabStorageKey = 'lumal-admin:tabs'
  let generation = 0
  let controller = new AbortController()
  let initializing: Promise<void> | undefined
  const session = createAuthSession({ storage, tokenKey: 'lumal-admin:session' })
  let service: ApplicationService

  function reset(expired = false): void {
    generation += 1
    controller.abort()
    controller = new AbortController()
    initializing = undefined
    ready.value = false
    user.value = null
    menus.value = []
    permissionStore.clear()
    session.clearToken()
    service.clearCache()
    tabStorage?.removeItem(tabStorageKey)
    resetHandlers.forEach(handler => handler(expired))
  }

  service = createService({
    getSession: session.getSession,
    getSignal: () => controller.signal,
    setSession: session.setSession,
    expire: async () => reset(true),
  })

  /***********************会话初始化与隔离*********************/
  function initialize(): Promise<void> {
    if (ready.value || !session.isAuthenticated())
      return Promise.resolve()
    if (initializing)
      return initializing
    const version = generation
    const signal = controller.signal
    const pending = (async () => {
      try {
        const [nextUser, access, nextMenus] = await Promise.all([
          service.getUser(signal),
          service.getAccess(signal),
          service.getMenus(signal),
        ])
        signal.throwIfAborted()
        if (version !== generation)
          throw new Error('会话已切换')
        user.value = nextUser
        permissionStore.setPermissions(access.permissions)
        permissionStore.setRoles(access.roles)
        menus.value = nextMenus
        ready.value = true
        error.value = ''
      }
      catch (reason) {
        if (version === generation) {
          reset()
          error.value = reason instanceof Error ? reason.message : '会话初始化失败'
        }
        throw reason
      }
    })()
    initializing = pending
    void pending.finally(() => {
      if (initializing === pending)
        initializing = undefined
    }).catch(() => {}) // 原始 Promise 仍向调用方传播异常，只消费 finally 分支。
    return pending
  }

  async function login(input: LoginInput): Promise<void> {
    reset()
    const version = generation
    const signal = controller.signal
    error.value = ''
    try {
      const result = await service.login(input, signal)
      signal.throwIfAborted()
      if (version !== generation)
        throw new Error('会话已切换')
      session.setSession(result)
      await initialize()
    }
    catch (reason) {
      if (version === generation) {
        reset()
        error.value = reason instanceof Error ? reason.message : '登录失败'
      }
      throw reason
    }
  }

  async function logout(): Promise<void> {
    const token = session.getToken()
    reset()
    // 即使远端撤销失败，本地状态也已清理；错误交由界面反馈。
    if (token)
      await service.logout(token)
  }

  return {
    currentUser: readonly(user),
    error: readonly(error),
    menus: readonly(menus),
    ready: readonly(ready),
    permissionStore,
    session,
    service,
    tabStorageKey,
    initialize,
    isAuthenticated: session.isAuthenticated,
    login,
    logout,
    reset,
    onReset(handler: (expired: boolean) => void) {
      resetHandlers.add(handler)
      return () => resetHandlers.delete(handler)
    },
  }
}
