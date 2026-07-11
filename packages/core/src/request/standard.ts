import { RequestError } from './error'

/***********************标准响应解析*********************/
/**
 * 常见后端统一响应包装（可通过 fieldNames 适配非标准字段）。
 */
export interface ApiEnvelope<TData = unknown> {
  code?: unknown
  data?: TData
  message?: unknown
  [key: string]: unknown
}

export type StandardResponse<TData = unknown> = ApiEnvelope<TData>

export interface StandardResponseFieldNames {
  /** 业务状态码字段名，默认 `code`。 */
  code?: string
  /** 业务数据字段名，默认 `data`。 */
  data?: string
  /** 提示消息字段名，默认 `message`。 */
  message?: string
}

export interface ParseStandardResponseOptions<TData = unknown, TResult = TData> {
  /** 非标准字段映射。 */
  fieldNames?: StandardResponseFieldNames
  /** 判定成功的状态码集合，默认 `[0, 200]`。 */
  successCodes?: unknown[]
  /** 解析失败时抛出的错误工厂，默认抛出 Error(message)。 */
  onError?: (message: string, response: StandardResponse) => never
  /** 会话失效业务码；命中时抛出 kind=session 的 RequestError。 */
  sessionExpiredCodes?: unknown[]
  /** 对取出的业务数据做最终类型归一。 */
  transform?: (data: TData, response: StandardResponse<TData>) => TResult
}

/**
 * 从标准响应包装中取出业务数据，状态码不在成功集合时抛错。
 * 该 helper 需显式启用，未启用时 request client 返回原始响应数据，
 * 以便适配非标准后端。
 */
export function parseStandardResponse<TData = unknown, TResult = TData>(
  response: StandardResponse<TData>,
  options: ParseStandardResponseOptions<TData, TResult> = {},
): TResult {
  const codeField = options.fieldNames?.code ?? 'code'
  const dataField = options.fieldNames?.data ?? 'data'
  const messageField = options.fieldNames?.message ?? 'message'
  const successCodes = options.successCodes ?? [0, 200]
  const sessionExpiredCodes = options.sessionExpiredCodes ?? []

  const code = response[codeField]

  // 未携带状态码字段视为非标准包装，直接返回原始响应
  if (code === undefined) {
    return response as TResult
  }

  if (!successCodes.includes(code)) {
    const message = String(response[messageField] ?? '请求失败')

    if (options.onError) {
      return options.onError(message, response)
    }

    throw new RequestError(message, {
      code: typeof code === 'number' || typeof code === 'string' ? code : undefined,
      data: response,
      kind: sessionExpiredCodes.includes(code) ? 'session' : 'business',
    })
  }

  const data = response[dataField] as TData
  return options.transform ? options.transform(data, response) : data as unknown as TResult
}

/**
 * 生成可直接用作 onResponse 的标准响应解析器。
 */
export function createStandardResponseParser<TData = unknown, TResult = TData>(
  options: ParseStandardResponseOptions<TData, TResult> = {},
) {
  return <TValue = TResult>(context: { data: unknown }): TValue =>
    parseStandardResponse(context.data as StandardResponse<TData>, options) as unknown as TValue
}

/***********************标准分页解析*********************/
export interface PageResult<TItem = unknown> {
  items: TItem[]
  total: number
}

export interface PageResultFieldNames {
  items?: string
  total?: string
}

export interface ParsePageResultOptions<TItem = unknown> {
  fieldNames?: PageResultFieldNames
  /** 处理多层嵌套或异常列表位置。 */
  parseResponse?: (response: unknown) => unknown
  /** 逐项修正数字字符串、布尔字符串等类型漂移。 */
  transform?: (item: unknown, index: number) => TItem
}

export function parsePageResult<TItem = unknown>(
  response: unknown,
  options: ParsePageResultOptions<TItem> = {},
): PageResult<TItem> {
  const source = options.parseResponse ? options.parseResponse(response) : response

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new RequestError('分页响应格式不正确', { data: response, kind: 'business' })
  }

  const record = source as Record<string, unknown>
  const items = record[options.fieldNames?.items ?? 'items']
  const totalValue = record[options.fieldNames?.total ?? 'total']
  const total = typeof totalValue === 'number' ? totalValue : Number(totalValue)

  if (!Array.isArray(items) || !Number.isFinite(total)) {
    throw new RequestError('分页响应缺少有效的 items 或 total', { data: response, kind: 'business' })
  }

  return {
    items: options.transform ? items.map(options.transform) : items as TItem[],
    total,
  }
}
