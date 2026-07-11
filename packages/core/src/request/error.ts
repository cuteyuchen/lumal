export type RequestErrorKind
  = | 'business'
    | 'cancelled'
    | 'duplicate'
    | 'http'
    | 'network'
    | 'session'

export interface RequestErrorOptions {
  code?: number | string
  kind?: RequestErrorKind
  data?: unknown
  originalError?: unknown
  response?: Response
  status?: number
}

export class RequestError extends Error {
  code?: number | string
  data?: unknown
  kind: RequestErrorKind
  originalError?: unknown
  response?: Response
  status?: number

  constructor(message: string, options: RequestErrorOptions = {}) {
    super(message)
    this.name = 'RequestError'
    this.code = options.code
    this.data = options.data
    this.kind = options.kind ?? 'business'
    this.originalError = options.originalError
    this.response = options.response
    this.status = options.status
  }
}
