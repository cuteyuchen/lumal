import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminRequestClient } from '../src/services/request'
import { adminSession, currentUser, login, logout } from '../src/services/session'

function createJsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  })
}

describe('admin request service', () => {
  afterEach(async () => {
    await logout()
  })

  it('通过 Admin adapter 识别业务会话码，刷新后重放 GET', async () => {
    await login('admin')
    const initialToken = adminSession.getToken()
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const token = new Headers(init?.headers).get('Authorization')

      if (token === `Bearer ${initialToken}`) {
        return createJsonResponse({
          result: null,
          resultMsg: '访问凭据已过期',
          statusCode: 'AUTH_EXPIRED',
        })
      }

      return createJsonResponse({
        result: { name: 'Luma Admin' },
        resultMsg: 'ok',
        statusCode: '0000',
      })
    })
    const request = createAdminRequestClient(fetchMock)

    await expect(request.get('/profile')).resolves.toEqual({ name: 'Luma Admin' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(adminSession.getToken()).not.toBe(initialToken)
    expect(currentUser.value?.username).toBe('admin')
  })

  it('刷新失败时清理会话、用户和权限状态', async () => {
    await login('operator')
    adminSession.setSession({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    })
    const request = createAdminRequestClient(vi.fn(async () => createJsonResponse({
      result: null,
      resultMsg: '访问凭据已过期',
      statusCode: 'AUTH_EXPIRED',
    })))

    await expect(request.get('/profile')).rejects.toMatchObject({ kind: 'session' })
    expect(adminSession.getSession()).toBeNull()
    expect(currentUser.value).toBeNull()
  })
})
