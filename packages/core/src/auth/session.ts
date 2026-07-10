import { createTokenStorage } from './storage'

/***********************默认键名*********************/
export const DEFAULT_TOKEN_STORAGE_KEY = 'luma:token'

/***********************便捷读写*********************/
/**
 * 直接读取存储中的 token，未配置 key 时使用默认键名。
 */
export function getStoredToken(storage: Storage, key = DEFAULT_TOKEN_STORAGE_KEY): string {
  return createTokenStorage(storage, key).getToken()
}

export function setStoredToken(storage: Storage, token: string, key = DEFAULT_TOKEN_STORAGE_KEY): void {
  createTokenStorage(storage, key).setToken(token)
}

export function clearStoredToken(storage: Storage, key = DEFAULT_TOKEN_STORAGE_KEY): void {
  createTokenStorage(storage, key).clearToken()
}
