import { describe, expect, it, vi } from 'vitest'
import {
  createRequestCache,
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
  it.each([
    { baseURL: undefined, input: '/users', query: undefined, before: '/users', target: '/gateway/users' },
    { baseURL: '/api', input: '/users?sort=name', query: { page: 2 }, before: '/api/users?sort=name&page=2', target: '/gateway/users?sort=name&page=2' },
    { baseURL: 'https://api.example.com', input: 'https://other.example.com/users?q=one', query: { page: 2 }, before: 'https://other.example.com/users?q=one&page=2', target: 'https://gateway.example.com/users?q=one&page=2' },
  ])('onRequest 改写后的 URL 和 init 真正传给 fetch（$input）', async ({ baseURL, input, query, before, target }) => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => createJsonResponse({ ok: true }))
    const onResponse = vi.fn(({ data }) => data)
    const client = createRequestClient({
      baseURL,
      fetch: fetchMock,
      getToken: () => 'managed-token',
      onRequest: async (context) => {
        expect(context.url).toBe(before)
        expect(new Headers(context.init.headers).get('Authorization')).toBe('Bearer managed-token')
        context.url = target
        const headers = new Headers(context.init.headers)
        headers.set('X-Gateway', 'enabled')
        // 替换整个 init 与就地修改 headers 同样属于公开契约。
        context.init = { ...context.init, headers, credentials: 'include' }
      },
      onResponse,
      requestId: () => 'rewrite-123',
    })

    await client.get(input, { query })
    const [sentUrl, init] = fetchMock.mock.calls[0]!
    expect(sentUrl).toBe(target)
    expect(init?.credentials).toBe('include')
    expect(new Headers(init?.headers).get('X-Gateway')).toBe('enabled')
    expect(new Headers(init?.headers).get('X-Request-Id')).toBe('rewrite-123')
    expect(onResponse).toHaveBeenCalledWith(expect.objectContaining({ init, url: target, requestId: 'rewrite-123' }))
  })

  it.each([undefined, 'shared-custom-key'])('缓存按最终目标隔离，相同最终 URL 才命中（key=%s）', async (key) => {
    let target = '/gateway/a?page=1'
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => createJsonResponse({ url }))
    const onRequest = vi.fn((context) => {
      context.url = target
    })
    const client = createRequestClient({ fetch: fetchMock, onRequest })
    const options = { cache: { enabled: true, key } }

    await expect(client.get('/original', options)).resolves.toEqual({ url: target })
    await client.get('/another-original', options)
    target = '/gateway/b?page=1'
    await expect(client.get('/original', options)).resolves.toEqual({ url: target })
    await client.get('/original', options)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/gateway/a?page=1', '/gateway/b?page=1'])
    expect(onRequest).toHaveBeenCalledTimes(4)
  })

  it('hook 改写的认证头、租户和请求级作用域仍隔离缓存', async () => {
    let identity = 'user-a'
    let tenant = 'tenant-a'
    const cache = createRequestCache()
    const set = vi.spyOn(cache, 'set')
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => createJsonResponse({ identity, tenant, url }))
    const client = createRequestClient({
      cache,
      fetch: fetchMock,
      getCacheScope: () => tenant,
      onRequest(context) {
        context.url = '/gateway/profile'
        context.init.headers = { Authorization: `Bearer ${identity}` }
      },
    })
    const options = { cache: { enabled: true, scope: 'summary' } }
    await client.get('/profile', options)
    await client.get('/profile', options)
    identity = 'user-b'
    await expect(client.get('/profile', options)).resolves.toMatchObject({ identity: 'user-b' })
    tenant = 'tenant-b'
    await expect(client.get('/profile', options)).resolves.toMatchObject({ tenant: 'tenant-b' })
    await client.get('/profile', { cache: { enabled: true, scope: 'detail' } })
    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(set.mock.calls.every(([key]) => !key.includes('user-a') && !key.includes('user-b'))).toBe(true)
  })

  it('并发提交按 hook 最终 URL、请求体和身份判断，失败后释放全部占用', async () => {
    const pending: Array<(response: Response) => void> = []
    const fetchMock = vi.fn((_url: RequestInfo | URL) => new Promise<Response>(resolve => pending.push(resolve)))
    const client = createRequestClient({
      duplicateSubmit: true,
      fetch: fetchMock,
      onRequest(context) {
        const headers = new Headers(context.init.headers)
        context.url = headers.get('X-Target') ?? '/gateway/shared'
        context.init.body = headers.get('X-Body') ?? context.init.body
      },
    })
    const first = client.post('/one', { body: { id: 1 } })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await expect(client.post('/two', { body: { id: 1 } })).rejects.toMatchObject({ kind: 'duplicate' })
    const otherTarget = client.post('/one', { body: { id: 1 }, headers: { 'X-Target': '/gateway/other' } })
    const otherBody = client.post('/one', { body: { id: 1 }, headers: { 'X-Body': '{"id":2}' } })
    const otherIdentity = client.post('/one', { body: { id: 1 }, headers: { Authorization: 'Bearer other-user' } })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4))
    const failed = expect(first).rejects.toMatchObject({ status: 500 })
    pending[0]!(createJsonResponse({}, { status: 500 }))
    pending[1]!(createJsonResponse({ ok: true }))
    pending[2]!(createJsonResponse({ ok: true }))
    pending[3]!(createJsonResponse({ ok: true }))
    await Promise.all([failed, otherTarget, otherBody, otherIdentity])
    const next = client.post('/one', { body: { id: 1 } })
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5))
    pending[4]!(createJsonResponse({ ok: true }))
    await expect(next).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/gateway/shared', '/gateway/other', '/gateway/shared', '/gateway/shared', '/gateway/shared'])
  })

  it('hook 最终写请求不隐式缓存，命中 GET 缓存也遵守 hook 的取消信号', async () => {
    const controller = new AbortController()
    let method = 'POST'
    const fetchMock = vi.fn(async () => createJsonResponse({ ok: true }))
    const client = createRequestClient({
      fetch: fetchMock,
      onRequest(context) {
        context.url = '/gateway/data'
        context.init.method = method
        context.init.signal = controller.signal
      },
    })
    const options = { cache: { enabled: true } }
    await client.get('/data', options)
    await client.get('/data', options)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    method = 'GET'
    await client.get('/data', options)
    await client.get('/data', options)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    controller.abort()
    await expect(client.get('/data', options)).rejects.toMatchObject({ kind: 'cancelled' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it.each(['network', 'http', 'parse', 'business', 'session'])('错误上下文报告 hook 最终 URL（%s）', async (kind) => {
    const onRequestError = vi.fn()
    const onResponseError = vi.fn()
    const onSessionExpired = vi.fn()
    const client = createRequestClient({
      fetch: async () => {
        if (kind === 'network')
          throw new Error('offline')
        if (kind === 'parse')
          return new Response('{', { headers: { 'content-type': 'application/json' } })
        return createJsonResponse({}, { status: kind === 'http' ? 500 : kind === 'session' ? 401 : 200 })
      },
      onRequest: (context) => { context.url = '/gateway/failure' },
      onRequestError,
      onResponse: () => { throw new Error('business error') },
      onResponseError,
      onSessionExpired,
      requestId: () => 'failure-id',
    })
    await expect(client.get('/original')).rejects.toBeInstanceOf(RequestError)
    expect(kind === 'network' ? onRequestError : onResponseError)
      .toHaveBeenCalledWith(expect.objectContaining({ url: '/gateway/failure', requestId: 'failure-id' }))
    if (kind === 'session')
      expect(onSessionExpired).toHaveBeenCalledWith(expect.objectContaining({ url: '/gateway/failure' }))
  })

  it('刷新重放从原始已解析 URL 再执行 hook，复用 requestId 且缓存最终目标', async () => {
    let token = 'expired'
    const seenUrls: string[] = []
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) =>
      new Headers(init?.headers).get('Authorization') === 'Bearer fresh'
        ? createJsonResponse({ url })
        : createJsonResponse({}, { status: 401 }))
    const refresh = vi.fn(async () => {
      token = 'fresh'
    })
    const client = createRequestClient({
      authRefresh: { refresh },
      duplicateSubmit: true,
      fetch: fetchMock,
      getToken: () => token,
      onRequest(context) {
        seenUrls.push(context.url)
        context.url = `/gateway${context.url}`
      },
      requestId: () => 'replay-id',
    })
    const options = { cache: { enabled: true } }
    await expect(client.get('/profile?page=1', options)).resolves.toEqual({ url: '/gateway/profile?page=1' })
    await client.get('/profile?page=1', options)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/gateway/profile?page=1', '/gateway/profile?page=1'])
    expect(fetchMock.mock.calls.map(([, init]) => new Headers(init?.headers).get('X-Request-Id'))).toEqual(['replay-id', 'replay-id'])
    expect(seenUrls).toEqual(['/profile?page=1', '/profile?page=1', '/profile?page=1'])
    expect(refresh).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ url: '/gateway/profile?page=1' }))
  })

  it('hook 改为写请求或使用外部认证头时不能隐式重放或缓存', async () => {
    const refresh = vi.fn(async () => {})
    const fetchMock = vi.fn(async () => createJsonResponse({}, { status: 401 }))
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: fetchMock,
      getToken: () => 'managed',
      onRequest(context) {
        context.url = '/gateway/write'
        context.init.method = 'POST'
        context.init.headers = { Authorization: 'Bearer external' }
      },
    })
    await expect(client.get('/read', { cache: { enabled: true } })).rejects.toMatchObject({ kind: 'session' })
    expect(refresh).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('认证刷新期间取消请求不会重放或触发会话失效回调', async () => {
    const controller = new AbortController()
    let rejectRefresh!: (error: Error) => void
    const refresh = vi.fn(() => new Promise<void>((_resolve, reject) => {
      rejectRefresh = reject
    }))
    const onSessionExpired = vi.fn()
    const fetchMock = vi.fn(async () => createJsonResponse({}, { status: 401 }))
    const client = createRequestClient({
      authRefresh: { refresh },
      fetch: fetchMock,
      getToken: () => 'old-session',
      onRequest(context) {
        context.url = '/gateway/profile'
        context.init.signal = controller.signal
      },
      onSessionExpired,
    })
    const pending = client.get('/profile').catch(error => error)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    controller.abort()
    rejectRefresh(new Error('session changed'))

    expect(await pending).toMatchObject({ kind: 'cancelled' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(onSessionExpired).not.toHaveBeenCalled()
  })

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
        keyword: 'Lumal',
        page: 1,
      },
    })

    const [url, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(String(url)).toBe('https://api.example.com/users?keyword=Lumal&page=1')
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
        name: 'Lumal',
      },
    })

    const [, init] = fetchMock.mock.calls[0] ?? []
    const headers = new Headers(init?.headers)

    expect(init?.method).toBe('POST')
    expect(headers.get('content-type')).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify({ name: 'Lumal' }))
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
        name: 'Lumal',
      },
    })
    const duplicateRequest = client.post('/projects', {
      body: {
        name: 'Lumal',
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

    await expect(client.post('/projects', { body: { name: 'Lumal' } })).rejects.toMatchObject({
      kind: 'session',
    })
    expect(refresh).not.toHaveBeenCalled()

    await expect(client.post('/projects', {
      body: { name: 'Lumal' },
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

  it('缓存按认证身份、租户作用域隔离，命中前仍执行请求钩子', async () => {
    let token = 'user-a'
    let tenant = 'tenant-a'
    const onRequest = vi.fn()
    const fetchMock = vi.fn(async () => createJsonResponse({ token, tenant }))
    const cache = createRequestCache()
    const client = createRequestClient({
      cache,
      fetch: fetchMock,
      getCacheScope: () => tenant,
      getToken: () => token,
      onRequest,
    })
    const options = { cache: { enabled: true } }
    await client.get('/profile', options)
    await client.get('/profile', options)
    token = 'user-b'
    await expect(client.get('/profile', options)).resolves.toEqual({ token, tenant })
    tenant = 'tenant-b'
    await expect(client.get('/profile', options)).resolves.toEqual({ token, tenant })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(onRequest).toHaveBeenCalledTimes(4)
  })

  it('非 GET 缓存必须显式给出区分请求体的 key', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) =>
      createJsonResponse(JSON.parse(init?.body as string)))
    const client = createRequestClient({ fetch: fetchMock })
    await client.post('/query', { body: { id: 1 }, cache: { enabled: true } })
    await expect(client.post('/query', { body: { id: 2 }, cache: { enabled: true } }))
      .resolves
      .toEqual({ id: 2 })
    await client.post('/query', { body: { id: 3 }, cache: { enabled: true, key: 'query:3' } })
    await client.post('/query', { body: { id: 3 }, cache: { enabled: true, key: 'query:3' } })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('清空后旧在途响应不能重新填充缓存，共用存储的客户端也互不污染', async () => {
    let resolve!: (response: Response) => void
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => new Promise<Response>((done) => { resolve = done }))
      .mockImplementation(async () => createJsonResponse({ value: 'new' }))
    const cache = createRequestCache()
    const client = createRequestClient({ cache, fetch: fetchMock })
    const options = { cache: { enabled: true } }
    const pending = client.get('/config', options)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    client.clearCache()
    resolve(createJsonResponse({ value: 'old' }))
    await pending
    await expect(client.get('/config', options)).resolves.toEqual({ value: 'new' })
    const second = createRequestClient({
      cache,
      fetch: async () => createJsonResponse({ value: 'another-client' }),
    })
    await expect(second.get('/config', options)).resolves.toEqual({ value: 'another-client' })
  })

  it('异步请求钩子期间清空缓存，也不会让旧请求写入新一代缓存', async () => {
    let resume!: () => void
    const fetchMock = vi.fn(async () => createJsonResponse({ value: fetchMock.mock.calls.length }))
    const onRequest = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resume = resolve }))
    const client = createRequestClient({ fetch: fetchMock, onRequest })
    const options = { cache: { enabled: true } }
    const pending = client.get('/config', options)
    await vi.waitFor(() => expect(onRequest).toHaveBeenCalledTimes(1))
    client.clearCache()
    resume()
    await pending
    await expect(client.get('/config', options)).resolves.toEqual({ value: 2 })
    await client.get('/config', options)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('会话重置后不等待旧刷新，旧 finally 不能清除新任务', async () => {
    let token = 'old'
    const oldController = new AbortController()
    const refreshes: Array<() => void> = []
    const refresh = vi.fn(() => new Promise<void>((resolve) => {
      refreshes.push(resolve)
    }))
    const client = createRequestClient({
      getToken: () => token,
      authRefresh: { refresh },
      fetch: async (_url, init) => new Headers(init?.headers).get('Authorization') === 'Bearer valid'
        ? createJsonResponse({ ok: true })
        : new Response('', { status: 401 }),
    })
    const old = client.get('/old', { signal: oldController.signal }).catch(error => error)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    oldController.abort()
    client.clearCache()
    token = 'new'
    const first = client.get('/first')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
    refreshes[0]!()
    await old
    const second = client.get('/second')
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(refresh).toHaveBeenCalledTimes(2)
    token = 'valid'
    refreshes[1]!()
    await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }])
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

  it.each(['reset', 'scope', 'token'] as const)('%s 切换后迟到401不清除新会话，不依赖调用方Abort', async (change) => {
    let token = 'account-a'
    let scope = 'session-a'
    let respond!: (response: Response) => void
    const expired = vi.fn()
    const responseError = vi.fn()
    const fetch = vi.fn(() => new Promise<Response>((resolve) => {
      respond = resolve
    }))
    const client = createRequestClient({ fetch, getToken: () => token, getCacheScope: () => scope, onSessionExpired: expired, onResponseError: responseError })
    const old = client.get('/private').catch(error => error)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    if (change === 'reset')
      client.clearCache()
    if (change === 'scope')
      scope = 'session-b'
    token = 'account-b'
    respond(createJsonResponse({}, { status: 401 }))
    expect(await old).toMatchObject({ code: 'STALE_SESSION', kind: 'cancelled' })
    expect(expired).not.toHaveBeenCalled()
    expect(responseError).not.toHaveBeenCalled()
    expect(token).toBe('account-b')
  })

  it.each(['reset', 'scope', 'token'] as const)('%s 切换后新会话仍独立通知失效，同一会话只通知一次', async (change) => {
    let token = 'account-a'
    let scope = 'session-a'
    const expired = vi.fn()
    const client = createRequestClient({
      fetch: async () => createJsonResponse({}, { status: 401 }),
      getToken: () => token,
      getCacheScope: () => scope,
      onSessionExpired: expired,
    })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    expect(expired).toHaveBeenCalledTimes(1)
    if (change === 'reset')
      client.clearCache()
    if (change === 'scope')
      scope = 'session-b'
    if (change === 'token')
      token = 'account-b'
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    expect(expired).toHaveBeenCalledTimes(2)
  })

  it('旧会话迟到401不占用或重置新会话的失效通知', async () => {
    let scope = 'session-a'
    let respond!: (response: Response) => void
    const expired = vi.fn()
    const responseError = vi.fn()
    const client = createRequestClient({
      fetch: async url => String(url) === '/late'
        ? new Promise<Response>((resolve) => { respond = resolve })
        : createJsonResponse({}, { status: 401 }),
      getToken: () => scope,
      getCacheScope: () => scope,
      onSessionExpired: expired,
      onResponseError: responseError,
    })
    const old = client.get('/late').catch(error => error)
    await vi.waitFor(() => expect(respond).toBeDefined())
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    scope = 'session-b'
    respond(createJsonResponse({}, { status: 401 }))
    expect(await old).toMatchObject({ code: 'STALE_SESSION', kind: 'cancelled' })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    expect(expired).toHaveBeenCalledTimes(2)
    expect(responseError).toHaveBeenCalledTimes(3)
  })

  it('旧凭据迟到成功不会重新开启新凭据的重复失效通知', async () => {
    let token = 'account-a'
    let respond!: (response: Response) => void
    const expired = vi.fn()
    const client = createRequestClient({
      fetch: async url => String(url) === '/late'
        ? new Promise<Response>((resolve) => { respond = resolve })
        : createJsonResponse({}, { status: 401 }),
      getToken: () => token,
      onSessionExpired: expired,
    })
    const old = client.get('/late')
    await vi.waitFor(() => expect(respond).toBeDefined())
    token = 'account-b'
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    respond(createJsonResponse({ ok: true }))
    await expect(old).resolves.toEqual({ ok: true })
    await expect(client.get('/private')).rejects.toMatchObject({ kind: 'session' })
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it.each([true, false])('authRefresh下不可重放的写请求区分凭据切换与当前会话失效（切换=%s）', async (switched) => {
    let token = 'account-a'
    let respond!: (response: Response) => void
    const expired = vi.fn()
    const responseError = vi.fn()
    const refresh = vi.fn(async () => {})
    const client = createRequestClient({
      fetch: () => new Promise<Response>((resolve) => { respond = resolve }),
      getToken: () => token,
      authRefresh: { refresh },
      onSessionExpired: expired,
      onResponseError: responseError,
    })
    const pending = client.post('/private', { body: { value: 'draft' } }).catch(error => error)
    await vi.waitFor(() => expect(respond).toBeDefined())
    if (switched)
      token = 'account-b'
    respond(createJsonResponse({}, { status: 401 }))
    expect(await pending).toMatchObject(switched
      ? { code: 'STALE_SESSION', kind: 'cancelled' }
      : { kind: 'session', status: 401 })
    expect(refresh).not.toHaveBeenCalled()
    expect(expired).toHaveBeenCalledTimes(switched ? 0 : 1)
    expect(responseError).toHaveBeenCalledTimes(switched ? 0 : 1)
    expect(token).toBe(switched ? 'account-b' : 'account-a')
  })

  it('旧刷新失败不能清除新会话或与新请求共享刷新', async () => {
    let scope = 'session-a'
    let rejectRefresh!: (error: Error) => void
    const expired = vi.fn()
    const refresh = vi.fn(() => new Promise<void>((_resolve, reject) => {
      rejectRefresh = reject
    }))
    const client = createRequestClient({
      fetch: async () => createJsonResponse({}, { status: 401 }),
      getToken: () => 'same-token-value',
      getCacheScope: () => scope,
      authRefresh: { refresh },
      onSessionExpired: expired,
    })
    const old = client.get('/private').catch(error => error)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce())
    scope = 'session-b'
    client.clearCache()
    rejectRefresh(new Error('old refresh failed'))
    expect(await old).toMatchObject({ code: 'STALE_SESSION', kind: 'cancelled' })
    expect(expired).not.toHaveBeenCalled()
  })
  it('只切换scope也会隔离新旧刷新，不要求额外创建客户端', async () => {
    let scope = 'a'
    let valid = false
    const pending: Array<() => void> = []
    const refresh = vi.fn(() => new Promise<void>((resolve) => {
      pending.push(resolve)
    }))
    const client = createRequestClient({
      fetch: async () => valid ? createJsonResponse({ ok: true }) : createJsonResponse({}, { status: 401 }),
      getCacheScope: () => scope,
      getToken: () => 'token',
      authRefresh: { refresh },
    })
    const old = client.get('/old').catch(error => error)
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
    scope = 'b'
    const current = client.get('/current')
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2))
    pending[0]!()
    expect(await old).toMatchObject({ code: 'STALE_SESSION', kind: 'cancelled' })
    valid = true
    pending[1]!()
    await expect(current).resolves.toEqual({ ok: true })
  })

  it('二进制请求体不被误编码为JSON', async () => {
    const fetch = vi.fn(async () => createJsonResponse({ ok: true }))
    const client = createRequestClient({ fetch })
    const body = new Uint8Array([1, 2, 3])
    await client.post('/binary', { body })
    expect(fetch.mock.calls[0]?.[1]?.body).toBe(body)
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
    const fetchMock = vi.fn(async () => createJsonResponse({ code: 0, data: { name: 'Lumal' } }))
    const client = createRequestClient({
      fetch: fetchMock,
      onResponse: createStandardResponseParser(),
    })

    await expect(client.get('/profile')).resolves.toEqual({ name: 'Lumal' })
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
