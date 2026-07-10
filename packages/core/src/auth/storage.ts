import type { TokenStorage } from './types'

/***********************Token 存储*********************/
/**
 * 基于 Web Storage 创建 token 存储实现。写入空 token 等价于移除。
 */
export function createTokenStorage(storage: Storage, key: string): TokenStorage {
  return {
    getToken: () => storage.getItem(key) ?? '',
    setToken: (token: string) => {
      if (!token) {
        storage.removeItem(key)
        return
      }

      storage.setItem(key, token)
    },
    clearToken: () => {
      storage.removeItem(key)
    },
  }
}
