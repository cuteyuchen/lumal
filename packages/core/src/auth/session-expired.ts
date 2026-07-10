import type { SessionExpiredHandler } from './types'

/***********************会话过期注册表*********************/
/**
 * 模块级会话过期回调注册表：供 request 层在收到 401 时触发，
 * 由应用注入具体处理（清 token、重置 store、跳转登录等）。
 */
let registeredHandler: SessionExpiredHandler | null = null

export function registerSessionExpiredHandler(handler: SessionExpiredHandler): void {
  registeredHandler = handler
}

export function clearSessionExpiredHandler(): void {
  registeredHandler = null
}

export async function handleSessionExpired(): Promise<void> {
  await registeredHandler?.()
}
