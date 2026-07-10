import type { RequestCache } from './types'

/***********************内存缓存*********************/
/**
 * 基于 Map 的内存请求缓存实现，作为开启缓存时的默认存储。
 * 应用可实现同接口替换为带 TTL、LRU 或持久化的存储。
 */
export function createRequestCache(): RequestCache {
  const store = new Map<string, unknown>()

  return {
    get: key => store.get(key),
    set: (key, value) => {
      store.set(key, value)
    },
    has: key => store.has(key),
    delete: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}
