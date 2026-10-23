import type { ApplicationService, ServiceContext } from './contracts'
import { createRequestClient, RequestError } from '@lumal/core/request'
import { object } from '../menu-policy'
import { createHttpAdapter } from './http-adapter'

export const demoAccount: { username: string, password: string } | null = null

export function createHttpBackend(context: ServiceContext, baseURL: string, adapterName = 'standard'): ApplicationService {
  const adapter = createHttpAdapter(adapterName)
  function exposeHttpMessage({ error }: { error: unknown }): void {
    if (error instanceof RequestError) {
      const message = adapter.errorMessage(error.data)
      if (message)
        error.message = message // 保留 status/kind/data，仅适配后端明确定义的错误文案。
    }
  }
  const publicRequest = createRequestClient({
    baseURL,
    onResponseError: exposeHttpMessage,
    onRequest() {
      if (!baseURL.trim())
        throw new Error('未配置 VITE_API_BASE_URL，请先接入真实后端')
    },
    onResponse: <T>({ data, init }: { data: unknown, init: RequestInit }) => {
      init.signal?.throwIfAborted()
      return adapter.parseResponse(data) as T
    },
  })
  const request = createRequestClient({
    baseURL,
    onResponseError: exposeHttpMessage,
    duplicateSubmit: true,
    getToken: () => context.getSession()?.accessToken,
    onRequest({ init }) {
      if (!baseURL.trim())
        throw new Error('未配置 VITE_API_BASE_URL，请先接入真实后端')
      init.signal = init.signal ? AbortSignal.any([init.signal, context.getSignal()]) : context.getSignal()
      const token = context.getSession()?.accessToken
      if (!token || new Headers(init.headers).get('Authorization') !== `Bearer ${token}`)
        throw new RequestError('会话已切换', { kind: 'cancelled' })
    },
    onResponse: <T>({ data, init }: { data: unknown, init: RequestInit }) => {
      init.signal?.throwIfAborted()
      return adapter.parseResponse(data) as T
    },
    authRefresh: {
      async refresh({ init }) {
        const refreshToken = context.getSession()?.refreshToken
        if (!refreshToken)
          throw new Error('缺少刷新凭据')
        const result = await publicRequest.post('/auth/refresh', { body: { refreshToken }, signal: init.signal ?? undefined })
        init.signal?.throwIfAborted()
        if (context.getSession()?.refreshToken !== refreshToken)
          throw new DOMException('会话已切换', 'AbortError')
        context.setSession(adapter.parseSession(result))
      },
    },
    onSessionExpired: context.expire,
  })
  return {
    request: (method, path, input = {}) => request.request(path, {
      method,
      ...input,
      // 业务端点仅接受 JSON 对象；在请求边界校验，不能直接透传任意 object。
      body: input.body === undefined ? undefined : object(input.body),
    }),
    login: async (input, signal) => adapter.parseSession(await publicRequest.post('/auth/login', { body: { ...input }, signal })),
    getUser: async signal => adapter.parseUser(await request.get('/session/me', { signal })),
    getAccess: async signal => adapter.parseAccess(await request.get('/session/access', { signal })),
    getMenus: async signal => adapter.parseMenus(await request.get(adapter.menusPath, { signal })),
    logout: async (accessToken) => {
      await publicRequest.post('/auth/logout', { headers: { Authorization: `Bearer ${accessToken}` } })
    },
    clearCache() {
      publicRequest.clearCache()
      request.clearCache()
    },
    async list(resource, input) {
      const result = await request.get(`/system/${resource}`, {
        query: { page: input.page, pageSize: input.pageSize, ...input.query } as Record<string, string | number>,
      })
      // Mock 的树形 / 字典接口不分页，显式在应用 adapter 边界转换。
      if (adapterName === 'lumal-mock' && Array.isArray(result)) {
        const flatten = (rows: Record<string, unknown>[]): Record<string, unknown>[] => rows.flatMap(row => [
          { ...row, children: undefined },
          ...(Array.isArray(row.children) ? flatten(row.children) : []),
        ])
        const items = flatten(result)
        const keyword = String(input.query.keyword ?? '').trim()
        const filtered = items.filter(row => !keyword || Object.values(row).some(value => String(value).includes(keyword)))
        return { items: filtered.slice((input.page - 1) * input.pageSize, input.page * input.pageSize), total: filtered.length }
      }
      return adapter.parsePage(result)
    },
    async save(resource, model, id) {
      if (resource === 'roles' && Object.hasOwn(model, 'permissions'))
        throw new Error('角色资料与授权必须分别调用，请使用角色授权服务')
      return id
        ? await request.put(`/system/${resource}/${encodeURIComponent(id)}`, { body: model })
        : await request.post(`/system/${resource}`, { body: model })
    },
    remove: async (resource, id) => {
      await request.delete(`/system/${resource}/${encodeURIComponent(id)}`)
    },
  }
}

export function createBackend(context: ServiceContext): ApplicationService {
  return createHttpBackend(context, import.meta.env.VITE_API_BASE_URL ?? '', import.meta.env.VITE_API_ADAPTER || 'standard')
}
