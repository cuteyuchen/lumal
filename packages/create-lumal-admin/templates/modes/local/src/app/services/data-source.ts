import type {
  AccessSnapshot,
  ApplicationService,
  BusinessRequest,
  CurrentUser,
  DataRow,
  HttpMethod,
  ServiceContext,
} from './contracts';
import type { LocalModule } from './local-contracts';
import { object, stringArray } from '../menu-policy';
import { permissionCodes, viewComponents } from '../router/views';
import { buildStoredMenus } from '../stored-menus';
import { createLocalDatabase } from './local-database';

export const demoAccount = import.meta.env.DEV ? { username: 'admin', password: 'lumal123' } : null;
const localModules = import.meta.glob<LocalModule>(['../../modules/*/local.ts', '../../modules/business/*/local.ts']);

export function createBackend(context: ServiceContext): ApplicationService {
  const db = createLocalDatabase();
  let ownedToken = '';
  let handlers: Promise<ReturnType<LocalModule['createLocalHandler']>[]> | undefined;
  function assertDemo(): void {
    if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_LOCAL_DEMO !== 'true')
      throw new Error('生产环境已禁用本地演示，请使用 HTTP 模式或显式启用演示');
    context.getSignal().throwIfAborted();
  }
  function account(): DataRow {
    assertDemo();
    const token = context.getSession()?.accessToken ?? '';
    const raw = sessionStorage.getItem(`demo:${token}`);
    if (!raw) throw new Error('本地演示会话已失效');
    const identity = object(JSON.parse(raw));
    const user = db.read('users').find((row) => row.id === identity.id);
    if (!user || user.status !== 'enabled') throw new Error('本地账号已停用或删除，请重新登录');
    ownedToken = token;
    return user;
  }
  function user(): CurrentUser {
    const current = account();
    return { id: String(current.id), username: String(current.username), name: String(current.nickname) };
  }
  function access(): AccessSnapshot {
    const current = account();
    const assigned = stringArray(current.roles);
    const roles = db.read('roles').filter((row) => assigned.includes(String(row.code)) && row.status === 'enabled');
    return {
      roles: roles.map((row) => String(row.code)),
      permissions: [...new Set(roles.flatMap((row) => stringArray(row.permissions)))].filter((code) =>
        permissionCodes.includes(code),
      ),
    };
  }
  function assertPermission(code: string): void {
    if (!access().permissions.includes(code)) throw new Error(`无操作权限：${code}`);
  }
  async function businessRequest<T>(method: HttpMethod, path: string, input: BusinessRequest = {}): Promise<T> {
    user();
    const signal = context.getSignal();
    handlers ??= Promise.all(
      Object.values(localModules).map(async (load) =>
        (await load()).createLocalHandler({ db, user, assertPermission }),
      ),
    );
    const handler = (await handlers).find((item) => item.handles(path));
    signal.throwIfAborted();
    if (handler) return (await handler.request(method, path, input)) as T;
    throw new Error(`本地数据源不支持此业务接口：${method} ${path}`);
  }
  return {
    request: businessRequest,
    async login(input, signal) {
      assertDemo();
      signal.throwIfAborted();
      const found = db.read('users').find((row) => row.username === input.username);
      if (!found || found.status !== 'enabled' || input.password !== found.password)
        throw new Error('账号或密码不正确');
      ownedToken = crypto.randomUUID();
      sessionStorage.setItem(`demo:${ownedToken}`, JSON.stringify({ id: found.id }));
      return { accessToken: ownedToken };
    },
    getUser: async (signal) => {
      signal.throwIfAborted();
      return user();
    },
    getAccess: async (signal) => {
      signal.throwIfAborted();
      return access();
    },
    getMenus: async (signal) => {
      signal.throwIfAborted();
      user();
      return buildStoredMenus(db.read('menus'), viewComponents);
    },
    logout: async (token) => {
      sessionStorage.removeItem(`demo:${token}`);
    },
    clearCache() {
      if (ownedToken) sessionStorage.removeItem(`demo:${ownedToken}`);
      ownedToken = '';
      handlers = undefined;
    },
    list: (resource, input) =>
      businessRequest('GET', `/system/${resource}`, {
        query: { page: input.page, pageSize: input.pageSize, ...input.query } as BusinessRequest['query'],
      }),
    save: (resource, model, id) =>
      businessRequest(id ? 'PUT' : 'POST', `/system/${resource}${id ? `/${encodeURIComponent(id)}` : ''}`, {
        body: model,
      }),
    remove: (resource, id) => businessRequest('DELETE', `/system/${resource}/${encodeURIComponent(id)}`),
  };
}
