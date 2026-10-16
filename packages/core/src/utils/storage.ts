import type { JsonValue, StorageAccessor } from './types'

/***********************内存存储兜底*********************/
export function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: key => values.get(String(key)) ?? null,
    key: index => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(String(key)) },
    setItem: (key, value) => { values.set(String(key), String(value)) },
  }
}

/***********************带前缀存储*********************/
function toKey(prefix: string, key: string): string {
  return prefix ? `${prefix}:${key}` : key
}

/**
 * 基于 Web Storage 创建带命名空间前缀的 JSON 存储访问器。
 * 读取失败（非法 JSON）时抛出明确错误，便于定位脏数据。
 */
export function createStorage(adapter: Storage, prefix = ''): StorageAccessor {
  return {
    get<T extends JsonValue>(key: string): T | undefined {
      const raw = adapter.getItem(toKey(prefix, key))

      if (raw === null) {
        return undefined
      }

      try {
        return JSON.parse(raw) as T
      }
      catch {
        throw new Error(`无法解析存储键 "${toKey(prefix, key)}" 的值`)
      }
    },
    set<T extends JsonValue>(key: string, value: T): void {
      adapter.setItem(toKey(prefix, key), JSON.stringify(value))
    },
    remove(key: string): void {
      adapter.removeItem(toKey(prefix, key))
    },
  }
}
