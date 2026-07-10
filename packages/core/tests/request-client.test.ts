import { describe, expect, it, vi } from 'vitest'
import {
  createRequestClient,
  createStandardResponseParser,
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

  it('状态码 401 时会触发会话过期回调并抛出 RequestError', async () => {
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
      status: 401,
    })
    expect(onSessionExpired).toHaveBeenCalledTimes(2)
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
    await expect(networkClient.get('/a')).rejects.toThrow('network down')
    expect(onRequestError).toHaveBeenCalledTimes(1)

    const errorClient = createRequestClient({
      fetch: vi.fn(async () => createJsonResponse({ message: 'boom' }, { status: 500 })),
      onResponseError,
    })
    await expect(errorClient.get('/b')).rejects.toBeInstanceOf(RequestError)
    expect(onResponseError).toHaveBeenCalledTimes(1)
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
