/***********************标准响应解析*********************/
/**
 * 常见后端统一响应包装（可通过 fieldNames 适配非标准字段）。
 */
export interface StandardResponse {
  code?: unknown
  data?: unknown
  message?: unknown
  [key: string]: unknown
}

export interface StandardResponseFieldNames {
  /** 业务状态码字段名，默认 `code`。 */
  code?: string
  /** 业务数据字段名，默认 `data`。 */
  data?: string
  /** 提示消息字段名，默认 `message`。 */
  message?: string
}

export interface ParseStandardResponseOptions {
  /** 非标准字段映射。 */
  fieldNames?: StandardResponseFieldNames
  /** 判定成功的状态码集合，默认 `[0, 200]`。 */
  successCodes?: unknown[]
  /** 解析失败时抛出的错误工厂，默认抛出 Error(message)。 */
  onError?: (message: string, response: StandardResponse) => never
}

/**
 * 从标准响应包装中取出业务数据，状态码不在成功集合时抛错。
 * 该 helper 需显式启用，未启用时 request client 返回原始响应数据，
 * 以便适配非标准后端。
 */
export function parseStandardResponse<TData = unknown>(
  response: StandardResponse,
  options: ParseStandardResponseOptions = {},
): TData {
  const codeField = options.fieldNames?.code ?? 'code'
  const dataField = options.fieldNames?.data ?? 'data'
  const messageField = options.fieldNames?.message ?? 'message'
  const successCodes = options.successCodes ?? [0, 200]

  const code = response[codeField]

  // 未携带状态码字段视为非标准包装，直接返回原始响应
  if (code === undefined) {
    return response as TData
  }

  if (!successCodes.includes(code)) {
    const message = String(response[messageField] ?? '请求失败')

    if (options.onError) {
      return options.onError(message, response)
    }

    throw new Error(message)
  }

  return response[dataField] as TData
}

/**
 * 生成可直接用作 onResponse 的标准响应解析器。
 */
export function createStandardResponseParser(options: ParseStandardResponseOptions = {}) {
  return <TResult = unknown>(context: { data: unknown }): TResult =>
    parseStandardResponse<TResult>(context.data as StandardResponse, options)
}
