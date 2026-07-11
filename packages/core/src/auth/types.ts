/***********************Token 存储*********************/
/**
 * Token 存储抽象：应用可注入 localStorage、sessionStorage 或自定义实现。
 */
export interface TokenStorage {
  getToken: () => string
  setToken: (token: string) => void
  clearToken: () => void
}

export interface AuthSessionData {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export interface AuthSessionFieldNames {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
}

export interface ParseAuthSessionOptions {
  fieldNames?: AuthSessionFieldNames
  /** 在字段映射前处理多层嵌套响应。 */
  parseResponse?: (response: unknown) => unknown
  /** 对标准会话做最终归一。 */
  transform?: (session: AuthSessionData) => AuthSessionData
}

/***********************登录跳转*********************/
export interface RedirectOptions {
  /** 登录页路径，默认 `/login`。 */
  loginPath?: string
  /** 携带原始路径的查询参数名，默认 `redirect`。 */
  redirectQueryKey?: string
}

/***********************会话过期*********************/
export type SessionExpiredHandler = () => void | Promise<void>

/***********************会话聚合*********************/
export interface AuthSessionOptions {
  /** token 存储键名，默认 `luma:token`。 */
  tokenKey?: string
  refreshTokenKey?: string
  expiresAtKey?: string
  /** 底层存储，默认使用 localStorage；SSR 或测试可注入自定义 storage。 */
  storage?: Storage
  /** 会话过期回调（清 token、重置 store、跳转登录等由应用注入）。 */
  onSessionExpired?: SessionExpiredHandler
  /** 登录跳转选项，供 resolveRedirect 复用。 */
  redirect?: RedirectOptions
}

export interface AuthSession {
  /** 读取当前 token。 */
  getToken: () => string
  getRefreshToken: () => string
  getSession: () => AuthSessionData | null
  /** 写入 token，空值等价于清除。 */
  setToken: (token: string) => void
  setSession: (session: AuthSessionData) => void
  /** 清除 token。 */
  clearToken: () => void
  /** 是否已登录（存在非空 token）。 */
  isAuthenticated: () => boolean
  /** 触发会话过期处理：清 token 并调用 onSessionExpired。 */
  handleSessionExpired: () => Promise<void>
  /** 登出：清 token 并调用 onSessionExpired。 */
  logout: () => Promise<void>
  /** 解析登录跳转地址，携带原始路径。 */
  resolveRedirect: (currentPath: string, options?: RedirectOptions) => string
}
