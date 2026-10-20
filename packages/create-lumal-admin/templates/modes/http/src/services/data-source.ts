import type { ApplicationService, ServiceContext } from './contracts'
import { createRequestClient, RequestError } from '@lumal/core/request'
import { createHttpAdapter } from './http-adapter'

export const demoAccount: { username: string, password: string } | null = null

export function createHttpBackend(context: ServiceContext, baseURL: string, adapterName = 'standard'): ApplicationService {
  const adapter = createHttpAdapter(adapterName)
  const publicRequest = createRequestClient({
    baseURL,
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
      if (resource === 'config' && adapter.configMode === 'object') {
        if (!result || typeof result !== 'object' || Array.isArray(result))
          throw new Error('系统配置响应必须是对象')
        const items = Object.entries(result).map(([key, value]) => ({ id: key, key, value: String(value) }))
        return { items, total: items.length }
      }
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
      const page = adapter.parsePage(result)
      if (resource === 'roles' && adapterName === 'lumal-mock') {
        page.items = await Promise.all(page.items.map(async row => ({
          ...row,
          permissions: await request.get(`/system/roles/${encodeURIComponent(String(row.code))}/permissions`),
        })))
      }
      return page
    },
    async save(resource, model, id) {
      if (resource === 'config' && adapter.configMode === 'object') {
        if (!id)
          throw new Error('系统配置只允许更新已存在的配置键')
        const current = await request.get<Record<string, unknown>>('/system/config')
        if (!(id in current))
          throw new Error('配置键不存在')
        const original = current[id]
        const value = typeof original === 'boolean'
          ? String(model.value) === 'true'
          : typeof original === 'number' ? Number(model.value) : String(model.value ?? '')
        return request.put('/system/config', { body: { [id]: value } })
      }
      const saved = id
        ? await request.put(`/system/${resource}/${encodeURIComponent(id)}`, { body: model })
        : await request.post(`/system/${resource}`, { body: model })
      if (resource === 'roles' && adapterName === 'lumal-mock' && Array.isArray(model.permissions))
        await request.put(`/system/roles/${encodeURIComponent(String(model.code))}/permissions`, { body: { permissions: model.permissions } })
      return saved
    },
    remove: async (resource, id) => {
      await request.delete(`/system/${resource}/${encodeURIComponent(id)}`)
    },
  }
}

export function createBackend(context: ServiceContext): ApplicationService {
  return createHttpBackend(context, import.meta.env.VITE_API_BASE_URL ?? '', import.meta.env.VITE_API_ADAPTER || 'standard')
}
