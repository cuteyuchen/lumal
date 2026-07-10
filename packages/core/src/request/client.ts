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

  const requestUrl = new URL(url, isAbsoluteUrl(url) ? undefined : 'http://luma.local')

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

async function applyToken(headers: Headers, options: RequestClientOptions): Promise<void> {
  if (headers.has('Authorization') || !options.getToken) {
    return
  }

  const token = await options.getToken()

  if (token) {
    headers.set('Authorization', `${options.tokenPrefix ?? 'Bearer'} ${token}`)
  }
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
  return `luma-${requestIdSeed.toString(36)}-${requestIdSeed}`
}

/***********************客户端创建*********************/
export function createRequestClient(clientOptions: RequestClientOptions = {}): RequestClient {
  const fetcher = clientOptions.fetch ?? globalThis.fetch
  const pendingKeys = new Set<string>()
  const defaultCache: RequestCache = clientOptions.cache ?? createRequestCache()

  async function request<TResult = unknown>(url: string, options: RequestOptions = {}): Promise<TResult> {
    const method = options.method ?? 'GET'
    const resolvedUrl = appendQuery(joinBaseURL(clientOptions.baseURL, url), options.query)
    const headers = new Headers(options.headers)

    await applyToken(headers, clientOptions)

    const requestId = resolveRequestId(clientOptions)
    if (requestId) {
      headers.set(clientOptions.requestIdHeader ?? 'X-Request-Id', requestId)
    }

    const init: RequestInit = {
      headers,
      method,
      signal: options.signal,
    }
    init.body = resolveBody(method, options.body, headers)

    // 缓存命中优先返回（仅在逐请求显式启用时生效）
    const cacheConfig = options.cache
    const cacheEnabled = cacheConfig?.enabled === true
    const cache = cacheConfig?.cache ?? defaultCache
    const cacheKey = cacheConfig?.key ?? `${method}:${resolvedUrl}`

    if (cacheEnabled && cache.has(cacheKey)) {
      return cache.get(cacheKey) as TResult
    }

    const duplicateKey = `${method}:${resolvedUrl}:${typeof init.body === 'string' ? init.body : ''}`

    if (clientOptions.duplicateSubmit && pendingKeys.has(duplicateKey)) {
      throw new RequestError('Duplicate request', {
        code: 'DUPLICATE_REQUEST',
      })
    }

    pendingKeys.add(duplicateKey)

    await clientOptions.onRequest?.({ init, requestId, url: resolvedUrl })

    try {
      let response: Response

      try {
        response = await fetcher(resolvedUrl, init)
      }
      catch (error) {
        // 网络层错误：区别于响应错误，走 onRequestError
        await clientOptions.onRequestError?.({ error, init, requestId, url: resolvedUrl })
        throw error
      }

      const data = await readResponseData(response)
      const context: RequestContext = {
        data,
        init,
        requestId,
        response,
        url: resolvedUrl,
      }

      if (response.status === 401) {
        await clientOptions.onSessionExpired?.(context)
      }

      if (!response.ok) {
        const responseError = new RequestError(response.statusText || `HTTP ${response.status}`, {
          data,
          response,
          status: response.status,
        })

        await clientOptions.onResponseError?.({
          error: responseError,
          init,
          requestId,
          response,
          url: resolvedUrl,
        })

        throw responseError
      }

      const result = clientOptions.onResponse
        ? await clientOptions.onResponse<TResult>(context)
        : (data as TResult)

      if (cacheEnabled) {
        cache.set(cacheKey, result)
      }

      return result
    }
    finally {
      pendingKeys.delete(duplicateKey)
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
