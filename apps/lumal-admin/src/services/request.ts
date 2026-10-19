import type { RequestClient } from '@lumal/core/request'
import { createRequestClient, RequestError } from '@lumal/core/request'
import { parseAdminResponse, parseAdminSession } from '../api/adapters'
import { adminSession, handleAdminSessionExpired } from './session'
import { registerSessionResetHandler } from './session-reset'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

/***********************会话请求生命周期*********************/
let sessionRequests = new AbortController()
registerSessionResetHandler(() => {
  sessionRequests.abort()
  sessionRequests = new AbortController()
})

function normalizeErrorMessage(error: unknown): void {
  if (!(error instanceof RequestError) || !error.data || typeof error.data !== 'object')
    return
  const message = (error.data as Record<string, unknown>).resultMsg
  if (typeof message === 'string' && message)
    error.message = message
}

function createBaseClient(fetcher: typeof fetch): RequestClient {
  return createRequestClient({
    baseURL,
    fetch: fetcher,
    onResponseError: ({ error }) => normalizeErrorMessage(error),
    onResponse: <TResult>({ data }: { data: unknown }) => parseAdminResponse<TResult>(data),
  })
}

export function createAdminPublicRequestClient(fetcher: typeof fetch = globalThis.fetch): RequestClient {
  return createBaseClient(fetcher)
}

export const adminPublicRequest = createAdminPublicRequestClient()

export function createAdminRequestClient(fetcher: typeof fetch = globalThis.fetch): RequestClient {
  return createRequestClient({
    authRefresh: {
      refresh: async ({ init }) => {
        const refreshToken = adminSession.getRefreshToken()
        if (!refreshToken)
          throw new Error('缺少刷新凭据')
        const result = await adminPublicRequest.post('/auth/refresh', { body: { refreshToken }, signal: init.signal ?? undefined })
        init.signal?.throwIfAborted()
        if (adminSession.getRefreshToken() !== refreshToken)
          throw new DOMException('会话已切换', 'AbortError')
        adminSession.setSession(parseAdminSession(result))
      },
    },
    baseURL,
    fetch: async (input, init) => {
      const response = await fetcher(input, init)
      // 自定义 transport 也可能不消费 signal，响应返回后仍须阻止旧数据进入页面。
      init?.signal?.throwIfAborted()
      return response
    },
    getToken: () => adminSession.getToken() || undefined,
    onRequest({ init }) {
      init.signal = init.signal
        ? AbortSignal.any([init.signal, sessionRequests.signal])
        : sessionRequests.signal
      const token = adminSession.getToken()
      if (!token || new Headers(init.headers).get('Authorization') !== `Bearer ${token}`)
        throw new RequestError('会话已切换，请求已取消', { kind: 'cancelled' })
    },
    onResponseError: ({ error }) => normalizeErrorMessage(error),
    onResponse: <TResult>({ data, init }: { data: unknown, init: RequestInit }) => {
      init.signal?.throwIfAborted()
      return parseAdminResponse<TResult>(data)
    },
    onSessionExpired: () => handleAdminSessionExpired(),
  })
}

export const adminRequest = createAdminRequestClient()

registerSessionResetHandler(() => adminRequest.clearCache())
