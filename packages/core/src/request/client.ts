import type {
  RequestBeforeContext,
  RequestCache,
  RequestClient,
  RequestClientOptions,
  RequestContext,
  RequestMethod,
  RequestOptions,
  RequestQuery,
  RequestUploadOptions,
} from './types'
import { createRequestCache } from './cache'
import { RequestError } from './error'

/***********************URL 处理*********************/
function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function joinBaseURL(baseURL: string | undefined, url: string): string {
  if (!baseURL || isAbsoluteUrl(url)) {
    return url
  }

  return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

function appendQuery(url: string, query: RequestQuery | undefined): string {
  if (!query) {
    return url
  }

  const requestUrl = new URL(url, isAbsoluteUrl(url) ? undefined : 'http://lumal.local')

  Object.entries(query).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value]

    values.forEach((item) => {
      if (item !== undefined && item !== null) {
        requestUrl.searchParams.append(key, String(item))
      }
    })
  })

  if (isAbsoluteUrl(url)) {
    return requestUrl.toString()
  }

  return `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`
}

/***********************请求体处理*********************/
function isPlainJsonBody(body: unknown): body is Record<string, unknown> | unknown[] {
  if (body === null || body === undefined) {
    return false
  }

  if (Array.isArray(body)) {
    return true
  }

  if (typeof body !== 'object') {
    return false
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return false
  }

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return false
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return false
  }

  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
    return false
  }
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body)) {
    return false
  }

  return true
}

function resolveBody(method: RequestMethod, body: RequestOptions['body'], headers: Headers): BodyInit | null | undefined {
  if (method === 'GET' || body === undefined) {
    return undefined
  }

  if (isPlainJsonBody(body)) {
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }

    return JSON.stringify(body)
  }

  return body as BodyInit | null
}

/***********************响应处理*********************/
async function readResponseData(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function applyToken(headers: Headers, options: RequestClientOptions): Promise<string | undefined> {
  if (headers.has('Authorization') || !options.getToken) {
    return undefined
  }

  const token = await options.getToken()

  if (token) {
    headers.set('Authorization', `${options.tokenPrefix ?? 'Bearer'} ${token}`)
  }

  return token
}

function isReplayableBody(body: RequestOptions['body']): boolean {
  return typeof ReadableStream === 'undefined' || !(body instanceof ReadableStream)
}

function canReplayAfterAuthRefresh(method: string, options: RequestOptions, init: RequestInit): boolean {
  return !new Headers(options.headers).has('Authorization')
    && (method === 'GET' || options.retryOnAuthRefresh === true)
    && isReplayableBody(init.body)
}

function normalizeFetchError(error: unknown, signal?: AbortSignal): RequestError {
  if (error instanceof RequestError) {
    return error
  }

  const cancelled = signal?.aborted === true
    || (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError')

  return new RequestError(cancelled ? '请求已取消' : '网络连接失败', {
    kind: cancelled ? 'cancelled' : 'network',
    originalError: error,
  })
}

/***********************请求标识*********************/
let requestIdSeed = 0
let clientIdSeed = 0

function resolveRequestId(options: RequestClientOptions): string | undefined {
  if (!options.requestId) {
    return undefined
  }

  if (typeof options.requestId === 'function') {
    return options.requestId()
  }

  requestIdSeed += 1
  return `lumal-${requestIdSeed.toString(36)}-${requestIdSeed}`
}

/***********************客户端创建*********************/
export function createRequestClient(clientOptions: RequestClientOptions = {}): RequestClient {
  const fetcher = clientOptions.fetch ?? globalThis.fetch
  const pendingKeys = new Set<string>()
  const defaultCache: RequestCache = clientOptions.cache ?? createRequestCache()
  const cacheNamespace = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${++clientIdSeed}`
  const cachedKeys = new Map<RequestCache, Set<string>>()
  let cacheGeneration = 0
  let cacheResetVersion = 0
  let cacheIdentity: string | undefined
  let refreshPromise: Promise<void> | undefined
  let refreshScope: string | undefined
  let refreshResetVersion = -1
  let sessionExpiredNotified = false

  function clearCache(): void {
    cacheResetVersion += 1
    // 新会话不能等待旧会话的刷新；旧 Promise 完成时也不能清除新刷新任务。
    refreshPromise = undefined
    invalidateCache()
  }

  function invalidateCache(): void {
    cacheGeneration += 1
    cachedKeys.forEach((keys, cache) => keys.forEach(key => cache.delete(key)))
    cachedKeys.clear()
  }

  async function request<TResult = unknown>(url: string, options: RequestOptions = {}): Promise<TResult> {
    const resetVersion = cacheResetVersion
    const sessionScope = clientOptions.getCacheScope?.()
    const method = options.method ?? 'GET'
    const resolvedUrl = appendQuery(joinBaseURL(clientOptions.baseURL, url), options.query)
    const requestId = resolveRequestId(clientOptions)

    const cacheConfig = options.cache
    const cache = cacheConfig?.cache ?? defaultCache
    // 重放期间保留已占用的目标；本次请求可以重入自己的锁，其他请求不能。
    const ownedDuplicateKeys = new Set<string>()

    try {
      return await executeRequest<TResult>(0)
    }
    finally {
      ownedDuplicateKeys.forEach(key => pendingKeys.delete(key))
    }

    async function executeRequest<TValue>(attempt: number): Promise<TValue> {
      const headers = new Headers(options.headers)
      const usedToken = await applyToken(headers, clientOptions)

      if (requestId) {
        headers.set(clientOptions.requestIdHeader ?? 'X-Request-Id', requestId)
      }

      const before: RequestBeforeContext = {
        init: {
          body: resolveBody(method, options.body, headers),
          headers,
          method,
          signal: options.signal,
        },
        requestId,
        url: resolvedUrl,
      }

      // 每次重放从原始已解析 URL 开始，hook 完成后的上下文是唯一发送依据。
      await clientOptions.onRequest?.(before)
      const { init, url: finalUrl } = before
      const finalMethod = (init.method ?? 'GET').toUpperCase()
      const cacheEnabled = cacheConfig?.enabled === true
        && (finalMethod === 'GET' || Boolean(cacheConfig.key))

      // 认证信息只留在内存用于识别变更，绝不写入可持久化的缓存 key。
      const identity = JSON.stringify([
        new Headers(init.headers).get('Authorization'),
        clientOptions.getCacheScope?.(),
      ])
      if (identity !== cacheIdentity) {
        invalidateCache()
        cacheIdentity = identity
      }
      const generation = cacheGeneration
      const cacheKey = JSON.stringify([
        cacheNamespace,
        generation,
        cacheConfig?.scope,
        finalMethod,
        finalUrl,
        cacheConfig?.key,
      ])
      if (init.signal?.aborted) {
        throw normalizeFetchError(init.signal.reason, init.signal)
      }
      if (cacheEnabled && resetVersion === cacheResetVersion && cache.has(cacheKey)) {
        return cache.get(cacheKey) as TValue
      }

      if (clientOptions.duplicateSubmit) {
        const duplicateKey = JSON.stringify([
          identity,
          cacheConfig?.scope,
          finalMethod,
          finalUrl,
          typeof init.body === 'string' ? init.body : '',
        ])
        if (pendingKeys.has(duplicateKey) && !ownedDuplicateKeys.has(duplicateKey)) {
          throw new RequestError('Duplicate request', {
            code: 'DUPLICATE_REQUEST',
            kind: 'duplicate',
          })
        }
        pendingKeys.add(duplicateKey)
        ownedDuplicateKeys.add(duplicateKey)
      }

      let response: Response

      try {
        response = await fetcher(finalUrl, init)
      }
      catch (error) {
        const requestError = normalizeFetchError(error, init.signal ?? undefined)
        await clientOptions.onRequestError?.({ error: requestError, init, requestId, url: finalUrl })
        throw requestError
      }

      let data: unknown
      try {
        data = await readResponseData(response)
      }
      catch (error) {
        const requestError = new RequestError('响应数据解析失败', {
          kind: 'http',
          originalError: error,
          response,
          status: response.status,
        })
        await notifyResponseError(requestError, init, response, finalUrl)
        throw requestError
      }

      const context: RequestContext = {
        attempt,
        data,
        init,
        requestId,
        response,
        url: finalUrl,
      }

      if (response.status === 401) {
        return handleSessionError(new RequestError(response.statusText || '会话已过期', {
          data,
          kind: 'session',
          response,
          status: response.status,
        }), context, usedToken, attempt)
      }

      if (!response.ok) {
        const responseError = new RequestError(response.statusText || `HTTP ${response.status}`, {
          data,
          kind: 'http',
          response,
          status: response.status,
        })
        await notifyResponseError(responseError, init, response, finalUrl)
        throw responseError
      }

      try {
        const result = clientOptions.onResponse
          ? await clientOptions.onResponse<TValue>(context)
          : (data as TValue)

        if (resetVersion === cacheResetVersion && sessionScope === clientOptions.getCacheScope?.())
          sessionExpiredNotified = false
        if (cacheEnabled && generation === cacheGeneration && resetVersion === cacheResetVersion
          && sessionScope === clientOptions.getCacheScope?.()) {
          cache.set(cacheKey, result)
          const keys = cachedKeys.get(cache) ?? new Set<string>()
          keys.add(cacheKey)
          cachedKeys.set(cache, keys)
        }

        return result
      }
      catch (error) {
        if (init.signal?.aborted)
          throw normalizeFetchError(error, init.signal)
        if (error instanceof RequestError && error.kind === 'session') {
          return handleSessionError(error, context, usedToken, attempt)
        }

        const responseError = error instanceof RequestError
          ? error
          : new RequestError(error instanceof Error ? error.message : '业务响应处理失败', {
              data,
              kind: 'business',
              originalError: error,
              response,
              status: response.status,
            })
        await notifyResponseError(responseError, init, response, finalUrl)
        throw responseError
      }
    }

    async function handleSessionError<TValue>(
      error: RequestError,
      context: RequestContext,
      usedToken: string | undefined,
      attempt: number,
    ): Promise<TValue> {
      // 会话切换可能发生在响应解析或刷新期间，旧请求不能再影响新身份。
      const signal = context.init.signal
      if (signal?.aborted)
        throw normalizeFetchError(signal.reason, signal)
      function assertCurrentSession() {
        if (resetVersion !== cacheResetVersion || sessionScope !== clientOptions.getCacheScope?.()) {
          throw new RequestError('会话已切换，忽略旧请求', {
            code: 'STALE_SESSION',
            kind: 'cancelled',
            originalError: error,
          })
        }
      }
      assertCurrentSession()
      const currentToken = await clientOptions.getToken?.()
      assertCurrentSession()
      // 无刷新机制时，迟到的旧 Token 401 也不能清除已经替换的新凭据。
      if (!clientOptions.authRefresh && usedToken !== undefined && currentToken !== usedToken) {
        throw new RequestError('访问凭据已变更，忽略旧请求', { code: 'STALE_SESSION', kind: 'cancelled', originalError: error })
      }
      const managedAuthorization = usedToken ? `${clientOptions.tokenPrefix ?? 'Bearer'} ${usedToken}` : null
      const replayAllowed = attempt === 0
        && canReplayAfterAuthRefresh((context.init.method ?? 'GET').toUpperCase(), options, context.init)
        // hook 注入外部身份时不使用客户端凭据重放，避免越权或覆盖外部认证。
        && new Headers(context.init.headers).get('Authorization') === managedAuthorization
        && Boolean(clientOptions.authRefresh)

      if (replayAllowed) {
        if (usedToken && currentToken && currentToken !== usedToken) {
          return executeRequest<TValue>(attempt + 1)
        }

        try {
          if (!refreshPromise || refreshScope !== sessionScope || refreshResetVersion !== resetVersion) {
            const pending = clientOptions.authRefresh!.refresh(context).finally(() => {
              if (refreshPromise === pending)
                refreshPromise = undefined
            })
            refreshScope = sessionScope
            refreshResetVersion = resetVersion
            refreshPromise = pending
          }

          await refreshPromise
          assertCurrentSession()
          if (signal?.aborted)
            throw normalizeFetchError(signal.reason, signal)
          sessionExpiredNotified = false
          return executeRequest<TValue>(attempt + 1)
        }
        catch (refreshError) {
          assertCurrentSession()
          if (signal?.aborted)
            throw normalizeFetchError(refreshError, signal)
          error = new RequestError(error.message, {
            code: error.code,
            data: error.data,
            kind: 'session',
            originalError: refreshError,
            response: error.response,
            status: error.status,
          })
        }
      }

      assertCurrentSession()
      if (!sessionExpiredNotified) {
        sessionExpiredNotified = true
        invalidateCache()
        await clientOptions.onSessionExpired?.(context)
      }

      await notifyResponseError(error, context.init, context.response, context.url)
      throw error
    }

    async function notifyResponseError(error: RequestError, init: RequestInit, response: Response, url: string): Promise<void> {
      await clientOptions.onResponseError?.({
        error,
        init,
        requestId,
        response,
        url,
      })
    }
  }

  /***********************文件上传*********************/
  function upload<TResult = unknown>(
    url: string,
    file: Blob | Blob[],
    options: RequestUploadOptions = {},
  ): Promise<TResult> {
    const { data, fileField = 'file', ...restOptions } = options
    const formData = new FormData()
    const files = Array.isArray(file) ? file : [file]

    files.forEach((item) => {
      formData.append(fileField, item)
    })

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
    }

    return request<TResult>(url, {
      ...restOptions,
      body: formData,
      method: 'POST',
    })
  }

  return {
    clearCache,
    delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
    get: (url, options) => request(url, { ...options, method: 'GET' }),
    patch: (url, options) => request(url, { ...options, method: 'PATCH' }),
    post: (url, options) => request(url, { ...options, method: 'POST' }),
    put: (url, options) => request(url, { ...options, method: 'PUT' }),
    request,
    upload,
  }
}
