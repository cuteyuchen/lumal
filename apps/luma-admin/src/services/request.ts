import type { RequestClient } from '@luma/core/request'
import { createRequestClient } from '@luma/core/request'
import { parseAdminResponse } from '../api/adapters'
import { refreshAdminSession } from '../api/auth'
import { adminSession } from './session'

export function createAdminRequestClient(fetcher: typeof fetch = globalThis.fetch): RequestClient {
  return createRequestClient({
    authRefresh: {
      refresh: async () => {
        const refreshToken = adminSession.getRefreshToken()

        if (!refreshToken) {
          throw new Error('缺少刷新凭据')
        }

        adminSession.setSession(await refreshAdminSession(refreshToken))
      },
    },
    fetch: fetcher,
    getToken: () => adminSession.getToken() || undefined,
    onResponse: <TResult>({ data }: { data: unknown }) => parseAdminResponse<TResult>(data),
    onSessionExpired: () => adminSession.handleSessionExpired(),
  })
}

export const adminRequest = createAdminRequestClient()
