import type { RequestClient } from '@lumal/core/request'
import { createRequestClient, RequestError } from '@lumal/core/request'
import { parseAdminResponse, parseAdminSession } from '../api/adapters'
import { adminSession, handleAdminSessionExpired } from './session'
import { registerSessionResetHandler } from './session-reset'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

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
      refresh: async () => {
        const refreshToken = adminSession.getRefreshToken()
        if (!refreshToken)
          throw new Error('缺少刷新凭据')
        const result = await adminPublicRequest.post('/auth/refresh', { body: { refreshToken } })
        adminSession.setSession(parseAdminSession(result))
      },
    },
    baseURL,
    fetch: fetcher,
    getToken: () => adminSession.getToken() || undefined,
    onResponseError: ({ error }) => normalizeErrorMessage(error),
    onResponse: <TResult>({ data }: { data: unknown }) => parseAdminResponse<TResult>(data),
    onSessionExpired: () => handleAdminSessionExpired(),
  })
}

export const adminRequest = createAdminRequestClient()

registerSessionResetHandler(() => adminRequest.clearCache())
