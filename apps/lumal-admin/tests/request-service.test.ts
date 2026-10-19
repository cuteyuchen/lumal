import { ElMessageBox } from 'element-plus'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAdminResponseTransport } from '../src/api/adapters'
import { createAdminRequestClient } from '../src/services/request'
import { adminSession, currentUser, login, logout } from '../src/services/session'

describe('admin request service', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await logout()
  })

  it('通过 Admin adapter 识别业务会话码，刷新后重放 GET', async () => {
    await login('admin')
    adminSession.setSession({
      accessToken: 'expired-access',
      refreshToken: adminSession.getRefreshToken(),
    })
    const request = createAdminRequestClient()

    await expect(request.get('/session/me')).resolves.toMatchObject({ username: 'admin' })
    expect(adminSession.getToken()).not.toBe('expired-access')
    expect(adminSession.getToken()).toBeTruthy()
    expect(currentUser.value?.username).toBe('admin')
  })

  it('退出会取消所有客户端的旧会话请求，新登录不复用取消信号', async () => {
    await login('admin')
    let finish!: () => void
    const receivedSignals: Array<AbortSignal | null | undefined> = []
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      receivedSignals.push(init?.signal)
      if (receivedSignals.length === 1) {
        await new Promise<void>((resolve) => {
          finish = resolve
        })
      }
      return new Response(JSON.stringify(createAdminResponseTransport({ ok: true })), {
        headers: { 'content-type': 'application/json' },
      })
    })
    const request = createAdminRequestClient(fetcher)
    const pending = request.get('/slow').catch(error => error)
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    await logout()
    const abortedBeforeNextLogin = receivedSignals[0]?.aborted
    await login('operator')
    finish()

    expect(await pending).toMatchObject({ kind: 'cancelled' })
    expect(abortedBeforeNextLogin).toBe(true)
    await expect(request.get('/fresh')).resolves.toEqual({ ok: true })
    expect(receivedSignals[1]?.aborted).toBe(false)
  })

  it('刷新失败时清理会话并提示重新登录后跳转登录页', async () => {
    const alert = vi.spyOn(ElMessageBox, 'alert').mockResolvedValue('confirm' as never)
    const { router } = await import('../src/router')

    await login('operator')
    await router.push('/profile')
    const replace = vi.spyOn(router, 'replace').mockResolvedValue(undefined as never)

    adminSession.setSession({
      accessToken: 'expired-access',
      refreshToken: 'invalid-refresh',
    })
    const request = createAdminRequestClient()

    await expect(request.get('/profile')).rejects.toMatchObject({ kind: 'session' })
    expect(adminSession.getSession()).toBeNull()
    expect(currentUser.value).toBeNull()
    expect(alert).toHaveBeenCalledWith(
      '登录状态已失效，请重新登录',
      '登录已过期',
      expect.objectContaining({ confirmButtonText: '重新登录' }),
    )
    expect(replace).toHaveBeenCalledWith('/login?redirect=%2Fprofile')
  })
})
