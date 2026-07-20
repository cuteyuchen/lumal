import type {
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

function canReplayAfterAuthRefresh(method: RequestMethod, options: RequestOptions): boolean {
  return !new Headers(options.headers).has('Authorization')
    && (method === 'GET' || options.retryOnAuthRefresh === true)
    && isReplayableBody(options.body)
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
  let refreshPromise: Promise<void> | undefined
  let sessionExpiredNotified = false

  async function request<TResult = unknown>(url: string, options: RequestOptions = {}): Promise<TResult> {
    const method = options.method ?? 'GET'
    const resolvedUrl = appendQuery(joinBaseURL(clientOptions.baseURL, url), options.query)
    const requestId = resolveRequestId(clientOptions)

    // 缓存命中优先返回（仅在逐请求显式启用时生效）
    const cacheConfig = options.cache
    const cacheEnabled = cacheConfig?.enabled === true
    const cache = cacheConfig?.cache ?? defaultCache
    const cacheKey = cacheConfig?.key ?? `${method}:${resolvedUrl}`

    if (cacheEnabled && cache.has(cacheKey)) {
      return cache.get(cacheKey) as TResult
    }

    let duplicateKey: string | undefined
    if (clientOptions.duplicateSubmit) {
      const duplicateHeaders = new Headers(options.headers)
      const duplicateBody = resolveBody(method, options.body, duplicateHeaders)
      duplicateKey = `${method}:${resolvedUrl}:${typeof duplicateBody === 'string' ? duplicateBody : ''}`

      if (pendingKeys.has(duplicateKey)) {
        throw new RequestError('Duplicate request', {
          code: 'DUPLICATE_REQUEST',
          kind: 'duplicate',
        })
      }

      pendingKeys.add(duplicateKey)
    }

    try {
      return await executeRequest<TResult>(0)
    }
    finally {
      if (duplicateKey) {
        pendingKeys.delete(duplicateKey)
      }
    }

    async function executeRequest<TValue>(attempt: number): Promise<TValue> {
      const headers = new Headers(options.headers)
      const usedToken = await applyToken(headers, clientOptions)

      if (requestId) {
        headers.set(clientOptions.requestIdHeader ?? 'X-Request-Id', requestId)
      }

      const init: RequestInit = {
        body: resolveBody(method, options.body, headers),
        headers,
        method,
        signal: options.signal,
      }

      await clientOptions.onRequest?.({ init, requestId, url: resolvedUrl })

      let response: Response

      try {
        response = await fetcher(resolvedUrl, init)
      }
      catch (error) {
        const requestError = normalizeFetchError(error, options.signal)
        await clientOptions.onRequestError?.({ error: requestError, init, requestId, url: resolvedUrl })
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
        await notifyResponseError(requestError, init, response)
        throw requestError
      }

      const context: RequestContext = {
        attempt,
        data,
        init,
        requestId,
        response,
        url: resolvedUrl,
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
        await notifyResponseError(responseError, init, response)
        throw responseError
      }

      try {
        const result = clientOptions.onResponse
          ? await clientOptions.onResponse<TValue>(context)
          : (data as TValue)

        sessionExpiredNotified = false
        if (cacheEnabled) {
          cache.set(cacheKey, result)
        }

        return result
      }
      catch (error) {
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
        await notifyResponseError(responseError, init, response)
        throw responseError
      }
    }

    async function handleSessionError<TValue>(
      error: RequestError,
      context: RequestContext,
      usedToken: string | undefined,
      attempt: number,
    ): Promise<TValue> {
      const replayAllowed = attempt === 0
        && canReplayAfterAuthRefresh(method, options)
        && Boolean(clientOptions.authRefresh)

      if (replayAllowed) {
        const currentToken = await clientOptions.getToken?.()

        if (usedToken && currentToken && currentToken !== usedToken) {
          return executeRequest<TValue>(attempt + 1)
        }

        try {
          if (!refreshPromise) {
            refreshPromise = clientOptions.authRefresh!.refresh(context).finally(() => {
              refreshPromise = undefined
            })
          }

          await refreshPromise
          sessionExpiredNotified = false
          return executeRequest<TValue>(attempt + 1)
        }
        catch (refreshError) {
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

      if (!sessionExpiredNotified) {
        sessionExpiredNotified = true
        await clientOptions.onSessionExpired?.(context)
      }

      await notifyResponseError(error, context.init, context.response)
      throw error
    }

    async function notifyResponseError(error: RequestError, init: RequestInit, response: Response): Promise<void> {
      await clientOptions.onResponseError?.({
        error,
        init,
        requestId,
        response,
        url: resolvedUrl,
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
    delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
    get: (url, options) => request(url, { ...options, method: 'GET' }),
    patch: (url, options) => request(url, { ...options, method: 'PATCH' }),
    post: (url, options) => request(url, { ...options, method: 'POST' }),
    put: (url, options) => request(url, { ...options, method: 'PUT' }),
    request,
    upload,
  }
}
