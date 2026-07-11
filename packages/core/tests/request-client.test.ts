import { describe, expect, it, vi } from 'vitest'
import {
  createRequestClient,
  createStandardResponseParser,
  parsePageResult,
  parseStandardResponse,
  RequestError,
} from '../src/request'

function createJsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'content-type': 'application/json',
    },
    status: 200,
    ...init,
  })
}

describe('create request client', () => {
  it('会序列化 GET query、注入 token，并通过 onResponse 解析响应', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({
      code: 0,
      data: {
        id: 'user-1',
      },
    }))

    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
      getToken: () => 'token-001',
      onResponse: ({ data }) => (data as { data: unknown }).data,
    })

    const result = await client.get('/users', {
      query: {
        keyword: 'Luma',
        page: 1,
      },
    })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(String(url)).toBe('https://api.example.com/users?keyword=Luma&page=1')
    expect(init?.method).toBe('GET')
    expect(headers.get('Authorization')).toBe('Bearer token-001')
    expect(result).toEqual({
      id: 'user-1',
    })
  })

  it('会以 JSON 提交 POST body 并返回默认 JSON 响应', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({
      ok: true,
    }))

    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
    })

    const result = await client.post('/projects', {
      body: {
        name: 'Luma',
      },
    })

    const [, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(init?.method).toBe('POST')
    expect(headers.get('content-type')).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify({ name: 'Luma' }))
    expect(result).toEqual({
      ok: true,
    })
  })

  it('会拦截同一个仍在进行中的重复提交', async () => {
    let resolveFetch: ((response: Response) => void) | undefined
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      resolveFetch = resolve
    }))

    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      duplicateSubmit: true,
      fetch: fetchMock,
    })

    const firstRequest = client.post('/projects', {
      body: {
        name: 'Luma',
      },
    })
    const duplicateRequest = client.post('/projects', {
      body: {
        name: 'Luma',
      },
    })

    await expect(duplicateRequest).rejects.toMatchObject({
      code: 'DUPLICATE_REQUEST',
    })

    resolveFetch?.(createJsonResponse({ ok: true }))

    await expect(firstRequest).resolves.toEqual({
      ok: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('状态码 401 时会触发一次会话过期回调并抛出 session 错误', async () => {
    const onSessionExpired = vi.fn()
    const fetchMock = vi.fn(async () => createJsonResponse({
      message: 'Unauthorized',
    }, {
      status: 401,
    }))

    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
      onSessionExpired,
    })

    await expect(client.get('/profile')).rejects.toBeInstanceOf(RequestError)
    await expect(client.get('/profile')).rejects.toMatchObject({
      kind: 'session',
      status: 401,
    })
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('并发 401 只刷新一次，并使用新 token 各重放一次 GET', async () => {
    let token = 'expired-token'
    let resolveRefresh: (() => void) | undefined
    const refresh = vi.fn(() => new Promise<void>((resolve) => {
      resolveRefresh = () => {
        token = 'fresh-token'
        resolve()
      }
    }))
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization')
      return authorization === 'Bearer fresh-token'
        ? createJsonResponse({ ok: true })
        : createJsonResponse({ message: 'expired' }, { status: 401 })
    })
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: fetchMock,
      getToken: () => token,
    })

    const first = client.get('/profile')
    const second = client.get('/permissions')

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    resolveRefresh?.()

    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }])
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('写请求默认不重放，显式开启后最多重放一次', async () => {
    let token = 'expired-token'
    const refresh = vi.fn(async () => {
      token = 'fresh-token'
    })
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization')
      return authorization === 'Bearer fresh-token'
        ? createJsonResponse({ saved: true })
        : createJsonResponse({ message: 'expired' }, { status: 401 })
    })
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: fetchMock,
      getToken: () => token,
    })

    await expect(client.post('/projects', { body: { name: 'Luma' } })).rejects.toMatchObject({
      kind: 'session',
    })
    expect(refresh).not.toHaveBeenCalled()

    await expect(client.post('/projects', {
      body: { name: 'Luma' },
      retryOnAuthRefresh: true,
    })).resolves.toEqual({ saved: true })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('显式 Authorization 请求不会进入自动刷新流程', async () => {
    const refresh = vi.fn(async () => {})
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: vi.fn(async () => createJsonResponse({ message: 'expired' }, { status: 401 })),
      getToken: () => 'managed-token',
    })

    await expect(client.get('/external', {
      headers: { Authorization: 'Bearer external-token' },
    })).rejects.toMatchObject({ kind: 'session' })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('刷新后仍为 401 时不会再次刷新', async () => {
    const refresh = vi.fn(async () => {})
    const onSessionExpired = vi.fn()
    const fetchMock = vi.fn(async () => createJsonResponse({ message: 'expired' }, { status: 401 }))
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: fetchMock,
      getToken: () => 'same-token',
      onSessionExpired,
    })

    await expect(client.get('/profile')).rejects.toMatchObject({ kind: 'session' })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(onSessionExpired).toHaveBeenCalledTimes(1)
  })

  it('会串行触发 onRequest 与 onResponse 生命周期钩子并注入 requestId', async () => {
    const onRequest = vi.fn()
    const fetchMock = vi.fn(async () => createJsonResponse({ ok: true }))

    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
      onRequest,
      requestId: () => 'req-123',
      requestIdHeader: 'X-Request-Id',
    })

    await client.get('/ping')

    const [, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(headers.get('X-Request-Id')).toBe('req-123')
    expect(onRequest).toHaveBeenCalledWith(expect.objectContaining({
      requestId: 'req-123',
      url: 'https://api.example.com/ping',
    }))
  })

  it('网络错误会触发 onRequestError，响应错误会触发 onResponseError', async () => {
    const onRequestError = vi.fn()
    const onResponseError = vi.fn()

    const networkClient = createRequestClient({
      fetch: vi.fn(async () => {
        throw new Error('network down')
      }),
      onRequestError,
    })
    await expect(networkClient.get('/a')).rejects.toMatchObject({ kind: 'network' })
    expect(onRequestError).toHaveBeenCalledTimes(1)

    const errorClient = createRequestClient({
      fetch: vi.fn(async () => createJsonResponse({ message: 'boom' }, { status: 500 })),
      onResponseError,
    })
    await expect(errorClient.get('/b')).rejects.toBeInstanceOf(RequestError)
    expect(onResponseError).toHaveBeenCalledTimes(1)
  })

  it('取消请求会归类为 cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    const client = createRequestClient({
      fetch: vi.fn(async () => {
        throw new DOMException('aborted', 'AbortError')
      }),
    })

    await expect(client.get('/cancelled', { signal: controller.signal })).rejects.toMatchObject({
      kind: 'cancelled',
    })
  })

  it('开启缓存后同一 GET 只请求一次', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({ value: 1 }))
    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
    })

    const first = await client.get('/config', { cache: { enabled: true } })
    const second = await client.get('/config', { cache: { enabled: true } })

    expect(first).toEqual({ value: 1 })
    expect(second).toEqual({ value: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('upload 会以 multipart/form-data 提交文件与附加字段', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({ ok: true }))
    const client = createRequestClient({
      baseURL: 'https://api.example.com',
      fetch: fetchMock,
    })

    const file = new Blob(['hello'], { type: 'text/plain' })
    await client.upload('/files', file, {
      data: { category: 'doc' },
      fileField: 'attachment',
    })

    const [, init] = fetchMock.mock.calls[0] ?? []

    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    const formData = init?.body as FormData
    expect(formData.get('category')).toBe('doc')
    expect(formData.get('attachment')).toBeInstanceOf(Blob)
  })
})

describe('parse standard response', () => {
  it('成功状态码返回 data，失败状态码抛错', () => {
    expect(parseStandardResponse({ code: 0, data: { id: 1 } })).toEqual({ id: 1 })
    expect(() => parseStandardResponse({ code: 500, message: '服务异常' })).toThrow('服务异常')
  })

  it('业务错误与会话错误会生成统一 RequestError.kind', () => {
    expect(() => parseStandardResponse({ code: 500, message: '服务异常' })).toThrow(RequestError)

    try {
      parseStandardResponse({ code: 'AUTH_EXPIRED', message: '登录过期' }, {
        sessionExpiredCodes: ['AUTH_EXPIRED'],
      })
    }
    catch (error) {
      expect(error).toMatchObject({ code: 'AUTH_EXPIRED', kind: 'session' })
    }
  })

  it('无 code 字段视为非标准包装，原样返回', () => {
    expect(parseStandardResponse({ id: 1 })).toEqual({ id: 1 })
  })

  it('支持自定义字段映射与成功码集合', () => {
    const result = parseStandardResponse(
      { status: 'OK', payload: { id: 2 } },
      {
        fieldNames: { code: 'status', data: 'payload' },
        successCodes: ['OK'],
      },
    )

    expect(result).toEqual({ id: 2 })
  })

  it('createStandardResponseParser 可直接用作 onResponse', async () => {
    const fetchMock = vi.fn(async () => createJsonResponse({ code: 0, data: { name: 'Luma' } }))
    const client = createRequestClient({
      fetch: fetchMock,
      onResponse: createStandardResponseParser(),
    })

    await expect(client.get('/profile')).resolves.toEqual({ name: 'Luma' })
  })
})

describe('parse page result', () => {
  it('支持多层响应、异常分页字段和类型漂移转换', () => {
    const result = parsePageResult<{ enabled: boolean, id: number }>({
      payload: {
        count: '2',
        records: [
          { enabled: '1', id: '1' },
          { enabled: '0', id: '2' },
        ],
      },
    }, {
      fieldNames: { items: 'records', total: 'count' },
      parseResponse: response => (response as { payload: unknown }).payload,
      transform: item => ({
        enabled: (item as { enabled: string }).enabled === '1',
        id: Number((item as { id: string }).id),
      }),
    })

    expect(result).toEqual({
      items: [{ enabled: true, id: 1 }, { enabled: false, id: 2 }],
      total: 2,
    })
  })
})
