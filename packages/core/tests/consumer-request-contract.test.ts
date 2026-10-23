import type { RequestMethod } from '../src/request'
import { describe, expect, it, vi } from 'vitest'
import { createRequestClient, createStandardResponseParser, parsePageResult } from '../src/request'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })
}

// 从两类消费者中抽取协议形状，不包含业务字段、地址、账号或数据。
describe('consumer request adapter contracts', () => {
  it.each([
    { fieldNames: { code: 'code', data: 'data', message: 'msg' }, successCodes: [200], body: { code: 200, data: { items: [], total: 0 } } },
    { fieldNames: { code: 'status', data: 'payload', message: 'message' }, successCodes: ['OK'], body: { status: 'OK', payload: { items: [], total: 0 } } },
  ])('成功码和响应字段由Adapter选择，不要求改Core', async ({ fieldNames, successCodes, body }) => {
    const client = createRequestClient({
      fetch: async () => json(body),
      onResponse: createStandardResponseParser({ fieldNames, successCodes }),
    })
    await expect(client.get('/records')).resolves.toEqual({ items: [], total: 0 })
  })

  it('msg错误明确抛出，登录401不影响独立的已登录客户端', async () => {
    const expired = vi.fn()
    const privateClient = createRequestClient({ fetch: async () => json({ ok: true }), onSessionExpired: expired })
    const publicClient = createRequestClient({ fetch: async () => json({ msg: '凭据错误' }, 401) })
    await expect(publicClient.post('/login', { body: { name: 'example', password: 'invalid' } })).rejects.toMatchObject({ status: 401 })
    await expect(privateClient.get('/profile')).resolves.toEqual({ ok: true })
    expect(expired).not.toHaveBeenCalled()
    const rejected = createRequestClient({
      fetch: async () => json({ code: 500, msg: '校验失败' }),
      onResponse: createStandardResponseParser({ fieldNames: { message: 'msg' } }),
    })
    await expect(rejected.get('/records')).rejects.toMatchObject({ kind: 'business', message: '校验失败' })
  })

  it.each(['get', 'delete', 'post', 'put', 'patch'] as const)('%s的query/body与上下文扩展不需要复制客户端', async (method) => {
    const fetcher = vi.fn<typeof fetch>(async () => json({ ok: true }))
    const client = createRequestClient({
      baseURL: '/api',
      fetch: fetcher,
      getToken: () => 'test-token',
      onRequest(context) {
        const headers = new Headers(context.init.headers)
        headers.set('X-Context', 'example-context')
        context.init.headers = headers
      },
    })
    const body = { name: 'example' }
    await client.request('/records', { method: method.toUpperCase() as RequestMethod, query: { page: 2 }, body: method === 'get' ? undefined : body })
    const [url, init] = fetcher.mock.calls[0]!
    expect(url).toBe('/api/records?page=2')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer test-token')
    expect(new Headers(init?.headers).get('X-Context')).toBe('example-context')
    expect(init?.body).toBe(method === 'get' ? undefined : JSON.stringify(body))
  })

  it('原生超时Signal作为取消错误传播，不触发会话退出', async () => {
    const expired = vi.fn()
    const client = createRequestClient({
      fetch: async (_url, init) => new Promise<Response>((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true })
      }),
      onSessionExpired: expired,
    })
    const pending = client.get('/slow', { signal: AbortSignal.timeout(20) })
    await expect(pending).rejects.toMatchObject({ kind: 'cancelled', originalError: { name: 'TimeoutError' } })
    expect(expired).not.toHaveBeenCalled()
  })

  it('分页转换保留类型与明确字段映射，不猜测业务响应', () => {
    expect(parsePageResult({ payload: { records: [{ id: '2' }], count: '1' } }, {
      parseResponse: response => (response as { payload: unknown }).payload,
      fieldNames: { items: 'records', total: 'count' },
      transform: record => ({ id: Number((record as { id: string }).id) }),
    })).toEqual({ items: [{ id: 2 }], total: 1 })
  })
})
