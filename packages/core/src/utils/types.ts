export type JsonPrimitive = boolean | null | number | string
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

/**
 * 带命名空间前缀的 JSON 存储访问器。
 */
export interface StorageAccessor {
  get: <T extends JsonValue>(key: string) => T | undefined
  set: <T extends JsonValue>(key: string, value: T) => void
  remove: (key: string) => void
}
