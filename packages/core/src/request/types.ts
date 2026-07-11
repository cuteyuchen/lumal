export type RequestMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export type RequestQueryValue = boolean | number | string | null | undefined

export type RequestQuery = Record<string, RequestQueryValue | RequestQueryValue[]>

/***********************请求上下文*********************/
export interface RequestContext<TData = unknown> {
  /** 当前发送次数，首次为 0，认证刷新后的重放为 1。 */
  attempt: number
  data: TData
  init: RequestInit
  response: Response
  url: string
  /** 本次请求的唯一标识，用于日志追踪与缓存 key。 */
  requestId?: string
}

/**
 * 请求发起前的上下文：可在此改写 url、init 或读取 requestId。
 */
export interface RequestBeforeContext {
  url: string
  init: RequestInit
  requestId?: string
}

/**
 * 请求错误上下文：网络错误或响应非 2xx 时携带。
 */
export interface RequestErrorContext {
  error: unknown
  url: string
  init: RequestInit
  requestId?: string
  response?: Response
}

/***********************缓存*********************/
export interface RequestCache {
  get: (key: string) => unknown
  set: (key: string, value: unknown) => void
  has: (key: string) => boolean
  delete: (key: string) => void
  clear: () => void
}

export interface RequestCacheOptions {
  /** 缓存存储，默认内存 Map 实现。 */
  cache?: RequestCache
  /** 是否对该请求启用缓存，默认仅 GET 且显式开启。 */
  enabled?: boolean
  /** 自定义缓存 key，默认 `method:url`。 */
  key?: string
}

/***********************客户端选项*********************/
export interface RequestClientOptions<TData = unknown> {
  /** 认证刷新配置；仅会对允许重放的请求执行一次。 */
  authRefresh?: RequestAuthRefreshOptions<TData>
  baseURL?: string
  duplicateSubmit?: boolean
  fetch?: typeof fetch
  getToken?: () => Promise<string | undefined> | string | undefined
  tokenPrefix?: string
  /** 是否为每个请求生成 requestId，或传入自定义生成函数。 */
  requestId?: boolean | (() => string)
  /** 请求头中携带 requestId 的字段名，默认 `X-Request-Id`。 */
  requestIdHeader?: string
  /** 默认缓存存储，供开启缓存的请求复用。 */
  cache?: RequestCache
  onRequest?: (context: RequestBeforeContext) => Promise<void> | void
  onRequestError?: (context: RequestErrorContext) => Promise<void> | void
  onResponse?: <TResult = unknown>(context: RequestContext<TData>) => Promise<TResult> | TResult
  onResponseError?: (context: RequestErrorContext) => Promise<void> | void
  onSessionExpired?: (context: RequestContext<TData>) => Promise<void> | void
}

/***********************请求选项*********************/
export interface RequestOptions {
  body?: BodyInit | Record<string, unknown> | unknown[] | null
  headers?: HeadersInit
  method?: RequestMethod
  query?: RequestQuery
  /** 写请求是否允许在认证刷新成功后重放，默认 false；GET 默认允许。 */
  retryOnAuthRefresh?: boolean
  signal?: AbortSignal
  /** 逐请求缓存配置。 */
  cache?: RequestCacheOptions
}

export interface RequestAuthRefreshOptions<TData = unknown> {
  /** 刷新访问凭据。并发过期请求共享同一个 Promise。 */
  refresh: (context: RequestContext<TData>) => Promise<void>
}

export interface RequestUploadOptions extends Omit<RequestOptions, 'body' | 'method'> {
  /** 除文件外的附加字段。 */
  data?: Record<string, RequestQueryValue>
  /** 文件字段名，默认 `file`。 */
  fileField?: string
}

export interface RequestClient {
  delete: <TResult = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) => Promise<TResult>
  get: <TResult = unknown>(url: string, options?: Omit<RequestOptions, 'body' | 'method'>) => Promise<TResult>
  patch: <TResult = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) => Promise<TResult>
  post: <TResult = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) => Promise<TResult>
  put: <TResult = unknown>(url: string, options?: Omit<RequestOptions, 'method'>) => Promise<TResult>
  request: <TResult = unknown>(url: string, options?: RequestOptions) => Promise<TResult>
  /** 上传文件（multipart/form-data），单文件或多文件。 */
  upload: <TResult = unknown>(url: string, file: Blob | Blob[], options?: RequestUploadOptions) => Promise<TResult>
}
