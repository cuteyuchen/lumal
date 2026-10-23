import type { LumalMenuRecord } from '@lumal/core/router';
import type { ApplicationService, CurrentUser, LoginInput, ServiceContext } from './contracts';
import { createAuthSession } from '@lumal/core/auth';
import { createPermissionStore } from '@lumal/core/permission';
import { readonly, shallowRef } from 'vue';

export function createApplicationSession(
  createService: (context: ServiceContext) => ApplicationService,
  storage: Storage,
  tabStorage?: Storage,
) {
  const permissionStore = createPermissionStore();
  const user = shallowRef<CurrentUser | null>(null);
  const menus = shallowRef<LumalMenuRecord[]>([]);
  const ready = shallowRef(false);
  const accessVersion = shallowRef(0);
  const error = shallowRef('');
  const resetHandlers = new Set<(expired: boolean) => void>();
  const refreshHandlers = new Set<() => void | Promise<void>>();
  const tabStorageKey = 'lumal-admin:tabs';
  let generation = 0;
  let controller = new AbortController();
  let initializing: Promise<void> | undefined;
  let refreshing: Promise<void> | undefined;
  const session = createAuthSession({ storage, tokenKey: 'lumal-admin:session' });
  let service: ApplicationService;

  function reset(expired = false): void {
    generation += 1;
    controller.abort();
    controller = new AbortController();
    initializing = undefined;
    refreshing = undefined;
    accessVersion.value += 1;
    ready.value = false;
    user.value = null;
    menus.value = [];
    permissionStore.clear();
    session.clearToken();
    service.clearCache();
    tabStorage?.removeItem(tabStorageKey);
    resetHandlers.forEach((handler) => handler(expired));
  }

  service = createService({
    getSession: session.getSession,
    getSignal: () => controller.signal,
    setSession: session.setSession,
    expire: async () => reset(true),
  });

  /***********************会话初始化与隔离*********************/
  function initialize(): Promise<void> {
    if (ready.value || !session.isAuthenticated()) return Promise.resolve();
    if (initializing) return initializing;
    const version = generation;
    const signal = controller.signal;
    const pending = (async () => {
      try {
        const [nextUser, access, nextMenus] = await Promise.all([
          service.getUser(signal),
          service.getAccess(signal),
          service.getMenus(signal),
        ]);
        signal.throwIfAborted();
        if (version !== generation) throw new Error('会话已切换');
        user.value = nextUser;
        permissionStore.setPermissions(access.permissions);
        permissionStore.setRoles(access.roles);
        menus.value = nextMenus;
        ready.value = true;
        error.value = '';
      } catch (reason) {
        if (version === generation) {
          reset();
          error.value = reason instanceof Error ? reason.message : '会话初始化失败';
        }
        throw reason;
      }
    })();
    initializing = pending;
    void pending
      .finally(() => {
        if (initializing === pending) initializing = undefined;
      })
      .catch(() => {}); // 原始 Promise 仍向调用方传播异常，只消费 finally 分支。
    return pending;
  }

  async function login(input: LoginInput): Promise<void> {
    reset();
    const version = generation;
    const signal = controller.signal;
    error.value = '';
    try {
      const result = await service.login(input, signal);
      signal.throwIfAborted();
      if (version !== generation) throw new Error('会话已切换');
      session.setSession(result);
      await initialize();
    } catch (reason) {
      if (version === generation) {
        reset();
        error.value = reason instanceof Error ? reason.message : '登录失败';
      }
      throw reason;
    }
  }

  async function logout(): Promise<void> {
    const token = session.getToken();
    reset();
    // 即使远端撤销失败，本地状态也已清理；错误交由界面反馈。
    if (token) await service.logout(token);
  }

  function refreshAccess(): Promise<void> {
    if (refreshing) return refreshing;
    if (!session.isAuthenticated()) return Promise.reject(new Error('会话已失效，请重新登录'));
    const version = generation;
    const refreshController = new AbortController();
    const signal = AbortSignal.any([controller.signal, refreshController.signal]);
    const pending = (async () => {
      const reads = [service.getUser(signal), service.getAccess(signal), service.getMenus(signal)] as const;
      try {
        const [nextUser, access, nextMenus] = await Promise.all(reads);
        signal.throwIfAborted();
        if (version !== generation) throw new Error('会话已切换');
        user.value = nextUser;
        permissionStore.setPermissions(access.permissions);
        permissionStore.setRoles(access.roles);
        menus.value = nextMenus;
        ready.value = true;
        await Promise.all([...refreshHandlers].map((handler) => handler()));
        accessVersion.value += 1;
        tabStorage?.removeItem(tabStorageKey);
      } catch (reason) {
        // 一个读取失败后取消其余请求并等待释放去重占位，立即重试不会撞上旧请求。
        refreshController.abort(reason);
        await Promise.allSettled(reads);
        if (version === generation) {
          // 重读失败时拒绝继续使用旧授权；保留 Token 以便显式重试。
          permissionStore.clear();
          menus.value = [];
          ready.value = false;
          tabStorage?.removeItem(tabStorageKey);
          resetHandlers.forEach((handler) => handler(false));
        }
        throw reason;
      }
    })();
    refreshing = pending;
    void pending
      .finally(() => {
        if (refreshing === pending) refreshing = undefined;
      })
      .catch(() => {});
    return pending;
  }

  return {
    currentUser: readonly(user),
    error: readonly(error),
    menus: readonly(menus),
    ready: readonly(ready),
    accessVersion: readonly(accessVersion),
    permissionStore,
    session,
    service,
    tabStorageKey,
    initialize,
    isAuthenticated: session.isAuthenticated,
    login,
    logout,
    reset,
    refreshAccess,
    onRefresh(handler: () => void | Promise<void>) {
      refreshHandlers.add(handler);
      return () => refreshHandlers.delete(handler);
    },
    onReset(handler: (expired: boolean) => void) {
      resetHandlers.add(handler);
      return () => resetHandlers.delete(handler);
    },
  };
}
